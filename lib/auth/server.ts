import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "../db";

export var googleEnabled = true;

if(!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
	console.warn("Google provider enviroment variables are not defined, google login has been disabled");
	googleEnabled = false;
}

export const auth = betterAuth({
    database: drizzleAdapter(db, {
        provider: "pg",
    }),

	baseURL: process.env.NEXT_PUBLIC_APP_URL,
    emailAndPassword: {
        enabled: true,
    },
	socialProviders: {
		google: {
			enabled: googleEnabled,
			clientId: process.env.GOOGLE_CLIENT_ID ?? "",
			clientSecret: process.env.GOOGLE_CLIENT_SECRET
		}
	}
});