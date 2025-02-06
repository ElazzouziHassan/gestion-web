import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { DB_NAME } from "@/lib/config"

export async function GET() {
  try {
    const client = await clientPromise
    const db = client.db(DB_NAME)

    // Get all semesters and populate cycle information
    const semesters = await db
      .collection("semesters")
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
          $project: {
            title: 1,
            startDate: 1,
            endDate: 1,
            cycleName: { $arrayElemAt: ["$cycleInfo.title", 0] },
          },
        },
      ])
      .toArray()

    return NextResponse.json(semesters)
  } catch (error) {
    console.error("Error fetching semesters:", error)
    return NextResponse.json({ error: "An error occurred while fetching semesters" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const { title, cycleId, startDate, endDate } = await req.json()
    const client = await clientPromise
    const db = client.db(DB_NAME)
    const result = await db.collection("semesters").insertOne({
      title,
      cycle: new ObjectId(cycleId),
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      modules: [],
    })
    return NextResponse.json({ message: "Semester created successfully", id: result.insertedId }, { status: 201 })
  } catch (error) {
    console.error("Error creating semester:", error)
    return NextResponse.json({ error: "An error occurred while creating the semester" }, { status: 500 })
  }
}

