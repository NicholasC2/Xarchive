import { NextResponse } from "next/server";
import {
  audioSources,
  ensureArchiveTables,
  ensureProfile,
  getArchiveSql,
  getCurrentUser,
  isAudioDataUrl,
  isImageDataUrl,
} from "@/lib/archive";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await ensureArchiveTables();
    const sql = getArchiveSql();
    const entries = await sql`SELECT e.id, e.kind, e.title, e.aka, e.artists,
      e.bio, e.source, e.media_url AS "mediaUrl", e.file_url AS "fileUrl",
      e.file_name AS "fileName", e.file_type AS "fileType", e.file_size AS "fileSize",
      e.tracklist, e.release_year AS "releaseYear",
      e.collective_id AS "collectiveId", c.title AS collective,
      e.created_by AS "createdBy", e.created_at AS "createdAt",
      p.username AS "creatorName", p.image_url AS "creatorImage"
      FROM archive_entries e LEFT JOIN archive_profiles p ON p.user_id = e.created_by
      LEFT JOIN archive_entries c ON c.id = e.collective_id
      ORDER BY e.created_at DESC LIMIT 100`;
    const artistRows = await sql`SELECT id, title FROM archive_entries WHERE kind = 'artist' ORDER BY title`;

    return NextResponse.json({ entries, artists: artistRows });
  } catch {
    return NextResponse.json({ error: "The archive is temporarily unavailable." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Sign in to contribute." }, { status: 401 });

    const body = await request.json();
    const kind = body.kind;
    const title = typeof body.title === "string" ? body.title.trim() : "";
    const bio = typeof body.bio === "string" ? body.bio.trim().slice(0, 2000) : "";
    const artists = Array.isArray(body.artists)
      ? body.artists.filter((name: unknown): name is string => typeof name === "string").map((name: string) => name.trim()).filter(Boolean).slice(0, 20)
      : [];
    const aka = Array.isArray(body.aka)
      ? body.aka.filter((name: unknown): name is string => typeof name === "string").map((name: string) => name.trim()).filter(Boolean).slice(0, 20)
      : [];
    const tracklist = Array.isArray(body.tracklist)
      ? body.tracklist.filter((track: unknown): track is string => typeof track === "string").map((track: string) => track.trim()).filter(Boolean).slice(0, 100)
      : [];
    const collectiveId = typeof body.collectiveId === "string" && body.collectiveId ? body.collectiveId : null;
    const releaseYear = Number.isInteger(body.releaseYear) && body.releaseYear >= 1000 && body.releaseYear <= 3000 ? body.releaseYear : null;
    const source = body.source;
    const mediaUrl = body.mediaUrl;
    const fileUrl = body.fileUrl;
    const fileName = typeof body.fileName === "string" ? body.fileName.slice(0, 180) : null;
    const fileType = typeof body.fileType === "string" ? body.fileType.slice(0, 100) : null;

    if (!title || title.length > 160 || !["song", "artist", "album", "collective"].includes(kind)) {
      return NextResponse.json({ error: "Add a valid title." }, { status: 400 });
    }
    if (["song", "album", "collective"].includes(kind) && artists.length === 0) {
      return NextResponse.json({ error: kind === "collective" ? "Add at least one artist to this collective." : "Add at least one artist." }, { status: 400 });
    }
    if (["artist", "album"].includes(kind) && mediaUrl !== null && !isImageDataUrl(mediaUrl)) {
      return NextResponse.json({ error: "Images must be supported formats up to 2 MB." }, { status: 400 });
    }
    if (kind === "song" && !isAudioDataUrl(fileUrl)) {
      return NextResponse.json({ error: "Audio files must be supported formats up to 8 MB." }, { status: 400 });
    }
    if (kind === "song" && !audioSources.includes(source)) {
      return NextResponse.json({ error: "Choose a valid audio source." }, { status: 400 });
    }

    await ensureArchiveTables();
    const sql = getArchiveSql();
    if (kind === "collective") {
      const artistNames = await sql`SELECT title FROM archive_entries
        WHERE kind = 'artist' AND LOWER(title) = ANY(${artists.map((name: string) => name.toLowerCase())})`;
      const foundNames = new Set((artistNames as unknown as { title: string }[]).map((artist) => artist.title.toLowerCase()));
      if (artists.some((name: string) => !foundNames.has(name.toLowerCase()))) {
        return NextResponse.json({ error: "Collectives can only include artists already in the archive." }, { status: 400 });
      }
    }
    if (collectiveId && ["song", "album"].includes(kind)) {
      const collectiveRows = await sql`SELECT id FROM archive_entries WHERE id = ${collectiveId} AND kind = 'collective'`;
      const [collective] = collectiveRows as unknown as { id: string }[];
      if (!collective) return NextResponse.json({ error: "Choose a collective from the archive." }, { status: 400 });
    }
    await ensureProfile(user);
    const id = crypto.randomUUID();
    const fileSize = typeof body.fileSize === "number" && body.fileSize > 0 ? Math.floor(body.fileSize) : null;

    await sql`INSERT INTO archive_entries
      (id, kind, title, aka, artists, bio, source, media_url, file_url, file_name, file_type, file_size, collective_id, tracklist, release_year, created_by)
      VALUES (${id}, ${kind}, ${title}, ${aka}, ${artists}, ${bio},
      ${kind === "song" ? source : null}, ${["artist", "album"].includes(kind) && typeof mediaUrl === "string" ? mediaUrl : null},
      ${kind === "song" ? fileUrl : null}, ${kind === "song" ? fileName : null},
      ${kind === "song" ? fileType : null}, ${kind === "song" ? fileSize : null},
      ${["song", "album"].includes(kind) ? collectiveId : null}, ${kind === "album" ? tracklist : []},
      ${kind === "album" ? releaseYear : null}, ${user.id})`;

    return NextResponse.json({ id }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Your contribution could not be saved." }, { status: 500 });
  }
}