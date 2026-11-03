CREATE TYPE "public"."audio_source" AS ENUM('soundcloud', 'spotify', 'youtube', 'social media', 'unknown');--> statement-breakpoint
CREATE TYPE "public"."genre" AS ENUM('pop', 'rock', 'hip-hop', 'rnb', 'electronic', 'dance', 'jazz', 'blues', 'classical', 'country', 'folk', 'metal', 'punk', 'reggae', 'latin', 'world', 'religious', 'soundtrack', 'experimental', 'other');--> statement-breakpoint
CREATE TYPE "public"."media_storage" AS ENUM('r2', 'external');--> statement-breakpoint
CREATE TYPE "public"."media_type" AS ENUM('image', 'audio', 'video', 'document');--> statement-breakpoint
CREATE TYPE "public"."person_type" AS ENUM('artist', 'profile');--> statement-breakpoint
CREATE TABLE "album_covers" (
	"album_id" text NOT NULL,
	"media_id" text NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"is_primary" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "album_covers_album_id_media_id_pk" PRIMARY KEY("album_id","media_id")
);
--> statement-breakpoint
CREATE TABLE "album_songs" (
	"album_id" text NOT NULL,
	"song_id" text NOT NULL,
	"track_number" integer,
	CONSTRAINT "album_songs_album_id_song_id_pk" PRIMARY KEY("album_id","song_id")
);
--> statement-breakpoint
CREATE TABLE "albums" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"bio" text DEFAULT '' NOT NULL,
	"tags" text[] DEFAULT '{}' NOT NULL,
	"genres" "genre"[] DEFAULT '{}' NOT NULL,
	"artists" text[] DEFAULT '{}' NOT NULL,
	"featured_artists" text[] DEFAULT '{}' NOT NULL,
	"release_date" date,
	"release_year" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audio_files" (
	"id" text PRIMARY KEY NOT NULL,
	"song_id" text NOT NULL,
	"media_id" text NOT NULL,
	"format" text NOT NULL,
	"duration" double precision NOT NULL,
	"sample_rate_hz" integer,
	"bitrate_kbps" integer,
	"bit_depth" integer,
	"source" "audio_source",
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "media_files" (
	"id" text PRIMARY KEY NOT NULL,
	"type" "media_type" NOT NULL,
	"storage" "media_storage" NOT NULL,
	"url" text NOT NULL,
	"public_url" text,
	"mime_type" text,
	"format" text,
	"size_bytes" bigint,
	"duration" double precision,
	"width" integer,
	"height" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "people" (
	"username" text PRIMARY KEY NOT NULL,
	"type" "person_type" DEFAULT 'profile' NOT NULL,
	"name" text NOT NULL,
	"bio" text DEFAULT '' NOT NULL,
	"profile_image_id" text,
	"banner_image_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "song_covers" (
	"song_id" text NOT NULL,
	"media_id" text NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"is_primary" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "song_covers_song_id_media_id_pk" PRIMARY KEY("song_id","media_id")
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
	"release_date" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "album_covers" ADD CONSTRAINT "album_covers_album_id_albums_id_fk" FOREIGN KEY ("album_id") REFERENCES "public"."albums"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "album_covers" ADD CONSTRAINT "album_covers_media_id_media_files_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media_files"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "album_songs" ADD CONSTRAINT "album_songs_album_id_albums_id_fk" FOREIGN KEY ("album_id") REFERENCES "public"."albums"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "album_songs" ADD CONSTRAINT "album_songs_song_id_songs_id_fk" FOREIGN KEY ("song_id") REFERENCES "public"."songs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audio_files" ADD CONSTRAINT "audio_files_song_id_songs_id_fk" FOREIGN KEY ("song_id") REFERENCES "public"."songs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audio_files" ADD CONSTRAINT "audio_files_media_id_media_files_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media_files"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "song_covers" ADD CONSTRAINT "song_covers_song_id_songs_id_fk" FOREIGN KEY ("song_id") REFERENCES "public"."songs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "song_covers" ADD CONSTRAINT "song_covers_media_id_media_files_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media_files"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "album_covers_media_idx" ON "album_covers" USING btree ("media_id");--> statement-breakpoint
CREATE INDEX "album_covers_order_idx" ON "album_covers" USING btree ("album_id","position");--> statement-breakpoint
CREATE INDEX "album_songs_song_idx" ON "album_songs" USING btree ("song_id");--> statement-breakpoint
CREATE INDEX "audio_files_song_idx" ON "audio_files" USING btree ("song_id");--> statement-breakpoint
CREATE INDEX "audio_files_media_idx" ON "audio_files" USING btree ("media_id");--> statement-breakpoint
CREATE INDEX "media_files_type_idx" ON "media_files" USING btree ("type");--> statement-breakpoint
CREATE INDEX "media_files_storage_idx" ON "media_files" USING btree ("storage");--> statement-breakpoint
CREATE INDEX "song_covers_media_idx" ON "song_covers" USING btree ("media_id");--> statement-breakpoint
CREATE INDEX "song_covers_order_idx" ON "song_covers" USING btree ("song_id","position");