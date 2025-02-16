import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  try {
    const token = await getToken({ 
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
      secureCookie: process.env.NODE_ENV === "production",
    });
    
    const isLoggedIn = !!token;
    const isAuthPage = request.nextUrl.pathname.startsWith("/auth");
    const isDashboardPage = request.nextUrl.pathname.startsWith("/dashboard");

    // Redirect authenticated users away from auth pages
    if (isAuthPage && isLoggedIn) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    // Protect dashboard routes
    if (isDashboardPage && !isLoggedIn) {
      const signInUrl = new URL("/auth/signin", request.url);
      signInUrl.searchParams.set("callbackUrl", request.url);
      return NextResponse.redirect(signInUrl);
    }

    return null;
  } catch (error) {
    console.error("Middleware error:", error);
    // On error, redirect to error page
    return NextResponse.redirect(new URL("/auth/error", request.url));
  }
}

// Only run middleware on auth and dashboard routes
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/auth/:path*"
  ]
}; 