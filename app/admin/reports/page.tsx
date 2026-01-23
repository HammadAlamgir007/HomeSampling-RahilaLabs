"use client"

import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { AdminNavbar } from "@/components/admin/admin-navbar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { Upload, Download, Eye, Trash2 } from "lucide-react"

export default function ReportsPage() {
  const [selectedPatient, setSelectedPatient] = useState("")
  const [selectedTest, setSelectedTest] = useState("")

  const reports = [
    { id: "r1", patientName: "Ali Ahmed", testName: "CBC", uploadedDate: "2024-01-10", status: "ready" },
    { id: "r2", patientName: "Fatima Khan", testName: "Thyroid", uploadedDate: "2024-01-12", status: "ready" },
    { id: "r3", patientName: "Hassan Ali", testName: "Lipid", uploadedDate: "2024-01-15", status: "pending" },
  ]

  return (
    <div className="flex">
      <AdminSidebar />
      <div className="flex-1 ml-64">
        <AdminNavbar />
        <main className="p-8 bg-slate-50 dark:bg-slate-950 min-h-screen">
          <div className="max-w-7xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Reports</h1>
                <p className="text-slate-600 dark:text-slate-400 mt-1">Manage and upload patient reports</p>
              </div>
            </div>

            {/* Upload Form */}
            <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
              <CardHeader>
                <CardTitle>Upload Report</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <select
                    value={selectedPatient}
                    onChange={(e) => setSelectedPatient(e.target.value)}
                    className="px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="">Select Patient</option>
                    <option value="p1">Ali Ahmed</option>
                    <option value="p2">Fatima Khan</option>
                    <option value="p3">Hassan Ali</option>
                  </select>

                  <select
                    value={selectedTest}
                    onChange={(e) => setSelectedTest(e.target.value)}
                    className="px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="">Select Test</option>
                    <option value="1">CBC</option>
                    <option value="2">Thyroid</option>
                    <option value="3">Lipid Profile</option>
                  </select>

                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    className="px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <Button className="bg-blue-900 hover:bg-blue-800 gap-2 w-full md:w-auto">
                  <Upload className="w-4 h-4" />
                  Upload Report
                </Button>
              </CardContent>
            </Card>

            {/* Reports List */}
            <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
              <CardHeader>
                <CardTitle>Recent Reports</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                      <tr>
                        <th className="px-6 py-3 text-left font-semibold text-slate-900 dark:text-white">Patient</th>
                        <th className="px-6 py-3 text-left font-semibold text-slate-900 dark:text-white">Test</th>
                        <th className="px-6 py-3 text-left font-semibold text-slate-900 dark:text-white">Uploaded</th>
                        <th className="px-6 py-3 text-left font-semibold text-slate-900 dark:text-white">Status</th>
                        <th className="px-6 py-3 text-left font-semibold text-slate-900 dark:text-white">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reports.map((report) => (
                        <tr
                          key={report.id}
                          className="border-b border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800"
                        >
                          <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{report.patientName}</td>
                          <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{report.testName}</td>
                          <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{report.uploadedDate}</td>
                          <td className="px-6 py-4">
                            <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                              {report.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 flex gap-2">
                            <button className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded">
                              <Eye className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                            </button>
                            <button className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded">
                              <Download className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                            </button>
                            <button className="p-2 hover:bg-red-100 dark:hover:bg-red-900 rounded">
                              <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                            </button>
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
