import type { BetterAuthPlugin } from "better-auth";
import { APIError, createAuthEndpoint, sessionMiddleware } from "better-auth/api";
import { z } from "zod";
import { albums, artists, db, songs } from "../db";
import { eq } from "drizzle-orm";
import { getBadges } from "./getBadges";
import { user } from "@/auth-schema"

async function getContributions(userId: string) {
    return [
        ...await db.query.artists.findMany({
            where: eq(artists.contributor, userId)
        }),
        ...await db.query.albums.findMany({
            where: eq(albums.contributor, userId)
        }),
        ...await db.query.songs.findMany({
            where: eq(songs.contributor, userId)
        })
    ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

type User = typeof user.$inferSelect;

export const getUser = () => ({
    id: "get-badge-stuff",
    endpoints: {
        getUser: createAuthEndpoint(
            "/get-user",
            {
                method: "GET",
                use: [sessionMiddleware],
                query: z.object({
                    id: z.string()
                }),
            },
            async (ctx) => {
                const { id } = ctx.query;

                const user = await ctx.context.internalAdapter.findUserById(id);

                if (!user) {
                    throw new APIError("NOT_FOUND", {
                        message: "User not found"
                    });
                }

                return ctx.json({
                    ...(user as User),
                    badges: await getBadges(user as User),
                    contributions: await getContributions(user.id)
                });
            }
        ),
    },
} satisfies BetterAuthPlugin);