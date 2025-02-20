import { DB_NAME } from "@/lib/config"
import clientPromise from "@/lib/mongodb"
import { NextResponse } from "next/server"


export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const cycleMasterId = searchParams.get("cycleMaster")

  try {
    const client = await clientPromise
    const db = client.db(DB_NAME)
    const schedules = await db
      .collection("schedules")
      .aggregate([
        ...(cycleMasterId ? [{ $match: { cycleMaster: new Object(cycleMasterId) } }] : []),
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
