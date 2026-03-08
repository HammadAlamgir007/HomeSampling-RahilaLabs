"use client"

import { useState, useEffect } from "react"
import { useStore } from "@/lib/store"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import Link from "next/link"
import { STATUS_COLORS } from "@/lib/constants"
import { API_BASE_URL } from "@/lib/api_config"

import { useRouter } from "next/navigation"
import { toast } from "react-toastify"
import { ClipboardList, CalendarClock, FileCheck2 } from "lucide-react"

export default function DashboardPage() {
  const router = useRouter()
  const user = useStore((state) => state.user)
  const authToken = useStore((state) => state.authToken)
  const setBookings = useStore((state) => state.addBooking)

  const [hasHydrated, setHasHydrated] = useState(false)
  const [localBookings, setLocalBookings] = useState<any[]>([])

  useEffect(() => {
    setHasHydrated(true)
  }, [])

  useEffect(() => {
    if (authToken) {
      fetch(`${API_BASE_URL}/api/patient/bookings`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      })
        .then(async (res) => {
          if (res.status === 401 || res.status === 403) {
            window.location.href = '/login'
            return
          }
          if (res.ok) {
            const data = await res.json()
            // Map backend format to frontend format
            const formatted = data.map((b: any) => ({
              id: b.id,
              bookingOrderId: b.booking_order_id,
              userId: b.user_id,
              testId: b.test_id,
              testName: b.test_name,
              status: b.status,
              scheduledDate: new Date(b.date).toLocaleString(),
              address: b.address,
              report_path: b.report_path,  // key field for Ready Reports
              rider: b.rider
            }))
            setLocalBookings(formatted)
          }
        })
        .catch(err => console.error(err))
    }
  }, [authToken])

  const handleCancel = async (bookingId: string) => {
    if (!authToken) return;
    if (!confirm("Are you sure you want to cancel this appointment?")) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/patient/bookings/${bookingId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      })

      if (res.ok) {
        setLocalBookings(prev => prev.filter(b => b.id !== bookingId))
        toast.success("Appointment cancelled successfully.")
      } else {
        const err = await res.json()
        toast.error(err.error || "Failed to cancel")
      }
    } catch (error) {
      console.error("Cancel error:", error)
      toast.error("Failed to cancel appointment")
    }
  }

  const bookings = localBookings

  // Ready Reports: any booking with an uploaded report_path
  const readyReports = bookings.filter((b) => b.report_path)

  // Upcoming: exclude completed, cancelled, and anything with a report ready
  const upcomingBookings = bookings.filter(
    (b) => b.status !== "ready" && b.status !== "completed" && b.status !== "cancelled"
  )

  // Redirect unauthenticated users
  useEffect(() => {
    if (hasHydrated && (!user || !authToken)) {
      document.cookie = "patient_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      window.location.href = "/login"
    }
  }, [user, authToken, hasHydrated])

  if (!hasHydrated || !user || !authToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500 font-medium">Redirecting to secure login...</p>
      </div>
    )
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-slate-950 dark:to-slate-900 transition-colors duration-300">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-6xl mx-auto">
            <div className="mb-8 mt-4 md:mt-0">
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Welcome, {user.name}!</h1>
              <p className="text-gray-600 dark:text-slate-400">
                <span className="font-semibold text-blue-600 mr-4">MRN: {user.mrn || "Pending"}</span>
                Manage your health tests and bookings
              </p>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <div className="bg-white dark:bg-slate-900 dark:border dark:border-slate-800 rounded-2xl shadow-sm hover:shadow-md transition-all p-6 border border-slate-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300">Total Bookings</h3>
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-full">
                    <ClipboardList className="w-6 h-6" />
                  </div>
                </div>
                <p className="text-4xl font-extrabold text-slate-900 dark:text-white">{bookings.length}</p>
              </div>

              <div className="bg-white dark:bg-slate-900 dark:border dark:border-slate-800 rounded-2xl shadow-sm hover:shadow-md transition-all p-6 border border-slate-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300">Upcoming Tests</h3>
                  <div className="p-3 bg-yellow-50 dark:bg-yellow-900/40 text-yellow-600 dark:text-yellow-400 rounded-full">
                    <CalendarClock className="w-6 h-6" />
                  </div>
                </div>
                <p className="text-4xl font-extrabold text-slate-900 dark:text-white">{upcomingBookings.length}</p>
              </div>

              <div className="bg-white dark:bg-slate-900 dark:border dark:border-slate-800 rounded-2xl shadow-sm hover:shadow-md transition-all p-6 border border-slate-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300">Ready Reports</h3>
                  <div className="p-3 bg-green-50 dark:bg-green-900/40 text-green-600 dark:text-green-400 rounded-full">
                    <FileCheck2 className="w-6 h-6" />
                  </div>
                </div>
                <p className="text-4xl font-extrabold text-slate-900 dark:text-white">
                  {readyReports.length}
                </p>
              </div>
            </div>

            {/* Upcoming Appointments */}
            <div className="bg-white dark:bg-slate-900 dark:border dark:border-slate-800 rounded-lg shadow-lg p-8 mb-12">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Upcoming Appointments</h2>
                <Link
                  href="/patient/book-test"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition"
                >
                  Book New Test
                </Link>
              </div>

              {upcomingBookings.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600 dark:text-slate-400 mb-4">No upcoming appointments</p>
                  <Link href="/patient/book-test" className="text-blue-600 hover:underline font-semibold">
                    Book your first test
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {upcomingBookings.map((booking) => (
                    <div key={booking.id} className="border border-slate-100 dark:border-slate-800 rounded-2xl p-6 hover:shadow-md hover:bg-slate-50 transition-all bg-white dark:bg-slate-900/50">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-gray-900 dark:text-gray-100">{booking.testName}</h3>
                            {booking.bookingOrderId && (
                              <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-0.5 rounded dark:bg-blue-900 dark:text-blue-300">
                                {booking.bookingOrderId}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 dark:text-slate-400">Scheduled: {booking.scheduledDate}</p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[booking.status]}`}
                          >
                            {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                          </span>
                          {booking.status === 'pending' && (
                            <button
                              onClick={() => handleCancel(booking.id)}
                              className="text-xs text-red-600 hover:text-red-800 hover:underline"
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-slate-400">Address: {booking.address}</p>
                      {booking.rider && (
                        <div className="mt-2 pt-2 border-t border-gray-200 dark:border-slate-700">
                          <p className="text-sm text-gray-700 dark:text-slate-300">
                            <span className="font-semibold">Rider Assigned:</span> {booking.rider.name}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-slate-400">
                            Phone: {booking.rider.phone}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Your Reports Section */}
            <div className="bg-white dark:bg-slate-900 dark:border dark:border-slate-800 rounded-lg shadow-lg p-8 mb-12">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Your Reports</h2>
              {readyReports.length === 0 ? (
                <p className="text-gray-600 dark:text-slate-400">No reports available yet.</p>
              ) : (
                <div className="space-y-4">
                  {readyReports.map((booking) => (
                    <div key={booking.id} className="border border-green-200 dark:border-green-900 rounded-lg p-4 bg-green-50 dark:bg-green-900/20 flex justify-between items-center">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-gray-900 dark:text-gray-100">{booking.testName}</h3>
                          {booking.bookingOrderId && (
                            <span className="bg-green-100 text-green-800 text-xs font-semibold px-2 py-0.5 rounded dark:bg-green-900 dark:text-green-300">
                              {booking.bookingOrderId}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-slate-400">{booking.scheduledDate}</p>
                      </div>
                      <div>
                        <a
                          href="#"
                          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm font-medium inline-block"
                          onClick={(e) => {
                            e.preventDefault();
                            if (!booking.report_path) { toast.info("Report generating..."); return; }
                            fetch(`${API_BASE_URL}/api/patient/reports/${booking.report_path}`, {
                              headers: { Authorization: `Bearer ${authToken}` }
                            })
                              .then(res => {
                                if (res.ok) return res.blob();
                                throw new Error("Download failed");
                              })
                              .then(blob => {
                                const url = window.URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = booking.report_path.split('_').slice(2).join('_');
                                a.click();
                              })
                              .catch(() => toast.error("Failed to download report."));
                          }}
                        >
                          Download Report
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
