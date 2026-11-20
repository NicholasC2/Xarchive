import { orderBadges } from "@/app/peices/orderBadges";
import { albums, artists, badges, db, songs } from "@/lib/db";
import { eq, inArray } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    const result = await db.query.user.findFirst({
        where: (user, { eq }) => eq(user.id, id)
    }).execute();

    if (result) {
        const userBadges = result.badges?.length
            ? await db.query.badges.findMany({
                where: inArray(badges.id, result.badges),
            }).execute()
            : [];
        
        const badgeOrder = result.badgeOrder ?? [];

        const orderedBadges = orderBadges(userBadges, badgeOrder, result.role === "admin");

        const contributions = [];

        contributions.push(...await db.query.artists.findMany({
            where: eq(artists.contributor, id)
        }).execute())

        contributions.push(...await db.query.albums.findMany({
            where: eq(albums.contributor, id)
        }).execute())

        contributions.push(...await db.query.songs.findMany({
            where: eq(songs.contributor, id)
        }).execute());

        return NextResponse.json({
            name: result.name ?? "",
            image: result.image ?? "",
            createdAt: result.createdAt,
            bio: result.bio ?? "",
            badges: orderedBadges,
            contributions: contributions,
        });
    } else {
        return NextResponse.json(
            { error: "Profile not found" },
            { status: 404 }
        );
    }
}