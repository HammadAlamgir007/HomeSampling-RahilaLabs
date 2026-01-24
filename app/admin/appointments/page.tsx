"use client"
import { useState, useEffect } from "react"

import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { AdminNavbar } from "@/components/admin/admin-navbar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useStore } from "@/lib/store"
import { AppointmentsTable } from "@/components/admin/appointments-table"
import { Plus } from "lucide-react"

export default function AppointmentsPage() {
  const { authToken } = useStore()
  const [appointments, setAppointments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchAppointments = async () => {
    if (!authToken) return
    try {
      const res = await fetch("http://localhost:5000/api/admin/appointments", {
        headers: { Authorization: `Bearer ${authToken}` }
      })
      if (res.ok) {
        const data = await res.json()
        setAppointments(data)
      }
    } catch (error) {
      console.error("Failed to fetch appointments")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAppointments()
  }, [authToken])

  const handleStatusUpdate = async (id: number, newStatus: string) => {
    try {
      const res = await fetch(`http://localhost:5000/api/admin/appointments/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({ status: newStatus })
      })
      if (res.ok) {
        fetchAppointments() // Refresh list
      }
    } catch (error) {
      console.error("Failed to update status")
    }
  }

  return (
    <div className="flex">
      <AdminSidebar />
      <div className="flex-1 ml-64">
        <AdminNavbar />
        <main className="p-8 bg-slate-50 dark:bg-slate-950 min-h-screen">
          <div className="max-w-7xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Appointments</h1>
                <p className="text-slate-600 dark:text-slate-400 mt-1">Manage all appointments and bookings</p>
              </div>
              <Button className="bg-blue-900 hover:bg-blue-800 gap-2">
                <Plus className="w-4 h-4" />
                New Appointment
              </Button>
            </div>

            <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
              <CardHeader>
                <CardTitle>All Appointments</CardTitle>
                <CardDescription>Total: {appointments.length} appointments</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? <p>Loading...</p> : (
                  <AppointmentsTable
                    appointments={appointments}
                    onStatusUpdate={handleStatusUpdate}
                  />
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}
