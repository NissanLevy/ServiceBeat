import { auth } from "@/auth";
import { NextResponse } from "next/server";

const SIX_MONTHS_MS = 6 * 30 * 24 * 60 * 60 * 1000;

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const { pathname } = req.nextUrl;

  const isAuthRoute = pathname.startsWith("/api/auth");
  const isLoginPage = pathname === "/login";
  const isPasswordPage = pathname === "/account/password";
  const isPasswordApi = pathname === "/api/account/password";
  const isStatusPage = pathname.startsWith("/status");
  const isApiWithBearer =
    pathname.startsWith("/api/") &&
    req.headers.get("authorization")?.startsWith("Bearer ");
  const isPublicFile = pathname === "/manifest.json" || pathname === "/sw.js";

  if (isAuthRoute || isLoginPage || isStatusPage || isApiWithBearer || isPublicFile) return NextResponse.next();
  if (!isLoggedIn) return NextResponse.redirect(new URL("/login", req.nextUrl));

  if (!isPasswordPage && !isPasswordApi) {
    const changedAt = req.auth?.user?.passwordChangedAt;
    const expired =
      !changedAt || Date.now() - new Date(changedAt).getTime() > SIX_MONTHS_MS;
    if (expired) {
      return NextResponse.redirect(new URL("/account/password?required=1", req.nextUrl));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
