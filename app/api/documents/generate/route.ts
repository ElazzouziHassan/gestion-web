import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { DB_NAME } from "@/lib/config"
import * as XLSX from "xlsx"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const cycleId = searchParams.get("cycleId")
  const semesterId = searchParams.get("semesterId")

  if (!cycleId || !semesterId) {
    return NextResponse.json({ error: "Cycle ID and Semester ID are required" }, { status: 400 })
  }

  try {
    const client = await clientPromise
    const db = client.db(DB_NAME)

    // Fetch cycle and semester information
    const cycle = await db.collection("cycle_masters").findOne({ _id: new ObjectId(cycleId) })
    const semester = await db.collection("semesters").findOne({ _id: new ObjectId(semesterId) })

    if (!cycle || !semester) {
      return NextResponse.json({ error: "Cycle or Semester not found" }, { status: 404 })
    }

    // Fetch modules for the given cycle and semester
    const modules = await db
      .collection("modules")
      .find({ cycle: new ObjectId(cycleId), semester: new ObjectId(semesterId) })
      .toArray()

    // Fetch students for the given cycle and semester
    const students = await db
      .collection("students")
      .find({ cycle: new ObjectId(cycleId), currentSemester: new ObjectId(semesterId) })
      .toArray()

    // Fetch professors teaching modules in this cycle and semester
    const professorIds = modules.map((module) => module.professor).filter((id) => id)
    const professors = await db
      .collection("professors")
      .find({ _id: { $in: professorIds.map((id) => new ObjectId(id)) } })
      .toArray()

    // Create workbook and worksheets
    const workbook = XLSX.utils.book_new()

    // Cycle and Semester Info worksheet
    const infoSheet = XLSX.utils.json_to_sheet([
      { Cycle: cycle.title, Semester: semester.title },
      { "Start Date": semester.startDate, "End Date": semester.endDate },
    ])
    XLSX.utils.book_append_sheet(workbook, infoSheet, "Info")

    // Modules worksheet
    const modulesSheet = XLSX.utils.json_to_sheet(
      modules.map((module) => ({
        Title: module.title,
        Code: module.code,
        Professor: professors.find((p) => p._id.toString() === module.professor?.toString())?.lastName || "N/A",
        Description: module.description || "N/A",
        Credits: module.credits || "N/A",
      })),
    )
    XLSX.utils.book_append_sheet(workbook, modulesSheet, "Modules")

    // Students worksheet
    const studentsSheet = XLSX.utils.json_to_sheet(
      students.map((student) => ({
        "First Name": student.firstName,
        "Last Name": student.lastName,
        "Student Number": student.studentNumber,
        Email: student.email,
        Promo: student.promo,
        "Current Semester": semester.title,
      })),
    )
    XLSX.utils.book_append_sheet(workbook, studentsSheet, "Students")

    // Professors worksheet
    const professorsSheet = XLSX.utils.json_to_sheet(
      professors.map((professor) => ({
        "First Name": professor.firstName,
        "Last Name": professor.lastName,
        Email: professor.email,
        Status: professor.status,
        "Modules Taught": modules
          .filter((m) => m.professor?.toString() === professor._id.toString())
          .map((m) => m.title)
          .join(", "),
      })),
    )
    XLSX.utils.book_append_sheet(workbook, professorsSheet, "Professors")

    // Generate Excel file
    const excelBuffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" })

    // Set response headers
    const headers = new Headers()
    headers.set("Content-Disposition", `attachment; filename="cycle_semester_data.xlsx"`)
    headers.set("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")

    return new NextResponse(excelBuffer, { status: 200, headers })
  } catch (error) {
    console.error("Error generating Excel document:", error)
    return NextResponse.json({ error: "An error occurred while generating the document" }, { status: 500 })
  }
}

