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

    if (!cycleMaster || !semester || !dailySchedules) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    if (!Array.isArray(dailySchedules)) {
      return NextResponse.json({ error: "dailySchedules must be an array" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db(DB_NAME)

    // Check if a schedule already exists for this cycle master and semester combination
    const existingSchedule = await db.collection("schedules").findOne({
      cycleMaster: new ObjectId(cycleMaster),
      semester: new ObjectId(semester),
    })

    if (existingSchedule) {
      return NextResponse.json(
        {
          error: "Un emploi du temps existe déjà pour ce cycle master et ce semestre.",
          details: {
            cycleMaster: existingSchedule.cycleMaster,
            semester: existingSchedule.semester,
          },
        },
        { status: 409 },
      )
    }

    // Process daily schedules
    const processedSchedules = dailySchedules.map((daily) => ({
      ...daily,
      sessions: daily.sessions.map((session: { module: { _id: number }; professor: { _id: number } }) => ({
        ...session,
        module: session.module?._id ? new ObjectId(session.module._id) : null,
        professor: session.professor?._id ? new ObjectId(session.professor._id) : null,
      })),
    }))

    // Insert the new schedule
    const result = await db.collection("schedules").insertOne({
      cycleMaster: new ObjectId(cycleMaster),
      semester: new ObjectId(semester),
      dailySchedules: processedSchedules,
      schedule_pdf: null,
      createdAt: new Date(),
    })

    // Fetch the complete schedule with populated fields
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

