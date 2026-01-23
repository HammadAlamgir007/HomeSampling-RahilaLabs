"use client"

import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { AdminNavbar } from "@/components/admin/admin-navbar"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useStore } from "@/lib/store"
import { Plus, Edit, Trash2 } from "lucide-react"

export default function TestsPage() {
  const { tests } = useStore()

  return (
    <div className="flex">
      <AdminSidebar />
      <div className="flex-1 ml-64">
        <AdminNavbar />
        <main className="p-8 bg-slate-50 dark:bg-slate-950 min-h-screen">
          <div className="max-w-7xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Manage Tests</h1>
                <p className="text-slate-600 dark:text-slate-400 mt-1">Manage available diagnostic tests</p>
              </div>
              <Button className="bg-blue-900 hover:bg-blue-800 gap-2">
                <Plus className="w-4 h-4" />
                Add Test
              </Button>
            </div>

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
                        <button className="p-2 hover:bg-red-100 dark:hover:bg-red-900 rounded">
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
          </div>
        </main>
      </div>
    </div>
  )
}
