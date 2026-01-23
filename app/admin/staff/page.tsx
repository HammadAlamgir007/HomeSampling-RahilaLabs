"use client"

import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { AdminNavbar } from "@/components/admin/admin-navbar"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Edit, Trash2, Mail, Phone } from "lucide-react"

const staffMembers = [
  {
    id: "1",
    name: "Dr. Sarah Ahmed",
    role: "Admin",
    email: "sarah@rahila.com",
    phone: "03001234567",
    status: "active",
  },
  { id: "2", name: "Ali Hassan", role: "Technician", email: "ali@rahila.com", phone: "03101234567", status: "active" },
  { id: "3", name: "Fatima Khan", role: "Staff", email: "fatima@rahila.com", phone: "03201234567", status: "active" },
  {
    id: "4",
    name: "Hassan Ali",
    role: "Technician",
    email: "hassan@rahila.com",
    phone: "03301234567",
    status: "inactive",
  },
]

export default function StaffPage() {
  return (
    <div className="flex">
      <AdminSidebar />
      <div className="flex-1 ml-64">
        <AdminNavbar />
        <main className="p-8 bg-slate-50 dark:bg-slate-950 min-h-screen">
          <div className="max-w-7xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Staff Management</h1>
                <p className="text-slate-600 dark:text-slate-400 mt-1">Manage team members and their roles</p>
              </div>
              <Button className="bg-blue-900 hover:bg-blue-800 gap-2">
                <Plus className="w-4 h-4" />
                Add Staff
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {staffMembers.map((staff) => (
                <Card
                  key={staff.id}
                  className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:shadow-lg transition-shadow"
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-bold text-slate-900 dark:text-white">{staff.name}</h3>
                        <p className="text-sm text-blue-900 dark:text-blue-400 mt-1">{staff.role}</p>
                      </div>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          staff.status === "active"
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                            : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
                        }`}
                      >
                        {staff.status}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                      <Mail className="w-4 h-4" />
                      <a href={`mailto:${staff.email}`} className="hover:text-blue-900 dark:hover:text-blue-400">
                        {staff.email}
                      </a>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                      <Phone className="w-4 h-4" />
                      <a href={`tel:${staff.phone}`} className="hover:text-blue-900 dark:hover:text-blue-400">
                        {staff.phone}
                      </a>
                    </div>
                    <div className="flex gap-2 pt-4 border-t border-slate-200 dark:border-slate-700">
                      <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-200 rounded hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors">
                        <Edit className="w-4 h-4" />
                        Edit
                      </button>
                      <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm bg-red-100 dark:bg-red-900 text-red-900 dark:text-red-200 rounded hover:bg-red-200 dark:hover:bg-red-800 transition-colors">
                        <Trash2 className="w-4 h-4" />
                        Remove
                      </button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
