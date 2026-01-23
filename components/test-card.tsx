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
}

export function TestCard({ id, name, description, price, tests, isSelected, onSelect }: TestCardProps) {
  return (
    <Card
      className={`cursor-pointer transition-all ${isSelected ? "ring-2 ring-blue-500 shadow-lg" : ""}`}
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
          <Button className="w-full" variant={isSelected ? "default" : "outline"}>
            {isSelected ? "Selected" : "Select Test"}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

export default TestCard
