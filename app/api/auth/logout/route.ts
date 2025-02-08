import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { logAction } from "@/lib/logAction"
import * as jose from "jose"

export async function POST() {
  try {
    const cookieStore = cookies()
    const token = (await cookieStore).get("token")?.value

    if (token) {
      const jwtSecret = process.env.JWT_SECRET
      if (!jwtSecret) {
        throw new Error("JWT_SECRET is not defined in the environment variables")
      }

      const secretKey = new TextEncoder().encode(jwtSecret)

      try {
        const { payload } = await jose.jwtVerify(token, secretKey)
        if (payload.userId && payload.role === "admin") {
          await logAction("admin", payload.userId as string, "logout", `Admin logged out: ${payload.email}`)
        }
      } catch (error) {
        console.error("Error verifying token during logout:", error)
      }
    }

    const response = NextResponse.json({ message: "Logged out successfully" }, { status: 200 })
    response.cookies.set("token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV !== "development",
      sameSite: "strict",
      expires: new Date(0),
      path: "/",
    })

    return response
  } catch (error) {
    console.error("Error during logout:", error)
    return NextResponse.json({ error: "An error occurred during logout" }, { status: 500 })
  }
}

