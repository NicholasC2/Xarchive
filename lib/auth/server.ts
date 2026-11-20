import { APIError, betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { badges, db } from "../db";
import { z } from "zod";
import * as schema from "@/auth-schema";
import { admin, customSession } from "better-auth/plugins";
import { inArray } from "drizzle-orm";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { bucket, bucketName } from "../r2";

export const googleEnabled = Boolean(
    process.env.GOOGLE_CLIENT_ID &&
    process.env.GOOGLE_CLIENT_SECRET
);

if (!googleEnabled) {
    console.warn(
        "Google provider environment variables are not defined. Google login has been disabled."
    );
}

export const auth = betterAuth({
    database: drizzleAdapter(db, {
        provider: "pg",
		schema,
    }),

    baseURL: process.env.NEXT_PUBLIC_APP_URL,

    emailAndPassword: {
        enabled: true,
        minPasswordLength: 8,
    },

    plugins: [
        admin({
            adminRoles: ["admin"]
        }),
    ],

    databaseHooks: {
        user: {
            create: {
                before: async (user) => {
                    if (!user.name || user.name.trim().length < 2) {
                        throw new APIError("BAD_REQUEST", {
                            message: "Name must be at least 2 characters",
                        });
                    }

                    return { data: user };
                },
            },

            update: {
                before: async (user) => {
                    if (
                        user.name !== undefined &&
                        user.name.trim().length < 2
                    ) {
                        throw new APIError("BAD_REQUEST", {
                            message: "Name must be at least 2 characters",
                        });
                    }

                    return { data: user };
                },
            },
        },
    },

	user: {
        deleteUser: {
            enabled: true,
            async afterDelete(user, request) {
                await bucket.send(
                    new DeleteObjectCommand({
                        Key: `pfp/${user.id}`,
                        Bucket: bucketName
                    })
                )
            },
        },

		additionalFields: {
			bio: {
				type: "string",
				required: false,
				unique: false,
                input: true,
			},

            badges: {
                type: "string[]",
                required: false,
                defaultValue: [],
                input: false,
            },

            badgeOrder: {
                type: "string[]",
                required: false,
                defaultValue: [],
                input: true,
                validator: {
                    input: z.array(z.string()),
                },
            },
		}
	},

    socialProviders: {
        ...(googleEnabled && {
            google: {
                clientId: process.env.GOOGLE_CLIENT_ID!,
                clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
            },
        }),
    },
});