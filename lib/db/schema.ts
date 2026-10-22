
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
  uniqueIndex,
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

// ─── Images ──────────────────────────────────────────────

export const images = pgTable("images", {
  id: text("id").primaryKey(),
  url: text("url").notNull(),
  bio: text("bio").notNull(),
});

// ─── Profiles ────────────────────────────────────────────

export const profiles = pgTable(
  "profiles",
  {
    username: text("username").primaryKey(),
    bio: text("bio").notNull(),

    profilePhotoId: text("profile_photo_id").references(
      () => images.id,
      { onDelete: "set null" },
    ),
    bannerPhotoId: text("banner_photo_id").references(
      () => images.id,
      { onDelete: "set null" },
    ),
  },
  (table) => [
    uniqueIndex("profiles_username_unique").on(table.username),
  ],
);

// A profile can follow many profiles and have many followers.
export const profileFollows = pgTable(
  "profile_follows",
  {
    followerUsername: text("follower_username")
      .notNull()
      .references(() => profiles.username, { onDelete: "cascade" }),

    followingUsername: text("following_username")
      .notNull()
      .references(() => profiles.username, { onDelete: "cascade" }),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    primaryKey({
      columns: [table.followerUsername, table.followingUsername],
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
  bio: text("bio").notNull(),
  aka: text("aka"),

  profilePhotoId: text("profile_photo_id").references(
    () => images.id,
    { onDelete: "set null" },
  ),
  bannerPhotoId: text("banner_photo_id").references(
    () => images.id,
    { onDelete: "set null" },
  ),
});

// ─── Collectives ─────────────────────────────────────────

export const collectives = pgTable("collectives", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  bio: text("bio"),

  profilePhotoId: text("profile_photo_id").references(
    () => images.id,
    { onDelete: "set null" },
  ),
  bannerPhotoId: text("banner_photo_id").references(
    () => images.id,
    { onDelete: "set null" },
  ),
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
    index("collective_artists_artist_idx").on(table.artistId),
  ],
);

// ─── Albums ──────────────────────────────────────────────

export const albums = pgTable("albums", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  bio: text("bio").notNull(),

  tags: text("tags").array().notNull().default([]),
  genre: genreEnum("genre").array().notNull().default([]),

  collectiveId: text("collective_id").references(
    () => collectives.id,
    { onDelete: "set null" },
  ),

  // NULL means the album is unreleased or has no known release date.
  releaseDate: date("release_date", { mode: "date" }),

  releaseYear: integer("release_year"),
});

// Many-to-many: albums and their main artists.
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
    index("album_artists_artist_idx").on(table.artistId),
  ],
);

// ─── Songs ───────────────────────────────────────────────

export const songs = pgTable("songs", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  bio: text("bio").notNull(),

  tags: text("tags").array().notNull().default([]),
  genre: genreEnum("genre").array().notNull().default([]),

  collectiveId: text("collective_id").references(
    () => collectives.id,
    { onDelete: "set null" },
  ),

  // NULL means unreleased or no known release date.
  releaseDate: date("release_date", { mode: "date" }),
});

// Main artists and featured artists are separate relationships.
export const songArtists = pgTable(
  "song_artists",
  {
    songId: text("song_id")
      .notNull()
      .references(() => songs.id, { onDelete: "cascade" }),

    artistId: text("artist_id")
      .notNull()
      .references(() => artists.id, { onDelete: "cascade" }),
  },
  (table) => [
    primaryKey({ columns: [table.songId, table.artistId] }),
    index("song_artists_artist_idx").on(table.artistId),
  ],
);

export const songFeaturedArtists = pgTable(
  "song_featured_artists",
  {
    songId: text("song_id")
      .notNull()
      .references(() => songs.id, { onDelete: "cascade" }),

    artistId: text("artist_id")
      .notNull()
      .references(() => artists.id, { onDelete: "cascade" }),
  },
  (table) => [
    primaryKey({ columns: [table.songId, table.artistId] }),
    index("song_featured_artists_artist_idx").on(table.artistId),
  ],
);

// An album can contain many songs, and a song can appear on
// multiple albums (e.g. a single, an EP, and a compilation).
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

// ─── Audio Files ─────────────────────────────────────────

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
  },
  (table) => [
    index("audio_files_song_idx").on(table.songId),
  ],
);

// ─── Album Cover Photos ───────────────────────────────────

export const albumCoverPhotos = pgTable(
  "album_cover_photos",
  {
    albumId: text("album_id")
      .notNull()
      .references(() => albums.id, { onDelete: "cascade" }),

    imageId: text("image_id")
      .notNull()
      .references(() => images.id, { onDelete: "cascade" }),

    position: integer("position").notNull().default(0),
  },
  (table) => [
    primaryKey({ columns: [table.albumId, table.imageId] }),
  ],
);

// ─── Song Cover Photos ────────────────────────────────────

export const songCoverPhotos = pgTable(
  "song_cover_photos",
  {
    songId: text("song_id")
      .notNull()
      .references(() => songs.id, { onDelete: "cascade" }),

    imageId: text("image_id")
      .notNull()
      .references(() => images.id, { onDelete: "cascade" }),

    position: integer("position").notNull().default(0),
  },
  (table) => [
    primaryKey({ columns: [table.songId, table.imageId] }),
  ],
);

// ─── Relations ───────────────────────────────────────────

export const imagesRelations = relations(images, ({ one, many }) => ({
  profilePhotos: many(profiles, { relationName: "profilePhoto" }),
  profileBanners: many(profiles, { relationName: "profileBanner" }),

  artistPhotos: many(artists, { relationName: "artistPhoto" }),
  artistBanners: many(artists, { relationName: "artistBanner" }),

  collectivePhotos: many(collectives, {
    relationName: "collectivePhoto",
  }),
  collectiveBanners: many(collectives, {
    relationName: "collectiveBanner",
  }),

  albumCovers: many(albumCoverPhotos),
  songCovers: many(songCoverPhotos),
}));

export const profilesRelations = relations(
  profiles,
  ({ one, many }) => ({
    profilePhoto: one(images, {
      fields: [profiles.profilePhotoId],
      references: [images.id],
      relationName: "profilePhoto",
    }),
    bannerPhoto: one(images, {
      fields: [profiles.bannerPhotoId],
      references: [images.id],
      relationName: "profileBanner",
    }),
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

export const artistsRelations = relations(artists, ({ one, many }) => ({
  profilePhoto: one(images, {
    fields: [artists.profilePhotoId],
    references: [images.id],
    relationName: "artistPhoto",
  }),
  bannerPhoto: one(images, {
    fields: [artists.bannerPhotoId],
    references: [images.id],
    relationName: "artistBanner",
  }),
  collectives: many(collectiveArtists),
  albums: many(albumArtists),
  songs: many(songArtists),
  featuredSongs: many(songFeaturedArtists),
}));

export const collectivesRelations = relations(
  collectives,
  ({ one, many }) => ({
    profilePhoto: one(images, {
      fields: [collectives.profilePhotoId],
      references: [images.id],
      relationName: "collectivePhoto",
    }),
    bannerPhoto: one(images, {
      fields: [collectives.bannerPhotoId],
      references: [images.id],
      relationName: "collectiveBanner",
    }),
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

export const albumsRelations = relations(albums, ({ one, many }) => ({
  collective: one(collectives, {
    fields: [albums.collectiveId],
    references: [collectives.id],
  }),
  mainArtists: many(albumArtists),
  songs: many(albumSongs),
  coverPhotos: many(albumCoverPhotos),
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

export const songsRelations = relations(songs, ({ one, many }) => ({
  collective: one(collectives, {
    fields: [songs.collectiveId],
    references: [collectives.id],
  }),
  mainArtists: many(songArtists),
  featuredArtists: many(songFeaturedArtists),
  albums: many(albumSongs),
  audioFiles: many(audioFiles),
  coverPhotos: many(songCoverPhotos),
}));

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

export const albumSongsRelations = relations(albumSongs, ({ one }) => ({
  album: one(albums, {
    fields: [albumSongs.albumId],
    references: [albums.id],
  }),
  song: one(songs, {
    fields: [albumSongs.songId],
    references: [songs.id],
  }),
}));

export const audioFilesRelations = relations(audioFiles, ({ one }) => ({
  song: one(songs, {
    fields: [audioFiles.songId],
    references: [songs.id],
  }),
}));

export const albumCoverPhotosRelations = relations(
  albumCoverPhotos,
  ({ one }) => ({
    album: one(albums, {
      fields: [albumCoverPhotos.albumId],
      references: [albums.id],
    }),
    image: one(images, {
      fields: [albumCoverPhotos.imageId],
      references: [images.id],
    }),
  }),
);

export const songCoverPhotosRelations = relations(
  songCoverPhotos,
  ({ one }) => ({
    song: one(songs, {
      fields: [songCoverPhotos.songId],
      references: [songs.id],
    }),
    image: one(images, {
      fields: [songCoverPhotos.imageId],
      references: [images.id],
    }),
  }),
);

// ─── Inferred TypeScript Types ───────────────────────────

export type Image = typeof images.$inferSelect;
export type NewImage = typeof images.$inferInsert;

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
