import { signIn } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}) {
  async function signInAction(formData: FormData) {
    "use server";
    const email = String(formData.get("email") ?? "").trim();
    const callbackUrl = String(formData.get("callbackUrl") ?? "/portal");
    await signIn("resend", { email, redirectTo: callbackUrl });
  }

  return <SignInPageContent action={signInAction} searchParams={searchParams} />;
}

async function SignInPageContent({
  action,
  searchParams,
}: {
  action: (formData: FormData) => Promise<void>;
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}) {
  const params = await searchParams;
  const callbackUrl = params.callbackUrl ?? "/portal";
  const error = params.error;

  return (
    <main className="mx-auto flex min-h-svh max-w-sm flex-col justify-center px-6 py-12">
      <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
      <p className="text-muted-foreground mt-2 text-sm">
        We&apos;ll email you a one-time link. No password needed.
      </p>
      <form action={action} className="mt-6 flex flex-col gap-3">
        <input type="hidden" name="callbackUrl" value={callbackUrl} />
        <Input
          type="email"
          name="email"
          placeholder="you@example.com"
          required
          autoComplete="email"
          autoFocus
        />
        <Button type="submit">Send magic link</Button>
        {error ? (
          <p className="text-sm text-red-600" role="alert">
            Could not sign you in. Please try again.
          </p>
        ) : null}
      </form>
    </main>
  );
}
