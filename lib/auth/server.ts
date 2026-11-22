import { APIError, betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "../db";
import * as schema from "@/auth-schema";
import { admin, customSession } from "better-auth/plugins";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { bucket, bucketName } from "../r2";
import { sendVerifcationEmail } from "./verificationEmail";
import { getUser } from "./getUser";
import { eq } from "drizzle-orm";
import { getBadges } from "./getBadges";

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
        requireEmailVerification: true
    },

    plugins: [
        admin({
            adminRoles: ["admin"]
        }),
        getUser(),
        customSession(async ({ user, session }) => {
            const dbUser = await db.query.user.findFirst({
                where: eq(schema.user.id, user.id)
            });

            if (!dbUser) {
                throw new Error("User not found");
            }

            return {
                user: {
                    ...user,
                    badges: await getBadges(dbUser)
                },
                session
            };
        })
    ],

    databaseHooks: {
        user: {
            create: {
                before: async (user, context) => {
                    if (!user.name || user.name.trim().length < 2) {
                        throw new APIError("BAD_REQUEST", {
                            message: "Name must be at least 2 characters",
                        });
                    }

                    return { data: user };
                },
            },

            update: {
                before: async (user, context) => {
                    if (
                        user.name !== undefined &&
                        user.name.trim().length < 2
                    ) {
                        throw new APIError("BAD_REQUEST", {
                            message: "Name must be at least 2 characters",
                        });
                    }

                    if (user.badges !== undefined) {
                        const currentBadges = context?.context.session?.user.badges ?? [];
                        const newBadges = user.badges;

                        if (Array.isArray(newBadges)) {
                            user.badges = [
                                ...newBadges.filter(badge => currentBadges.includes(badge)),
                                ...currentBadges.filter((badge: any) => !newBadges.includes(badge))
                            ];
                        }
                    }

                    return { data: user };
                },
            },
        }
    },

    emailVerification: {
        sendVerificationEmail: async ({ user, url, token }) => {
            await sendVerifcationEmail({
                to: user.email,
                verificationUrl: url
            })
        },

        sendOnSignUp: true,
        autoSignInAfterVerification: true,
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

        changeEmail: {
            enabled: true,
            async sendChangeEmailConfirmation(data, request) {
                await sendVerifcationEmail({
                    to: data.user.email,
                    verificationUrl: data.url,
                    approveEmailChange: data.newEmail
                })
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
                input: true,
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