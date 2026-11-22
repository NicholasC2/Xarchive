import { createAuthClient } from "better-auth/react";
import { customSessionClient, inferAdditionalFields } from "better-auth/client/plugins";
import { auth } from "./server";
import { getUser } from "./getUser";
import { BetterAuthClientPlugin } from "better-auth";

export const getUserClient = {
    id: "get-user",
    $InferServerPlugin: {} as ReturnType<typeof getUser>,
} satisfies BetterAuthClientPlugin;

if(!process.env.NEXT_PUBLIC_APP_URL) {
	throw new Error("NEXT_PUBLIC_APP_URL is not defined");
}

export const authClient = createAuthClient({
	baseURL: process.env.NEXT_PUBLIC_APP_URL,

    plugins: [
        inferAdditionalFields<typeof auth>(),
        customSessionClient<typeof auth>(),
        getUserClient,
    ],
});