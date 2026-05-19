import { neon } from "@neondatabase/serverless";
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";
import { env } from "@/env";
import * as schema from "./schema";

export type Db = NeonHttpDatabase<typeof schema>;

const sql = neon(env.DATABASE_URL);
export const db: Db = drizzle(sql, { schema });

export { schema };
