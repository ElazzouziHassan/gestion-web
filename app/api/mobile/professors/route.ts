import { DB_NAME } from "@/lib/config"
import clientPromise from "@/lib/mongodb"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const client = await clientPromise
    const db = client.db(DB_NAME)

    const professors = await db
      .collection("professors")
      .aggregate([
        {
          $lookup: {
            from: "modules",
            localField: "modules",
            foreignField: "_id",
            as: "moduleInfo",
          },
        },
        {
          $project: {
            firstName: 1,
            lastName: 1,
            email: 1,
            telephone: 1,
            status: 1,
            moduleNames: "$moduleInfo.title",
          },
        },
      ])
      .toArray()

    return NextResponse.json(professors)
  } catch (error) {
    console.error("Error fetching professors:", error)
    return NextResponse.json({ error: "An error occurred while fetching professors" }, { status: 500 })
  }
}