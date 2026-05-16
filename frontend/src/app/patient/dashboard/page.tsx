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

  // ── Status Timeline ────────────────────────────────────────────────────────
  const STATUS_STEPS = [
    { key: "pending",   label: "Booked",          short: "Booked" },
    { key: "confirmed", label: "Approved",         short: "Approved" },
    { key: "rider_accepted", label: "Rider Assigned",  short: "Rider" },
    { key: "collected", label: "Sample Collected", short: "Collected" },
    { key: "completed", label: "Results Ready",    short: "Results" },
  ]
  const getStepIndex = (status: string) => {
    const map: Record<string, number> = {
      pending: 0, confirmed: 1, rider_accepted: 2, collected: 3, completed: 4,
      cancelled: -1,
    }
    return map[status] ?? 0
  }

  const handleDownloadReport = async (booking: any) => {
    if (!booking.report_path) { toast.info("Report generating..."); return }
    try {
      const res = await fetch(`${API_BASE_URL}/api/patient/reports/${booking.report_path}`, {
        headers: { Authorization: `Bearer ${authToken}` }
      })
      if (res.status === 410) {
        toast.error("This report has expired (30 days). Please contact Rahila Labs for a new copy.")
        return
      }
      if (!res.ok) { toast.error("Failed to download report"); return }
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = booking.report_path.split("_").slice(2).join("_") || "report"
      a.click()
    } catch { toast.error("Download error") }
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-slate-100 dark:bg-[#020617] transition-colors duration-300 relative overflow-hidden">
        {/* Decorative background vectors */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/10 dark:bg-blue-600/5 rounded-full blur-[120px] pointer-events-none -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-teal-500/10 dark:bg-teal-600/5 rounded-full blur-[120px] pointer-events-none translate-y-1/3 -translate-x-1/4" />

        <div className="container mx-auto px-4 py-12 relative z-10">
          <div className="max-w-6xl mx-auto space-y-10">
            
            {/* Premium Welcome Banner */}
            <div className="bg-gradient-to-r from-blue-700 to-indigo-600 dark:from-blue-900/80 dark:to-indigo-900/80 rounded-[2rem] p-8 sm:p-12 text-white shadow-2xl shadow-blue-900/20 relative overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="absolute top-0 right-0 p-32 bg-white/10 rounded-full blur-[80px]" />
              <div className="relative z-10">
                <h1 className="text-4xl md:text-5xl font-black mb-3 tracking-tight">Hello, {user.name} 👋</h1>
                <p className="text-blue-100 text-lg max-w-2xl font-medium">
                  <span className="inline-block bg-white/20 backdrop-blur-md px-3 py-1 rounded-lg text-white font-bold mr-4 font-mono shadow-sm">MRN: {user.mrn || "Pending"}</span>
                  Welcome to your secure health portal. Manage appointments and access your medical reports instantly.
                </p>
              </div>
            </div>

            {/* Premium Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150 fill-mode-both">
              <div className="group bg-white dark:bg-slate-800 rounded-[2rem] p-8 border border-slate-200 dark:border-slate-700 shadow-xl shadow-slate-200/50 dark:shadow-none hover:-translate-y-1 hover:shadow-2xl hover:shadow-blue-900/10 transition-all duration-300">
                <div className="flex items-start justify-between mb-6">
                  <h3 className="text-lg font-bold text-slate-600 dark:text-slate-400">Total Bookings</h3>
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-2xl group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                    <ClipboardList className="w-6 h-6" />
                  </div>
                </div>
                <p className="text-5xl font-black text-slate-900 dark:text-white tracking-tight">{bookings.length}</p>
              </div>

              <div className="group bg-white dark:bg-slate-800 rounded-[2rem] p-8 border border-slate-200 dark:border-slate-700 shadow-xl shadow-slate-200/50 dark:shadow-none hover:-translate-y-1 hover:shadow-2xl hover:shadow-amber-900/10 transition-all duration-300">
                <div className="flex items-start justify-between mb-6">
                  <h3 className="text-lg font-bold text-slate-600 dark:text-slate-400">Upcoming Tests</h3>
                  <div className="p-4 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-2xl group-hover:scale-110 group-hover:bg-amber-500 group-hover:text-white transition-all duration-300">
                    <CalendarClock className="w-6 h-6" />
                  </div>
                </div>
                <p className="text-5xl font-black text-slate-900 dark:text-white tracking-tight">{upcomingBookings.length}</p>
              </div>

              <div className="group bg-white dark:bg-slate-800 rounded-[2rem] p-8 border border-slate-200 dark:border-slate-700 shadow-xl shadow-slate-200/50 dark:shadow-none hover:-translate-y-1 hover:shadow-2xl hover:shadow-emerald-900/10 transition-all duration-300">
                <div className="flex items-start justify-between mb-6">
                  <h3 className="text-lg font-bold text-slate-600 dark:text-slate-400">Ready Reports</h3>
                  <div className="p-4 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-2xl group-hover:scale-110 group-hover:bg-emerald-500 group-hover:text-white transition-all duration-300">
                    <FileCheck2 className="w-6 h-6" />
                  </div>
                </div>
                <p className="text-5xl font-black text-slate-900 dark:text-white tracking-tight">{readyReports.length}</p>
              </div>
            </div>

            {/* Upcoming Appointments Section */}
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[2rem] shadow-xl shadow-slate-200/50 dark:shadow-none p-8 sm:p-10 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300 fill-mode-both">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 dark:text-white">Upcoming Appointments</h2>
                  <p className="text-slate-500 font-medium mt-1">Track your pending health test visits</p>
                </div>
                <Link
                  href="/patient/book-test"
                  className="bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 text-white dark:text-slate-900 shadow-lg shadow-slate-900/20 dark:shadow-white/20 font-bold py-3 px-8 rounded-xl transition-all duration-300 hover:scale-105 active:scale-95"
                >
                  Book New Test
                </Link>
              </div>

              {upcomingBookings.length === 0 ? (
                <div className="text-center py-16 bg-slate-50/50 dark:bg-slate-950/30 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
                  <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                    <CalendarClock className="w-8 h-8" />
                  </div>
                  <p className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-2">No upcoming appointments</p>
                  <p className="text-slate-500 dark:text-slate-400 mb-4 font-medium">Your schedule is completely clear.</p>
                  <Link href="/patient/book-test" className="text-blue-600 hover:text-blue-700 dark:text-blue-400 hover:underline font-bold">
                    Book your first test →
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {upcomingBookings.map((booking) => (
                    <div key={booking.id} className="group border-2 border-slate-100 dark:border-slate-700 rounded-2xl p-6 hover:shadow-lg hover:shadow-slate-200/50 dark:hover:shadow-slate-950/50 hover:border-blue-400 dark:hover:border-blue-500 transition-all duration-300 bg-slate-50 dark:bg-slate-900">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2.5 py-1 rounded-md dark:bg-blue-900/60 dark:text-blue-300 tracking-wide uppercase">
                              #{booking.bookingOrderId || 'PENDING'}
                            </span>
                            <span className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wide ${STATUS_COLORS[booking.status]}`}>
                              {booking.status}
                            </span>
                          </div>
                          <h3 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">{booking.testName}</h3>
                        </div>
                      </div>
                      
                      <div className="space-y-3 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                            <CalendarClock className="w-4 h-4 text-slate-500" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Scheduled for</p>
                            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{booking.scheduledDate}</p>
                          </div>
                        </div>
                        
                        <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-3 border border-slate-100 dark:border-slate-800">
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Visit Address</p>
                          <p className="text-sm font-medium text-slate-700 dark:text-slate-300 line-clamp-2">{booking.address}</p>
                        </div>
                        
                        {booking.rider && (
                          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 border border-blue-100 dark:border-blue-900/30 flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-200 dark:bg-blue-800 flex items-center justify-center text-blue-700 dark:text-blue-300 font-bold text-xs">
                              {booking.rider.name.charAt(0)}
                            </div>
                            <div>
                              <p className="text-xs font-bold text-blue-500 uppercase tracking-wider">Assigned Rider</p>
                              <p className="text-sm font-semibold text-blue-900 dark:text-blue-300">{booking.rider.name} <span className="text-blue-600 dark:text-blue-400 font-medium ml-1">({booking.rider.phone})</span></p>
                            </div>
                          </div>
                        )}
                        
                        {booking.status === 'pending' && (
                          <div className="pt-2 flex justify-end">
                            <button
                              onClick={() => handleCancel(booking.id)}
                              className="text-sm font-bold text-red-500 hover:text-white border border-red-200 hover:border-red-500 hover:bg-red-500 py-1.5 px-4 rounded-lg transition-colors"
                            >
                              Cancel Booking
                            </button>
                          </div>
                        )}

                        {/* Status Timeline */}
                        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                          {booking.status === 'cancelled' ? (
                            <div className="flex items-center gap-2 text-red-500 dark:text-red-400 text-xs font-bold">
                              <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                              Appointment Cancelled
                            </div>
                          ) : (() => {
                            const currentStep = getStepIndex(booking.status)
                            return (
                              <div>
                                <div className="flex items-center justify-between mb-1.5">
                                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Progress</p>
                                  <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400">
                                    {STATUS_STEPS[currentStep]?.label ?? booking.status}
                                  </p>
                                </div>
                                <div className="flex items-center gap-1">
                                  {STATUS_STEPS.map((step, idx) => (
                                    <div key={step.key} className="flex-1">
                                      <div className={`h-1.5 rounded-full transition-all duration-500 ${idx <= currentStep ? 'bg-blue-600 dark:bg-blue-400' : 'bg-slate-200 dark:bg-slate-700'}`} />
                                    </div>
                                  ))}
                                </div>
                                <div className="flex justify-between mt-1">
                                  {STATUS_STEPS.map((step, idx) => (
                                    <span key={step.key} className={`text-[9px] font-semibold truncate ${idx <= currentStep ? 'text-blue-600 dark:text-blue-400' : 'text-slate-300 dark:text-slate-700'}`}>
                                      {step.short}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )
                          })()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Your Reports Section */}
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[2rem] shadow-xl shadow-slate-200/50 dark:shadow-none p-8 sm:p-10 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-500 fill-mode-both">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/40 rounded-xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 transform -rotate-6">
                  <FileCheck2 className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900 dark:text-white">Your Medical Reports</h2>
                  <p className="text-slate-500 font-medium">Download your finalized lab results securely</p>
                </div>
              </div>

              {readyReports.length === 0 ? (
                <div className="bg-slate-50 dark:bg-slate-800/30 rounded-2xl p-8 border border-slate-100 dark:border-slate-800 text-center">
                  <p className="text-slate-500 dark:text-slate-400 font-medium">No reports are ready for download yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {readyReports.map((booking) => (
                    <div key={booking.id} className="group border border-emerald-200 dark:border-emerald-900/50 rounded-2xl p-5 bg-gradient-to-r from-emerald-50/50 to-white dark:from-emerald-900/10 dark:to-slate-900 flex justify-between items-center hover:shadow-lg hover:shadow-emerald-100 dark:hover:shadow-emerald-900/20 transition-all duration-300">
                      <div>
                        <div className="flex items-center gap-2 mb-1.5">
                          <h3 className="font-bold text-slate-900 dark:text-white leading-tight">{booking.testName}</h3>
                        </div>
                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                          <CalendarClock className="w-3.5 h-3.5" />
                          {booking.scheduledDate}
                        </p>
                        {booking.bookingOrderId && (
                          <p className="text-xs font-bold text-emerald-600/70 dark:text-emerald-400 mt-1 uppercase tracking-wide">
                            ID: {booking.bookingOrderId}
                          </p>
                        )}
                      </div>
                      <div>
                        <a
                          href="#"
                          className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md shadow-emerald-600/20 transition-all duration-300 hover:scale-105 active:scale-95 inline-flex items-center gap-2"
                          onClick={() => handleDownloadReport(booking)}
                        >
                          Download
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
