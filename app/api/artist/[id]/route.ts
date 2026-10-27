import { db } from "@/lib/db"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const artist = await db.query.artists.findFirst({
    where: (artist, {eq}) => eq(artist.id, id)
  }).execute();

  if(artist) {
    return Response.json(artist)
  } else {
    return Response.json({error: "artist not found"})
  }
}