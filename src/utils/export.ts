export function exportToCSV(data: any[], filename: string) {
  const headers = Object.keys(data[0] || {})
  const csvContent = [
    headers.join(","),
    ...data.map((row) => headers.map((header) => JSON.stringify(row[header] || "")).join(",")),
  ].join("\n")

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
  const link = document.createElement("a")
  link.href = URL.createObjectURL(blob)
  link.download = filename
  link.click()
}

export function exportToJSON(data: any[], filename: string) {
  const jsonContent = JSON.stringify(data, null, 2)
  const blob = new Blob([jsonContent], {
    type: "application/json;charset=utf-8;",
  })
  const link = document.createElement("a")
  link.href = URL.createObjectURL(blob)
  link.download = filename
  link.click()
}

export function printContent(elementId: string) {
  const element = document.getElementById(elementId)
  if (!element) return

  const printWindow = window.open("", "", "width=800,height=600")
  printWindow?.document.write(element.innerHTML)
  printWindow?.document.close()
  printWindow?.print()
}

export async function exportToPDF(data: any[], filename: string, title: string) {
  try {
    // Using jsPDF and autoTable for PDF generation
    const pdf = await import("jspdf").then((m) => m.jsPDF)
    const autoTable = await import("jspdf-autotable").then((m) => m.default)

    const doc = new pdf()
    doc.text(title, 14, 15)

    const columns = Object.keys(data[0] || {})
    const rows = data.map((item) => columns.map((col) => item[col] || ""))

    autoTable(doc, {
      head: [columns],
      body: rows,
      startY: 25,
      margin: { top: 20, right: 10, bottom: 10, left: 10 },
    })

    doc.save(filename)
  } catch (error) {
    console.log("[v0] PDF export requires jsPDF and jspdf-autotable")
    exportToCSV(data, filename.replace(".pdf", ".csv"))
  }
}
