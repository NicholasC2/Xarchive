import { auth } from "@/lib/auth/server";
import { artists, db, MediaEntry } from "@/lib/db"
import { NextRequest, NextResponse } from "next/server";
import { createInsertSchema } from "drizzle-zod";
import { validateMedia } from "../../validateMedia";
import { eq } from "drizzle-orm";

const ArtistSchema = createInsertSchema(artists);

export async function GET(request: NextRequest, {params}: {params: Promise<{ id: string }>}) {
	const { id } = await params;

	const artist = await db.query.artists.findFirst({
		where: (artist, {eq}) => eq(artist.id, id)
	}).execute();

	if(artist) {
		return NextResponse.json(artist)
	} else {
		return NextResponse.json({error: "artist not found"}, {
			status: 404
		})
	}
}

export async function PUT(request: NextRequest, {params}: {params: Promise<{ id: string }>}) {
	try {
		const session = await auth.api.getSession({
			headers: request.headers
		})

		if(!session) {
			return NextResponse.json(
				{ error: "You need to be logged in to edit an artist." },
				{ status: 403 }
			);
		}

		const { id } = await params;

		const artist = await db.query.artists.findFirst({where: eq(artists.id, id)}).execute();

		if(!artist) {
			return NextResponse.json(
				{ error: "Artist doesnt exists" },
				{ status: 403 }
			);
		}

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

		const isOwner = artist.contributor == session.user.id;

		let media: MediaEntry[];

		try {
			media = validateMedia(result.data.media)
		} catch(err: any) {
			return NextResponse.json(
				{ error: "Media Schema invalid" },
				{ status: 403 }
			);
		}

		const validMedia = [
			...artist.media.filter(m => m.contributor != session.user.id),
			...media.map(m => ({
				...m,
				contributor: session.user.id
			}))
		];

		await db.update(artists).set({
			name: isOwner ? result.data.name : undefined,
			bio: isOwner ? result.data.bio : undefined,
			media: validMedia,
		}).where(eq(artists.id, id));

		return NextResponse.json({id}, { status: 201 });
	} catch (error) {
		console.error(error)

		return NextResponse.json(
			{ error: "Internal Server Error" },
			{ status: 500 }
		);
	}
}

export async function DELETE(request: NextRequest, {params}: {params: Promise<{ id: string }>}) {
	try {
		const session = await auth.api.getSession({
			headers: request.headers
		})

		if(!session) {
			return NextResponse.json(
				{ error: "You need to be logged in to delete an artist." },
				{ status: 403 }
			);
		}

		const { id } = await params;

		const artist = await db.query.artists.findFirst({where: eq(artists.id, id)}).execute();

		if(!artist) {
			return NextResponse.json(
				{ error: "Artist doesnt exists" },
				{ status: 403 }
			);
		}

		if(artist.contributor != session.user.id) {
			return NextResponse.json(
				{ error: "You do not have permission to delete this artist" },
				{ status: 403 }
			);
		}

		await db.delete(artists).where(eq(artists.id, id));

		return NextResponse.json({id}, { status: 204 });
	} catch (error) {
		console.error(error)

		return NextResponse.json(
			{ error: "Internal Server Error" },
			{ status: 500 }
		);
	}
}