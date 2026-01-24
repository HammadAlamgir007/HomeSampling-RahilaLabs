"use client"

import { useStore } from "@/lib/store"
import { useEffect, useState } from "react"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { AdminNavbar } from "@/components/admin/admin-navbar"
import { StatCardAdmin } from "@/components/admin/stat-card-admin"
import { AppointmentsTable } from "@/components/admin/appointments-table"
import { Users, TestTube, FileText, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const monthlyData = [
  { month: "Jan", patients: 400, tests: 240 },
  { month: "Feb", patients: 300, tests: 221 },
  { month: "Mar", patients: 200, tests: 229 },
  { month: "Apr", patients: 278, tests: 200 },
  { month: "May", patients: 189, tests: 220 },
  { month: "Jun", patients: 239, tests: 250 },
]

export default function AdminDashboard() {
  const { authToken } = useStore()
  const [recentActivity, setRecentActivity] = useState<any[]>([])
  const [appointments, setAppointments] = useState<any[]>([])
  const [stats, setStats] = useState({
    total_patients: 0,
    total_tests: 0,
    pending_bookings: 0,
    total_bookings: 0,
    revenue: 0
  })

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!authToken) return

      try {
        // Fetch Stats
        const statsRes = await fetch("http://localhost:5000/api/admin/stats", {
          headers: { Authorization: `Bearer ${authToken}` }
        })

        if (statsRes.status === 401 || statsRes.status === 403) {
          // Invalid token or unauthorized
          window.location.href = '/admin/login'
          return
        }

        if (statsRes.ok) {
          setStats(await statsRes.json())
        }

        // Fetch Recent Activity
        const activityRes = await fetch("http://localhost:5000/api/admin/activity", {
          headers: { Authorization: `Bearer ${authToken}` }
        })
        if (activityRes.ok) {
          setRecentActivity(await activityRes.json())
        }

        // Fetch Recent Appointments
        const appointmentsRes = await fetch("http://localhost:5000/api/admin/appointments", {
          headers: { Authorization: `Bearer ${authToken}` }
        })
        if (appointmentsRes.ok) {
          setAppointments(await appointmentsRes.json())
        }

      } catch (error) {
        console.error("Failed to fetch dashboard data")
      }
    }

    fetchDashboardData()
    // Poll every 5 seconds for real-time updates
    const interval = setInterval(fetchDashboardData, 5000)
    return () => clearInterval(interval)
  }, [authToken])

  const totalPatients = stats.total_patients
  const totalTests = stats.total_tests
  const pendingReports = stats.pending_bookings
  const todayAppointments = stats.total_bookings

  return (
    <div className="flex">
      <AdminSidebar />
      <div className="flex-1 md:ml-64">
        <AdminNavbar />
        <main className="p-8 bg-slate-50 dark:bg-slate-950 min-h-screen">
          <div className="max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Dashboard</h1>
              <p className="text-slate-600 dark:text-slate-400 mt-1">Welcome back, Dr. Rahila!</p>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCardAdmin
                icon={Users}
                label="Total Patients"
                value={totalPatients}
                change="12"
                changeType="positive"
              />
              <StatCardAdmin icon={TestTube} label="Total Tests" value={totalTests} change="8" changeType="positive" />
              <StatCardAdmin
                icon={FileText}
                label="Pending Bookings"
                value={pendingReports}
                change="5"
                changeType="negative"
              />
              <StatCardAdmin
                icon={Calendar}
                label="Today's Appointments"
                value={todayAppointments}
                change="3"
                changeType="positive"
              />
            </div>

            {/* Charts */}
            <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
              <CardHeader>
                <CardTitle>Monthly Activity</CardTitle>
                <CardDescription>Patients and tests over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="month" stroke="#64748b" />
                    <YAxis stroke="#64748b" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1e293b",
                        border: "1px solid #475569",
                        borderRadius: "8px",
                      }}
                      labelStyle={{ color: "#fff" }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="patients" stroke="#1e3a8a" name="Patients" />
                    <Line type="monotone" dataKey="tests" stroke="#dc2626" name="Tests" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Appointments Table */}
            <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
              <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <CardTitle>Recent Appointments</CardTitle>
                    <CardDescription>Upcoming and recent bookings</CardDescription>
                  </div>
                  <Button className="bg-blue-900 hover:bg-blue-800 w-full md:w-auto">New Appointment</Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <AppointmentsTable appointments={appointments} />
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {recentActivity.length > 0 ? (
                    recentActivity.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between py-3 border-b border-slate-200 dark:border-slate-800 last:border-0"
                      >
                        <p className="text-slate-700 dark:text-slate-300">{item.action}</p>
                        <span className="text-xs text-slate-500 dark:text-slate-400">{item.time}</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-slate-500 py-4">No recent activity</div>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button variant="outline" className="w-full justify-start bg-transparent">
                    Upload Report
                  </Button>
                  <Button variant="outline" className="w-full justify-start bg-transparent">
                    Add Patient
                  </Button>
                  <Button variant="outline" className="w-full justify-start bg-transparent">
                    Schedule Appointment
                  </Button>
                  <Button variant="outline" className="w-full justify-start bg-transparent">
                    Create Test Package
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
