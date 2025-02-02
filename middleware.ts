import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import jwt from "jsonwebtoken"

export function middleware(request: NextRequest) {
  // Exclude RSC requests from middleware processing
  if (request.url.includes('_rsc')) {
    return NextResponse.next()
  }

  const token = request.cookies.get("token")?.value

  if (request.nextUrl.pathname.startsWith("/dashboard")) {
    if (!token) {
      const loginUrl = new URL("/auth/login", request.url)
      return NextResponse.redirect(loginUrl)
    }

    const jwtSecret = process.env.JWT_SECRET
    if (!jwtSecret) {
      throw new Error('JWT_SECRET is not defined in the environment variables')
    }

    try {
      jwt.verify(token, jwtSecret)
      return NextResponse.next()
    } catch (error) {
      const loginUrl = new URL("/auth/login", request.url)
      return NextResponse.redirect(loginUrl)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}

