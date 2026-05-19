import NextAuth, { type DefaultSession } from "next-auth";
import Resend from "next-auth/providers/resend";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { db } from "@/lib/db";
import { users, accounts, sessions, verificationTokens } from "@/lib/db/schema";
import { env } from "@/env";
import { getResend, EMAIL_FROM, magicLinkEmail } from "@/lib/email";

type UserRole = "client" | "admin";

declare module "next-auth" {
  interface User {
    role?: UserRole;
  }
  interface Session {
    user: {
      role: UserRole;
    } & DefaultSession["user"];
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  session: {
    strategy: "database",
    maxAge: 30 * 24 * 60 * 60,
    updateAge: 24 * 60 * 60,
  },
  pages: {
    signIn: "/signin",
    verifyRequest: "/verify",
  },
  providers: [
    Resend({
      apiKey: env.RESEND_API_KEY,
      from: EMAIL_FROM,
      async sendVerificationRequest({ identifier: email, url, provider }) {
        const { host } = new URL(url);
        const { subject, text, html } = magicLinkEmail({ url, host });
        const { error } = await getResend().emails.send({
          from: provider.from ?? EMAIL_FROM,
          to: email,
          subject,
          html,
          text,
        });
        if (error) {
          throw new Error(`Resend failed: ${error.name}: ${error.message}`);
        }
      },
    }),
  ],
  callbacks: {
    session({ session, user }) {
      session.user.role = (user as { role?: UserRole }).role ?? "client";
      return session;
    },
  },
  secret: env.AUTH_SECRET,
  trustHost: true,
});
