import { badges, db } from "@/lib/db";
import { ilike, inArray } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest, {params}: {params: Promise<{ id: string }>}) {
    const {id} = await params
    
    const result = await db.query.user.findFirst({
        where: (user, {eq}) => eq(user.id, id)
    }).execute();

    if(result) {
        const userBadges = await db.query.badges.findMany({
            where: inArray(badges.id, result.badges ?? []),
        }).execute()

        return NextResponse.json({
            name: result.name,
            image: result.image,
            createdAt: result.createdAt,
            bio: result.bio,
            badges: userBadges
        });
    } else {
		return Response.json({error: "profile not found"}, {
			status: 404
		})
	}
}