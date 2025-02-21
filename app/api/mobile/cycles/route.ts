import clientPromise from "@/lib/mongodb"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const client = await clientPromise
    const db = client.db("gestion_db")
    const cycleMasters = await db.collection("cycle_masters").find({}).toArray()
    return NextResponse.json(cycleMasters)
  } catch (error) {
    console.error("Error fetching cycle masters:", error)
    return NextResponse.json(
      { error: "An error occurred while fetching cycle masters" },
      { status: 500 },
    )
  }
}