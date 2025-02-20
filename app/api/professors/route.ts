import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import bcrypt from "bcryptjs"
import { DB_NAME } from "@/lib/config"
import { logAction } from "@/lib/logAction"
import * as jose from "jose"
import { createPdf } from "@/lib/pdfGenerator"

function generatePassword(firstName: string, lastName: string): string {
  return `pass123`
}

export async function GET() {
  try {
    const client = await clientPromise
    const db = client.db(DB_NAME)

    const professors = await db
      .collection("professors")
      .aggregate([
        {
          $lookup: {
            from: "modules",
            localField: "modules",
            foreignField: "_id",
            as: "moduleInfo",
          },
        },
        {
          $project: {
            firstName: 1,
            lastName: 1,
            email: 1,
            telephone: 1,
            status: 1,
            moduleNames: "$moduleInfo.title",
          },
        },
      ])
      .toArray()

    return NextResponse.json(professors)
  } catch (error) {
    console.error("Error fetching professors:", error)
    return NextResponse.json({ error: "An error occurred while fetching professors" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const { firstName, lastName, email, telephone, status, moduleIds, profilePicture } = await req.json()

    const password = generatePassword(firstName, lastName)
    const hashedPassword = await bcrypt.hash(password, 10)

    const client = await clientPromise
    const db = client.db(DB_NAME)
    const result = await db.collection("professors").insertOne({
      firstName,
      lastName,
      email,
      telephone,
      password: hashedPassword,
      role: "professor",
      status,
      modules: moduleIds.map((id: string) => new ObjectId(id)),
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

    // Update professor document with PDF reference and profile picture
    await db.collection("professors").updateOne(
      { _id: result.insertedId },
      {
        $set: {
          pdfId: pdfObjectId,
        },
      },
    )

    // Log the professor creation action
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
              "create_professor",
              `Admin created professor: ${firstName} ${lastName} (${email})`,
            )
          }
        } catch (error) {
          console.error("Error verifying token during professor creation:", error)
        }
      }
    }

    return NextResponse.json(
      {
        message: "Professor created successfully",
        id: result.insertedId,
        pdfId: pdfObjectId.toString(),
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Error creating professor:", error)
    return NextResponse.json({ error: "An error occurred while creating the professor" }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const { id, firstName, lastName, email, telephone, status, moduleIds } = await req.json()

    const client = await clientPromise
    const db = client.db(DB_NAME)
    const result = await db.collection("professors").updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          firstName,
          lastName,
          email,
          telephone,
          status,
          modules: moduleIds.map((id: string) => new ObjectId(id)),
          updatedAt: new Date(),
        },
      },
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Professor not found" }, { status: 404 })
    }

    // Log the professor update action
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
              "update_professor",
              `Admin updated professor: ${firstName} ${lastName} (${email})`,
            )
          }
        } catch (error) {
          console.error("Error verifying token during professor update:", error)
        }
      }
    }

    return NextResponse.json({ message: "Professor updated successfully" }, { status: 200 })
  } catch (error) {
    console.error("Error updating professor:", error)
    return NextResponse.json({ error: "An error occurred while updating the professor" }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Professor ID is required" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db(DB_NAME)
    const result = await db.collection("professors").deleteOne({ _id: new ObjectId(id) })

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Professor not found" }, { status: 404 })
    }

    // Log the professor deletion action
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
              "delete_professor",
              `Admin deleted professor with ID: ${id}`,
            )
          }
        } catch (error) {
          console.error("Error verifying token during professor deletion:", error)
        }
      }
    }

    return NextResponse.json({ message: "Professor deleted successfully" }, { status: 200 })
  } catch (error) {
    console.error("Error deleting professor:", error)
    return NextResponse.json({ error: "An error occurred while deleting the professor" }, { status: 500 })
  }
}

