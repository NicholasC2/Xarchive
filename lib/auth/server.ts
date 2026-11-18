import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "../db";
import * as schema from "@/auth-schema";

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
    },

	user: {
		additionalFields: {
			bio: {
				type: "string",
				required: false,
				unique: false,
			}
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