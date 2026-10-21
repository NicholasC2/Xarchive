import { getArchiveSql } from "@/lib/archive";
import { AudioFileRow, withAudioFileSummaries } from "@/lib/audio-file-summary";
import { ArchiveImageRow, withArchiveImageSummaries } from "@/lib/archive-image-summary";

export type SearchField = "title" | "artist" | "collective" | "album" | "source" | "tag" | "genre" | "year";
export type SearchOperator = "is" | "contains" | "regex" | "is-not" | "does-not-contain";
export type SearchRule = { field: SearchField; operator: SearchOperator; value: string };
export type SearchGroup = { join: "and" | "or"; rules: SearchRule[] };

const validFields = new Set<SearchField>(["title", "artist", "collective", "album", "source", "tag", "genre", "year"]);
const validOperators = new Set<SearchOperator>(["is", "contains", "regex", "is-not", "does-not-contain"]);

export function validateSearchGroups(value: unknown): SearchGroup[] {
  if (!Array.isArray(value) || value.length > 6) throw new Error("Use up to 6 filter groups.");
  return value.map((group) => {
    if (!group || typeof group !== "object" || !("rules" in group) || !Array.isArray(group.rules) || group.rules.length < 1 || group.rules.length > 8) {
      throw new Error("Each filter group must have 1 to 8 rules.");
    }
    const join = "join" in group && group.join === "or" ? "or" : "and";
    const rules = group.rules.map((rule: unknown): SearchRule => {
      if (!rule || typeof rule !== "object" || !("field" in rule) || !("operator" in rule) || !("value" in rule) ||
        typeof rule.field !== "string" || !validFields.has(rule.field as SearchField) ||
        typeof rule.operator !== "string" || !validOperators.has(rule.operator as SearchOperator) ||
        typeof rule.value !== "string" || rule.value.trim().length === 0 || rule.value.length > 100) {
        throw new Error("A filter rule is invalid.");
      }
      if (rule.operator === "regex" && (!/^[\w\s.\-+*?^$[\]|]+$/.test(rule.value) || /([*+?]|\])\s*[*+?]/.test(rule.value))) {
        throw new Error("Use a simple regular expression without groups or nested quantifiers.");
      }
      return { field: rule.field as SearchField, operator: rule.operator as SearchOperator, value: rule.value.trim() };
    });
    return { join, rules };
  });
}

function filterExpression(rule: SearchRule, addParam: (value: unknown) => string) {
  const value = rule.value.toLowerCase();
  const exact = () => addParam(value);
  const partial = () => addParam(`%${value}%`);
  const contains = rule.operator === "contains" || rule.operator === "does-not-contain";
  let match: string;
  switch (rule.field) {
    case "title":
      match = rule.operator === "regex"
        ? `e.title ~* ${addParam(rule.value)}`
        : `LOWER(e.title) ${contains ? "LIKE" : "="} ${contains ? partial() : exact()}`;
      break;
    case "artist":
      match = `EXISTS (SELECT 1 FROM unnest(e.artists) AS item(name) WHERE LOWER(item.name) ${contains ? "LIKE" : rule.operator === "regex" ? "~*" : "="} ${rule.operator === "regex" ? addParam(rule.value) : contains ? partial() : exact()})`;
      break;
    case "collective":
    case "album": {
      const column = rule.field === "collective" ? "c.title" : "a.title";
      match = `${column} ${rule.operator === "regex" ? "~*" : contains ? "ILIKE" : "ILIKE"} ${rule.operator === "regex" ? addParam(rule.value) : contains ? partial() : exact()}`;
      break;
    }
    case "source":
      match = `EXISTS (SELECT 1 FROM archive_audio_files f WHERE f.song_id = e.id AND LOWER(COALESCE(f.source, e.source, '')) ${contains ? "LIKE" : "="} ${contains ? partial() : exact()})`;
      break;
    case "tag":
      match = `EXISTS (SELECT 1 FROM unnest(e.tags) AS item(value) WHERE LOWER(item.value) ${contains ? "LIKE" : "="} ${contains ? partial() : exact()})`;
      break;
    case "genre":
      match = `EXISTS (SELECT 1 FROM unnest(e.genres) AS item(value) WHERE LOWER(item.value) ${contains ? "LIKE" : "="} ${contains ? partial() : exact()})`;
      break;
    case "year":
      match = `CAST(e.release_year AS TEXT) ${contains ? "LIKE" : "="} ${contains ? partial() : exact()}`;
      break;
  }
  return rule.operator === "is-not" || rule.operator === "does-not-contain" ? `NOT (${match})` : match;
}

export async function searchArchiveEntries(options: {
  query?: string;
  kind?: string;
  page?: number;
  groups?: SearchGroup[];
}) {
  const sql = getArchiveSql();
  const parameters: unknown[] = [];
  const addParam = (value: unknown) => {
    parameters.push(value);
    return `$${parameters.length}`;
  };
  const conditions = ["e.kind IN ('song', 'album', 'artist', 'collective')"];
  const query = options.query?.trim().slice(0, 160) ?? "";
  if (query) {
    const token = addParam(`%${query}%`);
    conditions.push(`(
      e.title ILIKE ${token} OR e.bio ILIKE ${token} OR
      EXISTS (SELECT 1 FROM unnest(e.artists || e.aka || e.tags || e.genres) AS item(value) WHERE item.value ILIKE ${token}) OR
      COALESCE(c.title, '') ILIKE ${token} OR COALESCE(a.title, '') ILIKE ${token}
    )`);
  }
  if (options.kind && ["song", "album", "artist", "collective"].includes(options.kind)) {
    conditions.push(`e.kind = ${addParam(options.kind)}`);
  }
  for (const group of options.groups ?? []) {
    const expressions = group.rules.map((rule) => filterExpression(rule, addParam));
    conditions.push(`(${expressions.join(group.join === "or" ? " OR " : " AND ")})`);
  }
  const where = conditions.join(" AND ");
  const countRows = await sql.query(
    `SELECT COUNT(*)::INTEGER AS total FROM archive_entries e
      LEFT JOIN archive_entries c ON c.id = e.collective_id
      LEFT JOIN archive_entries a ON a.id = e.album_id WHERE ${where}`,
    parameters,
  );
  const pageSize = 100;
  const page = Math.max(1, Math.floor(options.page ?? 1));
  const resultParams = [...parameters, pageSize, (page - 1) * pageSize];
  const rows = await sql.query(
    `SELECT e.id, e.kind, e.title, e.aka, e.artists, e.bio, e.source,
      CASE WHEN e.kind = 'song' THEN NULL ELSE e.media_url END AS "mediaUrl",
      e.tracklist, e.tags, e.genres, e.album_id AS "albumId", a.title AS album,
      e.release_year AS "releaseYear", e.collective_id AS "collectiveId",
      c.title AS collective, e.created_by AS "createdBy", e.created_at AS "createdAt"
      FROM archive_entries e LEFT JOIN archive_entries c ON c.id = e.collective_id
      LEFT JOIN archive_entries a ON a.id = e.album_id
      WHERE ${where} ORDER BY e.created_at DESC, e.id LIMIT $${parameters.length + 1} OFFSET $${parameters.length + 2}`,
    resultParams,
  );
  const entries = rows as unknown as { id: string; kind: string; fileUrl?: string | null }[];
  const ids = entries.map((entry) => entry.id);
  const [audioRows, imageRows] = ids.length ? await Promise.all([
    sql`SELECT id, song_id AS "songId", file_name AS "fileName", file_type AS "fileType", file_size AS "fileSize",
      source, bio, labels
      FROM archive_audio_files WHERE song_id = ANY(${ids})
      ORDER BY CASE WHEN LOWER(file_type || ' ' || file_name) ~ '(flac|wav|wave|alac|aiff|ape|wv)' THEN 0 ELSE 1 END, file_size DESC`,
    sql`SELECT id, entry_id AS "entryId" FROM archive_entry_images
      WHERE entry_id = ANY(${ids}) ORDER BY created_at, id`,
  ]) : [[], []];
  const entriesWithAudio = withAudioFileSummaries(entries, audioRows as unknown as AudioFileRow[]);
  const entriesWithImages = withArchiveImageSummaries(
    entriesWithAudio as (typeof entriesWithAudio[number] & { mediaUrl?: string | null })[],
    imageRows as unknown as ArchiveImageRow[],
  );
  return {
    entries: entriesWithImages,
    page,
    pageSize,
    total: Number((countRows as unknown as { total: number }[])[0]?.total ?? 0),
  };
}
