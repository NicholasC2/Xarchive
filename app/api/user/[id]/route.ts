import { auth } from "@/lib/auth/server";
import { badges, db, user } from "@/lib/db";
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

        const orderedBadges = (result.badges ?? [])
            .map(id => userBadges.find(badge => badge.id === id))
            .filter((badge): badge is NonNullable<typeof badge> => !!badge);

        return NextResponse.json({
            name: result.name ?? "",
            image: result.image ?? "",
            createdAt: result.createdAt,
            bio: result.bio ?? "",
            badges: orderedBadges
        });
    } else {
        return NextResponse.json(
            { error: "Profile not found" },
            { status: 404 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await auth.api.getSession({
            headers: request.headers
        });

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const body = await request.json();

        const currentUser = await db.query.user.findFirst({
            where: eq(user.id, session.user.id)
        });

        if (!currentUser) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            );
        }

        const updates: Partial<typeof user.$inferInsert> = {};

        if (typeof body.name === "string") {
            updates.name = body.name;
        }

        if (typeof body.bio === "string") {
            updates.bio = body.bio;
        }

        if (typeof body.image === "string") {
            updates.image = body.image;
        }

        if (Array.isArray(body.badges)) {
            const currentBadges = currentUser.badges ?? [];

            const requestedBadgeIds = body.badges
                .filter(
                    (badge: { id?: string }) =>
                        typeof badge?.id === "string" &&
                        currentBadges.includes(badge.id)
                )
                .map((badge: { id: string }) => badge.id);

            updates.badges = [
                ...new Set([
                    ...requestedBadgeIds,
                    ...currentBadges
                ])
            ];
        }

        const [updatedUser] = await db
            .update(user)
            .set(updates)
            .where(eq(user.id, session.user.id))
            .returning();

        return NextResponse.json({
            success: true,
            user: {
                name: updatedUser.name,
                bio: updatedUser.bio,
                image: updatedUser.image,
                badges: updatedUser.badges,
            },
        });

    } catch (error) {
        console.error("Profile update error:", error);

        return NextResponse.json(
            { error: "Failed to update profile" },
            { status: 500 }
        );
    }
}
