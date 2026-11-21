import { albums, artists, db, songs } from "@/lib/db";
import { ilike } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    const query = request.nextUrl.searchParams.get("query")?.trim();
    const limit = Number(request.nextUrl.searchParams.get("limit")) || 20;

    if (!query) {
        return NextResponse.json([]);
    }

    const [searchedArtists, searchedAlbums, searchedSongs] = await Promise.all([
        db.query.artists.findMany({
            where: ilike(artists.name, `%${query}%`),
            limit,
        }).execute(),

        db.query.albums.findMany({
            where: ilike(albums.name, `%${query}%`),
            limit,
        }).execute(),

        db.query.songs.findMany({
            where: ilike(songs.name, `%${query}%`),
            limit,
        }).execute()
    ]);

    return NextResponse.json([...searchedArtists, ...searchedAlbums, ...searchedSongs]);
}