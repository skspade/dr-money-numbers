import { auth } from "@/lib/auth";
import type { NextRequest } from "next/server";
import type { Session } from "next-auth";

interface AuthenticatedRequest extends NextRequest {
  auth: Session | null;
}

export default auth((req: AuthenticatedRequest) => {
  const isLoggedIn = !!req.auth;
  const isAuthPage = req.nextUrl.pathname.startsWith("/auth");

  if (isAuthPage) {
    if (isLoggedIn) {
      return Response.redirect(new URL("/dashboard", req.nextUrl));
    }
    return null;
  }

  if (!isLoggedIn) {
    return Response.redirect(new URL("/auth/signin", req.nextUrl));
  }
  return null;
});

// Optionally, don't invoke Middleware on some paths
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}; 