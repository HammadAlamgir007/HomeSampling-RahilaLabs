"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface TestCardProps {
  id: string
  name: string
  description: string
  price: number
  tests: string[]
  isSelected?: boolean
  onSelect?: (id: string) => void
  buttonText?: string
}

export function TestCard({ id, name, description, price, tests, isSelected, onSelect, buttonText }: TestCardProps) {
  return (
    <Card
      className={`cursor-pointer rounded-2xl border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 ${isSelected ? "ring-2 ring-blue-500 shadow-lg" : ""}`}
      onClick={() => onSelect?.(id)}
    >
      <CardHeader>
        <CardTitle>{name}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-3xl font-bold text-blue-900">Rs. {price}</p>
        </div>
        <div>
          <p className="text-sm font-semibold mb-2">Includes:</p>
          <ul className="space-y-1">
            {tests.map((test) => (
              <li key={test} className="text-sm text-gray-600">
                • {test}
              </li>
            ))}
          </ul>
        </div>
        {onSelect && (
          <Button className={`w-full rounded-xl ${isSelected ? "bg-blue-600 hover:bg-blue-700" : ""}`} variant={isSelected ? "default" : "outline"}>
            {isSelected ? "Selected" : (buttonText || "Select Test")}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

export default TestCard
