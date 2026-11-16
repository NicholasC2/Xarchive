import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { getDb } from "../db";

export const auth = betterAuth({
	database: drizzleAdapter(getDb(), {
		provider: "sqlite"
	}),

	emailAndPassword: {
		enabled: true,
	},
});