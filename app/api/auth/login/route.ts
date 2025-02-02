import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import clientPromise from "@/lib/mongodb"
import { DB_NAME } from "@/lib/config"

if (!process.env.JWT_SECRET) {
  throw new Error("Please add your JWT_SECRET to .env.local")
}

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json()

    const client = await clientPromise
    const db = client.db(DB_NAME)

    // Find user
    const user = await db.collection("admins").findOne({ email })
    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 400 })
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 400 })
    }

    const jwtSecret = process.env.JWT_SECRET
    if (!jwtSecret) {
      throw new Error("JWT_SECRET is not defined in the environment variables")
    }

    // Create JWT token
    const token = jwt.sign(
      {
        userId: user._id.toString(),
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      jwtSecret,
      { expiresIn: "1h" },
    )

    // Create the response
    const response = NextResponse.json(
      {
        success: true,
        user: {
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
        },
      },
      { status: 200 },
    )

    // Set HTTP-only cookie
    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV !== "development",
      sameSite: "lax", // Changed from 'strict' to 'lax' to allow redirects
      maxAge: 3600,
      path: "/",
    })

    return response
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "An error occurred while logging in" }, { status: 500 })
  }
}

