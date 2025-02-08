import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { DB_NAME } from "@/lib/config"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const userType = searchParams.get("userType")
    const action = searchParams.get("action")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    const client = await clientPromise
    const db = client.db(DB_NAME)

    const query: any = {}

    if (userType) {
      query.userType = userType
    }

    if (action) {
      query.action = { $regex: action, $options: "i" }
    }

    if (startDate || endDate) {
      query.timestamp = {}
      if (startDate) {
        query.timestamp.$gte = new Date(startDate)
      }
      if (endDate) {
        query.timestamp.$lte = new Date(endDate)
      }
    }

    const logs = await db
      .collection("logs")
      .aggregate([
        { $match: query },
        {
          $lookup: {
            from: "admins",
            localField: "user",
            foreignField: "_id",
            as: "adminUser",
          },
        },
        {
          $lookup: {
            from: "students",
            localField: "user",
            foreignField: "_id",
            as: "studentUser",
          },
        },
        {
          $lookup: {
            from: "professors",
            localField: "user",
            foreignField: "_id",
            as: "professorUser",
          },
        },
        {
          $project: {
            userType: 1,
            action: 1,
            details: 1,
            timestamp: 1,
            user: {
              $cond: [
                { $eq: ["$userType", "admin"] },
                { $arrayElemAt: ["$adminUser", 0] },
                {
                  $cond: [
                    { $eq: ["$userType", "student"] },
                    { $arrayElemAt: ["$studentUser", 0] },
                    { $arrayElemAt: ["$professorUser", 0] },
                  ],
                },
              ],
            },
          },
        },
        {
          $project: {
            userType: 1,
            action: 1,
            details: 1,
            timestamp: 1,
            "user._id": 1,
            "user.firstName": 1,
            "user.lastName": 1,
            "user.email": 1,
          },
        },
        { $sort: { timestamp: -1 } },
      ])
      .toArray()

    return NextResponse.json(logs)
  } catch (error) {
    console.error("Error fetching logs:", error)
    return NextResponse.json({ error: "An error occurred while fetching logs" }, { status: 500 })
  }
}

