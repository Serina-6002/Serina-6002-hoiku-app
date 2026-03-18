import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const staffName = request.cookies.get("staff_name")?.value;
  const { pathname } = request.nextUrl;

  if (pathname === "/login") {
    if (staffName) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  if (!staffName) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
