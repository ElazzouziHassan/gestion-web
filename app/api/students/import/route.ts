import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import bcrypt from "bcryptjs"
import { DB_NAME } from "@/lib/config"
import { validateExcelData, studentValidationRules } from "@/lib/excel-validators"
import { createPdf } from "@/lib/pdfGenerator"

export async function POST(req: Request) {
  try {
    const data = await req.json()

    // Validate the Excel data
    const validation = validateExcelData(data, studentValidationRules)
    if (!validation.isValid) {
      return NextResponse.json(
        {
          success: false,
          message: "Erreurs de validation dans le fichier Excel",
          details: validation.errors.join("\n"),
        },
        { status: 400 },
      )
    }

    const client = await clientPromise
    const db = client.db(DB_NAME)

    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
    }

    for (const student of data) {
      try {
        // Generate password and hash it
        const password = `${student.firstName.charAt(0).toLowerCase()}${student.lastName
          .charAt(0)
          .toLowerCase()}${student.studentNumber}`
        const hashedPassword = await bcrypt.hash(password, 10)

        // Create student
        const result = await db.collection("students").insertOne({
          firstName: student.firstName,
          lastName: student.lastName,
          studentNumber: student.studentNumber,
          email: student.email,
          password: hashedPassword,
          role: "student",
          cycle: new ObjectId(student.cycleId),
          currentSemester: new ObjectId(student.currentSemesterId),
          promo: student.promo,
          createdAt: new Date(),
        })

        // Generate PDF
        const pdfBuffer = await createPdf({
          fullName: `${student.firstName} ${student.lastName}`,
          email: student.email,
          password,
          dateCreation: new Date().toISOString(),
        })

        // Save PDF
        const pdfObjectId = new ObjectId()
        await db.collection("user_pdfs").insertOne({
          _id: pdfObjectId,
          userId: result.insertedId,
          pdfData: pdfBuffer,
          createdAt: new Date(),
        })

        // Update student with PDF reference
        await db.collection("students").updateOne(
          { _id: result.insertedId },
          {
            $set: {
              pdfId: pdfObjectId,
            },
          },
        )

        results.success++
      } catch (error) {
        results.failed++
        results.errors.push(
          `Erreur lors de l'importation de l'étudiant ${student.firstName} ${student.lastName}: ${
            error instanceof Error ? error.message : "Erreur inconnue"
          }`,
        )
      }
    }

    return NextResponse.json({
      success: true,
      message: `Importation terminée. ${results.success} étudiants importés avec succès, ${results.failed} échecs.`,
      details: results.errors.length > 0 ? results.errors.join("\n") : undefined,
    })
  } catch (error) {
    console.error("Error importing students:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Une erreur s'est produite lors de l'importation",
        details: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 },
    )
  }
}

