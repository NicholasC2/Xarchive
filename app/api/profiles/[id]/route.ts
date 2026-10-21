import { auth } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const viewer = (await auth.getSession()).data?.user;

    const profile = await db.query.
    if (!profile) return NextResponse.json({ error: "Profile not found." }, { status: 404 });

    const entries = await sql`SELECT e.id, e.kind, e.title, e.aka, e.artists, e.bio, e.source,
      CASE WHEN e.kind = 'song' THEN NULL ELSE e.media_url END AS "mediaUrl", e.file_name AS "fileName",
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
    const artists = await sql`SELECT id, title FROM archive_entries WHERE kind = 'artist' ORDER BY title LIMIT 300`;
    const entryIds = (entries as unknown as { id: string }[]).map((entry) => entry.id);
    const audioRows = entryIds.length
      ? await sql`SELECT id, song_id AS "songId", file_name AS "fileName", file_type AS "fileType", file_size AS "fileSize",
          source, bio, labels
          FROM archive_audio_files WHERE song_id = ANY(${entryIds})
          ORDER BY CASE WHEN LOWER(file_type || ' ' || file_name) ~ '(flac|wav|wave|alac|aiff|ape|wv)' THEN 0 ELSE 1 END, file_size DESC`
      : [];
    const entriesWithAudioUrls = withAudioFileSummaries(
      entries as unknown as { id: string; kind: string; fileUrl?: string | null }[],
      audioRows as unknown as AudioFileRow[],
    );
    const imageRows = entryIds.length
      ? await sql`SELECT id, entry_id AS "entryId" FROM archive_entry_images
          WHERE entry_id = ANY(${entryIds}) ORDER BY created_at, id`
      : [];
    const entriesWithImages = withArchiveImageSummaries(
      entriesWithAudioUrls as (typeof entriesWithAudioUrls[number] & { mediaUrl?: string | null })[],
      imageRows as unknown as ArchiveImageRow[],
    );

    return NextResponse.json({ profile, entries: entriesWithImages, followers, following, artists, viewerId: viewer?.id ?? null });
  } catch {
    return NextResponse.json({ error: "This profile is temporarily unavailable." }, { status: 503 });
  }
}