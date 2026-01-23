import type { LucideIcon } from "lucide-react"

interface StatCardAdminProps {
  icon: LucideIcon
  label: string
  value: string | number
  change?: string
  changeType?: "positive" | "negative"
}

export function StatCardAdmin({ icon: Icon, label, value, change, changeType }: StatCardAdminProps) {
  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-lg border border-slate-200 dark:border-slate-800 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
          <Icon className="w-6 h-6 text-blue-900 dark:text-blue-400" />
        </div>
        {change && (
          <span className={`text-sm font-semibold ${changeType === "positive" ? "text-green-600" : "text-red-600"}`}>
            {changeType === "positive" ? "+" : ""}
            {change}%
          </span>
        )}
      </div>
      <p className="text-slate-600 dark:text-slate-400 text-sm mb-1">{label}</p>
      <p className="text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
    </div>
  )
}

export default StatCardAdmin
