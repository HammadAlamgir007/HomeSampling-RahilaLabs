import type React from "react"
import { Card, CardContent } from "@/components/ui/card"

interface StatCardProps {
  number: string
  label: string
  icon?: React.ReactNode
}

export function StatCard({ number, label, icon }: StatCardProps) {
  return (
    <Card className="group relative overflow-hidden rounded-3xl border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_40px_-15px_rgba(37,99,235,0.15)] dark:hover:shadow-[0_20px_40px_-15px_rgba(147,197,253,0.05)]">
      {/* Subtle hover gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/0 via-transparent to-blue-50/0 group-hover:from-blue-50/50 group-hover:to-transparent dark:group-hover:from-blue-900/10 transition-colors duration-500" />
      
      <CardContent className="pt-8 pb-8 relative z-10">
        <div className="text-center space-y-4">
          {icon && (
            <div className="flex justify-center mx-auto items-center w-20 h-20 rounded-2xl bg-blue-50/80 dark:bg-slate-800 text-blue-600 dark:text-blue-400 text-4xl mb-6 shadow-sm group-hover:scale-110 group-hover:shadow-blue-500/20 group-hover:bg-blue-600 group-hover:text-white transition-all duration-500 ease-out">
              {icon}
            </div>
          )}
          <p className="text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">{number}</p>
          <p className="text-lg font-medium text-slate-500 dark:text-slate-400">{label}</p>
        </div>
      </CardContent>
    </Card>
  )
}
