import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import clientPromise from "@/lib/mongodb"

export async function POST(req: Request) {
  try {
    const { firstName, lastName, username, email, password } = await req.json()

    const client = await clientPromise
    const db = client.db("gestion_db")

    // Check if user already exists
    const existingUser = await db.collection("admins").findOne({ $or: [{ email }, { username }] })
    if (existingUser) {
      return NextResponse.json({ error: "User already exists" }, { status: 400 })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create new user
    const result = await db.collection("admins").insertOne({
      firstName,
      lastName,
      username,
      email,
      password: hashedPassword,
      role: "admin",
      createdAt: new Date(),
    })

    return NextResponse.json({ message: "User created successfully", userId: result.insertedId }, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "An error occurred while registering the user" }, { status: 500 })
  }
}

