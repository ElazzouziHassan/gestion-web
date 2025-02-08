import { PDFDocument, rgb, StandardFonts } from "pdf-lib"

type UserDetails = {
  fullName: string
  email: string
  password: string
  dateCreation: string
}

export async function createPdf(userDetails: UserDetails): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create()
  const page = pdfDoc.addPage()
  const { width, height } = page.getSize()
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)

  const fontSize = 12
  const lineHeight = fontSize * 1.5

  page.drawText("User Details", {
    x: 50,
    y: height - 50,
    size: 16,
    font,
    color: rgb(0, 0, 0),
  })

  const details = [
    `Full Name: ${userDetails.fullName}`,
    `Email: ${userDetails.email}`,
    `Password: ${userDetails.password}`,
    `Date Created: ${new Date(userDetails.dateCreation).toLocaleString()}`,
  ]

  details.forEach((detail, index) => {
    page.drawText(detail, {
      x: 50,
      y: height - 100 - index * lineHeight,
      size: fontSize,
      font,
      color: rgb(0, 0, 0),
    })
  })

  return pdfDoc.save()
}

