import { NextResponse } from "next/server";
import { ensureArchiveTables, ensureProfile, getArchiveSql, getCurrentUser, withAudioFileSummaries } from "@/lib/archive";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const viewer = await getCurrentUser();
    await ensureArchiveTables();
    const sql = getArchiveSql();
    if (viewer?.id === id) await ensureProfile(viewer);

    const profileRows = await sql`SELECT p.user_id AS id, p.username, p.bio,
      p.image_url AS "imageUrl", p.social_links AS "links",
      (SELECT COUNT(*) FROM archive_follows WHERE following_id = p.user_id) AS followers,
      (SELECT COUNT(*) FROM archive_follows WHERE follower_id = p.user_id) AS following,
      EXISTS (SELECT 1 FROM archive_follows WHERE follower_id = ${viewer?.id ?? ""}
        AND following_id = p.user_id) AS "isFollowing"
      FROM archive_profiles p WHERE p.user_id = ${id}`;
    const [profile] = profileRows as unknown as { id: string; username: string; bio: string; imageUrl: string | null; followers: number; following: number; isFollowing: boolean }[];
    if (!profile) return NextResponse.json({ error: "Profile not found." }, { status: 404 });

    const entries = await sql`SELECT e.id, e.kind, e.title, e.aka, e.artists, e.bio, e.source,
      e.media_url AS "mediaUrl", e.file_name AS "fileName",
      e.file_type AS "fileType", e.tracklist, e.tags, e.genres, e.album_id AS "albumId", a.title AS album,
      e.release_year AS "releaseYear", e.links,
      e.collective_id AS "collectiveId",
      c.title AS collective, e.created_at AS "createdAt"
      FROM archive_entries e LEFT JOIN archive_entries c ON c.id = e.collective_id
      LEFT JOIN archive_entries a ON a.id = e.album_id
      WHERE e.created_by = ${id} ORDER BY e.created_at DESC`;
    const followers = await sql`SELECT p.user_id AS id, p.username, p.image_url AS "imageUrl"
      FROM archive_follows f JOIN archive_profiles p ON p.user_id = f.follower_id
      WHERE f.following_id = ${id} ORDER BY f.created_at DESC LIMIT 100`;
    const following = await sql`SELECT p.user_id AS id, p.username, p.image_url AS "imageUrl"
      FROM archive_follows f JOIN archive_profiles p ON p.user_id = f.following_id
      WHERE f.follower_id = ${id} ORDER BY f.created_at DESC LIMIT 100`;
    const artists = await sql`SELECT id, title FROM archive_entries WHERE kind = 'artist' ORDER BY title`;
    const songIds = (entries as Array<{ id: string; kind: string }>).filter((entry) => entry.kind === "song").map((entry) => entry.id);
    const audioRows = songIds.length ? await sql`SELECT id, song_id AS "songId", file_name AS "fileName", file_type AS "fileType", file_size AS "fileSize"
      FROM archive_audio_files WHERE song_id = ANY(${songIds}) ORDER BY file_size DESC, created_at DESC` : [];
    const entriesWithAudioUrls = withAudioFileSummaries(entries as Array<{ id: string; kind: string; fileUrl?: string | null }>, audioRows as unknown as { songId: string; id: string; fileName: string; fileType: string; fileSize: number | string }[]);

    return NextResponse.json({ profile, entries: entriesWithAudioUrls, followers, following, artists, viewerId: viewer?.id ?? null });
  } catch {
    return NextResponse.json({ error: "This profile is temporarily unavailable." }, { status: 503 });
  }
}