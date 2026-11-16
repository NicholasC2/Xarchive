import { drizzle } from "drizzle-orm/d1";
import { getCloudflareContext } from "@opennextjs/cloudflare";

export const db = drizzle(getCloudflareContext().env.DB, { schema });
export * from "./schema";