import { NextResponse } from "next/server";
import { ensureArchiveTables, getArchiveSql, getCurrentUser } from "@/lib/archive";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function PUT(request: Request, { params }: RouteContext) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Sign in to follow artists and listeners." }, { status: 401 });

    const { id } = await params;
    const { follow } = await request.json();
    if (!id || id === user.id || typeof follow !== "boolean") {
      return NextResponse.json({ error: "That follow action is not valid." }, { status: 400 });
    }

    await ensureArchiveTables();
    const sql = getArchiveSql();
    if (follow) {
      await sql`INSERT INTO archive_follows (follower_id, following_id)
        SELECT ${user.id}, ${id} WHERE EXISTS (
          SELECT 1 FROM archive_profiles WHERE user_id = ${id}
        ) ON CONFLICT DO NOTHING`;
    } else {
      await sql`DELETE FROM archive_follows WHERE follower_id = ${user.id} AND following_id = ${id}`;
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "The follow action could not be saved." }, { status: 500 });
  }
}