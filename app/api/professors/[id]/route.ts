import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { DB_NAME } from "@/lib/config"

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const client = await clientPromise
    const db = client.db(DB_NAME)

    const professor = await db
      .collection("professors")
      .aggregate([
        { $match: { _id: new ObjectId(params.id) } },
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
      .next()

    if (!professor) {
      return NextResponse.json({ error: "Professor not found" }, { status: 404 })
    }

    return NextResponse.json(professor)
  } catch (error) {
    console.error("Error fetching professor details:", error)
    return NextResponse.json({ error: "An error occurred while fetching professor details" }, { status: 500 })
  }
}

