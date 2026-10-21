import { NextResponse } from "next/server";
import { ensureArchiveTables, getArchiveSql, withAudioFileSummaries } from "@/lib/archive";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await ensureArchiveTables();
    const sql = getArchiveSql();
    const albumRows = await sql`SELECT e.id, e.title, e.artists, e.aka, e.bio, e.media_url AS "imageUrl",
      e.release_year AS "releaseYear", e.tracklist, e.links, e.collective_id AS "collectiveId", c.title AS collective
      FROM archive_entries e LEFT JOIN archive_entries c ON c.id = e.collective_id
      WHERE e.kind = 'album' AND (e.id = ${id} OR LOWER(e.title) = LOWER(${id}))
      ORDER BY CASE WHEN e.id = ${id} THEN 0 ELSE 1 END LIMIT 1`;
    const [album] = albumRows as unknown as { id: string; title: string; artists: string[]; aka: string[]; bio: string; imageUrl: string | null; releaseYear: number | null; tracklist: string[]; links: unknown[]; collectiveId: string | null; collective: string | null }[];
    if (!album) return NextResponse.json({ error: "Album not found." }, { status: 404 });

    const entries = await sql`SELECT e.id, e.kind, e.title, e.artists, e.aka, e.bio,
      e.source, e.file_name AS "fileName", e.file_type AS "fileType", e.media_url AS "mediaUrl", e.tracklist,
      e.tags, e.genres, e.album_id AS "albumId", e.release_year AS "releaseYear", e.links,
      c.title AS collective
      FROM archive_entries e LEFT JOIN archive_entries c ON c.id = e.collective_id
      WHERE e.kind = 'song' AND e.album_id = ${album.id} ORDER BY e.created_at DESC`;
    const artists = await sql`SELECT id, title FROM archive_entries WHERE kind = 'artist' ORDER BY title`;
    const songIds = (entries as Array<{ id: string; kind: string }>).filter((entry) => entry.kind === "song").map((entry) => entry.id);
    const audioRows = songIds.length ? await sql`SELECT id, song_id AS "songId", file_name AS "fileName", file_type AS "fileType", file_size AS "fileSize"
      FROM archive_audio_files WHERE song_id = ANY(${songIds}) ORDER BY file_size DESC, created_at DESC` : [];
    const entriesWithAudioUrls = withAudioFileSummaries(entries as Array<{ id: string; kind: string; fileUrl?: string | null }>, audioRows as unknown as { songId: string; id: string; fileName: string; fileType: string; fileSize: number | string }[]);

    return NextResponse.json({ album, entries: entriesWithAudioUrls, artists });
  } catch {
    return NextResponse.json({ error: "This album is temporarily unavailable." }, { status: 503 });
  }
}
