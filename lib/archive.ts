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
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;
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
    tracklist TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    release_year INTEGER,
    created_by TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;
  await sql`ALTER TABLE archive_entries ADD COLUMN IF NOT EXISTS collective_id TEXT`;
  await sql`ALTER TABLE archive_entries ADD COLUMN IF NOT EXISTS tracklist TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[]`;
  await sql`ALTER TABLE archive_entries ADD COLUMN IF NOT EXISTS release_year INTEGER`;
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
  await sql`CREATE INDEX IF NOT EXISTS archive_follows_following_idx ON archive_follows (following_id)`;
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