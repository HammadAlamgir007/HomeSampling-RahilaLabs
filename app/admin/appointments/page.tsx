"use client"
import { useState, useEffect } from "react"

import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { AdminNavbar } from "@/components/admin/admin-navbar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useStore } from "@/lib/store"
import { AppointmentsTable } from "@/components/admin/appointments-table"
import { Plus } from "lucide-react"
import { API_BASE_URL } from "@/lib/api_config"

export default function AppointmentsPage() {
  const { authToken } = useStore()
  const [appointments, setAppointments] = useState<any[]>([])
  const [riders, setRiders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const fetchAppointments = async () => {
    if (!authToken) return
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/appointments?page=${page}&limit=10`, {
        headers: { Authorization: `Bearer ${authToken}` }
      })

      if (res.status === 401 || res.status === 403) {
        window.location.href = '/admin/login'
        return
      }

      if (res.ok) {
        const data = await res.json()
        console.log("Admin Appointments Response:", data)
        setAppointments(Array.isArray(data.appointments) ? data.appointments : [])
        setTotalPages(data.pages || 1)
      }
    } catch (error) {
      console.error("Failed to fetch appointments")
    } finally {
      setLoading(false)
    }
  }

  const fetchRiders = async () => {
    if (!authToken) return
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/riders`, {
        headers: { Authorization: `Bearer ${authToken}` }
      })

      if (res.ok) {
        const data = await res.json()
        setRiders(data.riders || [])
      }
    } catch (error) {
      console.error("Failed to fetch riders")
    }
  }

  useEffect(() => {
    fetchAppointments()
    fetchRiders()
  }, [authToken, page])

  const handleStatusUpdate = async (id: number, newStatus: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/appointments/${id}/status`, {
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

  const handleRiderAssignment = async (appointmentId: number, riderId: number) => {
    try {
      console.log('Assigning rider:', { appointmentId, riderId, authToken: authToken ? 'exists' : 'missing' })

      const res = await fetch(`${API_BASE_URL}/api/admin/appointments/${appointmentId}/assign-rider`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({ rider_id: riderId })
      })

      console.log('Response status:', res.status)

      if (res.ok) {
        fetchAppointments() // Refresh list
        return { success: true, message: 'Rider assigned successfully!' }
      } else {
        const error = await res.json()
        console.error('Assignment error:', error)
        return { success: false, message: error.error || 'Failed to assign rider' }
      }
    } catch (error) {
      console.error('Network error:', error)
      return { success: false, message: `Network error: ${error instanceof Error ? error.message : 'Please try again.'}` }
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
                  <>
                    <AppointmentsTable
                      appointments={appointments}
                      riders={riders}
                      onStatusUpdate={handleStatusUpdate}
                      onRiderAssignment={handleRiderAssignment}
                    />
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
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}
