import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import * as jose from "jose"

interface JwtPayload extends jose.JWTPayload {
  userId: string
  email: string
  role: string
}

function isJwtPayload(payload: jose.JWTPayload): payload is JwtPayload {
  return (
    typeof payload === "object" &&
    payload !== null &&
    "userId" in payload &&
    "email" in payload &&
    "role" in payload &&
    typeof payload.userId === "string" &&
    typeof payload.email === "string" &&
    typeof payload.role === "string"
  )
}

export async function middleware(request: NextRequest) {
  const token = request.cookies.get("token")?.value

  console.log(`Middleware: Path ${request.nextUrl.pathname}, Token exists: ${!!token}`)

  if (request.nextUrl.pathname.startsWith("/dashboard") || request.nextUrl.pathname.startsWith("/api/user")) {
    if (!token) {
      console.log("Middleware: No token, redirecting to login")
      return NextResponse.redirect(new URL("/auth/login", request.url))
    }

    try {
      const jwtSecret = process.env.JWT_SECRET
      if (!jwtSecret) {
        throw new Error("JWT_SECRET is not defined in the environment variables")
      }

      const secretKey = new TextEncoder().encode(jwtSecret)

      const { payload } = await jose.jwtVerify(token, secretKey)

      if (!isJwtPayload(payload)) {
        throw new Error("Invalid token payload")
      }

      console.log("Middleware: Token verified successfully", payload)

      const requestHeaders = new Headers(request.headers)
      requestHeaders.set("Authorization", `Bearer ${token}`)

      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      })
    } catch (error) {
      console.log("Middleware: Token verification failed", error)
      return NextResponse.redirect(new URL("/auth/login", request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/dashboard/:path*", "/api/user"],
}

