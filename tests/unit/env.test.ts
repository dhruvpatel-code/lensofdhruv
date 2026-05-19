import { describe, it, expect } from "vitest";
import { envSchema } from "@/env";

describe("envSchema", () => {
  it("accepts a fully-formed valid environment", () => {
    const parsed = envSchema.safeParse({
      NODE_ENV: "development",
      APP_ENV: "local",
      DATABASE_URL: "postgres://user:pw@host/db",
      AUTH_SECRET: "x".repeat(32),
      AUTH_URL: "http://localhost:3000",
      RESEND_API_KEY: "re_test",
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects when DATABASE_URL is missing", () => {
    const parsed = envSchema.safeParse({
      AUTH_SECRET: "x".repeat(32),
      AUTH_URL: "http://localhost:3000",
      RESEND_API_KEY: "re_test",
    });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.issues.some((i) => i.path[0] === "DATABASE_URL")).toBe(true);
    }
  });

  it("rejects an AUTH_SECRET shorter than 32 chars", () => {
    const parsed = envSchema.safeParse({
      DATABASE_URL: "postgres://user:pw@host/db",
      AUTH_SECRET: "tooshort",
      AUTH_URL: "http://localhost:3000",
      RESEND_API_KEY: "re_test",
    });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.issues.some((i) => i.path[0] === "AUTH_SECRET")).toBe(true);
    }
  });

  it("rejects an invalid DATABASE_URL", () => {
    const parsed = envSchema.safeParse({
      DATABASE_URL: "not-a-url",
      AUTH_SECRET: "x".repeat(32),
      AUTH_URL: "http://localhost:3000",
      RESEND_API_KEY: "re_test",
    });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.issues.some((i) => i.path[0] === "DATABASE_URL")).toBe(true);
    }
  });
});
