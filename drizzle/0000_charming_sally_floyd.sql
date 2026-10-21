CREATE TYPE "public"."audio_source" AS ENUM('soundcloud', 'spotify', 'youtube', 'social media', 'unknown');--> statement-breakpoint
CREATE TYPE "public"."genre" AS ENUM('pop', 'rock', 'hip-hop', 'rnb', 'electronic', 'dance', 'jazz', 'blues', 'classical', 'country', 'folk', 'metal', 'punk', 'reggae', 'latin', 'world', 'religious', 'soundtrack', 'experimental', 'other');--> statement-breakpoint
CREATE TABLE "album_artists" (
	"album_id" text NOT NULL,
	"artist_id" text NOT NULL,
	CONSTRAINT "album_artists_album_id_artist_id_pk" PRIMARY KEY("album_id","artist_id")
);
--> statement-breakpoint
CREATE TABLE "albums" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"bio" text DEFAULT '' NOT NULL,
	"tags" text[] DEFAULT '{}' NOT NULL,
	"genre" "genre"[] DEFAULT '{}' NOT NULL,
	"release_date" date,
	"release_year" integer,
	"collective_id" text
);
--> statement-breakpoint
CREATE TABLE "artists" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"bio" text DEFAULT '' NOT NULL,
	"aka" text DEFAULT '' NOT NULL,
	"profile_photo" jsonb
);
--> statement-breakpoint
CREATE TABLE "audio_files" (
	"id" text PRIMARY KEY NOT NULL,
	"song_id" text NOT NULL,
	"url" text NOT NULL,
	"format" text NOT NULL,
	"sample_rate_hz" integer NOT NULL,
	"duration" double precision NOT NULL,
	"size_bytes" bigint NOT NULL,
	"bitrate_kbps" integer,
	"bit_depth" integer,
	"bio" text,
	"source" "audio_source",
	"position" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "collective_artists" (
	"collective_id" text NOT NULL,
	"artist_id" text NOT NULL,
	CONSTRAINT "collective_artists_collective_id_artist_id_pk" PRIMARY KEY("collective_id","artist_id")
);
--> statement-breakpoint
CREATE TABLE "collectives" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"bio" text
);
--> statement-breakpoint
CREATE TABLE "song_artists" (
	"song_id" text NOT NULL,
	"artist_id" text NOT NULL,
	"role" text NOT NULL,
	CONSTRAINT "song_artists_song_id_artist_id_role_pk" PRIMARY KEY("song_id","artist_id","role")
);
--> statement-breakpoint
CREATE TABLE "songs" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"bio" text DEFAULT '' NOT NULL,
	"tags" text[] DEFAULT '{}' NOT NULL,
	"genre" "genre"[] DEFAULT '{}' NOT NULL,
	"release_date" date,
	"album_id" text,
	"collective_id" text
);
--> statement-breakpoint
ALTER TABLE "album_artists" ADD CONSTRAINT "album_artists_album_id_albums_id_fk" FOREIGN KEY ("album_id") REFERENCES "public"."albums"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "album_artists" ADD CONSTRAINT "album_artists_artist_id_artists_id_fk" FOREIGN KEY ("artist_id") REFERENCES "public"."artists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "albums" ADD CONSTRAINT "albums_collective_id_collectives_id_fk" FOREIGN KEY ("collective_id") REFERENCES "public"."collectives"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audio_files" ADD CONSTRAINT "audio_files_song_id_songs_id_fk" FOREIGN KEY ("song_id") REFERENCES "public"."songs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collective_artists" ADD CONSTRAINT "collective_artists_collective_id_collectives_id_fk" FOREIGN KEY ("collective_id") REFERENCES "public"."collectives"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collective_artists" ADD CONSTRAINT "collective_artists_artist_id_artists_id_fk" FOREIGN KEY ("artist_id") REFERENCES "public"."artists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "song_artists" ADD CONSTRAINT "song_artists_song_id_songs_id_fk" FOREIGN KEY ("song_id") REFERENCES "public"."songs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "song_artists" ADD CONSTRAINT "song_artists_artist_id_artists_id_fk" FOREIGN KEY ("artist_id") REFERENCES "public"."artists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "songs" ADD CONSTRAINT "songs_album_id_albums_id_fk" FOREIGN KEY ("album_id") REFERENCES "public"."albums"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "songs" ADD CONSTRAINT "songs_collective_id_collectives_id_fk" FOREIGN KEY ("collective_id") REFERENCES "public"."collectives"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audio_files_song_id_idx" ON "audio_files" USING btree ("song_id");--> statement-breakpoint
CREATE INDEX "song_artists_artist_id_idx" ON "song_artists" USING btree ("artist_id");--> statement-breakpoint
CREATE INDEX "songs_album_id_idx" ON "songs" USING btree ("album_id");