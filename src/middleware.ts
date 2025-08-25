// middleware.js
import { NextResponse } from "next/server";

//@ts-expect-error any types
export function middleware(req) {
  // Get the JWT token from cookies
  const session = req.cookies.get("sessionId");

  // Define protected routes
  const protectedRoutes = ["/", "/epl"]; // Add your protected routes here

  if (protectedRoutes.some((route) => req.nextUrl.pathname.startsWith(route))) {
    // If the user is trying to access a protected route
    if (!session) {
      // If token doesn't exist, redirect to login
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  // If authenticated or on a non-protected route, continue
  return NextResponse.next();
}

// Enable middleware for these paths
export const config = {
  matcher: ["/"], // Add paths that you want to protect
};
