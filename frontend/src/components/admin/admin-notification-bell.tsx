"use client"

import { useState, useEffect, useRef } from "react"
import { Bell, X, Calendar, CheckCircle2, Clock, AlertCircle, User, ChevronRight } from "lucide-react"
import Link from "next/link"
import { useStore } from "@/lib/store"
import { API_BASE_URL } from "@/lib/api_config"

interface Appointment {
  id: number
  booking_order_id: string
  test_name: string
  status: string
  date: string
  patient_name?: string
  patient_email?: string
}

const statusConfig: Record<string, { icon: React.ReactNode; color: string; bg: string; label: string }> = {
  pending:   { icon: <Clock className="w-4 h-4" />,        color: "text-yellow-600 dark:text-yellow-400",  bg: "bg-yellow-100 dark:bg-yellow-900/30",  label: "Awaiting Review" },
  confirmed: { icon: <CheckCircle2 className="w-4 h-4" />, color: "text-blue-600 dark:text-blue-400",      bg: "bg-blue-100 dark:bg-blue-900/30",      label: "Confirmed" },
  approved:  { icon: <CheckCircle2 className="w-4 h-4" />, color: "text-blue-600 dark:text-blue-400",      bg: "bg-blue-100 dark:bg-blue-900/30",      label: "Approved" },
  collected: { icon: <Calendar className="w-4 h-4" />,     color: "text-purple-600 dark:text-purple-400",  bg: "bg-purple-100 dark:bg-purple-900/30",  label: "Sample Collected" },
  completed: { icon: <CheckCircle2 className="w-4 h-4" />, color: "text-green-600 dark:text-green-400",    bg: "bg-green-100 dark:bg-green-900/30",    label: "Completed" },
  ready:     { icon: <CheckCircle2 className="w-4 h-4" />, color: "text-green-600 dark:text-green-400",    bg: "bg-green-100 dark:bg-green-900/30",    label: "Results Ready" },
  cancelled: { icon: <X className="w-4 h-4" />,            color: "text-red-600 dark:text-red-400",        bg: "bg-red-100 dark:bg-red-900/30",        label: "Cancelled" },
  declined:  { icon: <AlertCircle className="w-4 h-4" />,  color: "text-red-600 dark:text-red-400",        bg: "bg-red-100 dark:bg-red-900/30",        label: "Declined" },
}

export function AdminNotificationBell() {
  const [open, setOpen] = useState(false)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [pendingCount, setPendingCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
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

  // Fetch recent appointments
  useEffect(() => {
    if (!authToken) return
    const fetch_data = async () => {
      setLoading(true)
      try {
        const res = await fetch(`${API_BASE_URL}/api/admin/appointments?page=1&per_page=15`, {
          headers: { Authorization: `Bearer ${authToken}` },
        })
        if (res.ok) {
          const data = await res.json()
          const appts: Appointment[] = data.appointments || []
          setAppointments(appts.slice(0, 12))
          setPendingCount(appts.filter((a) => a.status === "pending").length)
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false)
      }
    }
    fetch_data()
    // Refresh every 60s
    const interval = setInterval(fetch_data, 60000)
    return () => clearInterval(interval)
  }, [authToken])

  const formatDate = (dateStr: string | undefined | null) => {
    if (!dateStr) return "—"
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return "—"
    return d.toLocaleDateString("en-PK", {
      day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
    })
  }

  return (
    <div className="relative" ref={ref}>
      {/* Bell Button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors group"
      >
        <Bell className={`w-5 h-5 text-slate-600 dark:text-slate-400 ${open ? "text-blue-600 dark:text-blue-400" : ""}`} />
        {pendingCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-600 rounded-full flex items-center justify-center text-[10px] font-bold text-white border-2 border-white dark:border-slate-950 animate-pulse px-0.5">
            {pendingCount > 9 ? "9+" : pendingCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full mt-3 w-80 sm:w-[380px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl shadow-slate-900/10 dark:shadow-slate-900/50 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white">Appointments</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {pendingCount > 0 ? `${pendingCount} pending review` : "All caught up!"}
              </p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* List */}
          <div className="max-h-[400px] overflow-y-auto divide-y divide-slate-50 dark:divide-slate-800/60">
            {loading ? (
              <div className="flex flex-col gap-3 p-5">
                {[1, 2, 3, 4].map((i) => (
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
              <div className="flex flex-col items-center justify-center py-14 text-center">
                <div className="w-14 h-14 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                  <Bell className="w-6 h-6 text-slate-400" />
                </div>
                <p className="font-semibold text-slate-700 dark:text-slate-200">No appointments yet</p>
              </div>
            ) : (
              appointments.map((appt) => {
                const cfg = statusConfig[appt.status] ?? statusConfig.pending
                return (
                  <Link
                    key={appt.id}
                    href="/admin/appointments"
                    onClick={() => setOpen(false)}
                    className="flex items-start gap-4 px-5 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors block"
                  >
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${cfg.bg} ${cfg.color}`}>
                      {cfg.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900 dark:text-white text-sm leading-snug line-clamp-1">
                        {appt.test_name}
                      </p>
                      {appt.patient_name && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                          <User className="w-3 h-3 shrink-0" /> {appt.patient_name}
                        </p>
                      )}
                      <div className="flex items-center justify-between mt-1.5">
                        <span className={`text-[11px] font-bold ${cfg.color}`}>{cfg.label}</span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500">{formatDate(appt.date)}</span>
                      </div>
                    </div>
                  </Link>
                )
              })
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-slate-100 dark:border-slate-800 p-3">
            <Link
              href="/admin/appointments"
              onClick={() => setOpen(false)}
              className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold transition-colors"
            >
              View All Appointments
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminNotificationBell
