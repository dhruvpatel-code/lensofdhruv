import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { env } from "@/env";

export const dynamic = "force-dynamic";

const DB_TIMEOUT_MS = 1000;

async function pingDb(): Promise<"up" | "down"> {
  try {
    await Promise.race([
      db.execute(sql`SELECT 1`),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("db ping timeout")), DB_TIMEOUT_MS),
      ),
    ]);
    return "up";
  } catch {
    return "down";
  }
}

export async function GET() {
  const dbStatus = await pingDb();
  const ok = dbStatus === "up";

  return NextResponse.json(
    {
      ok,
      env: env.APP_ENV,
      db: dbStatus,
      commit: process.env.VERCEL_GIT_COMMIT_SHA ?? "local",
      time: new Date().toISOString(),
    },
    { status: ok ? 200 : 503 },
  );
}
