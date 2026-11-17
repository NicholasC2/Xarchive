import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "../db";

if(!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
	throw new Error("Auth variables are not defined")
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
			enabled: true,
			clientId: process.env.GOOGLE_CLIENT_ID,
			clientSecret: process.env.GOOGLE_CLIENT_SECRET
		}
	}
});