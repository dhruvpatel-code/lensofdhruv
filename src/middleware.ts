import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth?.user;
  const role = req.auth?.user?.role;

  if (nextUrl.pathname.startsWith("/admin")) {
    if (!isLoggedIn) {
      const signin = new URL("/signin", nextUrl);
      signin.searchParams.set("callbackUrl", nextUrl.pathname);
      return NextResponse.redirect(signin);
    }
    if (role !== "admin") {
      return NextResponse.redirect(new URL("/portal", nextUrl));
    }
  }

  if (nextUrl.pathname.startsWith("/portal")) {
    if (!isLoggedIn) {
      const signin = new URL("/signin", nextUrl);
      signin.searchParams.set("callbackUrl", nextUrl.pathname);
      return NextResponse.redirect(signin);
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/admin/:path*", "/portal/:path*"],
};
