import { db } from "@/lib/db"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;

  const artist = await db.query.people.findFirst({
    where: (artist, {eq}) => eq(artist.username, username)
  }).execute();

  if(artist) {
    return Response.json(artist)
  } else {
    return Response.json({error: "artist not found"}, {
      status: 404
    })
  }
}