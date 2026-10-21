import { NextResponse } from "next/server";
import { ensureArchiveTables, getArchiveSql } from "@/lib/archive";
import { withAudioFileSummaries } from "@/lib/audio-file-summary";
import { withArchiveImageSummaries } from "@/lib/archive-image-summary";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await ensureArchiveTables();
    const sql = getArchiveSql();
    const artists = await sql`SELECT e.id, e.kind, e.title, e.aka, e.artists, e.bio,
      e.media_url AS "mediaUrl", COALESCE(s.views, 0) AS views
      FROM archive_entries e LEFT JOIN archive_entry_stats s ON s.entry_id = e.id
      WHERE e.kind = 'artist' ORDER BY views DESC, e.title LIMIT 10`;
    const songs = await sql`SELECT e.id, e.kind, e.title, e.artists, e.bio, e.tags, e.genres,
      e.album_id AS "albumId", a.title AS album, e.release_year AS "releaseYear",
      e.collective_id AS "collectiveId", c.title AS collective,
      COALESCE(s.downloads, 0) AS downloads
      FROM archive_entries e LEFT JOIN archive_entry_stats s ON s.entry_id = e.id
      LEFT JOIN archive_entries a ON a.id = e.album_id
      LEFT JOIN archive_entries c ON c.id = e.collective_id
      WHERE e.kind = 'song' ORDER BY downloads DESC, e.created_at DESC LIMIT 10`;
    const songIds = (songs as unknown as { id: string }[]).map((song) => song.id);
    const [audioRows, imageRows] = songIds.length ? await Promise.all([
      sql`SELECT id, song_id AS "songId", file_name AS "fileName", file_type AS "fileType", file_size AS "fileSize",
        source, bio, labels
        FROM archive_audio_files WHERE song_id = ANY(${songIds})
        ORDER BY CASE WHEN LOWER(file_type || ' ' || file_name) ~ '(flac|wav|wave|alac|aiff|ape|wv)' THEN 0 ELSE 1 END, file_size DESC`,
      sql`SELECT id, entry_id AS "entryId" FROM archive_entry_images
        WHERE entry_id = ANY(${songIds}) ORDER BY created_at, id`,
    ]) : [[], []];
    const songsWithAudio = withAudioFileSummaries(
      songs as unknown as { id: string; kind: string; fileUrl?: string | null }[],
      audioRows as unknown as import("@/lib/audio-file-summary").AudioFileRow[],
    );
    return NextResponse.json({
      artists,
      songs: withArchiveImageSummaries(
        songsWithAudio as (typeof songsWithAudio[number] & { mediaUrl?: string | null })[],
        imageRows as unknown as import("@/lib/archive-image-summary").ArchiveImageRow[],
      ),
    });
  } catch {
    return NextResponse.json({ error: "The archive is temporarily unavailable." }, { status: 503 });
  }
}
