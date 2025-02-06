import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import bcrypt from "bcryptjs"
import { DB_NAME } from "@/lib/config"

function generatePassword(firstName: string, lastName: string): string {
  // Take first letter of first name, first letter of last name, and add a timestamp
  const firstInitial = firstName.charAt(0).toLowerCase()
  const lastInitial = lastName.charAt(0).toLowerCase()
  const timestamp = Date.now().toString().slice(-6)
  return `${firstInitial}${lastInitial}${timestamp}`
}

export async function GET() {
  try {
    const client = await clientPromise
    const db = client.db(DB_NAME)

    // Get all professors and populate module information
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
    const { firstName, lastName, email, telephone, status, moduleIds } = await req.json()

    // Generate and hash password
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
    })

    // Return the generated password so it can be communicated to the professor
    return NextResponse.json(
      {
        message: "Professor created successfully",
        id: result.insertedId,
        generatedPassword: password,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Error creating professor:", error)
    return NextResponse.json({ error: "An error occurred while creating the professor" }, { status: 500 })
  }
}

