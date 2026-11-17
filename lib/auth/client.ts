import { createAuthClient } from "better-auth/react";

if(!process.env.NEXT_PUBLIC_APP_URL) {
	throw new Error("NEXT_PUBLIC_APP_URL is not defined");
}

export const authClient = createAuthClient({
	baseURL: process.env.NEXT_PUBLIC_APP_URL,
});