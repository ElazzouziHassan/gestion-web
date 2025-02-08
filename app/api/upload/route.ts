import { NextResponse } from "next/server"
import { writeFile } from "fs/promises"
import path from "path"

export async function POST(req: Request) {
  const formData = await req.formData()
  const file = formData.get("file") as File | null

  if (!file) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 })
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const filename = Date.now() + "_" + file.name.replaceAll(" ", "_")

  try {
    const uploadDir = path.join(process.cwd(), "public/uploads")
    await writeFile(path.join(uploadDir, filename), buffer)
    return NextResponse.json({ fileUrl: `/uploads/${filename}` })
  } catch (error) {
    console.error("Error saving file:", error)
    return NextResponse.json({ error: "Error uploading file" }, { status: 500 })
  }
}

