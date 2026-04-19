"use client"

import { useState, useMemo } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Eye, Check, X, Upload, UserPlus, RefreshCw, CheckSquare, Square,
  CheckCheck, XCircle, TestTube, MapPin,
  CalendarClock, FileText, Bike, AlertCircle
} from "lucide-react"
import { useStore } from "@/lib/store"
import { API_BASE_URL } from "@/lib/api_config"
import { toast } from "react-toastify"

interface AppointmentsTableProps {
  appointments: any[]
  riders?: any[]
  onStatusUpdate?: (id: number, status: string) => void
  onRiderAssignment?: (appointmentId: number, riderId: number) => Promise<{ success: boolean; message: string }>
  onRefresh?: () => void
}

// ─── Status display config ──────────────────────────────────────────────────
// delivered_to_lab is grouped under "Collected"
const STATUS_CFG: Record<string, { label: string; cls: string }> = {
  pending:          { label: "Pending",        cls: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/60 dark:text-yellow-200" },
  confirmed:        { label: "Confirmed",      cls: "bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200" },
  rider_accepted:   { label: "Rider Assigned", cls: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/60 dark:text-indigo-200" },
  collected:        { label: "Collected",      cls: "bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-200" },
  delivered_to_lab: { label: "Collected",      cls: "bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-200" },
  completed:        { label: "Completed",      cls: "bg-green-100 text-green-800 dark:bg-green-900/60 dark:text-green-200" },
  cancelled:        { label: "Cancelled",      cls: "bg-red-100 text-red-800 dark:bg-red-900/60 dark:text-red-200" },
}

function safeFmt(dateStr: string | undefined | null) {
  if (!dateStr) return "—"
  const d = new Date(dateStr)
  return isNaN(d.getTime()) ? "—" : d.toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" })
}
function safeTimeFmt(dateStr: string | undefined | null) {
  if (!dateStr) return "—"
  const d = new Date(dateStr)
  return isNaN(d.getTime()) ? "—" : d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
}

// ─── Detail Modal ─────────────────────────────────────────────────────────────
function DetailModal({ apt, onClose, authToken }: { apt: any; onClose: () => void; authToken: string | null }) {
  const cfg = STATUS_CFG[apt.status] ?? { label: apt.status, cls: "bg-gray-100 text-gray-800" }

  const previewReport = async () => {
    if (!apt.report_path) return
    try {
      const res = await fetch(`${API_BASE_URL}/api/patient/reports/${apt.report_path}`, {
        headers: { Authorization: `Bearer ${authToken}` }
      })
      if (!res.ok) { toast.error("Could not load report"); return }
      const blob = await res.blob()
      window.open(window.URL.createObjectURL(blob), "_blank")
    } catch { toast.error("Error opening report") }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900 to-indigo-800 p-6 text-white">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-blue-200 text-xs font-bold uppercase tracking-wider mb-1">Appointment Details</p>
              <h2 className="text-xl font-black">{apt.test_name || "Unknown Test"}</h2>
              <p className="text-blue-200 text-sm mt-1 font-mono">#{apt.booking_order_id || apt.id}</p>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/20 transition-colors"><X className="w-5 h-5" /></button>
          </div>
          <Badge className={`mt-3 ${cfg.cls}`}>{cfg.label}</Badge>
        </div>
        {/* Body */}
        <div className="p-6 space-y-4 max-h-[65vh] overflow-y-auto">
          <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3">Patient</p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-blue-700 dark:text-blue-300 font-bold">
                {(apt.patient_name || "?").charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-bold text-slate-900 dark:text-white">{apt.patient_name || "Unknown"}</p>
                <p className="text-sm text-slate-500">{apt.patient_email}</p>
                <p className="text-sm text-slate-500">{apt.patient_phone}</p>
                {apt.patient_mrn && <p className="text-xs font-mono text-blue-600 dark:text-blue-400 mt-0.5">MRN: {apt.patient_mrn}</p>}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1"><TestTube className="w-3 h-3" />Test</p>
              <p className="font-semibold text-slate-900 dark:text-white text-sm">{apt.test_name}</p>
              {apt.test_price && <p className="text-xs text-slate-500 mt-0.5">PKR {apt.test_price}</p>}
            </div>
            <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1"><CalendarClock className="w-3 h-3" />Date & Time</p>
              <p className="font-semibold text-slate-900 dark:text-white text-sm">{safeFmt(apt.date)}</p>
              <p className="text-xs text-slate-500">{safeTimeFmt(apt.date)}</p>
            </div>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1"><MapPin className="w-3 h-3" />Address</p>
            <p className="text-sm text-slate-700 dark:text-slate-300">{apt.address || "—"}</p>
            {apt.patient_city && <p className="text-xs text-slate-500 mt-0.5">{apt.patient_city}</p>}
          </div>
          {apt.rider && (
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
              <p className="text-[11px] font-bold uppercase tracking-wider text-blue-400 mb-2 flex items-center gap-1"><Bike className="w-3 h-3" />Assigned Rider</p>
              <p className="font-semibold text-slate-900 dark:text-white text-sm">{apt.rider.name}</p>
              <p className="text-xs text-slate-500">{apt.rider.phone}</p>
            </div>
          )}
          {apt.report_path && (
            <button onClick={previewReport} className="w-full flex items-center gap-3 p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors">
              <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-800 rounded-lg flex items-center justify-center"><FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /></div>
              <div className="text-left">
                <p className="font-bold text-emerald-700 dark:text-emerald-300 text-sm">Report Available</p>
                <p className="text-xs text-emerald-600/70 dark:text-emerald-400/70">Click to preview</p>
              </div>
            </button>
          )}
        </div>
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button onClick={onClose} className="px-6 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-sm hover:opacity-90 transition-opacity">Close</button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Table ────────────────────────────────────────────────────────────────
export function AppointmentsTable({ appointments = [], riders = [], onStatusUpdate, onRiderAssignment, onRefresh }: AppointmentsTableProps) {
  const safeAppointments = Array.isArray(appointments) ? appointments : []
  const { authToken } = useStore()
  const [selectedRiders, setSelectedRiders] = useState<{ [key: number]: number }>({})
  const [assigningRider, setAssigningRider] = useState<number | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [bulkLoading, setBulkLoading] = useState(false)
  const [detailApt, setDetailApt] = useState<any | null>(null)

  // Bulk helpers
  const allSelected = safeAppointments.length > 0 && selectedIds.size === safeAppointments.length
  const someSelected = selectedIds.size > 0
  const toggleAll = () => setSelectedIds(allSelected ? new Set() : new Set(safeAppointments.map(a => a.id)))
  const toggleOne = (id: number) => setSelectedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })

  const handleAssignClick = async (appointmentId: number) => {
    const riderId = selectedRiders[appointmentId]
    if (!riderId) { toast.warning("Please select a rider first"); return }
    setAssigningRider(appointmentId)
    const result = await onRiderAssignment?.(appointmentId, riderId)
    setAssigningRider(null)
    if (result) {
      result.success ? toast.success(result.message) : toast.error(result.message)
      if (result.success) {
        setSelectedRiders(prev => { const n = { ...prev }; delete n[appointmentId]; return n })
        onRefresh?.()
      }
    }
  }

  const handleBulk = async (status: "confirmed" | "cancelled") => {
    if (!authToken || selectedIds.size === 0) return
    setBulkLoading(true)
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/appointments/bulk-status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ ids: Array.from(selectedIds), status })
      })
      const data = await res.json()
      if (res.ok) { toast.success(data.message); setSelectedIds(new Set()); onRefresh?.() }
      else toast.error(data.error || "Bulk action failed")
    } catch { toast.error("Network error") }
    finally { setBulkLoading(false) }
  }

  const sortedRiders = useMemo(() => {
    return [...riders]
      .filter(r => r.availability_status !== "offline")
      .sort((a, b) => {
        const order: Record<string, number> = { available: 0, busy: 1 }
        return (order[a.availability_status] ?? 2) - (order[b.availability_status] ?? 2)
      })
  }, [riders])

  // ─── Permission helpers based on the standard flow ────────────────────────
  // Pending        → Approve, Reject
  // Confirmed      → Assign Rider, Upload, Cancel
  // Rider Assigned → Reassign Rider, Upload, Cancel
  // Collected / delivered_to_lab → Upload only
  // Completed      → read-only
  // Cancelled      → read-only
  // Eye (View Details) → ALWAYS visible

  const isPending   = (s: string) => s === "pending"
  const isConfirmed = (s: string) => s === "confirmed"
  const isRiderAssigned = (s: string) => s === "rider_accepted"
  const isCollected = (s: string) => s === "collected" || s === "delivered_to_lab"
  const isCompleted = (s: string) => s === "completed"
  const isCancelled = (s: string) => s === "cancelled"

  const canApprove  = (s: string) => isPending(s)
  const canReject   = (s: string) => isPending(s)
  const canCancel   = (s: string) => isConfirmed(s) || isRiderAssigned(s)
  const canAssign   = (s: string) => isConfirmed(s) || isRiderAssigned(s)
  const canUpload   = (s: string) => isConfirmed(s) || isRiderAssigned(s) || isCollected(s)

  // ─── Shared upload handler ─────────────────────────────────────────────────
  const handleUpload = async (aptId: number, file: File, hasReport: boolean) => {
    const formData = new FormData()
    formData.append("file", file)
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/upload-report/${aptId}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${authToken}` },
        body: formData
      })
      if (res.ok) { toast.success(hasReport ? "Report re-uploaded!" : "Report uploaded!"); onRefresh?.() }
      else { const err = await res.json(); toast.error(err.error || "Upload failed") }
    } catch { toast.error("Upload error") }
  }

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      {detailApt && <DetailModal apt={detailApt} onClose={() => setDetailApt(null)} authToken={authToken} />}

      {/* Bulk Action Bar */}
      {someSelected && (
        <div className="flex flex-wrap items-center gap-3 mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
          <span className="text-sm font-bold text-blue-800 dark:text-blue-200">{selectedIds.size} selected</span>
          <div className="flex gap-2 ml-auto">
            <Button size="sm" onClick={() => handleBulk("confirmed")} disabled={bulkLoading} className="bg-green-600 hover:bg-green-700 text-white gap-1 text-xs">
              <CheckCheck className="w-3.5 h-3.5" /> Approve All
            </Button>
            <Button size="sm" variant="outline" onClick={() => handleBulk("cancelled")} disabled={bulkLoading} className="border-red-300 text-red-600 hover:bg-red-50 gap-1 text-xs">
              <XCircle className="w-3.5 h-3.5" /> Reject All
            </Button>
            <button onClick={() => setSelectedIds(new Set())} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-medium">Clear</button>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          MOBILE CARD LAYOUT (< lg)
         ═══════════════════════════════════════════════════════════════════════ */}
      <div className="lg:hidden space-y-3">
        {safeAppointments.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <CalendarClock className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="font-medium">No appointments found</p>
          </div>
        ) : safeAppointments.map(apt => {
          const cfg = STATUS_CFG[apt.status] ?? { label: apt.status, cls: "bg-gray-100 text-gray-800" }
          const isSelected = selectedIds.has(apt.id)
          const st = apt.status

          return (
            <div
              key={apt.id}
              className={`rounded-xl border p-4 transition-colors ${
                isSelected
                  ? "bg-blue-50 dark:bg-blue-900/10 border-blue-300 dark:border-blue-700"
                  : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
              }`}
            >
              {/* Top row: checkbox + patient + status */}
              <div className="flex items-start gap-3 mb-3">
                <button onClick={() => toggleOne(apt.id)} className="mt-0.5 text-slate-400 hover:text-blue-600 shrink-0">
                  {isSelected ? <CheckSquare className="w-4 h-4 text-blue-600" /> : <Square className="w-4 h-4" />}
                </button>
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className="w-9 h-9 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-blue-700 dark:text-blue-300 font-bold text-sm shrink-0">
                    {(apt.patient_name || "?").charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-900 dark:text-white text-sm truncate">{apt.patient_name || "Unknown"}</p>
                    <p className="text-[11px] text-slate-500 truncate">{apt.patient_email}</p>
                  </div>
                </div>
                <Badge className={`text-[10px] font-bold px-2 py-0.5 shrink-0 ${cfg.cls}`}>{cfg.label}</Badge>
              </div>

              {/* Test + Date */}
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Test</p>
                  <p className="text-sm font-medium text-slate-900 dark:text-white line-clamp-2">{apt.test_name || "Unknown"}</p>
                  <p className="text-[10px] text-slate-400 font-mono">#{apt.booking_order_id || apt.id}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Date & Time</p>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">{safeFmt(apt.date)}</p>
                  <p className="text-[11px] text-slate-500">{safeTimeFmt(apt.date)}</p>
                </div>
              </div>

              {/* Rider section */}
              {(canAssign(st) || apt.rider) && (
                <div className="mb-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Rider</p>
                  {apt.rider && (
                    <div className="flex items-center gap-2 text-xs mb-2">
                      <div className="w-5 h-5 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-blue-700 dark:text-blue-300 font-bold text-[9px] shrink-0">
                        {apt.rider.name.charAt(0)}
                      </div>
                      <span className="font-medium text-slate-700 dark:text-slate-300">{apt.rider.name}</span>
                      {canAssign(st) && <span className="text-[9px] text-blue-500 font-bold">current</span>}
                    </div>
                  )}
                  {canAssign(st) && (
                    <div className="flex items-center gap-1.5">
                      <select
                        value={selectedRiders[apt.id] || ""}
                        onChange={(e) => setSelectedRiders(prev => ({ ...prev, [apt.id]: Number(e.target.value) }))}
                        className="text-xs border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1.5 bg-white dark:bg-slate-900 text-slate-900 dark:text-white flex-1 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      >
                        <option value="">{apt.rider ? "Reassign…" : "Select rider…"}</option>
                        {sortedRiders.map(rider => (
                          <option key={rider.id} value={rider.id}>{rider.name} {rider.availability_status === "busy" ? "⚠" : "✓"}</option>
                        ))}
                      </select>
                      <button
                        onClick={() => handleAssignClick(apt.id)}
                        disabled={assigningRider === apt.id || !selectedRiders[apt.id]}
                        className="p-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-40 shrink-0"
                      >
                        {assigningRider === apt.id ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Report badge */}
              {apt.report_path && (
                <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold mb-3">✓ Report uploaded</div>
              )}

              {/* Actions row */}
              <div className="flex items-center gap-1 pt-2 border-t border-slate-100 dark:border-slate-800">
                {canApprove(st) && (
                  <button onClick={() => onStatusUpdate?.(apt.id, "confirmed")} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-xs font-bold hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors">
                    <Check className="w-3.5 h-3.5" /> Approve
                  </button>
                )}
                {canReject(st) && (
                  <button onClick={() => onStatusUpdate?.(apt.id, "cancelled")} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 text-xs font-bold hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors">
                    <X className="w-3.5 h-3.5" /> Reject
                  </button>
                )}
                {canCancel(st) && (
                  <button onClick={() => onStatusUpdate?.(apt.id, "cancelled")} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 text-xs font-bold hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors">
                    <X className="w-3.5 h-3.5" /> Cancel
                  </button>
                )}
                {(canUpload(st) || apt.report_path) && (
                  <div className="relative inline-block">
                    <input type="file" id={`mfile-${apt.id}`} className="hidden" accept=".pdf,.png,.jpg,.jpeg"
                      onChange={async (e) => { if (e.target.files?.[0]) await handleUpload(apt.id, e.target.files[0], !!apt.report_path) }}
                    />
                    <label htmlFor={`mfile-${apt.id}`} className={`cursor-pointer flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${apt.report_path ? "bg-orange-50 dark:bg-orange-900/20 text-orange-500" : "bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400"}`}>
                      {apt.report_path ? <><RefreshCw className="w-3.5 h-3.5" /> Re-upload</> : <><Upload className="w-3.5 h-3.5" /> Upload</>}
                    </label>
                  </div>
                )}
                <button onClick={() => setDetailApt(apt)} className="ml-auto p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400">
                  <Eye className="w-4 h-4" />
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          DESKTOP TABLE LAYOUT (>= lg)
         ═══════════════════════════════════════════════════════════════════════ */}
      <div className="hidden lg:block overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
        <table className="w-full text-sm min-w-[1050px]">
          <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="px-3 py-3 w-10">
                <button onClick={toggleAll} className="text-slate-400 hover:text-slate-700 dark:hover:text-white">
                  {allSelected ? <CheckSquare className="w-4 h-4 text-blue-600" /> : <Square className="w-4 h-4" />}
                </button>
              </th>
              {["Patient", "Test", "Date & Time", "Status", "Rider", "Actions"].map(h => (
                <th key={h} className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-300 text-xs uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {safeAppointments.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-16 text-slate-400"><CalendarClock className="w-10 h-10 mx-auto mb-3 opacity-40" /><p className="font-medium">No appointments found</p></td></tr>
            ) : safeAppointments.map((apt) => {
              const cfg = STATUS_CFG[apt.status] ?? { label: apt.status, cls: "bg-gray-100 text-gray-800" }
              const isSelected = selectedIds.has(apt.id)
              const st = apt.status

              return (
                <tr key={apt.id} className={`transition-colors ${isSelected ? "bg-blue-50 dark:bg-blue-900/10" : "hover:bg-slate-50/50 dark:hover:bg-slate-800/30"}`}>
                  <td className="px-3 py-3">
                    <button onClick={() => toggleOne(apt.id)} className="text-slate-400 hover:text-blue-600">
                      {isSelected ? <CheckSquare className="w-4 h-4 text-blue-600" /> : <Square className="w-4 h-4" />}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-blue-700 dark:text-blue-300 font-bold text-xs shrink-0">
                        {(apt.patient_name || "?").charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900 dark:text-white truncate max-w-[130px]">{apt.patient_name || "Unknown"}</p>
                        <p className="text-[11px] text-slate-500 truncate max-w-[130px]">{apt.patient_email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900 dark:text-white text-sm line-clamp-2 max-w-[170px]">{apt.test_name || "Unknown Test"}</p>
                    <p className="text-[11px] text-slate-400 font-mono">#{apt.booking_order_id || apt.id}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900 dark:text-white text-sm">{safeFmt(apt.date)}</p>
                    <p className="text-[11px] text-slate-500">{safeTimeFmt(apt.date)}</p>
                  </td>
                  <td className="px-4 py-3">
                    <Badge className={`text-[11px] font-bold px-2.5 py-0.5 ${cfg.cls}`}>{cfg.label}</Badge>
                    {apt.report_path && <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mt-1">✓ Report</div>}
                  </td>
                  {/* Rider */}
                  <td className="px-4 py-3">
                    {canAssign(st) ? (
                      <div className="space-y-1.5">
                        {apt.rider && (
                          <div className="flex items-center gap-1.5 text-xs">
                            <div className="w-5 h-5 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-blue-700 dark:text-blue-300 font-bold text-[9px] shrink-0">{apt.rider.name.charAt(0)}</div>
                            <span className="text-slate-600 dark:text-slate-400 font-medium truncate max-w-[110px]">{apt.rider.name}</span>
                            <span className="text-[9px] text-blue-500 font-bold">current</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1.5">
                          <select
                            value={selectedRiders[apt.id] || ""}
                            onChange={(e) => setSelectedRiders(prev => ({ ...prev, [apt.id]: Number(e.target.value) }))}
                            className="text-xs border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1.5 bg-white dark:bg-slate-900 text-slate-900 dark:text-white w-[140px] focus:ring-2 focus:ring-blue-500 focus:outline-none"
                          >
                            <option value="">{apt.rider ? "Reassign…" : "Select rider…"}</option>
                            {sortedRiders.map(rider => (
                              <option key={rider.id} value={rider.id}>{rider.name} {rider.availability_status === "busy" ? "⚠" : "✓"}</option>
                            ))}
                          </select>
                          <button onClick={() => handleAssignClick(apt.id)} disabled={assigningRider === apt.id || !selectedRiders[apt.id]}
                            className="p-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-40 shrink-0"
                            title={apt.rider ? "Reassign Rider" : "Assign Rider"}>
                            {assigningRider === apt.id ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                    ) : apt.rider ? (
                      <div className="flex items-center gap-1.5 text-xs">
                        <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-blue-700 dark:text-blue-300 font-bold text-[10px] shrink-0">{apt.rider.name.charAt(0)}</div>
                        <span className="text-slate-700 dark:text-slate-300 font-medium truncate max-w-[100px]">{apt.rider.name}</span>
                      </div>
                    ) : (
                      <span className="text-[11px] text-slate-400 italic">—</span>
                    )}
                  </td>
                  {/* Actions */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-0.5">
                      {canApprove(st) && (
                        <button title="Approve" onClick={() => onStatusUpdate?.(apt.id, "confirmed")} className="p-1.5 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 text-green-600 dark:text-green-400 transition-colors"><Check className="w-4 h-4" /></button>
                      )}
                      {canReject(st) && (
                        <button title="Reject" onClick={() => onStatusUpdate?.(apt.id, "cancelled")} className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 dark:text-red-400 transition-colors"><X className="w-4 h-4" /></button>
                      )}
                      {canCancel(st) && (
                        <button title="Cancel" onClick={() => onStatusUpdate?.(apt.id, "cancelled")} className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 dark:text-red-400 transition-colors"><X className="w-4 h-4" /></button>
                      )}
                      {(canUpload(st) || apt.report_path) && (
                        <div className="relative inline-block">
                          <input type="file" id={`dfile-${apt.id}`} className="hidden" accept=".pdf,.png,.jpg,.jpeg"
                            onChange={async (e) => { if (e.target.files?.[0]) await handleUpload(apt.id, e.target.files[0], !!apt.report_path) }}
                          />
                          <label htmlFor={`dfile-${apt.id}`} title={apt.report_path ? "Re-upload Report" : "Upload Report"}
                            className={`cursor-pointer p-1.5 rounded-lg flex transition-colors ${apt.report_path ? "hover:bg-orange-100 dark:hover:bg-orange-900/30 text-orange-500 dark:text-orange-400" : "hover:bg-purple-100 dark:hover:bg-purple-900/30 text-purple-600 dark:text-purple-400"}`}>
                            {apt.report_path ? <RefreshCw className="w-4 h-4" /> : <Upload className="w-4 h-4" />}
                          </label>
                        </div>
                      )}
                      <button title="View Details" onClick={() => setDetailApt(apt)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors"><Eye className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </>
  )
}

export default AppointmentsTable
