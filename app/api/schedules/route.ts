import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function GET() {
  try {
    const client = await clientPromise
    const db = client.db("gestion_db")
    const schedules = await db.collection("schedules").find({}).toArray()
    return NextResponse.json(schedules)
  } catch (error) {
    console.error("Error fetching schedules:", error)
    return NextResponse.json({ error: "An error occurred while fetching schedules" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const { moduleId, semesterId, timetable, schedulePdf } = await req.json()
    const client = await clientPromise
    const db = client.db("gestion_db")
    const result = await db.collection("schedules").insertOne({
      module: new ObjectId(moduleId),
      semester: new ObjectId(semesterId),
      timetable,
      schedule_pdf: schedulePdf,
    })
    return NextResponse.json({ message: "Schedule created successfully", id: result.insertedId }, { status: 201 })
  } catch (error) {
    console.error("Error creating schedule:", error)
    return NextResponse.json({ error: "An error occurred while creating the schedule" }, { status: 500 })
  }
}

