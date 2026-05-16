"use client"
import { useState, useEffect, useMemo } from "react"

import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { AdminNavbar } from "@/components/admin/admin-navbar"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useStore } from "@/lib/store"
import { Plus, Edit, Trash2, Search, Filter } from "lucide-react"
import { API_BASE_URL } from "@/lib/api_config"

export default function TestsPage() {
  const { authToken } = useStore()
  const [tests, setTests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('All')

  // ── Modal state ──────────────────────────────────────────
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [currentTestId, setCurrentTestId] = useState<number | null>(null)

  const initialFormState = {
    name: '',
    code: '',
    category: '',
    price: '',
    specimen: '',
    reporting_time: '',
    description: ''
  }
  const [form, setForm] = useState(initialFormState)
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
        setTests(data)
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

  const categories = useMemo(() => {
    const cats = new Set(tests.map(t => t.category).filter(Boolean))
    return ['All', ...Array.from(cats).sort()]
  }, [tests])

  const filteredTests = tests.filter(t => {
    const matchesSearch =
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.code || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = selectedCategory === 'All' || t.category === selectedCategory;

    return matchesSearch && matchesCategory;
  })

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

  const openAdd = () => {
    setIsEditing(false)
    setCurrentTestId(null)
    setForm(initialFormState)
    setEditError('')
    setIsModalOpen(true)
  }

  const openEdit = (test: any) => {
    setIsEditing(true)
    setCurrentTestId(test.id)
    setForm({
      name: test.name || '',
      code: test.code || '',
      category: test.category || '',
      price: String(test.price),
      specimen: test.specimen || '',
      reporting_time: test.reporting_time || '',
      description: test.description || ''
    })
    setEditError('')
    setIsModalOpen(true)
  }

  const handleSave = async () => {
    if (!form.name.trim()) { setEditError('Test name is required.'); return }
    if (!form.price || isNaN(Number(form.price))) { setEditError('Enter a valid price.'); return }

    setSaving(true)
    setEditError('')

    const url = isEditing
      ? `${API_BASE_URL}/api/admin/tests/${currentTestId}`
      : `${API_BASE_URL}/api/admin/tests`;

    const method = isEditing ? 'PUT' : 'POST';

    const payload = {
      name: form.name,
      code: form.code,
      category: form.category,
      specimen: form.specimen,
      reporting_time: form.reporting_time,
      price: Number(form.price),
      description: form.description
    }

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
        body: JSON.stringify(payload)
      })
      const data = await res.json()
      if (res.ok) {
        setIsModalOpen(false)
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
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Manage Catalog</h1>
                <p className="text-slate-600 dark:text-slate-400 mt-1">Manage tests, rates, and categories ({tests.length} total)</p>
              </div>
              <Button onClick={openAdd} className="bg-blue-900 hover:bg-blue-800 gap-2 w-full md:w-auto">
                <Plus className="w-4 h-4" />
                Add Test
              </Button>
            </div>

            {/* Toolbar */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 w-5 h-5 text-slate-400" />
                <Input
                  placeholder="Search by test name or code..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-slate-50 dark:bg-slate-800 border-0"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-slate-400" />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="p-2 border rounded-md bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 w-full md:w-64"
                >
                  {categories.map(cat => (
                    <option key={cat as string} value={cat as string}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-12"><p className="text-slate-500">Loading catalog...</p></div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredTests.length === 0 ? (
                  <div className="col-span-full text-center py-12 text-slate-500">
                    No tests match your filters.
                  </div>
                ) : filteredTests.map((test) => (
                  <Card key={test.id} className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 flex flex-col hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          {test.category && (
                            <span className="text-[10px] uppercase font-bold text-blue-600 tracking-wider">
                              {test.category}
                            </span>
                          )}
                          <h3 className="font-bold text-slate-900 dark:text-white leading-tight mt-1" title={test.name}>
                            {test.name}
                          </h3>
                        </div>
                        <div className="flex shrink-0">
                          <button onClick={() => openEdit(test)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-500 hover:text-blue-600">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(test.id)} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-950/30 rounded text-slate-500 hover:text-red-600">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2 mt-auto text-sm pt-2">
                      <div className="flex justify-between border-b pb-2 border-slate-100 dark:border-slate-800">
                        <span className="text-slate-500 dark:text-slate-400">Code</span>
                        <span className="font-medium font-mono">{test.code || '—'}</span>
                      </div>
                      <div className="flex justify-between border-b pb-2 border-slate-100 dark:border-slate-800">
                        <span className="text-slate-500 dark:text-slate-400">Specimen</span>
                        <span className="font-medium text-right max-w-[60%] truncate" title={test.specimen}>
                          {test.specimen || '—'}
                        </span>
                      </div>
                      <div className="flex justify-between border-b pb-2 border-slate-100 dark:border-slate-800">
                        <span className="text-slate-500 dark:text-slate-400">Report Time</span>
                        <span className="font-medium">{test.reporting_time || '—'}</span>
                      </div>
                      <div className="flex justify-between pt-1">
                        <span className="text-slate-500 dark:text-slate-400">Price</span>
                        <span className="font-bold text-blue-700 dark:text-blue-400">PKR {test.price}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* ── Modal ── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-lg p-6 my-auto">
            <h2 className="text-xl font-bold mb-1 text-slate-900 dark:text-white">
              {isEditing ? 'Edit Test' : 'Add New Test'}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
              {isEditing ? 'Update test details.' : 'Enter new catalog test details.'}
            </p>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1.5">Test Name *</label>
                <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. CBC" />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1.5">Test Code</label>
                <Input value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} placeholder="e.g. 1001" />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1.5">Price (PKR) *</label>
                <Input type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} placeholder="e.g. 1500" />
              </div>

              <div className="col-span-2">
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1.5">Category</label>
                <Input value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} placeholder="e.g. Hematology" />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1.5">Specimen</label>
                <Input value={form.specimen} onChange={e => setForm({ ...form, specimen: e.target.value })} placeholder="e.g. Blood" />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1.5">Reporting Time</label>
                <Input value={form.reporting_time} onChange={e => setForm({ ...form, reporting_time: e.target.value })} placeholder="e.g. Same day" />
              </div>

              {editError && (
                <div className="col-span-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                  {editError}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" onClick={() => setIsModalOpen(false)} disabled={saving}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving} className="bg-blue-900 hover:bg-blue-800">
                {saving ? 'Saving...' : 'Save Test'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
