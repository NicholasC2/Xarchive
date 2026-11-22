import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { artists, db, MediaEntry } from "@/lib/db";
import { eq } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { validateMedia } from "../validateMedia";

const ArtistSchema = createInsertSchema(artists);

export async function POST(request: NextRequest) {
    try {
        const session = await auth.api.getSession({
            headers: request.headers
        })

        if(!session) {
            return NextResponse.json(
                { error: "You need to be logged in to add an artist." },
                { status: 403 }
            );
        }

        const id = crypto.randomUUID();

        const result = ArtistSchema.safeParse({
            ...(await request.json()),
            id
        });

        if(!result.success) {
            return NextResponse.json(
                { error: "Invalid Schema" },
                { status: 400 }
            );
        }

        const { name, bio } = result.data;

        let media: MediaEntry[];

        try {
            media = validateMedia(result.data.media)
        } catch(err: any) {
            return NextResponse.json(
                { error: "Media Schema invalid" },
                { status: 403 }
            );
        }

        const artist = await db.query.artists.findFirst({where: eq(artists.name, name)}).execute();

        if(artist) {
            return NextResponse.json(
                { error: "Artist already exists" },
                { status: 403 }
            );
        } else {
            await db.insert(artists).values({
                id,
                name,
                bio,
                media,
                contributor: session.user.id,
                createdAt: new Date()
            }).execute()
        }

        return NextResponse.json({id}, { status: 201 });
    } catch (error) {
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}