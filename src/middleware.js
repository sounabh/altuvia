import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  console.log("🔒 Middleware check:", {
    path: pathname,
    authenticated: !!token,
    hasCompleteProfile: token?.hasCompleteProfile || false,
    userId: token?.userId || "none",
  });

  // 1️⃣ Public routes (no auth required)
  const publicPaths = ["/", "/onboarding/signup"];
  const isPublicPath = publicPaths.some((path) => pathname.startsWith(path));

  if (isPublicPath) {
    return NextResponse.next();
  }

  // 2️⃣ Not authenticated → go to signup
  if (!token) {
    const signinUrl = new URL("/onboarding/signup", request.url);
    signinUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signinUrl);
  }

  // 3️⃣ Token expired → force re-login
  if (token.error === "RefreshAccessTokenError") {
    const signinUrl = new URL("/onboarding/signup", request.url);
    signinUrl.searchParams.set("error", "SessionExpired");
    signinUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signinUrl);
  }

  // 4️⃣ Onboarding routes — only for incomplete profiles
  if (pathname.startsWith("/onboarding")) {
    if (token.hasCompleteProfile) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next(); // allow onboarding
  }

  // 5️⃣ Protected routes (must have complete profile)
  const protectedPaths = ["/dashboard", "/cv-builder", "/search"];
  const isProtectedPath = protectedPaths.some((path) =>
    pathname.startsWith(path)
  );

  if (isProtectedPath) {
    if (!token.hasCompleteProfile) {
      console.log("⏳ Profile incomplete - redirecting to onboarding");
      return NextResponse.redirect(new URL("/onboarding/signup", request.url));
    }

    console.log("✅ Profile complete - allowing access");
    return NextResponse.next();
  }

  // 6️⃣ Default
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/auth).*)",
  ],
};

