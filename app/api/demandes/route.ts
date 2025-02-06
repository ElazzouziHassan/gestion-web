import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { DB_NAME } from "@/lib/config"

export async function GET() {
  try {
    const client = await clientPromise
    const db = client.db(DB_NAME)
    const demandes = await db.collection("demandes").find({}).sort({ createdAt: -1 }).toArray()
    return NextResponse.json(demandes)
  } catch (error) {
    console.error("Error fetching demandes:", error)
    return NextResponse.json({ error: "An error occurred while fetching demandes" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const { userType, user, description } = await req.json()
    const client = await clientPromise
    const db = client.db(DB_NAME)
    const now = new Date().toISOString()
    const result = await db.collection("demandes").insertOne({
      userType,
      user,
      description,
      status: "pending",
      createdAt: now,
      updatedAt: now,
    })
    return NextResponse.json({ message: "Demande created successfully", id: result.insertedId }, { status: 201 })
  } catch (error) {
    console.error("Error creating demande:", error)
    return NextResponse.json({ error: "An error occurred while creating the demande" }, { status: 500 })
  }
}

