import { NextResponse, type NextRequest } from "next/server";

// Supabase stores the login in a cookie named sb-<project-ref>-auth-token.
// Only trust the cookie for the project in .env.local, so a login cookie left
// over from another Supabase project doesn't count as being logged in.
const projectRef = new URL(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://localhost",
).hostname.split(".")[0];
const authCookiePrefix = `sb-${projectRef}-auth-token`;

export function proxy(request: NextRequest) {
  const isLoggedIn = request.cookies
    .getAll()
    .some((c) => c.name.startsWith(authCookiePrefix));
  const isLoginPage = request.nextUrl.pathname === "/login";

  if (!isLoggedIn && !isLoginPage) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if (isLoggedIn && isLoginPage) {
    return NextResponse.redirect(new URL("/", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard", "/timeline", "/upload", "/profile", "/courses/:path*", "/extraction", "/review", "/login"],
};
