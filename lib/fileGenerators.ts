import jsPDF from "jspdf"
import "jspdf-autotable"
import * as XLSX from "xlsx"

export const generatePDF = (data: any[], title: string, headers: string[]) => {
  const doc = new jsPDF()
  doc.text(title, 14, 15)
  doc.autoTable({
    head: [headers],
    body: data.map((item) => headers.map((header) => item[header.toLowerCase().replace(/ /g, "")])),
    startY: 20,
  })
  return doc.output("blob")
}

export const generateExcel = (data: any[], sheetName: string) => {
  const worksheet = XLSX.utils.json_to_sheet(data)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)
  const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" })
  return new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })
}

