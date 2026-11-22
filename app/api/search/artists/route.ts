import { db, artists } from "@/lib/db";
import { ilike } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    const query = request.nextUrl.searchParams.get("query")?.trim();
    const limit = Number(request.nextUrl.searchParams.get("limit")) || 20;

    if (!query) {
        return NextResponse.json([]);
    }

    const results = await db.query.artists.findMany({
        where: ilike(artists.name, `%${query}%`),
        limit: limit,
    }).execute();

    return NextResponse.json(results);
}