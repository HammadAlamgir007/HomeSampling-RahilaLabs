"use client"

import { useState, useEffect, useRef } from "react"
import { Bell, X, Calendar, CheckCircle2, Clock, AlertCircle, XCircle, ChevronRight } from "lucide-react"
import Link from "next/link"
import { useStore } from "@/lib/store"
import { API_BASE_URL } from "@/lib/api_config"

interface Appointment {
  id: number
  booking_order_id: string
  test_name: string
  status: string
  date: string
  address: string
}

const statusConfig: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  pending:   { icon: <Clock className="w-4 h-4" />,        color: "text-yellow-500",  label: "Pending Review" },
  confirmed: { icon: <CheckCircle2 className="w-4 h-4" />, color: "text-blue-500",    label: "Confirmed" },
  approved:  { icon: <CheckCircle2 className="w-4 h-4" />, color: "text-blue-500",    label: "Approved" },
  collected: { icon: <Calendar className="w-4 h-4" />,     color: "text-purple-500",  label: "Sample Collected" },
  completed: { icon: <CheckCircle2 className="w-4 h-4" />, color: "text-green-500",   label: "Results Ready" },
  ready:     { icon: <CheckCircle2 className="w-4 h-4" />, color: "text-green-500",   label: "Results Ready" },
  cancelled: { icon: <XCircle className="w-4 h-4" />,      color: "text-red-500",     label: "Cancelled" },
  declined:  { icon: <AlertCircle className="w-4 h-4" />,  color: "text-red-500",     label: "Declined" },
}

export function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(false)
  const [hasUnread, setHasUnread] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const user = useStore((state) => state.user)
  const authToken = useStore((state) => state.authToken)

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  // Fetch appointments when user is logged in
  useEffect(() => {
    if (!user || !authToken) return

    const fetchAppointments = async () => {
      setLoading(true)
      try {
        const res = await fetch(`${API_BASE_URL}/api/patient/bookings`, {
          headers: { Authorization: `Bearer ${authToken}` },
        })
        if (res.ok) {
          const data = await res.json()
          setAppointments(data.slice(0, 10)) // Latest 10
          // Show unread dot if any appointment is in an "active" state
          setHasUnread(data.some((a: Appointment) =>
            ["pending", "confirmed", "approved", "collected", "completed", "ready"].includes(a.status)
          ))
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false)
      }
    }

    fetchAppointments()
  }, [user, authToken])

  const formatDate = (dateStr: string | undefined | null) => {
    if (!dateStr) return "—"
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return "—"
    return d.toLocaleDateString("en-PK", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (!user) return null

  return (
    <div className="relative" ref={ref}>
      {/* Bell Button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 rounded-full transition-colors group"
      >
        <Bell className={`w-5 h-5 ${open ? "animate-swing" : "group-hover:animate-swing"}`} />
        {hasUnread && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-950 animate-pulse" />
        )}
      </button>

      {/* Dropdown Panel */}
      {open && (
        <div className="absolute right-0 top-full mt-3 w-80 sm:w-96 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl shadow-slate-900/10 dark:shadow-slate-900/50 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white">Notifications</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Your booking updates</p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Notification List */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-50 dark:divide-slate-800">
            {loading ? (
              <div className="flex flex-col gap-3 p-5">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse flex gap-3">
                    <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 shrink-0" />
                    <div className="flex-1 space-y-2 py-1">
                      <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-3/4" />
                      <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : appointments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 px-5 text-center">
                <div className="w-14 h-14 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                  <Bell className="w-6 h-6 text-slate-400" />
                </div>
                <p className="font-semibold text-slate-700 dark:text-slate-200">No bookings yet</p>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Book a test to see your status updates here.</p>
              </div>
            ) : (
              appointments.map((appt) => {
                const cfg = statusConfig[appt.status] ?? statusConfig.pending
                return (
                  <div
                    key={appt.id}
                    className="flex items-start gap-4 px-5 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 bg-slate-100 dark:bg-slate-800 ${cfg.color}`}>
                      {cfg.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900 dark:text-white text-sm leading-snug line-clamp-1">
                        {appt.test_name}
                      </p>
                      <p className={`text-xs font-bold mt-0.5 ${cfg.color}`}>{cfg.label}</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 flex items-center gap-1">
                        <Calendar className="w-3 h-3 shrink-0" />
                        {formatDate(appt.date)}
                      </p>
                      <p className="text-[10px] font-mono text-slate-400 mt-0.5">#{appt.booking_order_id}</p>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-slate-100 dark:border-slate-800 p-3">
            <Link
              href="/patient/dashboard"
              onClick={() => setOpen(false)}
              className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold transition-colors"
            >
              View All Bookings
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

export default NotificationBell
