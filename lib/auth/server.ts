import { APIError, betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "../db";
import { z } from "zod";
import * as schema from "@/auth-schema";
import { admin } from "better-auth/plugins";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { bucket, bucketName } from "../r2";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);


export async function sendVerifcationEmail({
    to,
    subject,
    verificationUrl,
}: {
    to: string;
    subject: string;
    verificationUrl: string;
}) {
    const { data, error } = await resend.emails.send({
        from: "Xarchive <onboarding@resend.dev>",
        to,
        subject,

        text: `Welcome to Xarchive!

Please verify your email by clicking this link:

${verificationUrl}`,

        html: `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <meta name="color-scheme" content="light dark">
            <meta name="supported-color-schemes" content="light dark">

            <style>
                :root {
                    color-scheme: dark;
                    supported-color-schemes: dark light;

                    --background-1: #171715;
                    --background-2: #222220;
                    --background-3: #2c2c29;

                    --foreground-1: #ededeb;
                    --foreground-2: #c1c1bc;
                    --foreground-3: #92928b;

                    --surface-1: #85857d;

                    --accent: #df3832;
                    --accent-dark: #fa746d;

                    --line: #3a3a36;

                    --success: #77c99b;
                    --fail: #e07878;
                    --warn: #e5bd70;

                    --success-bg: #1e3329;
                    --fail-bg: #382323;
                    --warn-bg: #382f1e;
                }

                @media (prefers-color-scheme: light) {
                    :root {
                        color-scheme: light;

                        --background-1: #f8f8f6;
                        --background-2: #efefec;
                        --background-3: #e3e3df;

                        --foreground-1: #171715;
                        --foreground-2: #41413d;
                        --foreground-3: #777771;

                        --surface-1: #a5a59d;

                        --accent: #d92828;
                        --accent-dark: #a71e1e;

                        --line: #d5d5d0;

                        --success: #77c99b;
                        --fail: #c74747;
                        --warn: #a87518;

                        --success-bg: #e3f1e8;
                        --fail-bg: #f8e5e5;
                        --warn-bg: #f5edda;
                    }
                }
            </style>
        </head>

        <body style="
            margin: 0;
            padding: 40px 16px;
            background-color: var(--background-1);
            font-family: Arial, Helvetica, sans-serif;
            color: var(--foreground-1);
        ">
            <div style="
                max-width: 480px;
                margin: 0 auto;
                padding: 40px 32px;
                background-color: var(--background-2);
                border: 1px solid var(--line);
                border-radius: 16px;
            ">
                <h1 style="
                    margin: 0 0 32px;
                    font-size: 25px;
                    font-weight: 700;
                    color: var(--foreground-1);
                ">
                    Xarchive
                </h1>

                <h2 style="
                    margin: 0 0 16px;
                    font-size: 23px;
                    color: var(--foreground-1);
                ">
                    Verify your email
                </h2>

                <p style="
                    margin: 0 0 28px;
                    font-size: 15px;
                    line-height: 1.7;
                    color: var(--foreground-2);
                ">
                    Thanks for joining Xarchive!
                    Before you get started, we need to verify
                    that this email address belongs to you.
                </p>

                <a href="${verificationUrl}"
                   style="
                    display: block;
                    font-size: 12px;
                    line-height: 1.6;
                    color: var(--accent-dark);
                    word-break: break-all;
                ">
                    ${verificationUrl}
                </a>
            </div>
        </body>
        </html>
        `,
    });

    if (error) {
        console.error("Email error:", error);
        throw new Error("Failed to send email");
    }

    return data;
}

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
        requireEmailVerification: false
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

    emailVerification: {
        sendVerificationEmail: async ({ user, url, token }) => {
            await sendVerifcationEmail({
                to: user.email,
                subject: "Verify Email",
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
            enabled: true
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