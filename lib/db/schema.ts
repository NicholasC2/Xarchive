import { sql } from "drizzle-orm";
import {
  integer,
  real,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";
import { Genre } from "./constants/genre";
import { mediaTypes } from "./constants/mediaType";

export const artists = sqliteTable("artists", {
  id: text("id").primaryKey(),

  name: text("name").notNull(),
  bio: text("bio").notNull().default(""),

  createdAt: integer("created_at", {
    mode: "timestamp",
  }).notNull().default(sql`(unixepoch())`),
});

export const albums = sqliteTable("albums", {
  id: text("id").primaryKey(),

  name: text("name").notNull(),
  bio: text("bio").notNull().default(""),

  tags: text("tags", { mode: "json" })
    .$type<string[]>()
    .notNull()
    .default([]),

  genres: text("genres", { mode: "json" })
    .$type<Genre[]>()
    .notNull()
    .default([]),

  artists: text("artists", { mode: "json" })
    .$type<string[]>()
    .notNull()
    .default([]),

  featuredArtists: text("featured_artists", { mode: "json" })
    .$type<string[]>()
    .notNull()
    .default([]),

  releaseDate: text("release_date"),

  createdAt: integer("created_at", {
    mode: "timestamp",
  }).notNull().default(sql`(unixepoch())`),
});

export const songs = sqliteTable("songs", {
  id: text("id").primaryKey(),

  name: text("name").notNull(),
  bio: text("bio").notNull().default(""),

  tags: text("tags", { mode: "json" })
    .$type<string[]>()
    .notNull()
    .default([]),

  genres: text("genres", { mode: "json" })
    .$type<Genre[]>()
    .notNull()
    .default([]),

  artists: text("artists", { mode: "json" })
    .$type<string[]>()
    .notNull()
    .default([]),

  featuredArtists: text("featured_artists", { mode: "json" })
    .$type<string[]>()
    .notNull()
    .default([]),

  album: text("album").references(() => albums.id, {
    onDelete: "cascade",
  }),

  releaseDate: text("release_date"),

  createdAt: integer("created_at", {
    mode: "timestamp",
  }).notNull().default(sql`(unixepoch())`),
});

export const mediaFiles = sqliteTable("media_files", {
  id: text("id").primaryKey(),

  type: text("type", {
    enum: mediaTypes,
  }).notNull(),

  url: text("url").notNull(),

  mimeType: text("mime_type"),
  format: text("format"),

  song: text("song").references(() => songs.id, {
    onDelete: "cascade",
  }),

  album: text("album").references(() => albums.id, {
    onDelete: "cascade",
  }),

  artist: text("artist").references(() => artists.id, {
    onDelete: "cascade",
  }),

  sizeBytes: integer("size_bytes"),

  duration: real("duration"),

  createdAt: integer("created_at", {
    mode: "timestamp",
  }).notNull().default(sql`(unixepoch())`),
});


export type Artist = typeof artists.$inferSelect;
export type NewArtist = typeof artists.$inferInsert;

export type MediaFile = typeof mediaFiles.$inferSelect;
export type NewMediaFile = typeof mediaFiles.$inferInsert;

export type Album = typeof albums.$inferSelect;
export type NewAlbum = typeof albums.$inferInsert;

export type Song = typeof songs.$inferSelect;
export type NewSong = typeof songs.$inferInsert;