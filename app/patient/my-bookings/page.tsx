"use client"

import { useStore } from "@/lib/store"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import Link from "next/link"
import { STATUS_COLORS } from "@/lib/constants"
import { Input } from "@/components/ui/input"
import { useState } from "react"
import { searchItems, filterByStatus } from "@/lib/search-utils"
import { Search, Download, Printer as Print } from "lucide-react"
import { exportToCSV, printContent } from "@/lib/export-utils"

export default function MyBookingsPage() {
  const user = useStore((state) => state.user)
  const bookings = useStore((state) => state.bookings)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  if (!user) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Please log in first</h1>
          </div>
        </div>
        <Footer />
      </>
    )
  }

  const userBookings = bookings.filter((b) => b.userId === user.id)

  let filteredBookings = searchItems(userBookings, searchTerm, ["testName", "address"])
  filteredBookings = filterByStatus(filteredBookings, statusFilter)

  const handleExportCSV = () => {
    const data = filteredBookings.map((b) => ({
      testName: b.testName,
      status: b.status,
      scheduledDate: b.scheduledDate,
      address: b.address,
    }))
    exportToCSV(data, "my-bookings.csv")
  }

  const handlePrint = () => {
    printContent("bookings-table")
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-slate-950 dark:to-slate-900">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-6xl mx-auto">
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">My Bookings</h1>
              <p className="text-gray-600 dark:text-slate-400">Track all your test bookings and results</p>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-lg shadow-lg p-6 mb-8 space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <Input
                  placeholder="Search by test name or address..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-gray-50 dark:bg-slate-800 border-gray-300 dark:border-slate-700"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setStatusFilter("all")}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    statusFilter === "all"
                      ? "bg-blue-900 text-white"
                      : "bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700"
                  }`}
                >
                  All
                </button>
                {["pending", "approved", "collected", "ready"].map((status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`px-4 py-2 rounded-lg font-medium transition ${
                      statusFilter === status
                        ? "bg-blue-900 text-white"
                        : "bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700"
                    }`}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </button>
                ))}
              </div>

              <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-slate-700">
                <button
                  onClick={handleExportCSV}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition"
                >
                  <Download className="w-4 h-4" />
                  Export CSV
                </button>
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
                >
                  <Print className="w-4 h-4" />
                  Print
                </button>
              </div>
            </div>

            {filteredBookings.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 rounded-lg shadow-lg p-12 text-center">
                <p className="text-gray-600 dark:text-slate-400 mb-6 text-lg">
                  {userBookings.length === 0
                    ? "You don't have any test bookings yet"
                    : "No bookings match your filters"}
                </p>
                <Link
                  href="/patient/book-test"
                  className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition"
                >
                  Book Your First Test
                </Link>
              </div>
            ) : (
              <div id="bookings-table" className="space-y-4">
                {filteredBookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="bg-white dark:bg-slate-900 rounded-lg shadow-lg p-6 hover:shadow-xl transition"
                  >
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-bold text-gray-900 dark:text-white">{booking.testName}</h3>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[booking.status]}`}
                          >
                            {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                          </span>
                        </div>
                        <p className="text-gray-600 dark:text-slate-400 mb-2">
                          <strong>Scheduled Date:</strong> {booking.scheduledDate}
                        </p>
                        {booking.collectedDate && (
                          <p className="text-gray-600 dark:text-slate-400 mb-2">
                            <strong>Collected Date:</strong> {booking.collectedDate}
                          </p>
                        )}
                        {booking.reportDate && (
                          <p className="text-gray-600 dark:text-slate-400 mb-2">
                            <strong>Report Date:</strong> {booking.reportDate}
                          </p>
                        )}
                        <p className="text-gray-600 dark:text-slate-400">
                          <strong>Address:</strong> {booking.address}
                        </p>
                      </div>
                      {booking.status === "ready" && (
                        <button className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition">
                          Download Report
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-12 text-center">
              <Link
                href="/patient/dashboard"
                className="text-blue-600 dark:text-blue-400 hover:underline font-semibold"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
