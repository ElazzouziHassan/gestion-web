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

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const client = await clientPromise
    const db = client.db(DB_NAME)

    const schedule = await db
      .collection("schedules")
      .aggregate([
        { $match: { _id: new ObjectId(params.id) } },
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

    // Create PDF
    const doc = new jsPDF()

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

      // Combine all sessions for the day into a single row
      return [
        frenchDays[daily.day] || daily.day, // Translate the day to French
        sessions.map((s: { module: any }) => s.module).join("\n"),
        sessions.map((s: { professor: any }) => s.professor).join("\n"),
        sessions.map((s: { timeSlot: any }) => s.timeSlot).join("\n"),
        sessions.map((s: { place: any }) => s.place).join("\n"),
      ]
    })

    // Add table
    doc.autoTable({
      startY: 25,
      head: [["Jour", "Module", "Professeur", "Horaire", "Salle"]],
      body: tableData,
      theme: "grid",
      headStyles: { fillColor: [41, 128, 185], textColor: 255 },
      styles: {
        fontSize: 10,
        cellPadding: 3,
        overflow: "linebreak",
        cellWidth: "wrap",
      },
      columnStyles: {
        0: { cellWidth: 30 }, // Jour
        1: { cellWidth: 40 }, // Module
        2: { cellWidth: 40 }, // Professeur
        3: { cellWidth: 30 }, // Horaire
        4: { cellWidth: 30 }, // Salle
      },
    })

    // Add module descriptions
    const uniqueModules = Array.from(new Set(schedule.moduleInfo.map((m: { code: any }) => m.code)))
    const moduleDescriptions = uniqueModules.map((code: any) => {
      const module = schedule.moduleInfo.find((m: { code: any }) => m.code === code)
      return `${code}: ${module.title}`
    })

    doc.setFontSize(12)
    doc.text("Module Descriptions:", 14, doc.autoTable.previous.finalY + 10)

    doc.setFontSize(10)
    let yPos = doc.autoTable.previous.finalY + 20
    moduleDescriptions.forEach((description: string) => {
      doc.text(description, 14, yPos)
      yPos += 7
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

