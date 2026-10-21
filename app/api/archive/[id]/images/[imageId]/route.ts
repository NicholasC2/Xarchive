import { ensureArchiveTables, getArchiveSql } from "@/lib/archive";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; imageId: string }> },
) {
  try {
    const { id, imageId } = await params;
    await ensureArchiveTables();
    const sql = getArchiveSql();
    const rows = await sql`SELECT image_url AS "imageUrl"
      FROM archive_entry_images WHERE entry_id = ${id} AND id = ${imageId} LIMIT 1`;
    const [image] = rows as unknown as { imageUrl: string }[];
    if (!image) return new Response("Image not found.", { status: 404 });
    const match = /^data:image\/(jpeg|png|webp|gif);base64,([A-Za-z0-9+/=]+)$/.exec(image.imageUrl);
    if (!match) return new Response("Image is unavailable.", { status: 404 });
    const body = Buffer.from(match[2], "base64");
    return new Response(body, {
      headers: {
        "Content-Type": `image/${match[1]}`,
        "Content-Length": String(body.byteLength),
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch {
    return new Response("Image is temporarily unavailable.", { status: 503 });
  }
}
