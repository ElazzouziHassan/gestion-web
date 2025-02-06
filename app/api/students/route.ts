import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import bcrypt from "bcryptjs"
import { DB_NAME } from "@/lib/config"

function generatePassword(firstName: string, lastName: string, studentNumber: string): string {
  const firstInitial = firstName.charAt(0).toLowerCase()
  const lastInitial = lastName.charAt(0).toLowerCase()
  return `${firstInitial}${lastInitial}${studentNumber}`
}

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

export async function POST(req: Request) {
  try {
    const { firstName, lastName, studentNumber, cycleId, currentSemesterId, promo } = await req.json()

    const password = generatePassword(firstName, lastName, studentNumber)
    const hashedPassword = await bcrypt.hash(password, 10)

    const client = await clientPromise
    const db = client.db(DB_NAME)
    const result = await db.collection("students").insertOne({
      firstName,
      lastName,
      studentNumber,
      password: hashedPassword,
      role: "student",
      cycle: new ObjectId(cycleId),
      currentSemester: new ObjectId(currentSemesterId),
      promo,
      createdAt: new Date(),
    })

    return NextResponse.json(
      {
        message: "Student created successfully",
        id: result.insertedId,
        generatedPassword: password,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Error creating student:", error)
    return NextResponse.json({ error: "An error occurred while creating the student" }, { status: 500 })
  }
}

