import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { DB_NAME } from "@/lib/config"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const cycleMasterId = searchParams.get("cycleMaster")

  try {
    const client = await clientPromise
    const db = client.db(DB_NAME)
    const schedules = await db
      .collection("schedules")
      .aggregate([
        ...(cycleMasterId ? [{ $match: { cycleMaster: new ObjectId(cycleMasterId) } }] : []),
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
            localField: "dailySchedules.sessions.module",
            foreignField: "_id",
            as: "moduleInfo",
          },
        },
        {
          $lookup: {
            from: "professors",
            localField: "dailySchedules.sessions.professor",
            foreignField: "_id",
            as: "professorInfo",
          },
        },
        {
          $project: {
            _id: 1,
            cycleMaster: { $arrayElemAt: ["$cycleMasterInfo._id", 0] },
            cycleMasterTitle: { $arrayElemAt: ["$cycleMasterInfo.title", 0] },
            semester: { $arrayElemAt: ["$semesterInfo._id", 0] },
            semesterTitle: { $arrayElemAt: ["$semesterInfo.title", 0] },
            dailySchedules: {
              $map: {
                input: "$dailySchedules",
                as: "daily",
                in: {
                  day: "$$daily.day",
                  sessions: {
                    $map: {
                      input: "$$daily.sessions",
                      as: "session",
                      in: {
                        module: {
                          $let: {
                            vars: {
                              moduleInfo: {
                                $arrayElemAt: [
                                  {
                                    $filter: {
                                      input: "$moduleInfo",
                                      cond: { $eq: ["$$this._id", "$$session.module"] },
                                    },
                                  },
                                  0,
                                ],
                              },
                            },
                            in: {
                              _id: "$$moduleInfo._id",
                              title: "$$moduleInfo.title",
                              code: "$$moduleInfo.code",
                            },
                          },
                        },
                        professor: {
                          $let: {
                            vars: {
                              professorInfo: {
                                $arrayElemAt: [
                                  {
                                    $filter: {
                                      input: "$professorInfo",
                                      cond: { $eq: ["$$this._id", "$$session.professor"] },
                                    },
                                  },
                                  0,
                                ],
                              },
                            },
                            in: {
                              _id: "$$professorInfo._id",
                              firstName: "$$professorInfo.firstName",
                              lastName: "$$professorInfo.lastName",
                            },
                          },
                        },
                        timeSlot: "$$session.timeSlot",
                        place: "$$session.place",
                      },
                    },
                  },
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
      sessions: daily.sessions.map((session: { module: number; professor: number }) => ({
        ...session,
        module: session.module ? new ObjectId(session.module) : null,
        professor: session.professor ? new ObjectId(session.professor) : null,
      })),
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
            localField: "dailySchedules.sessions.module",
            foreignField: "_id",
            as: "moduleInfo",
          },
        },
        {
          $lookup: {
            from: "professors",
            localField: "dailySchedules.sessions.professor",
            foreignField: "_id",
            as: "professorInfo",
          },
        },
        {
          $project: {
            _id: 1,
            cycleMaster: { $arrayElemAt: ["$cycleMasterInfo._id", 0] },
            cycleMasterTitle: { $arrayElemAt: ["$cycleMasterInfo.title", 0] },
            semester: { $arrayElemAt: ["$semesterInfo._id", 0] },
            semesterTitle: { $arrayElemAt: ["$semesterInfo.title", 0] },
            dailySchedules: {
              $map: {
                input: "$dailySchedules",
                as: "daily",
                in: {
                  day: "$$daily.day",
                  sessions: {
                    $map: {
                      input: "$$daily.sessions",
                      as: "session",
                      in: {
                        module: {
                          $let: {
                            vars: {
                              moduleInfo: {
                                $arrayElemAt: [
                                  {
                                    $filter: {
                                      input: "$moduleInfo",
                                      cond: { $eq: ["$$this._id", "$$session.module"] },
                                    },
                                  },
                                  0,
                                ],
                              },
                            },
                            in: {
                              _id: "$$moduleInfo._id",
                              title: "$$moduleInfo.title",
                            },
                          },
                        },
                        professor: {
                          $let: {
                            vars: {
                              professorInfo: {
                                $arrayElemAt: [
                                  {
                                    $filter: {
                                      input: "$professorInfo",
                                      cond: { $eq: ["$$this._id", "$$session.professor"] },
                                    },
                                  },
                                  0,
                                ],
                              },
                            },
                            in: {
                              _id: "$$professorInfo._id",
                              firstName: "$$professorInfo.firstName",
                              lastName: "$$professorInfo.lastName",
                            },
                          },
                        },
                        timeSlot: "$$session.timeSlot",
                        place: "$$session.place",
                      },
                    },
                  },
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

