import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const accept = request.headers.get("accept") || "";
  if (request.nextUrl.pathname === "/" && accept.toLowerCase().includes("text/markdown")) {
    return NextResponse.rewrite(new URL("/markdown", request.url));
  }
  return NextResponse.next();
}

export const config = { matcher: ["/"] };
