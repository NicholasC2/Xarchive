import { badges, db } from "@/lib/db";
import { inArray } from "drizzle-orm";
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

        const badgeOrder = result.badgeOrder ?? [];

        const orderedBadges = [
            ...(result.role === "admin" ? [{
                id: "admin",
                name: "Administrator",
                icon: "/badges/admin.svg",
                acquireBy: "",
                textColor: {
                    className: "badge-color-red",
                },
            }] : []),

            ...badgeOrder
                .map(id => userBadges.find(badge => badge.id === id))
                .filter((badge): badge is NonNullable<typeof badge> => !!badge),

            ...userBadges.filter(
                badge => !badgeOrder.includes(badge.id)
            ),
        ];

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