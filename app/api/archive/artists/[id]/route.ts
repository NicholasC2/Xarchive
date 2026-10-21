import { NextResponse } from "next/server";
import { ensureArchiveTables, getArchiveSql, recordArchiveActivity } from "@/lib/archive";
import { withAudioFileSummaries, AudioFileRow } from "@/lib/audio-file-summary";
import { withArchiveImageSummaries, ArchiveImageRow } from "@/lib/archive-image-summary";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await ensureArchiveTables();
    const sql = getArchiveSql();
    const artistRows = await sql`SELECT id, kind, title, aka, bio, media_url AS "mediaUrl"
      FROM archive_entries WHERE kind = 'artist' AND (id = ${id} OR LOWER(title) = LOWER(${id}))
      ORDER BY CASE WHEN id = ${id} THEN 0 ELSE 1 END LIMIT 1`;
    const [artistRow] = artistRows as unknown as { id: string; kind: string; title: string; aka: string[]; bio: string; mediaUrl: string | null }[];
    if (!artistRow) return NextResponse.json({ error: "Artist not found." }, { status: 404 });
    await recordArchiveActivity(artistRow.id, "views");
    const artistImages = await sql`SELECT id, entry_id AS "entryId", image_kind AS "imageKind", alt
      FROM archive_entry_images WHERE entry_id = ${artistRow.id} ORDER BY created_at, id`;
    const [artist] = withArchiveImageSummaries(
      [artistRow],
      artistImages as unknown as ArchiveImageRow[],
    );
    const artistResponse = { ...artist, imageUrl: artist.mediaUrl };

    const entries = await sql`SELECT e.id, e.kind, e.title, e.artists, e.aka, e.bio,
      e.source, e.file_name AS "fileName", e.file_type AS "fileType",
      CASE WHEN e.kind = 'song' THEN NULL ELSE e.media_url END AS "mediaUrl", e.tracklist,
      e.tags, e.genres, e.album_id AS "albumId", a.title AS album, e.release_year AS "releaseYear", c.title AS collective
      FROM archive_entries e LEFT JOIN archive_entries c ON c.id = e.collective_id
      LEFT JOIN archive_entries a ON a.id = e.album_id
      WHERE e.kind IN ('song', 'album', 'collective') AND EXISTS (
        SELECT 1 FROM unnest(e.artists) AS member(name) WHERE LOWER(member.name) = LOWER(${artist.title})
      ) ORDER BY e.created_at DESC LIMIT 100`;
    const relatedArtistNames = [...new Set((entries as unknown as { artists: string[] }[]).flatMap((entry) => entry.artists))];
    const artists = relatedArtistNames.length
      ? await sql`SELECT id, title FROM archive_entries WHERE kind = 'artist' AND LOWER(title) = ANY(${relatedArtistNames.map((name) => name.toLowerCase())})`
      : [];
    const entryIds = (entries as unknown as { id: string }[]).map((entry) => entry.id);
    const audioRows = entryIds.length
      ? await sql`SELECT id, song_id AS "songId", file_name AS "fileName", file_type AS "fileType", file_size AS "fileSize",
          source, bio, labels
          FROM archive_audio_files WHERE song_id = ANY(${entryIds})
          ORDER BY CASE WHEN LOWER(file_type || ' ' || file_name) ~ '(flac|wav|wave|alac|aiff|ape|wv)' THEN 0 ELSE 1 END, file_size DESC`
      : [];
    const entriesWithAudioUrls = withAudioFileSummaries(
      entries as unknown as { id: string; kind: string; fileUrl?: string | null }[],
      audioRows as unknown as AudioFileRow[],
    );
    const imageRows = entryIds.length
      ? await sql`SELECT id, entry_id AS "entryId" FROM archive_entry_images
          WHERE entry_id = ANY(${entryIds}) ORDER BY created_at, id`
      : [];
    const entriesWithImages = withArchiveImageSummaries(
      entriesWithAudioUrls as (typeof entriesWithAudioUrls[number] & { mediaUrl?: string | null })[],
      imageRows as unknown as ArchiveImageRow[],
    );

    return NextResponse.json({ artist: artistResponse, entries: entriesWithImages, artists });
  } catch {
    return NextResponse.json({ error: "This artist is temporarily unavailable." }, { status: 503 });
  }
}