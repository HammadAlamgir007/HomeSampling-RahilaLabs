"use client"

import type { Appointment } from "@/lib/store"
import { Badge } from "@/components/ui/badge"
import { Eye, Check, Box, X, Upload } from "lucide-react"

interface AppointmentsTableProps {
  appointments: any[]
  onView?: (id: string) => void
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
  onStatusUpdate?: (id: number, status: string) => void
}

export function AppointmentsTable({ appointments, onView, onEdit, onDelete, onStatusUpdate }: AppointmentsTableProps) {
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

  return (
    <div className="overflow-x-auto">
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
          {appointments.map((apt) => (
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
              <td className="px-6 py-4 flex gap-2">
                {apt.status === 'pending' && (
                  <>
                    <button
                      title="Confirm Appointment"
                      onClick={() => onStatusUpdate?.(apt.id, 'confirmed')}
                      className="p-2 hover:bg-blue-100 text-blue-600 rounded"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      title="Decline Appointment"
                      onClick={() => onStatusUpdate?.(apt.id, 'cancelled')}
                      className="p-2 hover:bg-red-100 text-red-600 rounded"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </>
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
                  onClick={() => onView?.(apt.id)}
                  className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded"
                >
                  <Eye className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default AppointmentsTable
