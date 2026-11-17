import { db, artists } from "@/lib/db";
import { ilike } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    const query = request.nextUrl.searchParams.get("query")?.trim();

    if (!query) {
        return NextResponse.json([]);
    }

    const results = await db.query.artists.findMany({
        where: ilike(artists.name, `%${query}%`),
        limit: 20,
    });

    return NextResponse.json(results);
}