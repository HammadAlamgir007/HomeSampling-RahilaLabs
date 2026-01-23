"use client"

import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { AdminNavbar } from "@/components/admin/admin-navbar"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useState } from "react"
import { searchItems } from "@/lib/search-utils"
import { Plus, Search, Edit, Trash2, Eye } from "lucide-react"

const mockPatients = [
  { id: "p1", name: "Ali Ahmed", email: "ali@example.com", phone: "03001234567", city: "Karachi", status: "active" },
  {
    id: "p2",
    name: "Fatima Khan",
    email: "fatima@example.com",
    phone: "03101234567",
    city: "Lahore",
    status: "active",
  },
  {
    id: "p3",
    name: "Hassan Ali",
    email: "hassan@example.com",
    phone: "03201234567",
    city: "Islamabad",
    status: "inactive",
  },
  {
    id: "p4",
    name: "Ayesha Ahmed",
    email: "ayesha@example.com",
    phone: "03301234567",
    city: "Faisalabad",
    status: "active",
  },
]

export default function PatientsPage() {
  const [searchTerm, setSearchTerm] = useState("")

  const filteredPatients = searchItems(mockPatients, searchTerm, ["name", "email", "phone", "city"])

  return (
    <div className="flex">
      <AdminSidebar />
      <div className="flex-1 ml-64">
        <AdminNavbar />
        <main className="p-8 bg-slate-50 dark:bg-slate-950 min-h-screen">
          <div className="max-w-7xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Manage Patients</h1>
                <p className="text-slate-600 dark:text-slate-400 mt-1">View and manage all patients</p>
              </div>
              <Button className="bg-blue-900 hover:bg-blue-800 gap-2">
                <Plus className="w-4 h-4" />
                Add Patient
              </Button>
            </div>

            <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
              <CardHeader>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 w-5 h-5 text-slate-400" />
                  <Input
                    placeholder="Search by name, email, phone, or city..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-slate-50 dark:bg-slate-800 border-0"
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                      <tr>
                        <th className="px-6 py-3 text-left font-semibold text-slate-900 dark:text-white">Name</th>
                        <th className="px-6 py-3 text-left font-semibold text-slate-900 dark:text-white">Email</th>
                        <th className="px-6 py-3 text-left font-semibold text-slate-900 dark:text-white">Phone</th>
                        <th className="px-6 py-3 text-left font-semibold text-slate-900 dark:text-white">City</th>
                        <th className="px-6 py-3 text-left font-semibold text-slate-900 dark:text-white">Status</th>
                        <th className="px-6 py-3 text-left font-semibold text-slate-900 dark:text-white">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPatients.map((patient) => (
                        <tr
                          key={patient.id}
                          className="border-b border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800"
                        >
                          <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{patient.name}</td>
                          <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{patient.email}</td>
                          <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{patient.phone}</td>
                          <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{patient.city}</td>
                          <td className="px-6 py-4">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-medium ${
                                patient.status === "active"
                                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                  : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
                              }`}
                            >
                              {patient.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 flex gap-2">
                            <button className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded">
                              <Eye className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                            </button>
                            <button className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded">
                              <Edit className="w-4 h-4 text-slate-600 dark:text-slate-400" />
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
