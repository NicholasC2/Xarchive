
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
import { relations } from "drizzle-orm";

// ─── Enums ───────────────────────────────────────────────

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

// ─── Profiles ────────────────────────────────────────────

export const profiles = pgTable("profiles", {
  username: text("username").primaryKey(),
  bio: text("bio").notNull().default(""),

  // Any URL: local storage, CDN, or external website.
  profilePhotoUrl: text("profile_photo_url"),
  bannerPhotoUrl: text("banner_photo_url"),

  createdAt: timestamp("created_at", {
    withTimezone: true,
  }).notNull().defaultNow(),
});

export const profileFollows = pgTable(
  "profile_follows",
  {
    followerUsername: text("follower_username")
      .notNull()
      .references(() => profiles.username, {
        onDelete: "cascade",
      }),

    followingUsername: text("following_username")
      .notNull()
      .references(() => profiles.username, {
        onDelete: "cascade",
      }),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    }).notNull().defaultNow(),
  },
  (table) => [
    primaryKey({
      columns: [
        table.followerUsername,
        table.followingUsername,
      ],
    }),
    index("profile_follows_following_idx").on(
      table.followingUsername,
    ),
  ],
);

// ─── Artists ─────────────────────────────────────────────

export const artists = pgTable("artists", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  bio: text("bio").notNull().default(""),
  aka: text("aka"),

  profilePhotoUrl: text("profile_photo_url"),
  bannerPhotoUrl: text("banner_photo_url"),

  createdAt: timestamp("created_at", {
    withTimezone: true,
  }).notNull().defaultNow(),
});

// ─── Collectives ─────────────────────────────────────────

export const collectives = pgTable("collectives", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  bio: text("bio").notNull().default(""),

  profilePhotoUrl: text("profile_photo_url"),
  bannerPhotoUrl: text("banner_photo_url"),

  createdAt: timestamp("created_at", {
    withTimezone: true,
  }).notNull().defaultNow(),
});

export const collectiveArtists = pgTable(
  "collective_artists",
  {
    collectiveId: text("collective_id")
      .notNull()
      .references(() => collectives.id, {
        onDelete: "cascade",
      }),

    artistId: text("artist_id")
      .notNull()
      .references(() => artists.id, {
        onDelete: "cascade",
      }),
  },
  (table) => [
    primaryKey({
      columns: [table.collectiveId, table.artistId],
    }),
    index("collective_artists_artist_idx").on(table.artistId),
  ],
);

// ─── Albums ──────────────────────────────────────────────

export const albums = pgTable("albums", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  bio: text("bio").notNull().default(""),

  tags: text("tags").array().notNull().default([]),
  genre: genreEnum("genre").array().notNull().default([]),

  // Optional association with a collective.
  collectiveId: text("collective_id").references(
    () => collectives.id,
    { onDelete: "set null" },
  ),

  // A single primary cover URL, from any source.
  coverImageUrl: text("cover_image_url"),

  // Allows a known year even if the exact date is unknown.
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
      .references(() => albums.id, {
        onDelete: "cascade",
      }),

    artistId: text("artist_id")
      .notNull()
      .references(() => artists.id, {
        onDelete: "cascade",
      }),
  },
  (table) => [
    primaryKey({
      columns: [table.albumId, table.artistId],
    }),
    index("album_artists_artist_idx").on(table.artistId),
  ],
);

// ─── Songs ───────────────────────────────────────────────

export const songs = pgTable("songs", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  bio: text("bio").notNull().default(""),

  tags: text("tags").array().notNull().default([]),
  genre: genreEnum("genre").array().notNull().default([]),

  collectiveId: text("collective_id").references(
    () => collectives.id,
    { onDelete: "set null" },
  ),

  // A single primary cover URL, from any source.
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
      .references(() => songs.id, {
        onDelete: "cascade",
      }),

    artistId: text("artist_id")
      .notNull()
      .references(() => artists.id, {
        onDelete: "cascade",
      }),
  },
  (table) => [
    primaryKey({
      columns: [table.songId, table.artistId],
    }),
    index("song_artists_artist_idx").on(table.artistId),
  ],
);

// Featured artists are separate from main artists.
export const songFeaturedArtists = pgTable(
  "song_featured_artists",
  {
    songId: text("song_id")
      .notNull()
      .references(() => songs.id, {
        onDelete: "cascade",
      }),

    artistId: text("artist_id")
      .notNull()
      .references(() => artists.id, {
        onDelete: "cascade",
      }),
  },
  (table) => [
    primaryKey({
      columns: [table.songId, table.artistId],
    }),
    index("song_featured_artists_artist_idx").on(
      table.artistId,
    ),
  ],
);

// ─── Album Tracks ────────────────────────────────────────

// A song can appear on multiple albums.
// trackNumber belongs to the song's placement on an album.
export const albumSongs = pgTable(
  "album_songs",
  {
    albumId: text("album_id")
      .notNull()
      .references(() => albums.id, {
        onDelete: "cascade",
      }),

    songId: text("song_id")
      .notNull()
      .references(() => songs.id, {
        onDelete: "cascade",
      }),

    trackNumber: integer("track_number"),
  },
  (table) => [
    primaryKey({
      columns: [table.albumId, table.songId],
    }),
    index("album_songs_song_idx").on(table.songId),
  ],
);

// ─── Audio Files ─────────────────────────────────────────

export const audioFiles = pgTable(
  "audio_files",
  {
    id: text("id").primaryKey(),

    songId: text("song_id")
      .notNull()
      .references(() => songs.id, {
        onDelete: "cascade",
      }),

    // Audio URL can be local, CDN-hosted, or external.
    url: text("url").notNull(),
    format: text("format").notNull(),

    sampleRateHz: integer("sample_rate_hz").notNull(),
    duration: doublePrecision("duration").notNull(),
    sizeBytes: bigint("size_bytes", {
      mode: "number",
    }).notNull(),

    bitrateKbps: integer("bitrate_kbps"),
    bitDepth: integer("bit_depth"),
    bio: text("bio"),

    source: audioSourceEnum("source"),
  },
  (table) => [
    index("audio_files_song_idx").on(table.songId),
  ],
);

// ─── Relations ───────────────────────────────────────────

export const profilesRelations = relations(
  profiles,
  ({ many }) => ({
    following: many(profileFollows, {
      relationName: "follower",
    }),
    followers: many(profileFollows, {
      relationName: "followed",
    }),
  }),
);

export const profileFollowsRelations = relations(
  profileFollows,
  ({ one }) => ({
    follower: one(profiles, {
      fields: [profileFollows.followerUsername],
      references: [profiles.username],
      relationName: "follower",
    }),
    followed: one(profiles, {
      fields: [profileFollows.followingUsername],
      references: [profiles.username],
      relationName: "followed",
    }),
  }),
);

export const artistsRelations = relations(
  artists,
  ({ many }) => ({
    collectives: many(collectiveArtists),
    albums: many(albumArtists),
    songs: many(songArtists),
    featuredSongs: many(songFeaturedArtists),
  }),
);

export const collectivesRelations = relations(
  collectives,
  ({ many }) => ({
    artists: many(collectiveArtists),
    albums: many(albums),
    songs: many(songs),
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

export const albumsRelations = relations(
  albums,
  ({ one, many }) => ({
    collective: one(collectives, {
      fields: [albums.collectiveId],
      references: [collectives.id],
    }),
    mainArtists: many(albumArtists),
    songs: many(albumSongs),
  }),
);

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

export const songsRelations = relations(
  songs,
  ({ one, many }) => ({
    collective: one(collectives, {
      fields: [songs.collectiveId],
      references: [collectives.id],
    }),
    mainArtists: many(songArtists),
    featuredArtists: many(songFeaturedArtists),
    albums: many(albumSongs),
    audioFiles: many(audioFiles),
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

export const songFeaturedArtistsRelations = relations(
  songFeaturedArtists,
  ({ one }) => ({
    song: one(songs, {
      fields: [songFeaturedArtists.songId],
      references: [songs.id],
    }),
    artist: one(artists, {
      fields: [songFeaturedArtists.artistId],
      references: [artists.id],
    }),
  }),
);

export const albumSongsRelations = relations(
  albumSongs,
  ({ one }) => ({
    album: one(albums, {
      fields: [albumSongs.albumId],
      references: [albums.id],
    }),
    song: one(songs, {
      fields: [albumSongs.songId],
      references: [songs.id],
    }),
  }),
);

export const audioFilesRelations = relations(
  audioFiles,
  ({ one }) => ({
    song: one(songs, {
      fields: [audioFiles.songId],
      references: [songs.id],
    }),
  }),
);

// ─── Inferred TypeScript Types ───────────────────────────

export type Profile = typeof profiles.$inferSelect;
export type NewProfile = typeof profiles.$inferInsert;

export type Artist = typeof artists.$inferSelect;
export type NewArtist = typeof artists.$inferInsert;

export type Collective = typeof collectives.$inferSelect;
export type NewCollective = typeof collectives.$inferInsert;

export type Album = typeof albums.$inferSelect;
export type NewAlbum = typeof albums.$inferInsert;

export type Song = typeof songs.$inferSelect;
export type NewSong = typeof songs.$inferInsert;

export type AudioFile = typeof audioFiles.$inferSelect;
export type NewAudioFile = typeof audioFiles.$inferInsert;
