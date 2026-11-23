import { sql } from "drizzle-orm";
import {
	pgTable,
	text,
	timestamp,
	jsonb,
	date,
} from "drizzle-orm/pg-core";

import { Genre } from "./constants/genre";
import { user } from "@/auth-schema";
import { TextColor } from "@/app/peices/text-color";
import { MediaType } from "./constants/mediaType";
import { AudioSource } from "./constants/audioSources";

export interface MediaEntry {
	url: string;
	comment: string;
	mediaType: MediaType;
	audioSource: AudioSource;
	contributor: string;
}

export const artists = pgTable("artists", {
	id: text("id").primaryKey(),
	
	name: text("name").notNull(),
	bio: text("bio").notNull().default(""),

	media: jsonb("media")
		.$type<MediaEntry[]>()
		.notNull()
		.default(sql`'[]'::jsonb`),

	contributor: text("contributor").references(
		() => user.id,
		{ onDelete: "set null" },
	),

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
		.$type<MediaEntry[]>()
		.notNull()
		.default(sql`'[]'::jsonb`),

	contributor: text("contributor").references(
		() => user.id,
		{ onDelete: "set null" },
	),

	releaseDate: date("release_date", {
		mode: "string",
	}),

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

	genre: jsonb("genre")
		.$type<Genre>()
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
		.$type<MediaEntry[]>()
		.notNull()
		.default(sql`'[]'::jsonb`),

	contributor: text("contributor").references(
		() => user.id,
		{ onDelete: "set null" },
	),

	releaseDate: date("release_date", {
		mode: "string",
	}),

	createdAt: timestamp("created_at", {
		withTimezone: true,
	}).notNull().defaultNow(),
});

export const badges = pgTable("badges", {
    id: text("id").primaryKey(),

    name: text("name").notNull(),
    icon: text("icon").notNull(),
    acquireBy: text("acquire_by").notNull(),

    textColor: jsonb("text_color")
        .$type<TextColor>()
        .notNull()
        .default(sql`'{}'::jsonb`),

    createdAt: timestamp("created_at", {
        withTimezone: true,
    }).notNull().defaultNow(),
});

export const reports = pgTable("reports", {
    id: text("id").primaryKey(),

    by: text("by").references(() => user.id, {
        onDelete: "cascade",
    }),

    reason: text("reason").notNull(),

    reportingId: text("reporting_id").notNull(),
    reportingType: text("reporting_type", {
        enum: ["user", "song", "album", "artist"],
    }).notNull(),

    createdAt: timestamp("created_at", {
        withTimezone: true,
    }).notNull().defaultNow(),
});

export type Report = typeof reports.$inferSelect;
export type NewReport = typeof reports.$inferInsert;

export type Badge = typeof badges.$inferSelect;
export type NewBadge = typeof badges.$inferInsert;

export type Artist = typeof artists.$inferSelect;
export type NewArtist = typeof artists.$inferInsert;

export type Album = typeof albums.$inferSelect;
export type NewAlbum = typeof albums.$inferInsert;

export type Song = typeof songs.$inferSelect;
export type NewSong = typeof songs.$inferInsert;