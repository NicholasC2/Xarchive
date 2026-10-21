import { NextResponse } from "next/server";
import { ensureArchiveTables, getArchiveSql, getCurrentUser } from "@/lib/archive";

export const dynamic = "force-dynamic";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in to comment." }, { status: 401 });
  let body: { body?: unknown; audioFileId?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Enter a comment." }, { status: 400 });
  }
  const text = typeof body.body === "string" ? body.body.trim() : "";
  const audioFileId = typeof body.audioFileId === "string" && body.audioFileId ? body.audioFileId : null;
  if (!text || text.length > 2000) {
    return NextResponse.json({ error: "Comments must contain 1 to 2,000 characters." }, { status: 400 });
  }
  try {
    const { id } = await params;
    await ensureArchiveTables();
    const sql = getArchiveSql();
    const entries = await sql`SELECT id FROM archive_entries WHERE id = ${id} LIMIT 1` as unknown as { id: string }[];
    if (!entries.length) return NextResponse.json({ error: "Archive entry not found." }, { status: 404 });
    if (audioFileId) {
      const files = await sql`SELECT id FROM archive_audio_files WHERE id = ${audioFileId} AND song_id = ${id} LIMIT 1` as unknown as { id: string }[];
      if (!files.length) return NextResponse.json({ error: "Choose an audio version attached to this song." }, { status: 400 });
    }
    const commentId = crypto.randomUUID();
    await sql`INSERT INTO archive_comments (id, entry_id, audio_file_id, body, created_by)
      VALUES (${commentId}, ${id}, ${audioFileId}, ${text}, ${user.id})`;
    const comments = await sql`SELECT cm.id, cm.body, cm.audio_file_id AS "audioFileId",
      cm.created_at AS "createdAt", cm.created_by AS "createdBy", p.username AS "creatorName"
      FROM archive_comments cm LEFT JOIN archive_profiles p ON p.user_id = cm.created_by
      WHERE cm.id = ${commentId} LIMIT 1` as unknown as { id: string; body: string }[];
    return NextResponse.json({ comment: comments[0] }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Your comment could not be saved." }, { status: 500 });
  }
}
