import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { artists, db } from "@/lib/db";

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

        const {name, bio, media} = await request.json();

        if(typeof name != "string" || name.length < 1) {
            throw "name must be a string";
        }

        if(typeof bio != "string") {
            throw "bio must be a string";
        }

        if(!Array.isArray(media) || !media.every((item: unknown) => typeof item === "string")) {
            throw "media must be an array of strings"
        }

        await db.insert(artists).values({
            name,
            bio,
            media,
            contributor: session.user.id,
            createdAt: new Date()
        }).execute()

        return NextResponse.json({success: true}, { status: 201 });
    } catch (error) {
        return NextResponse.json(
            { error },
            { status: 500 }
        );
    }
}