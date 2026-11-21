import { db } from "@/lib/db"
import { NextRequest } from "next/server";

export async function GET(request:  NextRequest, {params}: {params: Promise<{ name: string }>}) {
	const { name } = await params;

	const artist = await db.query.artists.findFirst({
		where: (artist, {eq}) => eq(artist.name, name)
	}).execute();

	if(artist) {
		return Response.json(artist)
	} else {
		return Response.json({error: "artist not found"}, {
			status: 404
		})
	}
}