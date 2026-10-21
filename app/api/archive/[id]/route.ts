import { NextResponse } from "next/server";
import { ensureArchiveTables, getArchiveSql } from "@/lib/archive";
import { AudioFileRow, withAudioFileSummaries } from "@/lib/audio-file-summary";
import { ArchiveImageRow, withArchiveImageSummaries } from "@/lib/archive-image-summary";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await ensureArchiveTables();
    const sql = getArchiveSql();
    const rows = await sql`SELECT e.id, e.kind, e.title, e.aka, e.artists, e.bio, e.source,
      CASE WHEN e.kind = 'song' THEN NULL ELSE e.media_url END AS "mediaUrl",
      e.tracklist, e.tags, e.genres, e.album_id AS "albumId", a.title AS album,
      e.release_year AS "releaseYear", e.collective_id AS "collectiveId", c.title AS collective,
      e.created_at AS "createdAt"
      FROM archive_entries e LEFT JOIN archive_entries a ON a.id = e.album_id
      LEFT JOIN archive_entries c ON c.id = e.collective_id
      WHERE e.id = ${id} LIMIT 1`;
    const [entry] = rows as unknown as { id: string; kind: string }[];
    if (!entry) return NextResponse.json({ error: "Archive entry not found." }, { status: 404 });
    const audioRows = entry.kind === "song"
      ? await sql`SELECT id, song_id AS "songId", file_name AS "fileName", file_type AS "fileType",
          file_size AS "fileSize", source, bio, labels
          FROM archive_audio_files WHERE song_id = ${id}
          ORDER BY CASE WHEN LOWER(file_type || ' ' || file_name) ~ '(flac|wav|wave|alac|aiff|ape|wv)' THEN 0 ELSE 1 END, file_size DESC`
      : [];
    const imageRows = await sql`SELECT id, entry_id AS "entryId", image_kind AS "imageKind", alt
      FROM archive_entry_images WHERE entry_id = ${id} ORDER BY created_at, id`;
    const comments = await sql`SELECT cm.id, cm.body, cm.audio_file_id AS "audioFileId", cm.created_at AS "createdAt",
      cm.created_by AS "createdBy", p.username AS "creatorName"
      FROM archive_comments cm LEFT JOIN archive_profiles p ON p.user_id = cm.created_by
      WHERE cm.entry_id = ${id} ORDER BY cm.created_at DESC LIMIT 100`;
    const [withAudio] = withAudioFileSummaries(
      [entry as { id: string; kind: string; fileUrl?: string | null }],
      audioRows as unknown as AudioFileRow[],
    );
    const [entryWithImages] = withArchiveImageSummaries(
      [withAudio as typeof withAudio & { mediaUrl?: string | null }],
      imageRows as unknown as ArchiveImageRow[],
    );
    return NextResponse.json({ entry: entryWithImages, comments });
  } catch {
    return NextResponse.json({ error: "This archive entry is temporarily unavailable." }, { status: 503 });
  }
}
