import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import bcrypt from "bcryptjs"
import { DB_NAME } from "@/lib/config"
import { logAction } from "@/lib/logAction"
import * as jose from "jose"
import { createPdf } from "@/lib/pdfGenerator"

function generatePassword(firstName: string, lastName: string, studentNumber: string): string {
  return `${firstName.charAt(0).toLowerCase()}${lastName.charAt(0).toLowerCase()}${studentNumber}`
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
    const { firstName, lastName, studentNumber, cycleId, currentSemesterId, promo, email, profilePicture } =
      await req.json()

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
      profilePicture: null,
    })

    // Generate PDF
    const pdfBuffer = await createPdf({
      fullName: `${firstName} ${lastName}`,
      email,
      password,
      dateCreation: new Date().toISOString(),
    })

    // Save PDF to database
    const pdfObjectId = new ObjectId()
    await db.collection("user_pdfs").insertOne({
      _id: pdfObjectId,
      userId: result.insertedId,
      pdfData: pdfBuffer,
      createdAt: new Date(),
    })

    // Update student document with PDF reference and profile picture
    await db.collection("students").updateOne(
      { _id: result.insertedId },
      {
        $set: {
          pdfId: pdfObjectId,
        },
      },
    )

    // Log the student creation action
    const cookieStore = await cookies()
    const token = cookieStore.get("token")?.value
    if (token) {
      const jwtSecret = process.env.JWT_SECRET
      if (jwtSecret) {
        const secretKey = new TextEncoder().encode(jwtSecret)
        try {
          const { payload } = await jose.jwtVerify(token, secretKey)
          if (payload.userId && payload.role === "admin") {
            await logAction(
              "admin",
              payload.userId as string,
              "create_student",
              `Admin created student: ${firstName} ${lastName} (${studentNumber})`,
            )
          }
        } catch (error) {
          console.error("Error verifying token during student creation:", error)
        }
      }
    }

    return NextResponse.json(
      {
        message: "Student created successfully",
        id: result.insertedId,
        pdfId: pdfObjectId.toString(),
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Error creating student:", error)
    return NextResponse.json({ error: "An error occurred while creating the student" }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const { id, firstName, lastName, studentNumber, cycleId, currentSemesterId, promo } = await req.json()

    const client = await clientPromise
    const db = client.db(DB_NAME)
    const result = await db.collection("students").updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          firstName,
          lastName,
          studentNumber,
          cycle: new ObjectId(cycleId),
          currentSemester: new ObjectId(currentSemesterId),
          promo,
          updatedAt: new Date(),
        },
      },
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 })
    }

    // Log the student update action
    const cookieStore = await cookies()
    const token = cookieStore.get("token")?.value
    if (token) {
      const jwtSecret = process.env.JWT_SECRET
      if (jwtSecret) {
        const secretKey = new TextEncoder().encode(jwtSecret)
        try {
          const { payload } = await jose.jwtVerify(token, secretKey)
          if (payload.userId && payload.role === "admin") {
            await logAction(
              "admin",
              payload.userId as string,
              "update_student",
              `Admin updated student: ${firstName} ${lastName} (${studentNumber})`,
            )
          }
        } catch (error) {
          console.error("Error verifying token during student update:", error)
        }
      }
    }

    return NextResponse.json({ message: "Student updated successfully" }, { status: 200 })
  } catch (error) {
    console.error("Error updating student:", error)
    return NextResponse.json({ error: "An error occurred while updating the student" }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Student ID is required" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db(DB_NAME)
    const result = await db.collection("students").deleteOne({ _id: new ObjectId(id) })

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 })
    }

    // Log the student deletion action
    const cookieStore = await cookies()
    const token = cookieStore.get("token")?.value
    if (token) {
      const jwtSecret = process.env.JWT_SECRET
      if (jwtSecret) {
        const secretKey = new TextEncoder().encode(jwtSecret)
        try {
          const { payload } = await jose.jwtVerify(token, secretKey)
          if (payload.userId && payload.role === "admin") {
            await logAction("admin", payload.userId as string, "delete_student", `Admin deleted student with ID: ${id}`)
          }
        } catch (error) {
          console.error("Error verifying token during student deletion:", error)
        }
      }
    }

    return NextResponse.json({ message: "Student deleted successfully" }, { status: 200 })
  } catch (error) {
    console.error("Error deleting student:", error)
    return NextResponse.json({ error: "An error occurred while deleting the student" }, { status: 500 })
  }
}

