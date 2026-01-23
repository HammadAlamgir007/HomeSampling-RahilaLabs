"use client"

import { useState, useEffect } from "react"
import { useStore } from "@/lib/store"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import Link from "next/link"
import { STATUS_COLORS } from "@/lib/constants"

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
      fetch('http://localhost:5000/api/patient/bookings', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      })
        .then(res => res.json())
        .then(data => {
          // Map backend format to frontend format
          const formatted = data.map((b: any) => ({
            id: b.id,
            userId: b.user_id,
            testId: b.test_id,
            testName: b.test_name,
            status: b.status,
            scheduledDate: new Date(b.date).toLocaleString(),
            address: b.address
          }))
          setLocalBookings(formatted)
        })
        .catch(err => console.error(err))
    }
  }, [authToken])

  const handleCancel = async (bookingId: string) => {
    if (!authToken) return;
    if (!confirm("Are you sure you want to cancel this appointment?")) return;

    try {
      const res = await fetch(`http://localhost:5000/api/patient/bookings/${bookingId}`, {
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
      <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-6xl mx-auto">
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Welcome, {user.name}!</h1>
              <p className="text-gray-600">Manage your health tests and bookings</p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mb-12">
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Bookings</h3>
                <p className="text-4xl font-bold text-blue-600">{bookings.length}</p>
              </div>
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Upcoming Tests</h3>
                <p className="text-4xl font-bold text-yellow-600">{upcomingBookings.length}</p>
              </div>
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Ready Reports</h3>
                <p className="text-4xl font-bold text-green-600">
                  {bookings.filter((b) => b.status === "ready").length}
                </p>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-8 mb-12">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Upcoming Appointments</h2>
                <Link
                  href="/patient/book-test"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition"
                >
                  Book New Test
                </Link>
              </div>

              {upcomingBookings.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600 mb-4">No upcoming appointments</p>
                  <Link href="/patient/book-test" className="text-blue-600 hover:underline font-semibold">
                    Book your first test
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {upcomingBookings.map((booking) => (
                    <div key={booking.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-semibold text-gray-900">{booking.testName}</h3>
                          <p className="text-sm text-gray-600">Scheduled: {booking.scheduledDate}</p>
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
                      <p className="text-sm text-gray-600">Address: {booking.address}</p>
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
