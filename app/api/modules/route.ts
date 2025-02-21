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
            cycle: 1,
            semester: 1,
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

    // Validate required fields
    if (!title || !code || !cycleId || !semesterId) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 })
    }

    const result = await db.collection("modules").insertOne({
      title,
      code,
      cycle: new ObjectId(cycleId),
      semester: new ObjectId(semesterId),
      createdAt: new Date(),
    })

    // Fetch the complete module with populated fields
    const insertedModule = await db
      .collection("modules")
      .aggregate([
        { $match: { _id: result.insertedId } },
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
            cycle: 1,
            semester: 1,
            cycleName: { $arrayElemAt: ["$cycleInfo.title", 0] },
            semesterName: { $arrayElemAt: ["$semesterInfo.title", 0] },
          },
        },
      ])
      .next()

    return NextResponse.json(insertedModule, { status: 201 })
  } catch (error) {
    console.error("Error creating module:", error)
    return NextResponse.json({ error: "An error occurred while creating the module" }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const { id, title, code, cycleId, semesterId } = await req.json()

    if (!id || !title || !code || !cycleId || !semesterId) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db(DB_NAME)

    // Update the module
    const result = await db.collection("modules").updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          title,
          code,
          cycle: new ObjectId(cycleId),
          semester: new ObjectId(semesterId),
          updatedAt: new Date(),
        },
      },
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Module not found" }, { status: 404 })
    }

    // Fetch the updated module with populated fields
    const updatedModule = await db
      .collection("modules")
      .aggregate([
        { $match: { _id: new ObjectId(id) } },
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
            cycle: 1,
            semester: 1,
            cycleName: { $arrayElemAt: ["$cycleInfo.title", 0] },
            semesterName: { $arrayElemAt: ["$semesterInfo.title", 0] },
          },
        },
      ])
      .next()

    return NextResponse.json(updatedModule)
  } catch (error) {
    console.error("Error updating module:", error)
    return NextResponse.json({ error: "An error occurred while updating the module" }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Module ID is required" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db(DB_NAME)

    // Check if module is being used in any schedules
    const scheduleWithModule = await db.collection("schedules").findOne({
      "dailySchedules.sessions.module": new ObjectId(id),
    })

    if (scheduleWithModule) {
      return NextResponse.json(
        { error: "Cannot delete module as it is being used in one or more schedules" },
        { status: 409 },
      )
    }

    const result = await db.collection("modules").deleteOne({ _id: new ObjectId(id) })

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Module not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Module deleted successfully" })
  } catch (error) {
    console.error("Error deleting module:", error)
    return NextResponse.json({ error: "An error occurred while deleting the module" }, { status: 500 })
  }
}

