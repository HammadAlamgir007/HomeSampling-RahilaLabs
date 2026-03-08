import type React from "react"
import { Card, CardContent } from "@/components/ui/card"

interface StatCardProps {
  number: string
  label: string
  icon?: React.ReactNode
}

export function StatCard({ number, label, icon }: StatCardProps) {
  return (
    <Card className="rounded-2xl border-slate-100 shadow-sm hover:shadow-md transition-all duration-300">
      <CardContent className="pt-6">
        <div className="text-center space-y-3">
          {icon && (
            <div className="flex justify-center mx-auto items-center w-16 h-16 rounded-full bg-blue-50 text-blue-600 text-3xl mb-4">
              {icon}
            </div>
          )}
          <p className="text-4xl font-extrabold text-slate-900">{number}</p>
          <p className="text-gray-600">{label}</p>
        </div>
      </CardContent>
    </Card>
  )
}
