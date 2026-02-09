"use client"
import { useState, useEffect } from "react"

import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { AdminNavbar } from "@/components/admin/admin-navbar"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useStore } from "@/lib/store"
import { Plus, Edit, Trash2 } from "lucide-react"
import { API_BASE_URL } from "@/lib/api_config"

export default function TestsPage() {
  const { authToken } = useStore()
  const [tests, setTests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchTests = async () => {
    if (!authToken) return
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/tests`, {
        headers: { Authorization: `Bearer ${authToken}` }
      })
      if (res.ok) {
        const data = await res.json()
        // Ensure sampleType and turnaroundTime exist or default them (as backend might not have them yet)
        setTests(data.map((t: any) => ({
          ...t,
          sampleType: t.sampleType || "Blood",
          turnaroundTime: t.turnaroundTime || "24 Hours"
        })))
      }
    } catch (error) {
      console.error("Failed to fetch tests")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTests()
  }, [authToken])

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this test?")) return

    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/tests/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${authToken}` }
      })
      if (res.ok) {
        fetchTests()
      }
    } catch (error) {
      console.error("Failed to delete test")
    }
  }

  const handleAddTest = async () => {
    const name = prompt("Enter Test Name:")
    const price = prompt("Enter Price (PKR):")
    if (!name || !price) return

    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/tests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({ name, price, description: "New diagnostic test" })
      })
      if (res.ok) {
        fetchTests()
      }
    } catch (error) {
      console.error("Failed to add test")
    }
  }

  return (
    <div className="flex">
      <AdminSidebar />
      <div className="flex-1 md:ml-64 transition-all duration-300">
        <AdminNavbar />
        <main className="p-4 md:p-8 bg-slate-50 dark:bg-slate-950 min-h-screen">
          <div className="max-w-7xl mx-auto space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Manage Tests</h1>
                <p className="text-slate-600 dark:text-slate-400 mt-1">Manage available diagnostic tests</p>
              </div>
              <Button onClick={handleAddTest} className="bg-blue-900 hover:bg-blue-800 gap-2 w-full md:w-auto">
                <Plus className="w-4 h-4" />
                Add Test
              </Button>
            </div>

            {loading ? <p>Loading...</p> : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tests.map((test) => (
                  <Card
                    key={test.id}
                    className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:shadow-lg transition-shadow"
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-bold text-slate-900 dark:text-white">{test.name}</h3>
                          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{test.description}</p>
                        </div>
                        <div className="flex gap-2">
                          <button className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded">
                            <Edit className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                          </button>
                          <button
                            onClick={() => handleDelete(test.id)}
                            className="p-2 hover:bg-red-100 dark:hover:bg-red-900 rounded"
                          >
                            <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                          </button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-600 dark:text-slate-400">Price:</span>
                        <span className="font-bold text-blue-900 dark:text-blue-400">PKR {test.price}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-600 dark:text-slate-400">Sample:</span>
                        <span className="text-sm font-medium text-slate-900 dark:text-white">{test.sampleType}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-600 dark:text-slate-400">Turnaround:</span>
                        <span className="text-sm font-medium text-slate-900 dark:text-white">{test.turnaroundTime}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
