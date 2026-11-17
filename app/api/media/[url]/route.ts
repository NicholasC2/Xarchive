import { db } from "@/lib/db"
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
    const url = request.nextUrl.searchParams.get("url")?.trim() ?? "";

    const media = await db.query.mediaFiles.findFirst({
        where: (media, {eq}) => eq(media.url, url)
    }).execute();

    if(media) {
        return Response.json(media)
    } else {
        return Response.json({error: "media not found"}, {
            status: 404
        })
    }
}