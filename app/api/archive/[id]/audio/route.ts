import { ensureArchiveTables, getArchiveSql } from "@/lib/archive";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await ensureArchiveTables();
    const sql = getArchiveSql();
    const rows = await sql`SELECT file_url AS "fileUrl", file_name AS "fileName", file_type AS "fileType"
      FROM archive_entries WHERE id = ${id} AND kind = 'song' LIMIT 1`;
    const [audio] = rows as unknown as { fileUrl: string | null; fileName: string | null; fileType: string | null }[];
    if (!audio?.fileUrl) return new Response("Audio not found.", { status: 404 });

    const match = /^data:audio\/(mpeg|wav|x-wav|mp4|aac|ogg|flac|webm);base64,([A-Za-z0-9+/=]+)$/.exec(audio.fileUrl);
    if (!match) return new Response("Audio is unavailable.", { status: 404 });

    const decoded = Buffer.from(match[2], "base64");
    const body = new Uint8Array(decoded.byteLength);
    body.set(decoded);
    const extension = audio.fileName?.split(".").pop() || match[1];
    const fileName = audio.fileName || `${id}.${extension}`;

    return new Response(body, {
      headers: {
        "Content-Type": audio.fileType || `audio/${match[1]}`,
        "Content-Length": String(body.byteLength),
        "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(fileName)}`,
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch {
    return new Response("Audio is temporarily unavailable.", { status: 503 });
  }
}
