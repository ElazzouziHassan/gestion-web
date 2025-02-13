import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { DB_NAME } from "@/lib/config"

export async function GET() {
  try {
    const client = await clientPromise
    const db = client.db(DB_NAME)
    const schedules = await db
      .collection("schedules")
      .aggregate([
        {
          $lookup: {
            from: "cycle_masters",
            localField: "cycleMaster",
            foreignField: "_id",
            as: "cycleMasterInfo",
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
          $lookup: {
            from: "modules",
            localField: "dailySchedules.module",
            foreignField: "_id",
            as: "moduleInfo",
          },
        },
        {
          $lookup: {
            from: "professors",
            localField: "dailySchedules.professor",
            foreignField: "_id",
            as: "professorInfo",
          },
        },
        {
          $project: {
            cycleMaster: { $arrayElemAt: ["$cycleMasterInfo.title", 0] },
            semester: { $arrayElemAt: ["$semesterInfo.title", 0] },
            dailySchedules: {
              $map: {
                input: "$dailySchedules",
                as: "daily",
                in: {
                  day: "$$daily.day",
                  module: {
                    $arrayElemAt: [
                      {
                        $filter: {
                          input: "$moduleInfo",
                          cond: { $eq: ["$$this._id", "$$daily.module"] },
                        },
                      },
                      0,
                    ],
                  },
                  professor: {
                    $arrayElemAt: [
                      {
                        $filter: {
                          input: "$professorInfo",
                          cond: { $eq: ["$$this._id", "$$daily.professor"] },
                        },
                      },
                      0,
                    ],
                  },
                  time: "$$daily.time",
                  place: "$$daily.place",
                },
              },
            },
            schedule_pdf: 1,
          },
        },
      ])
      .toArray()
    return NextResponse.json(schedules)
  } catch (error) {
    console.error("Error fetching schedules:", error)
    return NextResponse.json({ error: "An error occurred while fetching schedules" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const { cycleMaster, semester, dailySchedules } = await req.json()
    const client = await clientPromise
    const db = client.db(DB_NAME)

    // Validate required fields
    if (!cycleMaster || !semester || !Array.isArray(dailySchedules)) {
      return NextResponse.json({ error: "Invalid input data" }, { status: 400 })
    }

    // Process daily schedules
    const processedSchedules = dailySchedules.map((daily) => ({
      ...daily,
      module: daily.module ? new ObjectId(daily.module) : null,
      professor: daily.professor ? new ObjectId(daily.professor) : null,
    }))

    const result = await db.collection("schedules").insertOne({
      cycleMaster: new ObjectId(cycleMaster),
      semester: new ObjectId(semester),
      dailySchedules: processedSchedules,
      schedule_pdf: null,
      createdAt: new Date(),
    })

    // Fetch the inserted document to return with populated fields
    const insertedSchedule = await db
      .collection("schedules")
      .aggregate([
        { $match: { _id: result.insertedId } },
        {
          $lookup: {
            from: "cycle_masters",
            localField: "cycleMaster",
            foreignField: "_id",
            as: "cycleMasterInfo",
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
          $lookup: {
            from: "modules",
            localField: "dailySchedules.module",
            foreignField: "_id",
            as: "moduleInfo",
          },
        },
        {
          $lookup: {
            from: "professors",
            localField: "dailySchedules.professor",
            foreignField: "_id",
            as: "professorInfo",
          },
        },
        {
          $project: {
            _id: 1,
            cycleMaster: { $arrayElemAt: ["$cycleMasterInfo.title", 0] },
            semester: { $arrayElemAt: ["$semesterInfo.title", 0] },
            dailySchedules: {
              $map: {
                input: "$dailySchedules",
                as: "daily",
                in: {
                  day: "$$daily.day",
                  module: {
                    $cond: [
                      { $eq: ["$$daily.module", null] },
                      null,
                      {
                        $arrayElemAt: [
                          {
                            $filter: {
                              input: "$moduleInfo",
                              cond: { $eq: ["$$this._id", "$$daily.module"] },
                            },
                          },
                          0,
                        ],
                      },
                    ],
                  },
                  professor: {
                    $cond: [
                      { $eq: ["$$daily.professor", null] },
                      null,
                      {
                        $arrayElemAt: [
                          {
                            $filter: {
                              input: "$professorInfo",
                              cond: { $eq: ["$$this._id", "$$daily.professor"] },
                            },
                          },
                          0,
                        ],
                      },
                    ],
                  },
                  time: "$$daily.time",
                  place: "$$daily.place",
                },
              },
            },
            schedule_pdf: 1,
            createdAt: 1,
          },
        },
      ])
      .next()

    if (!insertedSchedule) {
      throw new Error("Failed to retrieve the inserted schedule")
    }

    return NextResponse.json(insertedSchedule, { status: 201 })
  } catch (error) {
    console.error("Error creating schedule:", error)
    return NextResponse.json({ error: "An error occurred while creating the schedule" }, { status: 500 })
  }
}

