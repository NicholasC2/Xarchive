import { sql } from "drizzle-orm";
import {
	pgTable,
	text,
	timestamp,
	jsonb,
	bigint,
} from "drizzle-orm/pg-core";

import { Genre } from "./constants/genre";
import { mediaTypes } from "./constants/mediaType";
import { sources } from "./constants/sources";

export const artists = pgTable("artists", {
	id: text("id").primaryKey(),

	name: text("name").notNull(),
	bio: text("bio").notNull().default(""),

	media: jsonb("media")
		.$type<string[]>()
		.notNull()
		.default(sql`'[]'::jsonb`),

	createdAt: timestamp("created_at", {
		withTimezone: true,
	}).notNull().defaultNow(),
});

export const albums = pgTable("albums", {
	id: text("id").primaryKey(),

	name: text("name").notNull(),
	bio: text("bio").notNull().default(""),

	tags: jsonb("tags")
		.$type<string[]>()
		.notNull()
		.default(sql`'[]'::jsonb`),

	songs: jsonb("songs")
		.$type<string[]>()
		.notNull()
		.default(sql`'[]'::jsonb`),

	media: jsonb("media")
		.$type<string[]>()
		.notNull()
		.default(sql`'[]'::jsonb`),

	releaseDate: text("release_date"),

	createdAt: timestamp("created_at", {
		withTimezone: true,
	}).notNull().defaultNow(),
});

export const songs = pgTable("songs", {
	id: text("id").primaryKey(),

	name: text("name").notNull(),
	bio: text("bio").notNull().default(""),

	tags: jsonb("tags")
		.$type<string[]>()
		.notNull()
		.default(sql`'[]'::jsonb`),

	genres: jsonb("genres")
		.$type<Genre[]>()
		.notNull()
		.default(sql`'[]'::jsonb`),

	artists: jsonb("artists")
		.$type<string[]>()
		.notNull()
		.default(sql`'[]'::jsonb`),

	featuredArtists: jsonb("featured_artists")
		.$type<string[]>()
		.notNull()
		.default(sql`'[]'::jsonb`),

	media: jsonb("media")
		.$type<string[]>()
		.notNull()
		.default(sql`'[]'::jsonb`),

	releaseDate: text("release_date"),

	createdAt: timestamp("created_at", {
		withTimezone: true,
	}).notNull().defaultNow(),
});

export const mediaFiles = pgTable("media_files", {
	url: text("url").primaryKey(),

	name: text("name").notNull(),

	type: text("type", {
		enum: mediaTypes,
	}).notNull(),

	source: text("source", {
		enum: sources,
	}).notNull(),

	mimeType: text("mime_type"),
	format: text("format"),
	sizeBytes: bigint("size_bytes", {mode: "number"}), // mb

	createdAt: timestamp("created_at", {
		withTimezone: true,
	}).notNull().defaultNow(),
});

export type Artist = typeof artists.$inferSelect;
export type NewArtist = typeof artists.$inferInsert;

export type MediaFile = typeof mediaFiles.$inferSelect;
export type NewMediaFile = typeof mediaFiles.$inferInsert;

export type Album = typeof albums.$inferSelect;
export type NewAlbum = typeof albums.$inferInsert;

export type Song = typeof songs.$inferSelect;
export type NewSong = typeof songs.$inferInsert;