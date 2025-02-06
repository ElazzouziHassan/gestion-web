import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { DB_NAME } from "@/lib/config"
import nodemailer from "nodemailer"

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const { emailContent, userType } = await req.json()
    const client = await clientPromise
    const db = client.db(DB_NAME)

    // Find the demande
    const demande = await db.collection("demandes").findOne({ _id: new ObjectId(params.id) })

    if (!demande) {
      return NextResponse.json({ error: "Demande not found" }, { status: 404 })
    }

    // Send email
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    })

    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: demande.user,
      subject: `Résolution de votre demande: ${demande._id}`,
      text: emailContent,
    })

    // Update the demande status to resolved
    await db
      .collection("demandes")
      .updateOne(
        { _id: new ObjectId(params.id) },
        { $set: { status: "resolved", updatedAt: new Date().toISOString() } },
      )

    return NextResponse.json({ message: "Demande resolved and email sent successfully" })
  } catch (error) {
    console.error("Error resolving demande:", error)
    return NextResponse.json({ error: "An error occurred while resolving the demande" }, { status: 500 })
  }
}

