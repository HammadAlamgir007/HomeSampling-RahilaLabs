"use client"
import { useState, useEffect } from "react"

import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { AdminNavbar } from "@/components/admin/admin-navbar"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useStore } from "@/lib/store"
import { Plus, Edit, Trash2, Search } from "lucide-react"
import { API_BASE_URL } from "@/lib/api_config"

export default function TestsPage() {
  const { authToken } = useStore()
  const [tests, setTests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  // ── Edit modal state ──────────────────────────────────────────
  const [editingTest, setEditingTest] = useState<any | null>(null)
  const [editForm, setEditForm] = useState({ name: '', price: '', description: '' })
  const [saving, setSaving] = useState(false)
  const [editError, setEditError] = useState('')

  const fetchTests = async () => {
    if (!authToken) return
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/tests`, {
        headers: { Authorization: `Bearer ${authToken}` }
      })
      if (res.ok) {
        const data = await res.json()
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

  const filteredTests = tests.filter(t =>
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.description || '').toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this test?")) return
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/tests/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${authToken}` }
      })
      if (res.ok) fetchTests()
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
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ name, price, description: "New diagnostic test" })
      })
      if (res.ok) fetchTests()
    } catch (error) {
      console.error("Failed to add test")
    }
  }

  const openEdit = (test: any) => {
    setEditingTest(test)
    setEditForm({ name: test.name, price: String(test.price), description: test.description || '' })
    setEditError('')
  }

  const handleSaveEdit = async () => {
    if (!editingTest) return
    if (!editForm.name.trim()) { setEditError('Test name is required.'); return }
    if (!editForm.price || isNaN(Number(editForm.price))) { setEditError('Enter a valid price.'); return }
    setSaving(true)
    setEditError('')
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/tests/${editingTest.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ name: editForm.name, price: Number(editForm.price), description: editForm.description })
      })
      const data = await res.json()
      if (res.ok) {
        setEditingTest(null)
        fetchTests()
      } else {
        setEditError(data.error || 'Failed to save changes.')
      }
    } catch {
      setEditError('Network error. Please try again.')
    } finally {
      setSaving(false)
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

            {/* Search Bar */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-5 h-5 text-slate-400" />
                <Input
                  placeholder="Search by name or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-slate-50 dark:bg-slate-800 border-0"
                />
              </div>
            </div>

            {loading ? <p>Loading...</p> : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTests.length === 0 ? (
                  <div className="col-span-3 text-center py-12 text-slate-500 dark:text-slate-400">
                    {searchTerm ? 'No tests match your search.' : 'No tests found.'}
                  </div>
                ) : filteredTests.map((test) => (
                  <Card
                    key={test.id}
                    className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:shadow-lg transition-shadow"
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-slate-900 dark:text-white truncate">{test.name}</h3>
                          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">{test.description}</p>
                        </div>
                        <div className="flex gap-1 ml-2 shrink-0">
                          <button
                            onClick={() => openEdit(test)}
                            className="p-2 hover:bg-blue-50 dark:hover:bg-blue-900 rounded transition-colors"
                            title="Edit test"
                          >
                            <Edit className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          </button>
                          <button
                            onClick={() => handleDelete(test.id)}
                            className="p-2 hover:bg-red-100 dark:hover:bg-red-900 rounded transition-colors"
                            title="Delete test"
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

      {/* ── Edit Modal ── */}
      {editingTest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-1 text-slate-900 dark:text-white">Edit Test</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Update the details for this diagnostic test</p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5 text-slate-700 dark:text-slate-300">
                  Test Name <span className="text-red-500">*</span>
                </label>
                <Input
                  value={editForm.name}
                  onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                  placeholder="e.g. Complete Blood Count"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5 text-slate-700 dark:text-slate-300">
                  Price (PKR) <span className="text-red-500">*</span>
                </label>
                <Input
                  type="number"
                  min="0"
                  value={editForm.price}
                  onChange={e => setEditForm({ ...editForm, price: e.target.value })}
                  placeholder="e.g. 1500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5 text-slate-700 dark:text-slate-300">
                  Description
                </label>
                <textarea
                  value={editForm.description}
                  onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                  placeholder="Brief description of this test"
                  rows={3}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:bg-slate-800 dark:border-slate-700"
                />
              </div>

              {editError && (
                <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950 px-3 py-2 rounded-lg">
                  {editError}
                </div>
              )}

              <div className="flex justify-end gap-3 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setEditingTest(null)}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveEdit}
                  disabled={saving}
                  className="bg-blue-900 hover:bg-blue-800"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
