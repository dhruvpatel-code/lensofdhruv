import { defineConfig } from "drizzle-kit";
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

// `drizzle-kit generate` only reads schema files, so DATABASE_URL is optional
// for that command. `migrate`, `push`, and `studio` will fail loudly if missing.
export default defineConfig({
  schema: "./src/lib/db/schema/index.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "postgres://placeholder",
  },
  strict: true,
  verbose: true,
});
