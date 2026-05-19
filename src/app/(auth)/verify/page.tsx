export default function VerifyPage() {
  return (
    <main className="mx-auto flex min-h-svh max-w-sm flex-col justify-center px-6 py-12">
      <h1 className="text-2xl font-semibold tracking-tight">Check your inbox</h1>
      <p className="text-muted-foreground mt-3 text-sm">
        We just sent you a sign-in link. It expires in 10 minutes and can only be used once.
      </p>
      <p className="text-muted-foreground mt-6 text-sm">
        Wrong email?{" "}
        <a className="underline" href="/signin">
          Try again
        </a>
        .
      </p>
    </main>
  );
}
