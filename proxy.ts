import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

export function proxy(request: NextRequest) {
  const sessionCookie = getSessionCookie(request);

  if (!sessionCookie) {
    return NextResponse.redirect(
      new URL("/login?redirect_uri=" + decodeURI(request.nextUrl.pathname), request.url)
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/user/edit",
    "/contribute:path*"
  ],
};