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
      e.source, e.file_url AS "fileUrl", e.media_url AS "mediaUrl", e.tracklist,
      e.release_year AS "releaseYear", c.title AS collective
      FROM archive_entries e LEFT JOIN archive_entries c ON c.id = e.collective_id
      WHERE e.kind IN ('song', 'album', 'collective') AND EXISTS (
        SELECT 1 FROM unnest(e.artists) AS member(name) WHERE LOWER(member.name) = LOWER(${artist.title})
      ) ORDER BY e.created_at DESC`;
    const artists = await sql`SELECT id, title FROM archive_entries WHERE kind = 'artist' ORDER BY title`;

    return NextResponse.json({ artist, entries, artists });
  } catch {
    return NextResponse.json({ error: "This artist is temporarily unavailable." }, { status: 503 });
  }
}