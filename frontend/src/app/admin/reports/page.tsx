"use client"

import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { AdminNavbar } from "@/components/admin/admin-navbar"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useState, useEffect } from "react"
import { useStore } from "@/lib/store"
import { API_BASE_URL } from "@/lib/api_config"
import { Search, FileText, Download, Eye, User, Calendar, TestTube } from "lucide-react"
import Link from "next/link"
import { toast } from "react-toastify"

interface Report {
  id: number
  booking_order_id: string | null
  patient_id: number
  patient_name: string
  patient_email: string | null
  test_name: string
  test_price: number | null
  status: string
  appointment_date: string | null
  created_at: string | null
  report_path: string | null
  address: string | null
}

function formatDate(iso: string | null) {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" })
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    completed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    collected: "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200",
    confirmed: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    cancelled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    delivered_to_lab: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  }
  const cls = map[status] ?? "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${cls}`}>
      {status.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
    </span>
  )
}

export default function ReportsPage() {
  const { authToken } = useStore()
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    const fetchReports = async () => {
      if (!authToken) return
      setLoading(true)
      try {
        const res = await fetch(`${API_BASE_URL}/api/admin/reports`, {
          headers: { Authorization: `Bearer ${authToken}` }
        })
        if (!res.ok) throw new Error("Failed to load reports")
        const data = await res.json()
        setReports(data.reports || [])
      } catch (err: any) {
        setError(err.message || "Error loading reports")
      } finally {
        setLoading(false)
      }
    }
    fetchReports()
  }, [authToken])

  // Client-side filter
  const filtered = reports.filter(r =>
    r.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.test_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (r.patient_email || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (r.booking_order_id || "").toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleDownload = async (reportPath: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/patient/reports/${reportPath}`, {
        headers: { Authorization: `Bearer ${authToken}` }
      })
      if (!res.ok) throw new Error("Download failed")
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      // Strip the UUID prefix for a cleaner filename
      a.download = reportPath.split("_").slice(1).join("_") || reportPath
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      toast.error("Could not download report. Please try again.")
    }
  }

  const handlePreview = async (reportPath: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/patient/reports/${reportPath}`, {
        headers: { Authorization: `Bearer ${authToken}` }
      })
      if (!res.ok) throw new Error("Preview failed")
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      window.open(url, "_blank")
    } catch {
      toast.error("Could not preview report.")
    }
  }

  return (
    <div className="flex">
      <AdminSidebar />
      <div className="flex-1 md:ml-64 transition-all duration-300">
        <AdminNavbar />
        <main className="p-4 md:p-8 bg-slate-50 dark:bg-slate-950 min-h-screen">
          <div className="max-w-7xl mx-auto space-y-6">

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Reports Library</h1>
                <p className="text-slate-600 dark:text-slate-400 mt-1">
                  All uploaded patient test reports
                </p>
              </div>
              {/* Stats pill */}
              <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-4 py-2">
                <FileText className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-semibold text-slate-900 dark:text-white">{reports.length}</span>
                <span className="text-sm text-slate-500 dark:text-slate-400">report{reports.length !== 1 ? "s" : ""} uploaded</span>
              </div>
            </div>

            {/* Search */}
            <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
              <CardContent className="pt-4 pb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 w-5 h-5 text-slate-400" />
                  <Input
                    placeholder="Search by patient name, email, test, or booking ID..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="pl-10 bg-slate-50 dark:bg-slate-800 border-0"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Error */}
            {error && (
              <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {/* Table */}
            <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
              <CardHeader className="border-b border-slate-100 dark:border-slate-800">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileText className="w-5 h-5" />
                  Uploaded Reports
                </CardTitle>
                <CardDescription>
                  {loading ? "Loading..." : `${filtered.length} report${filtered.length !== 1 ? "s" : ""}${searchTerm ? " match your search" : ""}`}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {loading ? (
                  <div className="text-center py-16 text-slate-400">Loading reports...</div>
                ) : filtered.length === 0 ? (
                  <div className="text-center py-16 text-slate-400 dark:text-slate-500 space-y-2">
                    <FileText className="w-10 h-10 mx-auto opacity-30" />
                    <p className="font-medium">{searchTerm ? "No reports match your search" : "No reports uploaded yet"}</p>
                    <p className="text-sm">
                      {searchTerm
                        ? "Try a different patient name or test."
                        : "Upload reports from the Appointments page to see them here."}
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                        <tr>
                          <th className="px-5 py-3 text-left font-semibold text-slate-700 dark:text-slate-300">Booking ID</th>
                          <th className="px-5 py-3 text-left font-semibold text-slate-700 dark:text-slate-300">Patient</th>
                          <th className="px-5 py-3 text-left font-semibold text-slate-700 dark:text-slate-300">Test</th>
                          <th className="px-5 py-3 text-left font-semibold text-slate-700 dark:text-slate-300">Appointment Date</th>
                          <th className="px-5 py-3 text-left font-semibold text-slate-700 dark:text-slate-300">Uploaded On</th>
                          <th className="px-5 py-3 text-left font-semibold text-slate-700 dark:text-slate-300">Status</th>
                          <th className="px-5 py-3 text-left font-semibold text-slate-700 dark:text-slate-300">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filtered.map(report => (
                          <tr
                            key={report.id}
                            className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                          >
                            {/* Booking ID */}
                            <td className="px-5 py-4 text-xs text-slate-400 dark:text-slate-500 font-mono">
                              {report.booking_order_id ?? `#${report.id}`}
                            </td>

                            {/* Patient */}
                            <td className="px-5 py-4">
                              <Link
                                href={`/admin/patients/${report.patient_id}`}
                                className="flex items-center gap-2 group"
                              >
                                <div className="w-8 h-8 rounded-full bg-blue-900 flex items-center justify-center text-white text-xs font-bold shrink-0">
                                  {report.patient_name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <div className="font-medium text-slate-900 dark:text-white group-hover:text-blue-700 dark:group-hover:text-blue-400 group-hover:underline">
                                    {report.patient_name}
                                  </div>
                                  {report.patient_email && (
                                    <div className="text-xs text-slate-400 dark:text-slate-500">{report.patient_email}</div>
                                  )}
                                </div>
                              </Link>
                            </td>

                            {/* Test */}
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                                <TestTube className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span className="font-medium">{report.test_name}</span>
                              </div>
                              {report.test_price && (
                                <div className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 ml-5">
                                  PKR {report.test_price}
                                </div>
                              )}
                            </td>

                            {/* Appointment Date */}
                            <td className="px-5 py-4 text-slate-600 dark:text-slate-400">
                              <div className="flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                {formatDate(report.appointment_date)}
                              </div>
                            </td>

                            {/* Uploaded On */}
                            <td className="px-5 py-4 text-slate-600 dark:text-slate-400 text-xs">
                              {formatDate(report.created_at)}
                            </td>

                            {/* Status */}
                            <td className="px-5 py-4">
                              <StatusBadge status={report.status} />
                            </td>

                            {/* Actions */}
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-1">
                                {report.report_path && (
                                  <>
                                    <button
                                      onClick={() => handlePreview(report.report_path!)}
                                      className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors"
                                      title="Preview report"
                                    >
                                      <Eye className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                    </button>
                                    <button
                                      onClick={() => handleDownload(report.report_path!)}
                                      className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors"
                                      title="Download report"
                                    >
                                      <Download className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                                    </button>
                                  </>
                                )}
                                <Link href={`/admin/patients/${report.patient_id}`}>
                                  <button
                                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors"
                                    title="View patient profile"
                                  >
                                    <User className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                                  </button>
                                </Link>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>

          </div>
        </main>
      </div>
    </div>
  )
}
