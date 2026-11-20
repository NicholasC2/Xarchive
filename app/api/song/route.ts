import { NextRequest, NextResponse } from "next/server";
import { db, songs } from "@/lib/db";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        const { 
            id, 
            name,
            bio,
            artists,
            featuredArtists,
            genre,
            tags,
            media,
            releaseDate
        } = body;

        const post = await db.insert(songs).values({
            id: crypto.randomUUID(),
            name,
            bio,

            genre,
            tags,
            media,
            releaseDate,

            createdAt: new Date(),

            artists,
            featuredArtists,
        });

        return NextResponse.json(post, { status: 201 });

    } catch (error) {
        console.error(error);

        return NextResponse.json(
            { error: "Failed to create post" },
            { status: 500 }
        );
    }
}