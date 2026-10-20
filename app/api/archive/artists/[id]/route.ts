import { NextResponse } from "next/server";
import { ensureArchiveTables, getArchiveSql } from "@/lib/archive";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await ensureArchiveTables();
    const sql = getArchiveSql();
    const artistRows = await sql`SELECT id, title, aka, bio, media_url AS "imageUrl"
      FROM archive_entries WHERE kind = 'artist' AND (id = ${id} OR LOWER(title) = LOWER(${id}))
      ORDER BY CASE WHEN id = ${id} THEN 0 ELSE 1 END LIMIT 1`;
    const [artist] = artistRows as unknown as { id: string; title: string; aka: string[]; bio: string; imageUrl: string | null }[];
    if (!artist) return NextResponse.json({ error: "Artist not found." }, { status: 404 });

    const entries = await sql`SELECT e.id, e.kind, e.title, e.artists, e.aka, e.bio,
      e.source, e.file_name AS "fileName", e.file_type AS "fileType", e.media_url AS "mediaUrl", e.tracklist,
      e.tags, e.genres, e.album_id AS "albumId", a.title AS album, e.release_year AS "releaseYear", c.title AS collective
      FROM archive_entries e LEFT JOIN archive_entries c ON c.id = e.collective_id
      LEFT JOIN archive_entries a ON a.id = e.album_id
      WHERE e.kind IN ('song', 'album', 'collective') AND EXISTS (
        SELECT 1 FROM unnest(e.artists) AS member(name) WHERE LOWER(member.name) = LOWER(${artist.title})
      ) ORDER BY e.created_at DESC`;
    const artists = await sql`SELECT id, title FROM archive_entries WHERE kind = 'artist' ORDER BY title`;
    const entriesWithAudioUrls = (entries as unknown as { id: string; kind: string }[]).map((entry) => ({
      ...entry,
      fileUrl: entry.kind === "song" ? `/api/archive/${encodeURIComponent(entry.id)}/audio` : null,
    }));

    return NextResponse.json({ artist, entries: entriesWithAudioUrls, artists });
  } catch {
    return NextResponse.json({ error: "This artist is temporarily unavailable." }, { status: 503 });
  }
}