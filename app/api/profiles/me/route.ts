import { NextResponse } from "next/server";
import { ensureArchiveTables, ensureProfile, getArchiveSql, getCurrentUser, isImageDataUrl, normalizeArchiveLinks } from "@/lib/archive";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Sign in to view your profile." }, { status: 401 });

    await ensureArchiveTables();
    await ensureProfile(user);
    const sql = getArchiveSql();
    const profileRows = await sql`SELECT username, bio, image_url AS "imageUrl", banner_url AS "bannerUrl", gallery_images AS "galleryImages", social_links AS "links"
      FROM archive_profiles WHERE user_id = ${user.id}`;
    const [profile] = profileRows as unknown as { username: string; bio: string; imageUrl: string | null; bannerUrl: string | null; galleryImages: string[]; }[];
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
    const bannerUrl = typeof body.bannerUrl === "string" ? body.bannerUrl : null;
    const galleryImages = Array.isArray(body.galleryImages)
      ? body.galleryImages.filter((item: unknown): item is string => typeof item === "string" && isImageDataUrl(item)).slice(0, 12)
      : [];
    const links = normalizeArchiveLinks(body.links ?? body.profileLinks);
    if (!username || username.length > 50 || bio.length > 500) {
      return NextResponse.json({ error: "Choose a name (up to 50 characters) and a bio under 500 characters." }, { status: 400 });
    }
    if (imageUrl !== null && !isImageDataUrl(imageUrl)) {
      return NextResponse.json({ error: "Profile images must be PNG, JPG, GIF, or WebP under 2 MB." }, { status: 400 });
    }
    if (bannerUrl !== null && !isImageDataUrl(bannerUrl)) {
      return NextResponse.json({ error: "Banner images must be PNG, JPG, GIF, or WebP under 2 MB." }, { status: 400 });
    }

    await ensureArchiveTables();
    const sql = getArchiveSql();
    await sql`INSERT INTO archive_profiles (user_id, username, bio, image_url, banner_url, gallery_images, social_links)
      VALUES (${user.id}, ${username}, ${bio}, ${imageUrl}, ${bannerUrl}, ${galleryImages}, ${links})
      ON CONFLICT (user_id) DO UPDATE SET username = EXCLUDED.username,
      bio = EXCLUDED.bio, image_url = EXCLUDED.image_url, banner_url = EXCLUDED.banner_url,
      gallery_images = EXCLUDED.gallery_images, social_links = EXCLUDED.social_links, updated_at = NOW()`;
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Your profile could not be saved." }, { status: 500 });
  }
}