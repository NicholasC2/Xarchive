import { drizzle, NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

let db: NodePgDatabase<typeof schema> & {
    $client: Pool;
} | undefined;

let pool: Pool | undefined;

if (connectionString) {
  const pool = new Pool({
    connectionString,
  });

  db = drizzle(pool, { schema });
} else {
  console.warn("DATABASE_URL is not configured");
}

export { pool, db };
export * from "./schema";
