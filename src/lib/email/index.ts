import { Resend } from "resend";
import { env } from "@/env";

let _resend: Resend | null = null;

export function getResend(): Resend {
  if (!_resend) {
    _resend = new Resend(env.RESEND_API_KEY);
  }
  return _resend;
}

export const EMAIL_FROM = env.EMAIL_FROM;

export function magicLinkEmail({ url, host }: { url: string; host: string }) {
  const escapedHost = host.replace(/\./g, "&#8203;.");
  const subject = `Sign in to ${escapedHost}`;
  const text = `Sign in to ${host}\n\nClick the link below to sign in:\n${url}\n\nIf you did not request this email, you can safely ignore it.`;
  const html = `<!doctype html>
<html>
  <body style="font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; padding: 32px; color: #111;">
    <h2 style="margin: 0 0 16px;">Sign in to ${escapedHost}</h2>
    <p style="margin: 0 0 24px; color: #444;">Click the button below to sign in. This link expires in 10 minutes and can only be used once.</p>
    <p style="margin: 0 0 24px;">
      <a href="${url}" style="display: inline-block; padding: 12px 20px; background: #111; color: #fff; text-decoration: none; border-radius: 6px;">Sign in</a>
    </p>
    <p style="margin: 0; font-size: 12px; color: #888;">If you did not request this email, you can safely ignore it.</p>
  </body>
</html>`;
  return { subject, text, html };
}
