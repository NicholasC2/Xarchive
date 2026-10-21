import { NextResponse } from "next/server";
import {
  audioSources,
  ensureArchiveTables,
  ensureProfile,
  getArchiveSql,
  getCurrentUser,
  isAudioDataUrl,
  isImageDataUrl,
  normalizeArchiveLinks,
  withAudioFileSummaries,
} from "@/lib/archive";
import { withAudioFileSummaries } from "@/lib/audio-file-summary";
import { withArchiveImageSummaries } from "@/lib/archive-image-summary";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await ensureArchiveTables();
    const sql = getArchiveSql();
    const entries = await sql`SELECT e.id, e.kind, e.title, e.aka, e.artists,
      e.bio, e.source, CASE WHEN e.kind = 'song' THEN NULL ELSE e.media_url END AS "mediaUrl",
      e.file_name AS "fileName", e.file_type AS "fileType", e.file_size AS "fileSize",
      e.tracklist, e.tags, e.genres, e.album_id AS "albumId", a.title AS album, e.release_year AS "releaseYear",
      e.collective_id AS "collectiveId", c.title AS collective,
      e.page_views AS "pageViews", e.links, e.created_by AS "createdBy", e.created_at AS "createdAt",
      p.username AS "creatorName", p.image_url AS "creatorImage"
      FROM archive_entries e LEFT JOIN archive_profiles p ON p.user_id = e.created_by
      LEFT JOIN archive_entries c ON c.id = e.collective_id
      LEFT JOIN archive_entries a ON a.id = e.album_id
      ORDER BY e.created_at DESC LIMIT 100`;
    const artistRows = await sql`SELECT id, title FROM archive_entries WHERE kind = 'artist' ORDER BY title LIMIT 300`;
    const albums = await sql`SELECT id, title, artists, media_url AS "mediaUrl", release_year AS "releaseYear"
      FROM archive_entries WHERE kind = 'album' ORDER BY title LIMIT 300`;

    const entryIds = (entries as unknown as { id: string }[]).map((entry) => entry.id);
    const audioRows = entryIds.length
      ? await sql`SELECT id, song_id AS "songId", file_name AS "fileName", file_type AS "fileType", file_size AS "fileSize",
          source, bio, labels
          FROM archive_audio_files WHERE song_id = ANY(${entryIds})
          ORDER BY CASE WHEN LOWER(file_type || ' ' || file_name) ~ '(flac|wav|wave|alac|aiff|ape|wv)' THEN 0 ELSE 1 END, file_size DESC`
      : [];
    const entriesWithAudioUrls = withAudioFileSummaries(
      entries as unknown as { id: string; kind: string; fileUrl?: string | null }[],
      audioRows as unknown as import("@/lib/audio-file-summary").AudioFileRow[],
    );
    const imageRows = entryIds.length
      ? await sql`SELECT id, entry_id AS "entryId" FROM archive_entry_images
          WHERE entry_id = ANY(${entryIds}) ORDER BY created_at, id`
      : [];
    const entriesWithImages = withArchiveImageSummaries(
      entriesWithAudioUrls as (typeof entriesWithAudioUrls[number] & { mediaUrl?: string | null })[],
      imageRows as unknown as import("@/lib/archive-image-summary").ArchiveImageRow[],
    );

    return NextResponse.json({ entries: entriesWithImages, artists: artistRows, albums });
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
    const albumId = typeof body.albumId === "string" && body.albumId ? body.albumId : null;
    const parseReleaseYear = (value: unknown) => {
      if (typeof value === "string") {
        const trimmed = value.trim();
        if (!trimmed) return null;
        if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
          const year = Number(trimmed.slice(0, 4));
          return year >= 1000 && year <= 3000 ? year : null;
        }
        const asNumber = Number(trimmed);
        if (Number.isInteger(asNumber) && asNumber >= 1000 && asNumber <= 3000) {
          return asNumber;
        }
      }
      if (typeof value === "number" && Number.isInteger(value) && value >= 1000 && value <= 3000) {
        return value;
      }
      return null;
    };
    const releaseYear = parseReleaseYear(body.releaseDate ?? body.releaseYear ?? body.songReleaseDate ?? body.songReleaseYear);
    const tags = Array.isArray(body.tags)
      ? body.tags.filter((tag: unknown): tag is string => typeof tag === "string").map((tag: string) => tag.trim().toLowerCase()).filter(Boolean).slice(0, 30)
      : [];
    const genres = Array.isArray(body.genres)
      ? body.genres.filter((genre: unknown): genre is string => typeof genre === "string").map((genre: string) => genre.trim().toLowerCase()).filter(Boolean).slice(0, 10)
      : [];
    const source = body.source;
    const mediaUrl = body.mediaUrl;
    const bannerImage = body.bannerImage;
    const galleryImages: string[] = Array.isArray(body.galleryImages)
      ? body.galleryImages.filter((image: unknown): image is string => typeof image === "string")
      : [];
    const submittedAudioFiles: Record<string, unknown>[] = Array.isArray(body.audioFiles)
      ? body.audioFiles.filter((file: unknown): file is Record<string, unknown> => typeof file === "object" && file !== null)
      : body.fileUrl ? [{ fileUrl: body.fileUrl, fileName: body.fileName, fileType: body.fileType, fileSize: body.fileSize }] : [];
    const audioFiles: { fileUrl: unknown; fileName: string; fileType: string; fileSize: number; source: string; bio: string; labels: string[] }[] = submittedAudioFiles.map((file) => {
      const fileUrl = file.fileUrl;
      const match = typeof fileUrl === "string" ? /^data:(audio\/(?:mpeg|wav|x-wav|mp4|aac|ogg|flac|webm));base64,/.exec(fileUrl) : null;
      return {
        fileUrl,
        fileName: typeof file.fileName === "string" ? file.fileName.slice(0, 180) : "audio",
        fileType: typeof file.fileType === "string" ? file.fileType.slice(0, 100) : match?.[1] ?? "audio/mpeg",
        fileSize: typeof file.fileSize === "number" && file.fileSize > 0 ? Math.floor(file.fileSize) : 0,
        source: typeof file.source === "string" && audioSources.includes(file.source as typeof audioSources[number])
          ? file.source
          : typeof source === "string" && audioSources.includes(source as typeof audioSources[number]) ? source : "unknown",
        bio: typeof file.bio === "string" ? file.bio.trim().slice(0, 2000) : "",
        labels: Array.isArray(file.labels)
          ? file.labels.filter((label: unknown): label is string => typeof label === "string").map((label: string) => label.trim().toLowerCase()).filter(Boolean).slice(0, 30)
          : [],
      };
    });
    const coverImages: string[] = Array.isArray(body.coverImages)
      ? body.coverImages.filter((image: unknown): image is string => typeof image === "string").slice(0, 10)
      : typeof mediaUrl === "string" ? [mediaUrl] : [];

    if (!title || title.length > 160 || !["song", "artist", "album", "collective"].includes(kind)) {
      return NextResponse.json({ error: "Add a valid title." }, { status: 400 });
    }
    if (["song", "album", "collective"].includes(kind) && artists.length === 0) {
      return NextResponse.json({ error: kind === "collective" ? "Add at least one artist to this collective." : "Add at least one artist." }, { status: 400 });
    }
    if (["artist", "album", "song", "collective"].includes(kind) && mediaUrl != null && !isImageDataUrl(mediaUrl)) {
      return NextResponse.json({ error: "Images must be supported formats up to 2 MB." }, { status: 400 });
    }
    if (kind === "song" && (coverImages.length > 10 || coverImages.some((image) => !isImageDataUrl(image)))) {
      return NextResponse.json({ error: "Add up to 10 supported song covers, each up to 2 MB." }, { status: 400 });
    }
    if (["artist", "collective"].includes(kind) &&
      ((bannerImage != null && !isImageDataUrl(bannerImage)) || galleryImages.length > 10 || galleryImages.some((image) => !isImageDataUrl(image)))) {
      return NextResponse.json({ error: "Add supported profile, banner, and gallery images up to 2 MB each." }, { status: 400 });
    }
    if (kind === "song" && (!audioFiles.length || audioFiles.length > 10 || audioFiles.some((file) => !isAudioDataUrl(file.fileUrl)))) {
      return NextResponse.json({ error: "Add 1 to 10 supported audio files, each up to 8 MB." }, { status: 400 });
    }
    if (kind === "song" && audioFiles.reduce((total, file) => total + file.fileSize, 0) > 32 * 1024 * 1024) {
      return NextResponse.json({ error: "The combined audio files must be 32 MB or smaller." }, { status: 400 });
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
    let songReleaseYear = releaseYear;
    let albumCoverUrl: string | null = null;
    if (kind === "song" && albumId) {
      const albumRows = await sql`SELECT media_url, release_year FROM archive_entries WHERE id = ${albumId} AND kind = 'album'`;
      const [album] = albumRows as unknown as { media_url: string | null; release_year: number | null }[];
      if (!album) return NextResponse.json({ error: "Choose an album from the archive." }, { status: 400 });
      albumCoverUrl = album.media_url;
      songReleaseYear ??= album.release_year;
    }
    await ensureProfile(user);
    const id = crypto.randomUUID();
    await sql`INSERT INTO archive_entries
      (id, kind, title, aka, artists, bio, source, media_url, banner_url, gallery_images, file_url, file_name, file_type, file_size, collective_id, album_id, tags, genres, tracklist, links, release_year, created_by)
      VALUES (${id}, ${kind}, ${title}, ${aka}, ${artists}, ${bio},
      ${null}, ${kind === "song" ? null : ["artist", "album", "collective"].includes(kind) && typeof mediaUrl === "string" ? mediaUrl : null},
      ${null}, ${null}, ${null}, ${null},
      ${["song", "album"].includes(kind) ? collectiveId : null}, ${kind === "song" ? albumId : null},
      ${kind === "song" ? tags : []}, ${["song", "album", "artist"].includes(kind) ? genres : []}, ${kind === "album" ? tracklist : []},
      ${links}, ${kind === "song" ? songReleaseYear : kind === "album" ? releaseYear : null}, ${user.id})`;

    if (kind === "song") {
      const coversToSave = coverImages.length ? coverImages : albumCoverUrl ? [albumCoverUrl] : [];
      for (const [index, imageUrl] of coversToSave.entries()) {
        await sql`INSERT INTO archive_entry_images (id, entry_id, image_url, image_kind, alt)
          VALUES (${crypto.randomUUID()}, ${id}, ${imageUrl}, 'cover', ${index === 0 ? `${title} cover` : `${title} alternate cover ${index + 1}`})`;
      }
      for (const file of audioFiles) {
        await sql`INSERT INTO archive_audio_files (id, song_id, file_url, file_name, file_type, file_size, source, bio, labels)
          VALUES (${crypto.randomUUID()}, ${id}, ${file.fileUrl}, ${file.fileName}, ${file.fileType}, ${file.fileSize}, ${file.source}, ${file.bio}, ${file.labels})`;
      }
    }
    if (["artist", "collective"].includes(kind)) {
      if (typeof bannerImage === "string") {
        await sql`INSERT INTO archive_entry_images (id, entry_id, image_url, image_kind, alt)
          VALUES (${crypto.randomUUID()}, ${id}, ${bannerImage}, 'banner', ${`${title} banner`})`;
      }
      for (const [index, imageUrl] of galleryImages.entries()) {
        await sql`INSERT INTO archive_entry_images (id, entry_id, image_url, image_kind, alt)
          VALUES (${crypto.randomUUID()}, ${id}, ${imageUrl}, 'gallery', ${`${title} image ${index + 1}`})`;
      }
    }

    return NextResponse.json({ id }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Your contribution could not be saved." }, { status: 500 });
  }
}