
import {
  pgTable,
  pgEnum,
  text,
  integer,
  bigint,
  doublePrecision,
  timestamp,
  date,
  primaryKey,
  index,
  check,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// ─── Enums ──────────────────────────────────────────────

export const personTypes = ["artist", "profile"] as const;
export type PersonType = (typeof personTypes)[number];

export const personTypeEnum = pgEnum("person_type", personTypes);

export const sources = [
  "soundcloud",
  "spotify",
  "youtube",
  "social media",
  "unknown",
] as const;

export type AudioSource = (typeof sources)[number];
export const audioSourceEnum = pgEnum("audio_source", sources);

export const genres = [
  "pop",
  "rock",
  "hip-hop",
  "rnb",
  "electronic",
  "dance",
  "jazz",
  "blues",
  "classical",
  "country",
  "folk",
  "metal",
  "punk",
  "reggae",
  "latin",
  "world",
  "religious",
  "soundtrack",
  "experimental",
  "other",
] as const;

export type Genre = (typeof genres)[number];
export const genreEnum = pgEnum("genre", genres);

// ─── People ─────────────────────────────────────────────

export const people = pgTable("people", {
  username: text("username").primaryKey(),

  type: personTypeEnum("type").notNull().default("profile"),

  name: text("name").notNull(),
  bio: text("bio").notNull().default(""),
  profileImageUrl: text("profile_image_url"),
  bannerImageUrl: text("banner_image_url"),

  createdAt: timestamp("created_at", {
    withTimezone: true,
  }).notNull().defaultNow(),
});

// ─── Albums ─────────────────────────────────────────────

export const albums = pgTable("albums", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  bio: text("bio").notNull().default(""),

  tags: text("tags").array().notNull().default([]),
  genres: genreEnum("genres").array().notNull().default([]),

  coverImageUrl: text("cover_image_url"),
  releaseDate: date("release_date", { mode: "date" }),
  releaseYear: integer("release_year"),

  createdAt: timestamp("created_at", {
    withTimezone: true,
  }).notNull().defaultNow(),
});

// Main album artists.
export const albumArtists = pgTable(
  "album_artists",
  {
    albumId: text("album_id")
      .notNull()
      .references(() => albums.id, { onDelete: "cascade" }),

    artistUsername: text("artist_username")
      .notNull()
      .references(() => people.username, { onDelete: "cascade" }),
  },
  (table) => [
    primaryKey({ columns: [table.albumId, table.artistUsername] }),
    index("album_artists_artist_idx").on(table.artistUsername),
  ],
);

// Featured album artists.
export const albumFeaturedArtists = pgTable(
  "album_featured_artists",
  {
    albumId: text("album_id")
      .notNull()
      .references(() => albums.id, { onDelete: "cascade" }),

    artistUsername: text("artist_username")
      .notNull()
      .references(() => people.username, { onDelete: "cascade" }),
  },
  (table) => [
    primaryKey({ columns: [table.albumId, table.artistUsername] }),
    index("album_featured_artists_artist_idx").on(
      table.artistUsername,
    ),
  ],
);

// ─── Songs ──────────────────────────────────────────────

export const songs = pgTable("songs", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  bio: text("bio").notNull().default(""),

  tags: text("tags").array().notNull().default([]),
  genres: genreEnum("genres").array().notNull().default([]),

  coverImageUrl: text("cover_image_url"),
  releaseDate: date("release_date", { mode: "date" }),

  createdAt: timestamp("created_at", {
    withTimezone: true,
  }).notNull().defaultNow(),
});

// Main song artists.
export const songArtists = pgTable(
  "song_artists",
  {
    songId: text("song_id")
      .notNull()
      .references(() => songs.id, { onDelete: "cascade" }),

    artistUsername: text("artist_username")
      .notNull()
      .references(() => people.username, { onDelete: "cascade" }),
  },
  (table) => [
    primaryKey({ columns: [table.songId, table.artistUsername] }),
    index("song_artists_artist_idx").on(table.artistUsername),
  ],
);

// Featured song artists.
export const songFeaturedArtists = pgTable(
  "song_featured_artists",
  {
    songId: text("song_id")
      .notNull()
      .references(() => songs.id, { onDelete: "cascade" }),

    artistUsername: text("artist_username")
      .notNull()
      .references(() => people.username, { onDelete: "cascade" }),
  },
  (table) => [
    primaryKey({ columns: [table.songId, table.artistUsername] }),
    index("song_featured_artists_artist_idx").on(
      table.artistUsername,
    ),
  ],
);

// Song placements on albums.
export const albumSongs = pgTable(
  "album_songs",
  {
    albumId: text("album_id")
      .notNull()
      .references(() => albums.id, { onDelete: "cascade" }),

    songId: text("song_id")
      .notNull()
      .references(() => songs.id, { onDelete: "cascade" }),

    trackNumber: integer("track_number"),
  },
  (table) => [
    primaryKey({ columns: [table.albumId, table.songId] }),
    index("album_songs_song_idx").on(table.songId),
  ],
);

// ─── Audio Files ────────────────────────────────────────

export const audioFiles = pgTable(
  "audio_files",
  {
    id: text("id").primaryKey(),

    songId: text("song_id")
      .notNull()
      .references(() => songs.id, { onDelete: "cascade" }),

    // Local storage, CDN, or external URL.
    url: text("url").notNull(),
    format: text("format").notNull(),

    duration: doublePrecision("duration").notNull(),
    sizeBytes: bigint("size_bytes", { mode: "number" }).notNull(),

    sampleRateHz: integer("sample_rate_hz"),
    bitrateKbps: integer("bitrate_kbps"),
    bitDepth: integer("bit_depth"),

    source: audioSourceEnum("source"),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    }).notNull().defaultNow(),
  },
  (table) => [
    index("audio_files_song_idx").on(table.songId),
  ],
);

// ─── Inferred Types ─────────────────────────────────────

export type Person = typeof people.$inferSelect;
export type NewPerson = typeof people.$inferInsert;

export type Album = typeof albums.$inferSelect;
export type NewAlbum = typeof albums.$inferInsert;

export type Song = typeof songs.$inferSelect;
export type NewSong = typeof songs.$inferInsert;

export type AudioFile = typeof audioFiles.$inferSelect;
export type NewAudioFile = typeof audioFiles.$inferInsert;
