"use client"

import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { AdminNavbar } from "@/components/admin/admin-navbar"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useState, useEffect } from "react"
import { useStore } from "@/lib/store"
import { searchItems } from "@/lib/search-utils"
import { Plus, Search, Edit, Trash2, Eye } from "lucide-react"
import { API_BASE_URL } from "@/lib/api_config"
import Link from "next/link"
import { toast } from "react-toastify"

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
  const { authToken } = useStore() // Get auth token
  const [patients, setPatients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [isAddPatientOpen, setIsAddPatientOpen] = useState(false)
  const [newPatient, setNewPatient] = useState({
    username: '',
    email: '',
    password: '',
    phone: '',
    city: ''
  })
  const [editingPatient, setEditingPatient] = useState<any>(null)

  useEffect(() => {
    const fetchPatients = async () => {
      if (!authToken) return
      setLoading(true)
      try {
        const res = await fetch(`${API_BASE_URL}/api/admin/patients?page=${page}&limit=10`, {
          headers: { Authorization: `Bearer ${authToken}` }
        })
        if (res.ok) {
          const data = await res.json()
          setPatients(data.users || [])
          setTotalPages(data.pages || 1)
        }
      } catch (error) {
        console.error("Failed to fetch patients")
      } finally {
        setLoading(false)
      }
    }
    fetchPatients()
  }, [authToken, page])

  const filteredPatients = searchItems(patients, searchTerm, ["username", "email"])

  const handleAddPatient = async () => {
    if (!newPatient.username || !newPatient.email || !newPatient.password || !newPatient.phone) {
      toast.error("Please fill in all required fields")
      return
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/patients`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(newPatient)
      })

      if (res.ok) {
        const data = await res.json()
        setPatients([...patients, data.user])
        setIsAddPatientOpen(false)
        setNewPatient({ username: '', email: '', password: '', phone: '', city: '' })
      } else {
        const err = await res.json()
        toast.error("Failed to add patient: " + (err.error || "Unknown error"))
      }
    } catch (error) {
      console.error("Failed to add patient")
      toast.error("Failed to add patient")
    }
  }

  const handleDeletePatient = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to permanently delete patient ${name}?`)) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/admin/patients/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        });

        if (res.ok) {
          setPatients(patients.filter(p => p.id !== id));
        } else {
          const err = await res.json();
          toast.error("Failed to delete patient: " + (err.error || "Unknown error"));
        }
      } catch (error) {
        console.error("Failed to delete patient", error);
        toast.error("Failed to delete patient");
      }
    }
  };

  return (
    <div className="flex">
      <AdminSidebar />
      <div className="flex-1 md:ml-64 transition-all duration-300">
        <AdminNavbar />
        <main className="p-4 md:p-8 bg-slate-50 dark:bg-slate-950 min-h-screen">
          <div className="max-w-7xl mx-auto space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Manage Patients</h1>
                <p className="text-slate-600 dark:text-slate-400 mt-1">View and manage all patients</p>
              </div>
              <Button
                onClick={() => setIsAddPatientOpen(true)}
                className="bg-blue-900 hover:bg-blue-800 gap-2 w-full md:w-auto"
              >
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
                      {loading ? (
                        <tr><td colSpan={6} className="text-center py-4">Loading...</td></tr>
                      ) : filteredPatients.map((patient) => (
                        <tr
                          key={patient.id}
                          className="border-b border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800"
                        >
                          <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                            <Link href={`/admin/patients/${patient.id}`} className="hover:text-blue-700 dark:hover:text-blue-400 hover:underline cursor-pointer">
                              {patient.username}
                            </Link>
                          </td>
                          <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{patient.email}</td>
                          <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{patient.phone}</td>
                          <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{patient.city}</td>
                          <td className="px-6 py-4">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-medium ${patient.status === "active"
                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
                                }`}
                            >
                              {patient.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 flex gap-2">
                            <Link href={`/admin/patients/${patient.id}`}>
                              <button className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded" title="View patient history">
                                <Eye className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                              </button>
                            </Link>
                            <button
                              className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded"
                              onClick={() => setEditingPatient(patient)}
                            >
                              <Edit className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                            </button>
                            <button
                              className="p-2 hover:bg-red-100 dark:hover:bg-red-900 rounded"
                              onClick={() => handleDeletePatient(patient.id, patient.username)}
                            >
                              <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="flex items-center justify-between mt-4">
                    <Button
                      variant="outline"
                      disabled={page <= 1}
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                    >
                      Previous
                    </Button>
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                      Page {page} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      disabled={page >= totalPages}
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>

      {/* Add Patient Modal */}
      {isAddPatientOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-lg shadow-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4 text-slate-900 dark:text-white">Add New Patient</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-slate-300">Name *</label>
                <Input
                  value={newPatient.username}
                  onChange={(e) => setNewPatient({ ...newPatient, username: e.target.value })}
                  placeholder="Full Name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-slate-300">Email *</label>
                <Input
                  value={newPatient.email}
                  onChange={(e) => setNewPatient({ ...newPatient, email: e.target.value })}
                  placeholder="Email Address"
                  type="email"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-slate-300">Password *</label>
                <Input
                  value={newPatient.password}
                  onChange={(e) => setNewPatient({ ...newPatient, password: e.target.value })}
                  placeholder="Password"
                  type="password"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-slate-300">Phone *</label>
                <Input
                  value={newPatient.phone}
                  onChange={(e) => setNewPatient({ ...newPatient, phone: e.target.value })}
                  placeholder="Phone Number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-slate-300">City</label>
                <Input
                  value={newPatient.city}
                  onChange={(e) => setNewPatient({ ...newPatient, city: e.target.value })}
                  placeholder="City"
                />
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <Button variant="outline" onClick={() => setIsAddPatientOpen(false)}>Cancel</Button>
                <Button
                  className="bg-blue-900 hover:bg-blue-800"
                  onClick={handleAddPatient}
                >
                  Add Patient
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Patient Modal */}
      {editingPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-lg shadow-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4 text-slate-900 dark:text-white">Edit Patient</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-slate-300">Name</label>
                <Input
                  value={editingPatient.username || ''}
                  onChange={(e) => setEditingPatient({ ...editingPatient, username: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-slate-300">Email</label>
                <Input
                  value={editingPatient.email || ''}
                  onChange={(e) => setEditingPatient({ ...editingPatient, email: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-slate-300">Phone</label>
                <Input
                  value={editingPatient.phone || ''}
                  onChange={(e) => setEditingPatient({ ...editingPatient, phone: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-slate-300">City</label>
                <Input
                  value={editingPatient.city || ''}
                  onChange={(e) => setEditingPatient({ ...editingPatient, city: e.target.value })}
                />
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <Button variant="outline" onClick={() => setEditingPatient(null)}>Cancel</Button>
                <Button
                  className="bg-blue-900 hover:bg-blue-800"
                  onClick={async () => {
                    try {
                      const res = await fetch(`${API_BASE_URL}/api/admin/patients/${editingPatient.id}`, {
                        method: 'PUT',
                        headers: {
                          'Content-Type': 'application/json',
                          'Authorization': `Bearer ${authToken}`
                        },
                        body: JSON.stringify(editingPatient)
                      });
                      if (res.ok) {
                        setPatients(patients.map(p => p.id === editingPatient.id ? editingPatient : p));
                        setEditingPatient(null);
                      } else {
                        const err = await res.json();
                        toast.error("Failed to update: " + (err.error || "Unknown error"));
                      }
                    } catch (e) {
                      console.error(e);
                      toast.error("Update failed");
                    }
                  }}
                >
                  Save Changes
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
