"use client"

import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { AdminNavbar } from "@/components/admin/admin-navbar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import { Upload, Download, Eye, Trash2 } from "lucide-react"

import { useStore } from "@/lib/store"

export default function ReportsPage() {
  const { authToken } = useStore()
  const [reports, setReports] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchReports = async () => {
      if (!authToken) return
      try {
        const res = await fetch("http://localhost:5000/api/admin/appointments", {
          headers: { Authorization: `Bearer ${authToken}` }
        })
        if (res.ok) {
          const data = await res.json()
          // Filter only completed appointments with reports
          const completed = data.filter((a: any) => a.status === 'completed' || a.report_path)
          setReports(completed)
        }
      } catch (error) {
        console.error("Failed to fetch reports")
      } finally {
        setLoading(false)
      }
    }
    fetchReports()
  }, [authToken])

  return (
    <div className="flex">
      <AdminSidebar />
      <div className="flex-1 md:ml-64 transition-all duration-300">
        <AdminNavbar />
        <main className="p-4 md:p-8 bg-slate-50 dark:bg-slate-950 min-h-screen">
          <div className="max-w-7xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Reports Library</h1>
                <p className="text-slate-600 dark:text-slate-400 mt-1">View history of uploaded patient reports</p>
              </div>
            </div>

            {/* Reports List */}
            <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
              <CardHeader>
                <CardTitle>Uploaded Reports</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                      <tr>
                        <th className="px-6 py-3 text-left font-semibold text-slate-900 dark:text-white">Patient</th>
                        <th className="px-6 py-3 text-left font-semibold text-slate-900 dark:text-white">Test</th>
                        <th className="px-6 py-3 text-left font-semibold text-slate-900 dark:text-white">Date</th>
                        <th className="px-6 py-3 text-left font-semibold text-slate-900 dark:text-white">Status</th>
                        <th className="px-6 py-3 text-left font-semibold text-slate-900 dark:text-white">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reports.length === 0 ? (
                        <tr><td colSpan={5} className="px-6 py-4 text-center">No reports found</td></tr>
                      ) : reports.map((report) => (
                        <tr
                          key={report.id}
                          className="border-b border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800"
                        >
                          <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{report.test_name || "Unknown"}</td>
                          <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{report.test_name}</td>
                          <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{new Date(report.date).toLocaleDateString()}</td>
                          <td className="px-6 py-4">
                            <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                              Completed
                            </span>
                          </td>
                          <td className="px-6 py-4 flex gap-2">
                            <button className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded">
                              <Eye className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                            </button>
                            <a
                              href={`http://localhost:5000/api/patient/reports/${report.report_path}`}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e) => {
                                if (!authToken) {
                                  e.preventDefault();
                                  alert("Unauthorized");
                                  return;
                                }
                                // We need to pass auth token.
                                // Since this is a simple anchor tag, we can't easily pass headers unless we fetch and blob.
                                // Alternative: Use a download function.
                                e.preventDefault();
                                fetch(`http://localhost:5000/api/patient/reports/${report.report_path}`, {
                                  headers: { Authorization: `Bearer ${authToken}` }
                                })
                                  .then(res => res.blob())
                                  .then(blob => {
                                    const url = window.URL.createObjectURL(blob);
                                    const a = document.createElement('a');
                                    a.href = url;
                                    a.download = report.report_path.split('_').slice(2).join('_'); // Cleaner filename
                                    a.click();
                                  })
                                  .catch(err => console.error(err));
                              }}
                              className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded inline-block"
                            >
                              <Download className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}
