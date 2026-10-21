import { ensureArchiveTables, getArchiveSql, recordArchiveActivity } from "@/lib/archive";
import { createAudioResponse } from "@/lib/audio-response";

export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await ensureArchiveTables();
    const sql = getArchiveSql();
    const selectedFileId = new URL(request.url).searchParams.get("file");
    let audio: { fileUrl: string | null; fileName: string | null; fileType: string | null } | undefined;

    if (selectedFileId) {
      const rows = await sql`SELECT f.file_url AS "fileUrl", f.file_name AS "fileName", f.file_type AS "fileType"
        FROM archive_audio_files f JOIN archive_entries e ON e.id = f.song_id
        WHERE e.id = ${id} AND e.kind = 'song' AND f.id = ${selectedFileId} LIMIT 1`;
      [audio] = rows as unknown as typeof audio[];
      if (!audio) return new Response("Audio not found.", { status: 404 });
    } else {
      const rows = await sql`SELECT f.file_url AS "fileUrl", f.file_name AS "fileName", f.file_type AS "fileType"
        FROM archive_audio_files f JOIN archive_entries e ON e.id = f.song_id
        WHERE e.id = ${id} AND e.kind = 'song'
        ORDER BY CASE WHEN LOWER(f.file_type || ' ' || f.file_name) ~ '(flac|wav|wave|alac|aiff|ape|wv)' THEN 0 ELSE 1 END,
          f.file_size DESC LIMIT 1`;
      [audio] = rows as unknown as typeof audio[];

      if (!audio) {
        const legacyRows = await sql`SELECT file_url AS "fileUrl", file_name AS "fileName", file_type AS "fileType"
          FROM archive_entries WHERE id = ${id} AND kind = 'song' LIMIT 1`;
        [audio] = legacyRows as unknown as typeof audio[];
      }
    }

    const download = new URL(request.url).searchParams.get("download") === "1";
    if (download) await recordArchiveActivity(id, "downloads");
    return createAudioResponse(audio, { download, fallbackFileName: id });
  } catch {
    return new Response("Audio is temporarily unavailable.", { status: 503 });
  }
}
