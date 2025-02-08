import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { DB_NAME } from "@/lib/config"

export async function logAction(userType: string, userId: string, action: string, details: string) {
  try {
    const client = await clientPromise
    const db = client.db(DB_NAME)

    await db.collection("logs").insertOne({
      userType,
      user: new ObjectId(userId),
      action,
      details,
      timestamp: new Date(),
    })
  } catch (error) {
    console.error("Error logging action:", error)
  }
}

