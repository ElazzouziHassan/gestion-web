import { NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import clientPromise from "@/lib/mongodb"
import { DB_NAME } from "@/lib/config"
import jsPDF from "jspdf"
import "jspdf-autotable"

const frenchDays: { [key: string]: string } = {
  Monday: "Lundi",
  Tuesday: "Mardi",
  Wednesday: "Mercredi",
  Thursday: "Jeudi",
  Friday: "Vendredi",
  Saturday: "Samedi",
  Sunday: "Dimanche",
}

export async function GET(req: Request, context: { params: { id: string } }) {
  try {
    // Destructure and await the params
    const { id } = context.params

    const client = await clientPromise
    const db = client.db(DB_NAME)

    const schedule = await db
      .collection("schedules")
      .aggregate([
        { $match: { _id: new ObjectId(id) } },
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
            cycleMasterTitle: { $arrayElemAt: ["$cycleMasterInfo.title", 0] },
            semesterTitle: { $arrayElemAt: ["$semesterInfo.title", 0] },
            dailySchedules: 1,
            moduleInfo: 1,
            professorInfo: 1,
          },
        },
      ])
      .next()

    if (!schedule) {
      return NextResponse.json({ error: "Schedule not found" }, { status: 404 })
    }

    // Create PDF with adjusted page size and margins
    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    })

    // Add title
    doc.setFontSize(16)
    doc.text(`${schedule.cycleMasterTitle} - ${schedule.semesterTitle}`, 14, 15)

    // Prepare table data by grouping sessions by day
    const tableData = schedule.dailySchedules.map((daily: { sessions: any[]; day: any }) => {
      const sessions = daily.sessions.map(
        (session: {
          module: { toString: () => any }
          professor: { toString: () => any }
          timeSlot: any
          place: any
        }) => {
          const module = schedule.moduleInfo.find(
            (m: { _id: { toString: () => any } }) => m._id.toString() === session.module.toString(),
          )
          const professor = schedule.professorInfo.find(
            (p: { _id: { toString: () => any } }) => p._id.toString() === session.professor.toString(),
          )
          return {
            module: module ? module.code : "N/A",
            professor: professor ? `Pr ${professor.firstName[0]}. ${professor.lastName.toUpperCase()}` : "N/A",
            timeSlot: session.timeSlot,
            place: session.place,
          }
        },
      )

      return [
        frenchDays[daily.day] || daily.day,
        sessions.map((s: { module: any }) => s.module).join("\n"),
        sessions.map((s: { professor: any }) => s.professor).join("\n"),
        sessions.map((s: { timeSlot: any }) => s.timeSlot).join("\n"),
        sessions.map((s: { place: any }) => s.place).join("\n"),
      ]
    })

    // Add table with adjusted column widths and styling
    doc.autoTable({
      startY: 25,
      head: [["Jour", "Module", "Professeur", "Horaire", "Salle"]],
      body: tableData,
      theme: "grid",
      headStyles: { fillColor: [41, 128, 185], textColor: 255 },
      styles: {
        fontSize: 8,
        cellPadding: 2,
        overflow: "linebreak",
      },
      columnStyles: {
        0: { cellWidth: 30 }, // Jour
        1: { cellWidth: 50 }, // Module
        2: { cellWidth: 50 }, // Professeur
        3: { cellWidth: 40 }, // Horaire
        4: { cellWidth: 30 }, // Salle
      },
      margin: { left: 10, right: 10 },
    })

    // Convert PDF to buffer
    const pdfBuffer = doc.output("arraybuffer")

    // Return PDF
    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="emploi_du_temps.pdf"`,
      },
    })
  } catch (error) {
    console.error("Error generating PDF:", error)
    return NextResponse.json({ error: "Error generating PDF" }, { status: 500 })
  }
}

