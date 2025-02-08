import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { DB_NAME } from "@/lib/config"

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const client = await clientPromise
    const db = client.db(DB_NAME)

    const pdfDoc = await db.collection("user_pdfs").findOne({ _id: new ObjectId(params.id) })

    if (!pdfDoc) {
      return NextResponse.json({ error: "PDF not found" }, { status: 404 })
    }

    const response = new NextResponse(pdfDoc.pdfData.buffer)
    response.headers.set("Content-Type", "application/pdf")
    response.headers.set("Content-Disposition", `attachment; filename="user_details.pdf"`)

    return response
  } catch (error) {
    console.error("Error fetching PDF:", error)
    return NextResponse.json({ error: "An error occurred while fetching the PDF" }, { status: 500 })
  }
}

