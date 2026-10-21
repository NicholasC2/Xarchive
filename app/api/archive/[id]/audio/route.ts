import { ensureArchiveTables, getArchiveSql } from "@/lib/archive";

export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const url = new URL(request.url);
    const selectedFileId = url.searchParams.get("file");
    await ensureArchiveTables();
    const sql = getArchiveSql();

    let chosenRow: { fileUrl: string | null; fileName: string | null; fileType: string | null } | null = null;

    if (selectedFileId) {
      const fileRows = await sql`SELECT file_url AS "fileUrl", file_name AS "fileName", file_type AS "fileType"
        FROM archive_audio_files WHERE id = ${selectedFileId} AND song_id = ${id} LIMIT 1`;
      chosenRow = (fileRows as unknown as { fileUrl: string | null; fileName: string | null; fileType: string | null }[])[0] ?? null;
    }

    if (!chosenRow) {
      const fallbackRows = await sql`SELECT file_url AS "fileUrl", file_name AS "fileName", file_type AS "fileType"
        FROM archive_audio_files WHERE song_id = ${id} ORDER BY file_size DESC, created_at DESC LIMIT 1`;
      chosenRow = (fallbackRows as unknown as { fileUrl: string | null; fileName: string | null; fileType: string | null }[])[0] ?? null;
    }

    if (!chosenRow) {
      const legacyRows = await sql`SELECT file_url AS "fileUrl", file_name AS "fileName", file_type AS "fileType"
        FROM archive_entries WHERE id = ${id} AND kind = 'song' LIMIT 1`;
      chosenRow = (legacyRows as unknown as { fileUrl: string | null; fileName: string | null; fileType: string | null }[])[0] ?? null;
    }

    if (!chosenRow?.fileUrl) return new Response("Audio not found.", { status: 404 });

    if (/^https?:\/\//i.test(chosenRow.fileUrl)) {
      const audioResponse = await fetch(chosenRow.fileUrl);
      if (!audioResponse.ok) return new Response("Audio is unavailable.", { status: 404 });
      const body = Buffer.from(await audioResponse.arrayBuffer());
      const fileName = chosenRow.fileName || `${id}.audio`;
      return new Response(body, {
        headers: {
          "Content-Type": chosenRow.fileType || audioResponse.headers.get("content-type") || "audio/mpeg",
          "Content-Length": String(body.byteLength),
          "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(fileName)}`,
          "Cache-Control": "public, max-age=3600",
        },
      });
    }

    const match = /^data:audio\/(mpeg|wav|x-wav|mp4|aac|ogg|flac|webm);base64,([A-Za-z0-9+/=]+)$/.exec(chosenRow.fileUrl);
    if (!match) return new Response("Audio is unavailable.", { status: 404 });

    const decoded = Buffer.from(match[2], "base64");
    const body = new Uint8Array(decoded.byteLength);
    body.set(decoded);
    const extension = chosenRow.fileName?.split(".").pop() || match[1];
    const fileName = chosenRow.fileName || `${id}.${extension}`;

    return new Response(body, {
      headers: {
        "Content-Type": chosenRow.fileType || `audio/${match[1]}`,
        "Content-Length": String(body.byteLength),
        "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(fileName)}`,
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch {
    return new Response("Audio is temporarily unavailable.", { status: 503 });
  }
}
