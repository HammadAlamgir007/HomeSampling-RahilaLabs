"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowRight, CheckCircle2 } from "lucide-react"

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
      className={`group relative overflow-hidden rounded-3xl border cursor-pointer transition-all duration-500 flex flex-col h-full ${
        isSelected 
          ? "border-blue-500 shadow-[0_8px_30px_rgb(59,130,246,0.15)] dark:shadow-[0_8px_30px_rgb(59,130,246,0.1)] -translate-y-1 bg-blue-50/30 dark:bg-blue-900/10" 
          : "border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900 hover:-translate-y-2 hover:shadow-[0_20px_40px_-15px_rgba(37,99,235,0.12)] dark:hover:shadow-[0_20px_40px_-15px_rgba(147,197,253,0.05)]"
      }`}
      onClick={() => onSelect?.(id)}
    >
      {/* Top accent bar */}
      <div className={`absolute top-0 left-0 w-full h-1 transition-colors duration-500 ${isSelected ? "bg-blue-500" : "bg-transparent group-hover:bg-blue-500/20"}`} />

      {/* Header — fixed min-height so all titles align */}
      <CardHeader className="pb-4 relative z-10 pt-8 flex-shrink-0">
        <div className="flex justify-between items-start gap-4">
          <CardTitle className="leading-snug text-xl font-bold dark:text-white group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors min-h-[3.5rem]">
            {name}
          </CardTitle>
          {isSelected && <CheckCircle2 className="w-6 h-6 text-blue-500 shrink-0 drop-shadow-sm animate-in zoom-in" />}
        </div>
        <CardDescription className="line-clamp-2 mt-2 dark:text-slate-400 min-h-[2.5rem]">
          {description || "Comprehensive diagnostic panel for full evaluation."}
        </CardDescription>
      </CardHeader>

      {/* Content — flex-grow pushes button to the bottom */}
      <CardContent className="flex flex-col flex-grow gap-5 relative z-10 pb-6">

        {/* Price block */}
        <div className="flex items-baseline gap-1 bg-slate-50 dark:bg-slate-800/50 px-4 py-3 rounded-2xl border border-slate-100 dark:border-slate-800/50 transition-colors group-hover:bg-blue-50/50 dark:group-hover:bg-blue-900/20 flex-shrink-0">
          <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">PKR</span>
          <span className="text-3xl font-black text-blue-700 dark:text-blue-400 tracking-tight">{price}</span>
        </div>

        {/* Details summary — grows to fill available space */}
        <div className="flex-grow">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">Details summary</p>
          <ul className="space-y-2">
            {tests.map((test) => (
              <li key={test} className="text-sm text-slate-600 dark:text-slate-300 flex items-start gap-2">
                <span className="text-blue-400 mt-0.5 shrink-0">•</span>
                <span className="leading-snug">{test}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Book Now button — always at the bottom */}
        {onSelect && (
          <Button
            className={`w-full rounded-xl py-6 font-bold shadow-none transition-all duration-300 flex-shrink-0 mt-auto ${
              isSelected
                ? "bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-600/20"
                : "bg-slate-100 text-slate-700 hover:bg-blue-600 hover:text-white dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-blue-600 dark:hover:text-white group-hover:shadow-md group-hover:shadow-blue-600/10"
            }`}
          >
            {isSelected ? "Selected ✅" : (buttonText || "Select Test")}
            {!isSelected && <ArrowRight className="w-4 h-4 ml-2 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

export default TestCard
