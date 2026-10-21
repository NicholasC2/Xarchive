import { NextResponse } from "next/server";
import { ensureArchiveTables, ensureProfile, getArchiveSql, getCurrentUser, isImageDataUrl } from "@/lib/archive";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Sign in to view your profile." }, { status: 401 });

    await ensureArchiveTables();
    await ensureProfile(user);
    const sql = getArchiveSql();
    const profileRows = await sql`SELECT username, bio, image_url AS "imageUrl",
      banner_url AS "bannerUrl", gallery_urls AS "galleryUrls"
      FROM archive_profiles WHERE user_id = ${user.id}`;
    const [profile] = profileRows as unknown as { username: string; bio: string; imageUrl: string | null; bannerUrl: string | null; galleryUrls: string[] }[];
    return NextResponse.json({ profile });
  } catch {
    return NextResponse.json({ error: "Your profile is temporarily unavailable." }, { status: 503 });
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Sign in to edit your profile." }, { status: 401 });

    const body = await request.json();
    const username = typeof body.username === "string" ? body.username.trim() : "";
    const bio = typeof body.bio === "string" ? body.bio.trim() : "";
    const imageUrl = body.imageUrl;
    const bannerUrl = body.bannerUrl;
    const galleryUrls = Array.isArray(body.galleryUrls) ? body.galleryUrls : [];
    if (!username || username.length > 50 || bio.length > 500) {
      return NextResponse.json({ error: "Choose a name (up to 50 characters) and a bio under 500 characters." }, { status: 400 });
    }
    if (imageUrl !== null && !isImageDataUrl(imageUrl)) {
      return NextResponse.json({ error: "Profile images must be PNG, JPG, GIF, or WebP under 2 MB." }, { status: 400 });
    }
    if ((bannerUrl !== null && !isImageDataUrl(bannerUrl)) || galleryUrls.length > 10 || galleryUrls.some((image: unknown) => !isImageDataUrl(image))) {
      return NextResponse.json({ error: "Add up to 10 supported profile images, each up to 2 MB." }, { status: 400 });
    }

    await ensureArchiveTables();
    const sql = getArchiveSql();
    await sql`INSERT INTO archive_profiles (user_id, username, bio, image_url, banner_url, gallery_urls)
      VALUES (${user.id}, ${username}, ${bio}, ${imageUrl}, ${bannerUrl}, ${galleryUrls})
      ON CONFLICT (user_id) DO UPDATE SET username = EXCLUDED.username,
      bio = EXCLUDED.bio, image_url = EXCLUDED.image_url, banner_url = EXCLUDED.banner_url,
      gallery_urls = EXCLUDED.gallery_urls, updated_at = NOW()`;
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Your profile could not be saved." }, { status: 500 });
  }
}