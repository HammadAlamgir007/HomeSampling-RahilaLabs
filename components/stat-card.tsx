import type React from "react"
import { Card, CardContent } from "@/components/ui/card"

interface StatCardProps {
  number: string
  label: string
  icon?: React.ReactNode
}

export function StatCard({ number, label, icon }: StatCardProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="text-center space-y-2">
          {icon && <div className="flex justify-center text-blue-900 text-4xl">{icon}</div>}
          <p className="text-4xl font-bold text-blue-900">{number}</p>
          <p className="text-gray-600">{label}</p>
        </div>
      </CardContent>
    </Card>
  )
}
