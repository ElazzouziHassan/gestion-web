import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { DB_NAME } from "@/lib/config"

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const { id } = params
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

    // Check if another schedule exists with the same cycle master and semester (excluding current schedule)
    const existingSchedule = await db.collection("schedules").findOne({
      _id: { $ne: new ObjectId(id) },
      cycleMaster: new ObjectId(cycleMaster),
      semester: new ObjectId(semester),
    })

    if (existingSchedule) {
      return NextResponse.json(
        {
          error: "A schedule already exists for this cycle master and semester combination.",
        },
        { status: 409 },
      )
    }

    // Process daily schedules
    const processedSchedules = dailySchedules.map((daily: any) => ({
      ...daily,
      sessions: daily.sessions.map((session: any) => ({
        ...session,
        module: session.module?._id ? new ObjectId(session.module._id) : null,
        professor: session.professor?._id ? new ObjectId(session.professor._id) : null,
      })),
    }))

    // First update the document
    await db.collection("schedules").updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          cycleMaster: new ObjectId(cycleMaster),
          semester: new ObjectId(semester),
          dailySchedules: processedSchedules,
          updatedAt: new Date(),
        },
      },
    )

    // Then fetch the updated document with populated fields
    const updatedSchedule = await db
      .collection("schedules")
      .aggregate([
        { $match: { _id: new ObjectId(id) } },
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
            updatedAt: 1,
          },
        },
      ])
      .next()

    if (!updatedSchedule) {
      return NextResponse.json({ error: "Failed to retrieve updated schedule" }, { status: 500 })
    }

    return NextResponse.json(updatedSchedule)
  } catch (error) {
    console.error("Error updating schedule:", error)
    return NextResponse.json({ error: "An error occurred while updating the schedule" }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const { id } = params
  try {
    const client = await clientPromise
    const db = client.db(DB_NAME)

    const result = await db.collection("schedules").deleteOne({ _id: new ObjectId(id) })

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Schedule not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Schedule deleted successfully" })
  } catch (error) {
    console.error("Error deleting schedule:", error)
    return NextResponse.json({ error: "An error occurred while deleting the schedule" }, { status: 500 })
  }
}

