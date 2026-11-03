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
} from "drizzle-orm/pg-core";

import { genres } from "./constants/genre";
import { sources } from "./constants/sources";

export const personTypes = ["artist", "profile"] as const;
export type PersonType = (typeof personTypes)[number];

export const personTypeEnum = pgEnum("person_type", personTypes);

export const audioSourceEnum = pgEnum("audio_source", sources);

export const genreEnum = pgEnum("genre", genres);

export const mediaStorageTypes = ["r2", "external"] as const;
export type MediaStorageType = (typeof mediaStorageTypes)[number];

export const mediaStorageEnum = pgEnum(
  "media_storage",
  mediaStorageTypes,
);

export const mediaTypes = ["image", "audio", "video", "document"] as const;
export type MediaType = (typeof mediaTypes)[number];

export const mediaTypeEnum = pgEnum("media_type", mediaTypes);

export const people = pgTable("people", {
  username: text("username").primaryKey(),

  type: personTypeEnum("type").notNull().default("profile"),

  name: text("name").notNull(),
  bio: text("bio").notNull().default(""),

  profileImageId: text("profile_image_id"),
  bannerImageId: text("banner_image_id"),

  createdAt: timestamp("created_at", {
    withTimezone: true,
  }).notNull().defaultNow(),
});

export const mediaFiles = pgTable(
  "media_files",
  {
    id: text("id").primaryKey(),

    type: mediaTypeEnum("type").notNull(),

    storage: mediaStorageEnum("storage").notNull(),

    url: text("url").notNull(),

    publicUrl: text("public_url"),

    mimeType: text("mime_type"),
    format: text("format"),

    sizeBytes: bigint("size_bytes", { mode: "number" }),

    duration: doublePrecision("duration"),

    width: integer("width"),
    height: integer("height"),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    }).notNull().defaultNow(),
  },
  (table) => [
    index("media_files_type_idx").on(table.type),
    index("media_files_storage_idx").on(table.storage),
  ],
);

export const albums = pgTable("albums", {
  id: text("id").primaryKey(),

  name: text("name").notNull(),
  bio: text("bio").notNull().default(""),

  tags: text("tags").array().notNull().default([]),
  genres: genreEnum("genres").array().notNull().default([]),

  artists: text("artists").array().notNull().default([]),
  featuredArtists: text("featured_artists").array().notNull().default([]),

  releaseDate: date("release_date", { mode: "date" }),
  releaseYear: integer("release_year"),

  createdAt: timestamp("created_at", {
    withTimezone: true,
  }).notNull().defaultNow(),
});

export const albumCovers = pgTable(
  "album_covers",
  {
    albumId: text("album_id")
      .notNull()
      .references(() => albums.id, { onDelete: "cascade" }),

    mediaId: text("media_id")
      .notNull()
      .references(() => mediaFiles.id, { onDelete: "cascade" }),

    position: integer("position").notNull().default(0),

    isPrimary: integer("is_primary").notNull().default(0),
  },
  (table) => [
    primaryKey({ columns: [table.albumId, table.mediaId] }),

    index("album_covers_media_idx").on(table.mediaId),

    index("album_covers_order_idx").on(
      table.albumId,
      table.position,
    ),
  ],
);

export const songs = pgTable("songs", {
  id: text("id").primaryKey(),

  name: text("name").notNull(),
  bio: text("bio").notNull().default(""),

  tags: text("tags").array().notNull().default([]),
  genres: genreEnum("genres").array().notNull().default([]),

  artists: text("artists").array().notNull().default([]),
  featuredArtists: text("featured_artists").array().notNull().default([]),

  releaseDate: date("release_date", { mode: "date" }),

  createdAt: timestamp("created_at", {
    withTimezone: true,
  }).notNull().defaultNow(),
});

export const songCovers = pgTable(
  "song_covers",
  {
    songId: text("song_id")
      .notNull()
      .references(() => songs.id, { onDelete: "cascade" }),

    mediaId: text("media_id")
      .notNull()
      .references(() => mediaFiles.id, { onDelete: "cascade" }),

    position: integer("position").notNull().default(0),

    isPrimary: integer("is_primary").notNull().default(0),
  },
  (table) => [
    primaryKey({ columns: [table.songId, table.mediaId] }),

    index("song_covers_media_idx").on(table.mediaId),

    index("song_covers_order_idx").on(
      table.songId,
      table.position,
    ),
  ],
);

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

export const audioFiles = pgTable(
  "audio_files",
  {
    id: text("id").primaryKey(),

    songId: text("song_id")
      .notNull()
      .references(() => songs.id, { onDelete: "cascade" }),

    mediaId: text("media_id")
      .notNull()
      .references(() => mediaFiles.id, { onDelete: "restrict" }),

    format: text("format").notNull(),

    duration: doublePrecision("duration").notNull(),

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

    index("audio_files_media_idx").on(table.mediaId),
  ],
);

export type Person = typeof people.$inferSelect;
export type NewPerson = typeof people.$inferInsert;

export type MediaFile = typeof mediaFiles.$inferSelect;
export type NewMediaFile = typeof mediaFiles.$inferInsert;

export type Album = typeof albums.$inferSelect;
export type NewAlbum = typeof albums.$inferInsert;

export type AlbumCover = typeof albumCovers.$inferSelect;
export type NewAlbumCover = typeof albumCovers.$inferInsert;

export type Song = typeof songs.$inferSelect;
export type NewSong = typeof songs.$inferInsert;

export type SongCover = typeof songCovers.$inferSelect;
export type NewSongCover = typeof songCovers.$inferInsert;

export type AlbumSong = typeof albumSongs.$inferSelect;
export type NewAlbumSong = typeof albumSongs.$inferInsert;

export type AudioFile = typeof audioFiles.$inferSelect;
export type NewAudioFile = typeof audioFiles.$inferInsert;
