import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { DB_NAME } from "@/lib/config"

export async function GET() {
  try {
    const client = await clientPromise
    const db = client.db(DB_NAME)

    // Get all modules and populate cycle and semester information
    const modules = await db
      .collection("modules")
      .aggregate([
        {
          $lookup: {
            from: "cycle_masters",
            localField: "cycle",
            foreignField: "_id",
            as: "cycleInfo",
          },
        },
        {
          $lookup: {
            from: "semesters",
            localField: "semester",
            foreignField: "_id",
            as: "semesterInfo",
          },
        },
        {
          $project: {
            title: 1,
            code: 1,
            cycleName: { $arrayElemAt: ["$cycleInfo.title", 0] },
            semesterName: { $arrayElemAt: ["$semesterInfo.title", 0] },
          },
        },
      ])
      .toArray()

    return NextResponse.json(modules)
  } catch (error) {
    console.error("Error fetching modules:", error)
    return NextResponse.json({ error: "An error occurred while fetching modules" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const { title, code, cycleId, semesterId } = await req.json()
    const client = await clientPromise
    const db = client.db(DB_NAME)
    const result = await db.collection("modules").insertOne({
      title,
      code,
      cycle: new ObjectId(cycleId),
      semester: new ObjectId(semesterId),
    })
    return NextResponse.json({ message: "Module created successfully", id: result.insertedId }, { status: 201 })
  } catch (error) {
    console.error("Error creating module:", error)
    return NextResponse.json({ error: "An error occurred while creating the module" }, { status: 500 })
  }
}

