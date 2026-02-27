"use client"

import { useState } from "react"
import type { Appointment } from "@/lib/store"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Eye, Check, Box, X, Upload, UserPlus, RefreshCw } from "lucide-react"
import { useStore } from "@/lib/store"
import { API_BASE_URL } from "@/lib/api_config"

interface AppointmentsTableProps {
  appointments: any[]
  riders?: any[]
  onView?: (id: string) => void
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
  onStatusUpdate?: (id: number, status: string) => void
  onRiderAssignment?: (appointmentId: number, riderId: number) => Promise<{ success: boolean; message: string }>
}

export function AppointmentsTable({ appointments = [], riders = [], onView, onEdit, onDelete, onStatusUpdate, onRiderAssignment }: AppointmentsTableProps) {
  const safeAppointments = Array.isArray(appointments) ? appointments : [];
  const { authToken } = useStore()
  const [selectedRiders, setSelectedRiders] = useState<{ [key: number]: number }>({})
  const [assigningRider, setAssigningRider] = useState<number | null>(null)
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)

  const handleRiderSelect = (appointmentId: number, riderId: number) => {
    setSelectedRiders(prev => ({ ...prev, [appointmentId]: riderId }))
  }

  const handleAssignClick = async (appointmentId: number) => {
    const riderId = selectedRiders[appointmentId]
    if (!riderId) {
      setMessage({ text: 'Please select a rider first', type: 'error' })
      setTimeout(() => setMessage(null), 3000)
      return
    }

    setAssigningRider(appointmentId)
    const result = await onRiderAssignment?.(appointmentId, riderId)
    setAssigningRider(null)

    if (result) {
      setMessage({ text: result.message, type: result.success ? 'success' : 'error' })
      setTimeout(() => setMessage(null), 3000)
      if (result.success) {
        setSelectedRiders(prev => {
          const newState = { ...prev }
          delete newState[appointmentId]
          return newState
        })
      }
    }
  }

  const previewReport = async (reportPath: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/patient/reports/${reportPath}`, {
        headers: { Authorization: `Bearer ${authToken}` }
      })
      if (!res.ok) { alert('Could not load report. Please try again.'); return }
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      window.open(url, '_blank')
    } catch {
      alert('Error opening report.')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      case "confirmed":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const availableRiders = riders.filter(r => r.availability_status === 'available')

  return (
    <div className="overflow-x-auto">
      {message && (
        <div className={`mb-4 p-3 rounded ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {message.text}
        </div>
      )}
      <table className="w-full text-sm">
        <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
          <tr>
            <th className="px-6 py-3 text-left font-semibold text-slate-900 dark:text-white">Patient Details</th>
            <th className="px-6 py-3 text-left font-semibold text-slate-900 dark:text-white">Test Info</th>
            <th className="px-6 py-3 text-left font-semibold text-slate-900 dark:text-white">Location</th>
            <th className="px-6 py-3 text-left font-semibold text-slate-900 dark:text-white">Date & Time</th>
            <th className="px-6 py-3 text-left font-semibold text-slate-900 dark:text-white">Status</th>
            <th className="px-6 py-3 text-left font-semibold text-slate-900 dark:text-white">Actions</th>
          </tr>
        </thead>
        <tbody>
          {safeAppointments.length === 0 ? (
            <tr>
              <td colSpan={6} className="text-center py-4 text-slate-500">No appointments found.</td>
            </tr>
          ) : safeAppointments.map((apt) => (
            <tr
              key={apt.id}
              className="border-b border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900"
            >
              <td className="px-6 py-4">
                <div className="font-medium text-slate-900 dark:text-white">{apt.patient_name || apt.patientName || "Unknown"}</div>
                <div className="text-xs text-slate-500">{apt.patient_phone || "No Phone"}</div>
                <div className="text-xs text-slate-500">{apt.patient_email}</div>
              </td>
              <td className="px-6 py-4">
                <div className="font-medium text-slate-900 dark:text-white">{apt.test_name || "Unknown Test"}</div>
                <div className="text-xs text-slate-500">ID: {apt.id}</div>
              </td>
              <td className="px-6 py-4">
                <div className="text-slate-600 dark:text-slate-400 max-w-[200px] truncate" title={apt.address}>
                  {apt.address}
                </div>
                <div className="text-xs text-slate-500">{apt.patient_city || "Unknown City"}</div>
              </td>
              <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                <div>{new Date(apt.date || apt.appointment_date).toLocaleDateString()}</div>
                <div className="text-xs text-slate-500">
                  {new Date(apt.date || apt.appointment_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </td>
              <td className="px-6 py-4">
                <Badge className={getStatusColor(apt.status)}>
                  {apt.status.charAt(0).toUpperCase() + apt.status.slice(1)}
                </Badge>
                {apt.report_path && <div className="mt-1 text-[10px] text-blue-600 font-semibold">Report Ready</div>}
              </td>
              <td className="px-6 py-4">
                <div className="flex gap-2 items-center">
                  {(apt.status === 'pending' || apt.status === 'confirmed') && (
                    <>
                      <div className="flex gap-2 items-center">
                        <select
                          value={selectedRiders[apt.id] || ''}
                          onChange={(e) => handleRiderSelect(apt.id, Number(e.target.value))}
                          className="text-xs border rounded px-2 py-1 min-w-[120px]"
                          disabled={assigningRider === apt.id}
                        >
                          <option value="">Select Rider</option>
                          {availableRiders.map(rider => (
                            <option key={rider.id} value={rider.id}>
                              {rider.name}
                            </option>
                          ))}
                        </select>
                        <Button
                          size="sm"
                          onClick={() => handleAssignClick(apt.id)}
                          disabled={assigningRider === apt.id || !selectedRiders[apt.id]}
                          className="text-xs"
                        >
                          {assigningRider === apt.id ? (
                            <span className="flex items-center gap-1">
                              <span className="animate-spin">⏳</span> Assigning...
                            </span>
                          ) : (
                            <span className="flex items-center gap-1">
                              <UserPlus className="w-3 h-3" /> Assign
                            </span>
                          )}
                        </Button>
                      </div>

                      {apt.status === 'pending' && (
                        <button
                          title="Approve Appointment"
                          onClick={() => onStatusUpdate?.(apt.id, 'confirmed')}
                          className="p-2 hover:bg-green-100 text-green-600 rounded"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      )}

                      <button
                        title="Decline Appointment"
                        onClick={() => onStatusUpdate?.(apt.id, 'cancelled')}
                        className="p-2 hover:bg-red-100 text-red-600 rounded"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </>
                  )}
                  {apt.rider && (
                    <div className="text-xs text-gray-600">
                      Rider: <span className="font-semibold">{apt.rider.name}</span>
                    </div>
                  )}
                  {apt.status === 'confirmed' && (
                    <button
                      title="Mark Completed"
                      onClick={() => onStatusUpdate?.(apt.id, 'completed')}
                      className="p-2 hover:bg-green-100 text-green-600 rounded"
                    >
                      <Box className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => apt.report_path ? previewReport(apt.report_path) : onView?.(apt.id)}
                    title={apt.report_path ? "Preview uploaded report" : "View appointment"}
                    className={`p-2 rounded ${apt.report_path
                        ? 'hover:bg-blue-100 dark:hover:bg-blue-900 text-blue-600 dark:text-blue-400'
                        : 'hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <div className="relative inline-block">
                    <input
                      type="file"
                      id={`file-${apt.id}`}
                      className="hidden"
                      accept=".pdf,.png,.jpg,.jpeg"
                      onChange={async (e) => {
                        if (e.target.files && e.target.files[0]) {
                          const file = e.target.files[0];
                          const formData = new FormData();
                          formData.append('file', file);

                          // Ideally getting token from context or prop, but local storage fallback or assume parent handles
                          // But here we are in a component. We need onUpload callback or handle it here if possible.
                          // Let's use an onUpload prop if available, or fetch directly.
                          // Given we are in NextJS client component, we access localStorage/store


                          // ... existing code ...

                          // But store hook rule.
                          // Let's dispatch a custom event or use onStatusUpdate prop as proxy? No. 
                          // Let's assume we can pass an onUpload prop.
                          // Actually, let's just do fetch here if we can get token.
                          // Or better: Trigger a callback passed from parent.
                          const token = authToken;

                          if (!token) { alert("Auth token missing"); return; }

                          try {
                            const res = await fetch(`${API_BASE_URL}/api/admin/upload-report/${apt.id}`, {
                              method: 'POST',
                              headers: { 'Authorization': `Bearer ${token}` },
                              body: formData
                            });
                            if (res.ok) {
                              alert("Report uploaded successfully!");
                              window.location.reload(); // Simple reload to refresh
                            } else {
                              const err = await res.json();
                              alert("Upload failed: " + err.error);
                            }
                          } catch (err) { console.error(err); alert("Upload error"); }
                        }
                      }}
                    />
                    <label
                      htmlFor={`file-${apt.id}`}
                      title={apt.report_path ? "Re-upload Report (replace existing)" : "Upload Report"}
                      className={`cursor-pointer p-2 rounded flex items-center justify-center ${apt.report_path
                          ? 'hover:bg-orange-100 dark:hover:bg-orange-900 text-orange-500 dark:text-orange-400'
                          : 'hover:bg-purple-100 dark:hover:bg-purple-900 text-purple-600 dark:text-purple-400'
                        }`}
                    >
                      {apt.report_path
                        ? <RefreshCw className="w-4 h-4" />
                        : <Upload className="w-4 h-4" />}
                    </label>
                  </div>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default AppointmentsTable
