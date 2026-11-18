import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest, {params}: {params: Promise<{ id: string }>}) {
    const {id} = await params
    
    const result = await db.query.user.findFirst({
        where: (user, {eq}) => eq(user.id, id)
    }).execute();

    if(result) {
        return NextResponse.json({
            name: result.name,
            image: result.image,
            createdAt: result.createdAt,
            bio: result.bio
        });
    } else {
		return Response.json({error: "profile not found"}, {
			status: 404
		})
	}
}