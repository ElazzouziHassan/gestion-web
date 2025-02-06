import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { DB_NAME } from "@/lib/config"

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const client = await clientPromise
    const db = client.db(DB_NAME)
    const result = await db.collection("demandes").deleteOne({ _id: new ObjectId(params.id) })

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Demande not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Demande deleted successfully" })
  } catch (error) {
    console.error("Error deleting demande:", error)
    return NextResponse.json({ error: "An error occurred while deleting the demande" }, { status: 500 })
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const { status } = await req.json()
    const client = await clientPromise
    const db = client.db(DB_NAME)
    const result = await db
      .collection("demandes")
      .updateOne({ _id: new ObjectId(params.id) }, { $set: { status, updatedAt: new Date().toISOString() } })

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Demande not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Demande updated successfully" })
  } catch (error) {
    console.error("Error updating demande:", error)
    return NextResponse.json({ error: "An error occurred while updating the demande" }, { status: 500 })
  }
}

