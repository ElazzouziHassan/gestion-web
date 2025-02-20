import { DB_NAME } from "@/lib/config"
import clientPromise from "@/lib/mongodb"
import { NextResponse } from "next/server"


export async function GET() {
  try {
    const client = await clientPromise
    const db = client.db(DB_NAME)

    const students = await db
      .collection("students")
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
            localField: "currentSemester",
            foreignField: "_id",
            as: "semesterInfo",
          },
        },
        {
          $project: {
            firstName: 1,
            lastName: 1,
            studentNumber: 1,
            promo: 1,
            cycleName: { $arrayElemAt: ["$cycleInfo.title", 0] },
            semesterName: { $arrayElemAt: ["$semesterInfo.title", 0] },
          },
        },
      ])
      .toArray()

    return NextResponse.json(students)
  } catch (error) {
    console.error("Error fetching students:", error)
    return NextResponse.json({ error: "An error occurred while fetching students" }, { status: 500 })
  }
}
