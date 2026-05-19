import { z } from "zod";

export const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  APP_ENV: z.enum(["local", "preview", "production"]).default("local"),

  DATABASE_URL: z.string().url(),

  AUTH_SECRET: z.string().min(32),
  AUTH_URL: z.string().url(),

  RESEND_API_KEY: z.string().min(1),
  EMAIL_FROM: z.string().email().default("Lens of Dhruv <noreply@resend.dev>"),

  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),

  R2_ACCOUNT_ID: z.string().optional(),
  R2_ACCESS_KEY_ID: z.string().optional(),
  R2_SECRET_ACCESS_KEY: z.string().optional(),
  R2_BUCKET: z.string().optional(),

  SENTRY_DSN: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
  // Build-time escape hatch: CI builds can set this when env vars are injected
  // at runtime only. We still parse with placeholders so dependent SDKs (neon,
  // Resend) can construct their clients during the build's page-collection
  // step. Runtime evaluation without this flag still throws on real misconfig.
  if (process.env.SKIP_ENV_VALIDATION === "true") {
    return envSchema.parse({
      NODE_ENV: process.env.NODE_ENV ?? "development",
      APP_ENV: process.env.APP_ENV ?? "local",
      DATABASE_URL: process.env.DATABASE_URL ?? "postgres://build:build@localhost:5432/build",
      AUTH_SECRET: process.env.AUTH_SECRET ?? "build-placeholder-secret-thirty-two-characters!",
      AUTH_URL: process.env.AUTH_URL ?? "http://localhost:3000",
      RESEND_API_KEY: process.env.RESEND_API_KEY ?? "re_build_placeholder",
      EMAIL_FROM: process.env.EMAIL_FROM,
      STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
      STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
      R2_ACCOUNT_ID: process.env.R2_ACCOUNT_ID,
      R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID,
      R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY,
      R2_BUCKET: process.env.R2_BUCKET,
      SENTRY_DSN: process.env.SENTRY_DSN,
    });
  }
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join(".") || "(root)"}: ${i.message}`)
      .join("\n");
    throw new Error(`Invalid environment variables:\n${issues}`);
  }
  return parsed.data;
}

export const env = loadEnv();
