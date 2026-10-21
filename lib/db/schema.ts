
import {
  pgTable,
  text,
  integer,
  bigint,
  doublePrecision,
  date,
  jsonb,
  pgEnum,
  primaryKey,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const genreEnum = pgEnum("genre", [
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
]);

export const audioSourceEnum = pgEnum("audio_source", [
  "soundcloud",
  "spotify",
  "youtube",
  "social media",
  "unknown",
]);

export const artists = pgTable("artists", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  bio: text("bio").notNull().default(""),
  aka: text("aka").notNull().default(""),
  profilePhoto: jsonb("profile_photo")
    .$type<{ url: string }>(),
});

export const collectives = pgTable("collectives", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  bio: text("bio"),
});

export const collectiveArtists = pgTable(
  "collective_artists",
  {
    collectiveId: text("collective_id")
      .notNull()
      .references(() => collectives.id, { onDelete: "cascade" }),
    artistId: text("artist_id")
      .notNull()
      .references(() => artists.id, { onDelete: "cascade" }),
  },
  (table) => [
    primaryKey({ columns: [table.collectiveId, table.artistId] }),
  ],
);

export const albums = pgTable("albums", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  bio: text("bio").notNull().default(""),
  tags: text("tags").array().notNull().default([]),
  genre: genreEnum("genre").array().notNull().default([]),
  releaseDate: date("release_date"),
  releaseYear: integer("release_year"),
  collectiveId: text("collective_id")
    .references(() => collectives.id, { onDelete: "set null" }),
});

export const albumArtists = pgTable(
  "album_artists",
  {
    albumId: text("album_id")
      .notNull()
      .references(() => albums.id, { onDelete: "cascade" }),
    artistId: text("artist_id")
      .notNull()
      .references(() => artists.id, { onDelete: "cascade" }),
  },
  (table) => [
    primaryKey({ columns: [table.albumId, table.artistId] }),
  ],
);

export const songs = pgTable(
  "songs",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    bio: text("bio").notNull().default(""),
    tags: text("tags").array().notNull().default([]),
    genre: genreEnum("genre").array().notNull().default([]),
    releaseDate: date("release_date"),
    albumId: text("album_id")
      .references(() => albums.id, { onDelete: "set null" }),
    collectiveId: text("collective_id")
      .references(() => collectives.id, { onDelete: "set null" }),
  },
  (table) => [
    index("songs_album_id_idx").on(table.albumId),
  ],
);

export const songArtists = pgTable(
  "song_artists",
  {
    songId: text("song_id")
      .notNull()
      .references(() => songs.id, { onDelete: "cascade" }),
    artistId: text("artist_id")
      .notNull()
      .references(() => artists.id, { onDelete: "cascade" }),
    role: text("role", {
      enum: ["main", "featured"],
    }).notNull(),
  },
  (table) => [
    primaryKey({
      columns: [table.songId, table.artistId, table.role],
    }),
    index("song_artists_artist_id_idx").on(table.artistId),
  ],
);

export const audioFiles = pgTable(
  "audio_files",
  {
    id: text("id").primaryKey(),
    songId: text("song_id")
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
    position: integer("position").notNull().default(0),
  },
  (table) => [
    index("audio_files_song_id_idx").on(table.songId),
  ],
);

export const artistsRelations = relations(artists, ({ many }) => ({
  albumArtists: many(albumArtists),
  songArtists: many(songArtists),
  collectiveArtists: many(collectiveArtists),
}));

export const collectivesRelations = relations(
  collectives,
  ({ many }) => ({
    artists: many(collectiveArtists),
    albums: many(albums),
    songs: many(songs),
  }),
);

export const albumsRelations = relations(albums, ({ one, many }) => ({
  collective: one(collectives, {
    fields: [albums.collectiveId],
    references: [collectives.id],
  }),
  mainArtist: many(albumArtists),
  songs: many(songs),
}));

export const songsRelations = relations(songs, ({ one, many }) => ({
  album: one(albums, {
    fields: [songs.albumId],
    references: [albums.id],
  }),
  collective: one(collectives, {
    fields: [songs.collectiveId],
    references: [collectives.id],
  }),
  artists: many(songArtists),
  audioFiles: many(audioFiles),
}));

export const audioFilesRelations = relations(audioFiles, ({ one }) => ({
  song: one(songs, {
    fields: [audioFiles.songId],
    references: [songs.id],
  }),
}));

export const albumArtistsRelations = relations(
  albumArtists,
  ({ one }) => ({
    album: one(albums, {
      fields: [albumArtists.albumId],
      references: [albums.id],
    }),
    artist: one(artists, {
      fields: [albumArtists.artistId],
      references: [artists.id],
    }),
  }),
);

export const songArtistsRelations = relations(
  songArtists,
  ({ one }) => ({
    song: one(songs, {
      fields: [songArtists.songId],
      references: [songs.id],
    }),
    artist: one(artists, {
      fields: [songArtists.artistId],
      references: [artists.id],
    }),
  }),
);

export const collectiveArtistsRelations = relations(
  collectiveArtists,
  ({ one }) => ({
    collective: one(collectives, {
      fields: [collectiveArtists.collectiveId],
      references: [collectives.id],
    }),
    artist: one(artists, {
      fields: [collectiveArtists.artistId],
      references: [artists.id],
    }),
  }),
);

export type ArtistRow = typeof artists.$inferSelect;
export type NewArtist = typeof artists.$inferInsert;

export type AlbumRow = typeof albums.$inferSelect;
export type NewAlbum = typeof albums.$inferInsert;

export type SongRow = typeof songs.$inferSelect;
export type NewSong = typeof songs.$inferInsert;

export type CollectiveRow = typeof collectives.$inferSelect;
export type NewCollective = typeof collectives.$inferInsert;

export type AudioFileRow = typeof audioFiles.$inferSelect;
export type NewAudioFile = typeof audioFiles.$inferInsert;
