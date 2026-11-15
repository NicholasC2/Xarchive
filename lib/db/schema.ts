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

export const mediaStorageTypes = ["bucket", "external"] as const;
export type MediaStorageType = (typeof mediaStorageTypes)[number];

export const mediaStorageEnum = pgEnum("media_storage", mediaStorageTypes);

export const mediaTypes = ["image", "audio", "video"] as const;
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

    mimeType: text("mime_type"),
    format: text("format"),

    song: text("song").references(() => songs.id, { onDelete: "cascade" }),
    album: text("album").references(() => albums.id, { onDelete: "cascade" }),

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

export type Person = typeof people.$inferSelect;
export type NewPerson = typeof people.$inferInsert;

export type MediaFile = typeof mediaFiles.$inferSelect;
export type NewMediaFile = typeof mediaFiles.$inferInsert;

export type Album = typeof albums.$inferSelect;
export type NewAlbum = typeof albums.$inferInsert;

export type Song = typeof songs.$inferSelect;
export type NewSong = typeof songs.$inferInsert;