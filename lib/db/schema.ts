import {
  pgTable,
  pgEnum,
  text,
  bigint,
  doublePrecision,
  timestamp,
  date,
} from "drizzle-orm/pg-core";

import { genres } from "./constants/genre";
import { sources } from "./constants/sources";

export const audioSourceEnum = pgEnum("audio_source", sources);

export const genreEnum = pgEnum("genre", genres);

export const mediaTypes = [
  "image",
  "audio",
  "video",
  "cover",
  "banner" // N/A for albums or songs
] as const;
export type MediaType = (typeof mediaTypes)[number];

export const mediaTypeEnum = pgEnum("media_type", mediaTypes);

export const artists = pgTable("artists", {
  id: text("id").primaryKey(),

  name: text("name").notNull(),
  bio: text("bio").notNull().default(""),

  createdAt: timestamp("created_at", {
    withTimezone: true,
  }).notNull().defaultNow(),
});

export const mediaFiles = pgTable(
  "media_files",
  {
    id: text("id").primaryKey(),

    type: mediaTypeEnum("type").notNull(),

    url: text("url").notNull(),

    mimeType: text("mime_type"),
    format: text("format"),

    song: text("song").references(() => songs.id, { onDelete: "cascade" }),
    album: text("album").references(() => albums.id, { onDelete: "cascade" }),
    artist: text("artist").references(() => artists.id, { onDelete: "cascade" }),

    sizeBytes: bigint("size_bytes", { mode: "number" }),

    duration: doublePrecision("duration"),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    }).notNull().defaultNow(),
  }
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

  createdAt: timestamp("created_at", {
    withTimezone: true,
  }).notNull().defaultNow(),
});

export const songs = pgTable("songs", {
  id: text("id").primaryKey(),

  name: text("name").notNull(),
  bio: text("bio").notNull().default(""),

  tags: text("tags").array().notNull().default([]),
  genres: genreEnum("genres").array().notNull().default([]),

  artists: text("artists").array().notNull().default([]),
  featuredArtists: text("featured_artists").array().notNull().default([]),

  album: text("album").references(() => albums.id, { onDelete: "cascade" }),

  releaseDate: date("release_date", { mode: "date" }),

  createdAt: timestamp("created_at", {
    withTimezone: true,
  }).notNull().defaultNow(),
});

export type Artist = typeof artists.$inferSelect;
export type NewArtist = typeof artists.$inferInsert;

export type MediaFile = typeof mediaFiles.$inferSelect;
export type NewMediaFile = typeof mediaFiles.$inferInsert;

export type Album = typeof albums.$inferSelect;
export type NewAlbum = typeof albums.$inferInsert;

export type Song = typeof songs.$inferSelect;
export type NewSong = typeof songs.$inferInsert;