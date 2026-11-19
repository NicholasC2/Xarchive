import { db } from "@/lib/db"
import { NextRequest } from "next/server";

export async function GET(request: NextRequest, {name}: {name: string}) {
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