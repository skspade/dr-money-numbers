import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request });
  const isLoggedIn = !!token;
  const isAuthPage = request.nextUrl.pathname.startsWith("/auth");

  if (isAuthPage) {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return null;
  }

  if (!isLoggedIn) {
    return NextResponse.redirect(new URL("/auth/signin", request.url));
  }
  return null;
}

// Optionally, don't invoke Middleware on some paths
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}; 