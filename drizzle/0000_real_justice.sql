CREATE TYPE "public"."audio_source" AS ENUM('soundcloud', 'spotify', 'youtube', 'social media', 'unknown');--> statement-breakpoint
CREATE TYPE "public"."genre" AS ENUM('pop', 'rock', 'hip-hop', 'rnb', 'electronic', 'dance', 'jazz', 'blues', 'classical', 'country', 'folk', 'metal', 'punk', 'reggae', 'latin', 'world', 'religious', 'soundtrack', 'experimental', 'other');--> statement-breakpoint
CREATE TYPE "public"."media_type" AS ENUM('image', 'audio', 'video', 'cover', 'banner');--> statement-breakpoint
CREATE TABLE "albums" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"bio" text DEFAULT '' NOT NULL,
	"tags" text[] DEFAULT '{}' NOT NULL,
	"genres" "genre"[] DEFAULT '{}' NOT NULL,
	"artists" text[] DEFAULT '{}' NOT NULL,
	"featured_artists" text[] DEFAULT '{}' NOT NULL,
	"release_date" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "artists" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"bio" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "media_files" (
	"id" text PRIMARY KEY NOT NULL,
	"type" "media_type" NOT NULL,
	"url" text NOT NULL,
	"mime_type" text,
	"format" text,
	"song" text,
	"album" text,
	"artist" text,
	"size_bytes" bigint,
	"duration" double precision,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "songs" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"bio" text DEFAULT '' NOT NULL,
	"tags" text[] DEFAULT '{}' NOT NULL,
	"genres" "genre"[] DEFAULT '{}' NOT NULL,
	"artists" text[] DEFAULT '{}' NOT NULL,
	"featured_artists" text[] DEFAULT '{}' NOT NULL,
	"album" text,
	"release_date" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "media_files" ADD CONSTRAINT "media_files_song_songs_id_fk" FOREIGN KEY ("song") REFERENCES "public"."songs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media_files" ADD CONSTRAINT "media_files_album_albums_id_fk" FOREIGN KEY ("album") REFERENCES "public"."albums"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media_files" ADD CONSTRAINT "media_files_artist_artists_id_fk" FOREIGN KEY ("artist") REFERENCES "public"."artists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "songs" ADD CONSTRAINT "songs_album_albums_id_fk" FOREIGN KEY ("album") REFERENCES "public"."albums"("id") ON DELETE cascade ON UPDATE no action;