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

  if (!staffName || staffName.trim() === "") {
    const res = NextResponse.redirect(new URL("/login", request.url));
    res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
    return res;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
