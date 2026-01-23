"use client"

import type { Appointment } from "@/lib/store"
import { Badge } from "@/components/ui/badge"
import { Eye, Edit, Trash2 } from "lucide-react"

interface AppointmentsTableProps {
  appointments: Appointment[]
  onView?: (id: string) => void
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
}

export function AppointmentsTable({ appointments, onView, onEdit, onDelete }: AppointmentsTableProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      case "collected":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
          <tr>
            <th className="px-6 py-3 text-left font-semibold text-slate-900 dark:text-white">Patient</th>
            <th className="px-6 py-3 text-left font-semibold text-slate-900 dark:text-white">Test</th>
            <th className="px-6 py-3 text-left font-semibold text-slate-900 dark:text-white">Date</th>
            <th className="px-6 py-3 text-left font-semibold text-slate-900 dark:text-white">Time</th>
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
              <td className="px-6 py-4 text-slate-900 dark:text-white font-medium">{apt.patientName}</td>
              <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{apt.testName}</td>
              <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{apt.date}</td>
              <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{apt.time}</td>
              <td className="px-6 py-4">
                <Badge className={getStatusColor(apt.status)}>
                  {apt.status.charAt(0).toUpperCase() + apt.status.slice(1)}
                </Badge>
              </td>
              <td className="px-6 py-4 flex gap-2">
                <button
                  onClick={() => onView?.(apt.id)}
                  className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded"
                >
                  <Eye className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                </button>
                <button
                  onClick={() => onEdit?.(apt.id)}
                  className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded"
                >
                  <Edit className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                </button>
                <button
                  onClick={() => onDelete?.(apt.id)}
                  className="p-2 hover:bg-red-100 dark:hover:bg-red-900 rounded"
                >
                  <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
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
