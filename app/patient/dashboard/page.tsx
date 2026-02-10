"use client"

import { useState, useEffect } from "react"
import { useStore } from "@/lib/store"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import Link from "next/link"
import { STATUS_COLORS } from "@/lib/constants"
import { API_BASE_URL } from "@/lib/api_config"

export default function DashboardPage() {
  const user = useStore((state) => state.user)
  const authToken = useStore((state) => state.authToken)
  const setBookings = useStore((state) => state.addBooking) // We might need a setBookings method in store, but relying on addBooking in loop or refactoring store
  // Actually, let's use local state for display if store synchronization is complex, OR assume we want to sync store.
  // Best practice: Fetch and set local state or update store.
  // Let's implement a simple fetch and display for now.
  const [localBookings, setLocalBookings] = useState<any[]>([])

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
              userId: b.user_id,
              testId: b.test_id,
              testName: b.test_name,
              status: b.status,
              scheduledDate: new Date(b.date).toLocaleString(),
              address: b.address,
              report_path: b.report_path,
              rider: b.rider // Include rider information
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
        // Remove locally
        setLocalBookings(prev => prev.filter(b => b.id !== bookingId))
        alert("Appointment cancelled successfully.")
      } else {
        const err = await res.json()
        alert(err.error || "Failed to cancel")
      }
    } catch (error) {
      console.error("Cancel error:", error)
      alert("Failed to cancel appointment")
    }
  }

  // Use localBookings instead of store bookings for now to ensure reactivity to live data
  const bookings = localBookings
  const upcomingBookings = bookings.filter((b) => b.status !== "ready")

  if (!user) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Please log in first</h1>
            <Link href="/login" className="text-blue-600 hover:underline font-semibold">
              Go to login
            </Link>
          </div>
        </div>
        <Footer />
      </>
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
              <p className="text-gray-600 dark:text-slate-400">Manage your health tests and bookings</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <div className="bg-white dark:bg-slate-900 dark:border dark:border-slate-800 rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Total Bookings</h3>
                <p className="text-4xl font-bold text-blue-600">{bookings.length}</p>
              </div>
              <div className="bg-white dark:bg-slate-900 dark:border dark:border-slate-800 rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Upcoming Tests</h3>
                <p className="text-4xl font-bold text-yellow-600">{upcomingBookings.length}</p>
              </div>
              <div className="bg-white dark:bg-slate-900 dark:border dark:border-slate-800 rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Ready Reports</h3>
                <p className="text-4xl font-bold text-green-600">
                  {bookings.filter((b) => b.status === "ready").length}
                </p>
              </div>
            </div>

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
                    <div key={booking.id} className="border border-gray-200 dark:border-slate-800 rounded-lg p-4 hover:shadow-md transition bg-slate-50 dark:bg-slate-950/50">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-gray-100">{booking.testName}</h3>
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

            {/* Completed / Reports Section */}
            <div className="bg-white dark:bg-slate-900 dark:border dark:border-slate-800 rounded-lg shadow-lg p-8 mb-12">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Your Reports</h2>
              {bookings.filter(b => b.status === "completed" || b.status === "ready").length === 0 ? (
                <p className="text-gray-600 dark:text-slate-400">No reports available yet.</p>
              ) : (
                <div className="space-y-4">
                  {bookings.filter(b => b.status === "completed" || b.status === "ready").map((booking) => (
                    <div key={booking.id} className="border border-green-200 dark:border-green-900 rounded-lg p-4 bg-green-50 dark:bg-green-900/20 flex justify-between items-center">
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100">{booking.testName}</h3>
                        <p className="text-sm text-gray-600 dark:text-slate-400">{booking.scheduledDate}</p>
                      </div>
                      <div>
                        <a
                          href={`${API_BASE_URL}/api/patient/reports/${booking.report_path || `report_${booking.id}_file.pdf`}`}
                          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm font-medium inline-block"
                          onClick={(e) => {
                            e.preventDefault();
                            if (!booking.report_path) { alert("Report generating..."); return; }
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
                              .catch(err => alert("Failed to download report."));
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
