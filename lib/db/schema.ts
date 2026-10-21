import {
  pgTable,
  pgEnum,
  uuid,
  text,
  integer,
  bigint,
  doublePrecision,
  date,
  primaryKey,
} from "drizzle-orm/pg-core";

import { sources, genres } from "../types";

export const audioSourceEnum = pgEnum("audio_source", sources as [string, ...string[]]);
export const genreEnum = pgEnum("genre", genres);

export const images = pgTable("images", {
  id: uuid("id").defaultRandom().primaryKey(),
  url: text("url").notNull(),
});

export const profiles = pgTable("profiles", {
  username: text("username").primaryKey(),
  bio: text("bio").notNull(),
  profilePhotoId: uuid("profile_photo_id").references(() => images.id),
  bannerPhotoId: uuid("banner_photo_id").references(() => images.id),
});

export const profileFollows = pgTable(
  "profile_follows",
  {
    follower: text("follower")
      .notNull()
      .references(() => profiles.username, { onDelete: "cascade" }),
    following: text("following")
      .notNull()
      .references(() => profiles.username, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.follower, t.following] })],
);

export const artists = pgTable("artists", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  bio: text("bio").notNull(),
  aka: text("aka"),
  profilePhotoId: uuid("profile_photo_id").references(() => images.id),
  bannerPhotoId: uuid("banner_photo_id").references(() => images.id),
});

export const collectives = pgTable("collectives", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  bio: text("bio"),
  profilePhotoId: uuid("profile_photo_id").references(() => images.id),
  bannerPhotoId: uuid("banner_photo_id").references(() => images.id),
});

export const collectiveArtists = pgTable(
  "collective_artists",
  {
    collectiveId: uuid("collective_id")
      .notNull()
      .references(() => collectives.id, { onDelete: "cascade" }),
    artistId: uuid("artist_id")
      .notNull()
      .references(() => artists.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.collectiveId, t.artistId] })],
);

export const albums = pgTable("albums", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  bio: text("bio").notNull(),
  tags: text("tags").array().notNull().default([]),
  genre: genreEnum("genre").array().notNull().default([]),
  collectiveId: uuid("collective_id").references(() => collectives.id),
  releaseDate: date("release_date", { mode: "date" }),
  releaseYear: integer("release_year"),
});

export const albumArtists = pgTable(
  "album_artists",
  {
    albumId: uuid("album_id")
      .notNull()
      .references(() => albums.id, { onDelete: "cascade" }),
    artistId: uuid("artist_id")
      .notNull()
      .references(() => artists.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.albumId, t.artistId] })],
);

export const albumCoverPhotos = pgTable(
  "album_cover_photos",
  {
    albumId: uuid("album_id")
      .notNull()
      .references(() => albums.id, { onDelete: "cascade" }),
    imageId: uuid("image_id")
      .notNull()
      .references(() => images.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.albumId, t.imageId] })],
);

export const songs = pgTable("songs", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  bio: text("bio").notNull(),
  tags: text("tags").array().notNull().default([]),
  genre: genreEnum("genre").array().notNull().default([]),
  collectiveId: uuid("collective_id").references(() => collectives.id),
  releaseDate: date("release_date", { mode: "date" }),
});

export const songArtists = pgTable(
  "song_artists",
  {
    songId: uuid("song_id")
      .notNull()
      .references(() => songs.id, { onDelete: "cascade" }),
    artistId: uuid("artist_id")
      .notNull()
      .references(() => artists.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.songId, t.artistId] })],
);

export const songFeaturedArtists = pgTable(
  "song_featured_artists",
  {
    songId: uuid("song_id")
      .notNull()
      .references(() => songs.id, { onDelete: "cascade" }),
    artistId: uuid("artist_id")
      .notNull()
      .references(() => artists.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.songId, t.artistId] })],
);

export const songAlbums = pgTable(
  "song_albums",
  {
    songId: uuid("song_id")
      .notNull()
      .references(() => songs.id, { onDelete: "cascade" }),
    albumId: uuid("album_id")
      .notNull()
      .references(() => albums.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.songId, t.albumId] })],
);

export const songCoverPhotos = pgTable(
  "song_cover_photos",
  {
    songId: uuid("song_id")
      .notNull()
      .references(() => songs.id, { onDelete: "cascade" }),
    imageId: uuid("image_id")
      .notNull()
      .references(() => images.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.songId, t.imageId] })],
);

export const audioFiles = pgTable("audio_files", {
  id: uuid("id").defaultRandom().primaryKey(),
  songId: uuid("song_id")
    .notNull()
    .references(() => songs.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  format: text("format").notNull(),
  sampleRateHz: integer("sample_rate_hz").notNull(),
  duration: doublePrecision("duration").notNull(),
  sizeBytes: bigint("size_bytes", { mode: "number" }).notNull(),
  bitrateKbps: integer("bitrate_kbps"),
  bitDepth: integer("bit_depth"),
  bio: text("bio"),
  source: audioSourceEnum("source"),
});