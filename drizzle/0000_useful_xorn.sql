CREATE TYPE "public"."audio_source" AS ENUM('soundcloud', 'spotify', 'youtube', 'social media', 'unknown');--> statement-breakpoint
CREATE TYPE "public"."genre" AS ENUM('pop', 'rock', 'hip-hop', 'rnb', 'electronic', 'dance', 'jazz', 'blues', 'classical', 'country', 'folk', 'metal', 'punk', 'reggae', 'latin', 'world', 'religious', 'soundtrack', 'experimental', 'other');--> statement-breakpoint
CREATE TYPE "public"."person_type" AS ENUM('artist', 'profile');--> statement-breakpoint
CREATE TABLE "album_artists" (
	"album_id" text NOT NULL,
	"artist_username" text NOT NULL,
	CONSTRAINT "album_artists_album_id_artist_username_pk" PRIMARY KEY("album_id","artist_username")
);
--> statement-breakpoint
CREATE TABLE "album_featured_artists" (
	"album_id" text NOT NULL,
	"artist_username" text NOT NULL,
	CONSTRAINT "album_featured_artists_album_id_artist_username_pk" PRIMARY KEY("album_id","artist_username")
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
	"cover_image_url" text,
	"release_date" date,
	"release_year" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audio_files" (
	"id" text PRIMARY KEY NOT NULL,
	"song_id" text NOT NULL,
	"url" text NOT NULL,
	"format" text NOT NULL,
	"duration" double precision NOT NULL,
	"size_bytes" bigint NOT NULL,
	"sample_rate_hz" integer,
	"bitrate_kbps" integer,
	"bit_depth" integer,
	"source" "audio_source",
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "people" (
	"username" text PRIMARY KEY NOT NULL,
	"type" "person_type" DEFAULT 'profile' NOT NULL,
	"name" text NOT NULL,
	"bio" text DEFAULT '' NOT NULL,
	"profile_image_url" text,
	"banner_image_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "song_artists" (
	"song_id" text NOT NULL,
	"artist_username" text NOT NULL,
	CONSTRAINT "song_artists_song_id_artist_username_pk" PRIMARY KEY("song_id","artist_username")
);
--> statement-breakpoint
CREATE TABLE "song_featured_artists" (
	"song_id" text NOT NULL,
	"artist_username" text NOT NULL,
	CONSTRAINT "song_featured_artists_song_id_artist_username_pk" PRIMARY KEY("song_id","artist_username")
);
--> statement-breakpoint
CREATE TABLE "songs" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"bio" text DEFAULT '' NOT NULL,
	"tags" text[] DEFAULT '{}' NOT NULL,
	"genres" "genre"[] DEFAULT '{}' NOT NULL,
	"cover_image_url" text,
	"release_date" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "album_artists" ADD CONSTRAINT "album_artists_album_id_albums_id_fk" FOREIGN KEY ("album_id") REFERENCES "public"."albums"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "album_artists" ADD CONSTRAINT "album_artists_artist_username_people_username_fk" FOREIGN KEY ("artist_username") REFERENCES "public"."people"("username") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "album_featured_artists" ADD CONSTRAINT "album_featured_artists_album_id_albums_id_fk" FOREIGN KEY ("album_id") REFERENCES "public"."albums"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "album_featured_artists" ADD CONSTRAINT "album_featured_artists_artist_username_people_username_fk" FOREIGN KEY ("artist_username") REFERENCES "public"."people"("username") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "album_songs" ADD CONSTRAINT "album_songs_album_id_albums_id_fk" FOREIGN KEY ("album_id") REFERENCES "public"."albums"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "album_songs" ADD CONSTRAINT "album_songs_song_id_songs_id_fk" FOREIGN KEY ("song_id") REFERENCES "public"."songs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audio_files" ADD CONSTRAINT "audio_files_song_id_songs_id_fk" FOREIGN KEY ("song_id") REFERENCES "public"."songs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "song_artists" ADD CONSTRAINT "song_artists_song_id_songs_id_fk" FOREIGN KEY ("song_id") REFERENCES "public"."songs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "song_artists" ADD CONSTRAINT "song_artists_artist_username_people_username_fk" FOREIGN KEY ("artist_username") REFERENCES "public"."people"("username") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "song_featured_artists" ADD CONSTRAINT "song_featured_artists_song_id_songs_id_fk" FOREIGN KEY ("song_id") REFERENCES "public"."songs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "song_featured_artists" ADD CONSTRAINT "song_featured_artists_artist_username_people_username_fk" FOREIGN KEY ("artist_username") REFERENCES "public"."people"("username") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "album_artists_artist_idx" ON "album_artists" USING btree ("artist_username");--> statement-breakpoint
CREATE INDEX "album_featured_artists_artist_idx" ON "album_featured_artists" USING btree ("artist_username");--> statement-breakpoint
CREATE INDEX "album_songs_song_idx" ON "album_songs" USING btree ("song_id");--> statement-breakpoint
CREATE INDEX "audio_files_song_idx" ON "audio_files" USING btree ("song_id");--> statement-breakpoint
CREATE INDEX "song_artists_artist_idx" ON "song_artists" USING btree ("artist_username");--> statement-breakpoint
CREATE INDEX "song_featured_artists_artist_idx" ON "song_featured_artists" USING btree ("artist_username");