import { NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import * as jose from "jose"
import clientPromise from "@/lib/mongodb"
import { DB_NAME } from "@/lib/config"

interface JwtPayload extends jose.JWTPayload {
  userId: string
  email: string
  role: string
}

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 })
    }

    const token = authHeader.split(" ")[1]

    const jwtSecret = process.env.JWT_SECRET
    if (!jwtSecret) {
      throw new Error("JWT_SECRET is not defined in the environment variables")
    }

    const secretKey = new TextEncoder().encode(jwtSecret)

    try {
      const { payload } = await jose.jwtVerify(token, secretKey)
      const jwtPayload = payload as JwtPayload

      const client = await clientPromise
      const db = client.db(DB_NAME)

      const user = await db.collection("admins").findOne({ _id: new ObjectId(jwtPayload.userId) })

      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 })
      }

      return NextResponse.json({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
      })
    } catch (error) {
      console.error("Token verification failed:", error)
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }
  } catch (error) {
    console.error("Error in user API route:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

