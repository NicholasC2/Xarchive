import { neon } from "@neondatabase/serverless";
import { auth } from "@/lib/auth/server";

let connection: ReturnType<typeof neon> | undefined;
let archiveTablesReady: Promise<void> | undefined;

export function getArchiveSql() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not configured");
  }

  connection ??= neon(process.env.DATABASE_URL);
  return connection;
}

async function initializeArchiveTables() {
  const sql = getArchiveSql();

  await sql`CREATE TABLE IF NOT EXISTS archive_profiles (
    user_id TEXT PRIMARY KEY,
    username TEXT NOT NULL,
    bio TEXT NOT NULL DEFAULT '',
    image_url TEXT,
    banner_url TEXT,
    gallery_urls TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;
  await sql`ALTER TABLE archive_profiles ADD COLUMN IF NOT EXISTS banner_url TEXT`;
  await sql`ALTER TABLE archive_profiles ADD COLUMN IF NOT EXISTS gallery_urls TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[]`;
  await sql`CREATE TABLE IF NOT EXISTS archive_entries (
    id TEXT PRIMARY KEY,
    kind TEXT NOT NULL CHECK (kind IN ('song', 'artist', 'album', 'collective')),
    title TEXT NOT NULL,
    aka TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    artists TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    bio TEXT NOT NULL DEFAULT '',
    source TEXT,
    media_url TEXT,
    file_url TEXT,
    file_name TEXT,
    file_type TEXT,
    file_size BIGINT,
    collective_id TEXT,
    album_id TEXT,
    tags TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    genres TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    tracklist TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    release_year INTEGER,
    created_by TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;
  await sql`ALTER TABLE archive_entries ADD COLUMN IF NOT EXISTS collective_id TEXT`;
  await sql`ALTER TABLE archive_entries ADD COLUMN IF NOT EXISTS album_id TEXT`;
  await sql`ALTER TABLE archive_entries ADD COLUMN IF NOT EXISTS tags TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[]`;
  await sql`ALTER TABLE archive_entries ADD COLUMN IF NOT EXISTS genres TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[]`;
  await sql`ALTER TABLE archive_entries ADD COLUMN IF NOT EXISTS tracklist TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[]`;
  await sql`ALTER TABLE archive_entries ADD COLUMN IF NOT EXISTS release_year INTEGER`;
  await sql`CREATE TABLE IF NOT EXISTS archive_audio_files (
    id TEXT PRIMARY KEY,
    song_id TEXT NOT NULL REFERENCES archive_entries(id) ON DELETE CASCADE,
    file_url TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    source TEXT,
    bio TEXT NOT NULL DEFAULT '',
    labels TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;
  await sql`ALTER TABLE archive_audio_files ADD COLUMN IF NOT EXISTS source TEXT`;
  await sql`ALTER TABLE archive_audio_files ADD COLUMN IF NOT EXISTS bio TEXT NOT NULL DEFAULT ''`;
  await sql`ALTER TABLE archive_audio_files ADD COLUMN IF NOT EXISTS labels TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[]`;
  await sql`INSERT INTO archive_audio_files (id, song_id, file_url, file_name, file_type, file_size)
    SELECT e.id || ':legacy', e.id, e.file_url, COALESCE(e.file_name, 'audio'),
      COALESCE(e.file_type, 'audio/mpeg'), COALESCE(e.file_size, 0)
    FROM archive_entries e
    WHERE e.kind = 'song' AND e.file_url IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM archive_audio_files f WHERE f.song_id = e.id)
    ON CONFLICT (id) DO NOTHING`;
  await sql`UPDATE archive_audio_files f SET source = e.source
    FROM archive_entries e WHERE e.id = f.song_id AND f.source IS NULL AND e.source IS NOT NULL`;
  await sql`CREATE TABLE IF NOT EXISTS archive_entry_images (
    id TEXT PRIMARY KEY,
    entry_id TEXT NOT NULL REFERENCES archive_entries(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    image_kind TEXT NOT NULL DEFAULT 'cover',
    alt TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;
  await sql`INSERT INTO archive_entry_images (id, entry_id, image_url, image_kind)
    SELECT e.id || ':cover', e.id, e.media_url, 'cover'
    FROM archive_entries e
    WHERE e.kind = 'song' AND e.media_url LIKE 'data:image/%'
      AND NOT EXISTS (SELECT 1 FROM archive_entry_images i WHERE i.entry_id = e.id)
    ON CONFLICT (id) DO NOTHING`;
  await sql`UPDATE archive_entries e SET media_url = NULL
    WHERE e.kind = 'song' AND e.media_url LIKE 'data:image/%'
      AND EXISTS (SELECT 1 FROM archive_entry_images i WHERE i.entry_id = e.id)`;
  await sql`UPDATE archive_entries e SET file_url = NULL, file_name = NULL, file_type = NULL, file_size = NULL
    WHERE e.kind = 'song' AND e.file_url IS NOT NULL
      AND EXISTS (SELECT 1 FROM archive_audio_files f WHERE f.song_id = e.id)`;
  await sql`UPDATE archive_entries e SET source = NULL
    WHERE e.kind = 'song' AND e.source IS NOT NULL
      AND EXISTS (SELECT 1 FROM archive_audio_files f WHERE f.song_id = e.id AND f.source = e.source)`;
  await sql`CREATE TABLE IF NOT EXISTS archive_comments (
    id TEXT PRIMARY KEY,
    entry_id TEXT NOT NULL REFERENCES archive_entries(id) ON DELETE CASCADE,
    audio_file_id TEXT REFERENCES archive_audio_files(id) ON DELETE CASCADE,
    body TEXT NOT NULL,
    created_by TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (audio_file_id IS NULL OR entry_id IS NOT NULL)
  )`;
  await sql`CREATE TABLE IF NOT EXISTS archive_entry_stats (
    entry_id TEXT PRIMARY KEY REFERENCES archive_entries(id) ON DELETE CASCADE,
    views BIGINT NOT NULL DEFAULT 0,
    downloads BIGINT NOT NULL DEFAULT 0
  )`;
  await sql`DO $$ BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conname = 'archive_entries_kind_check'
        AND conrelid = 'archive_entries'::regclass
        AND pg_get_constraintdef(oid) LIKE '%collective%'
    ) THEN
      ALTER TABLE archive_entries DROP CONSTRAINT IF EXISTS archive_entries_kind_check;
      ALTER TABLE archive_entries ADD CONSTRAINT archive_entries_kind_check
        CHECK (kind IN ('song', 'artist', 'album', 'collective'));
    END IF;
  END $$`;
  await sql`CREATE TABLE IF NOT EXISTS archive_follows (
    follower_id TEXT NOT NULL,
    following_id TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (follower_id, following_id),
    CHECK (follower_id <> following_id)
  )`;
  await sql`CREATE INDEX IF NOT EXISTS archive_entries_created_at_idx ON archive_entries (created_at DESC)`;
  await sql`CREATE INDEX IF NOT EXISTS archive_entries_creator_idx ON archive_entries (created_by)`;
  await sql`CREATE INDEX IF NOT EXISTS archive_audio_files_song_idx ON archive_audio_files (song_id)`;
  await sql`CREATE INDEX IF NOT EXISTS archive_entry_images_entry_idx ON archive_entry_images (entry_id, created_at)`;
  await sql`CREATE INDEX IF NOT EXISTS archive_comments_entry_idx ON archive_comments (entry_id, created_at DESC)`;
  await sql`CREATE INDEX IF NOT EXISTS archive_entry_stats_downloads_idx ON archive_entry_stats (downloads DESC)`;
  await sql`CREATE INDEX IF NOT EXISTS archive_follows_following_idx ON archive_follows (following_id)`;
}

export async function recordArchiveActivity(entryId: string, activity: "views" | "downloads") {
  const sql = getArchiveSql();
  await sql`INSERT INTO archive_entry_stats (entry_id, ${sql.unsafe(activity)})
    VALUES (${entryId}, 1)
    ON CONFLICT (entry_id) DO UPDATE SET ${sql.unsafe(activity)} = archive_entry_stats.${sql.unsafe(activity)} + 1`;
}

export function ensureArchiveTables() {
  archiveTablesReady ??= initializeArchiveTables().catch((error: unknown) => {
    archiveTablesReady = undefined;
    throw error;
  });
  return archiveTablesReady;
}

export async function getCurrentUser() {
  const session = await auth.getSession();
  return session.data?.user ?? null;
}

export async function ensureProfile(
  user: { id: string; name?: string | null; email?: string | null },
) {
  const sql = getArchiveSql();
  const username = user.name?.trim() || user.email?.split("@")[0] || "Listener";
  await sql`INSERT INTO archive_profiles (user_id, username)
    VALUES (${user.id}, ${username})
    ON CONFLICT (user_id) DO NOTHING`;
}

export function isImageDataUrl(value: unknown, maxBytes = 2 * 1024 * 1024): value is string {
  if (typeof value !== "string") return false;
  const match = /^data:image\/(?:jpeg|png|webp|gif);base64,([A-Za-z0-9+/=]+)$/.exec(value);
  return Boolean(match && Math.floor((match[1].length * 3) / 4) <= maxBytes);
}

export function isAudioDataUrl(value: unknown, maxBytes = 8 * 1024 * 1024): value is string {
  if (typeof value !== "string") return false;
  const match = /^data:audio\/(?:mpeg|wav|x-wav|mp4|aac|ogg|flac|webm);base64,([A-Za-z0-9+/=]+)$/.exec(value);
  return Boolean(match && Math.floor((match[1].length * 3) / 4) <= maxBytes);
}

export const audioSources = [
  "soundcloud",
  "spotify",
  "youtube",
  "social media",
  "unknown",
] as const;