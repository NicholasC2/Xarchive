import { badges, db } from "../db";
import { eq, inArray } from "drizzle-orm";
import { user } from "@/auth-schema"

type User = typeof user.$inferSelect;

export async function getBadges(user: User) {
    const userBadges = await db.query.badges.findMany({
        where: inArray(badges.id, user.badges ?? [])
    })

    const conditionalStaticBadges = {
        admin: () => user.role === "admin"
    };

    const extraBadges = (
        await Promise.all(
            Object.entries(conditionalStaticBadges).map(async ([key, requirement]) => {
                if (!requirement()) return null;

                return db.query.badges.findFirst({
                    where: eq(badges.id, key)
                });
            })
        )
    ).filter((badge) => badge != null);
    
    return {
        static: extraBadges,
        badges: userBadges
    }
}