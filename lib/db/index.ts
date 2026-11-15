import PG from "pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.warn("DATABASE_URL is not configured");
}

export const db = new PG.Connection({
  connectionString
});
export * from "./schema";
