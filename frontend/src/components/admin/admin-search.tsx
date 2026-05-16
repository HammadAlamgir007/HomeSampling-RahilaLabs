"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Search, User, Calendar, TestTube, FileText, X, ArrowRight } from "lucide-react"
import { useRouter } from "next/navigation"
import { useStore } from "@/lib/store"
import { API_BASE_URL } from "@/lib/api_config"

interface SearchResult {
  id: string | number
  title: string
  subtitle: string
  type: "patient" | "appointment" | "test" | "report"
  href: string
}

const typeConfig = {
  patient:     { icon: <User className="w-4 h-4" />,      color: "text-blue-600 dark:text-blue-400",    bg: "bg-blue-100 dark:bg-blue-900/30",    label: "Patient" },
  appointment: { icon: <Calendar className="w-4 h-4" />,  color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-100 dark:bg-purple-900/30", label: "Appointment" },
  test:        { icon: <TestTube className="w-4 h-4" />,  color: "text-green-600 dark:text-green-400",   bg: "bg-green-100 dark:bg-green-900/30",   label: "Test" },
  report:      { icon: <FileText className="w-4 h-4" />,  color: "text-orange-600 dark:text-orange-400", bg: "bg-orange-100 dark:bg-orange-900/30", label: "Report" },
}

const quickLinks = [
  { label: "All Patients",      href: "/admin/patients",      icon: <User className="w-4 h-4" /> },
  { label: "All Appointments",  href: "/admin/appointments",  icon: <Calendar className="w-4 h-4" /> },
  { label: "Manage Tests",      href: "/admin/tests",         icon: <TestTube className="w-4 h-4" /> },
  { label: "Reports",           href: "/admin/reports",       icon: <FileText className="w-4 h-4" /> },
]

export function AdminSearch() {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const authToken = useStore((state) => state.authToken)

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  // Keyboard shortcut Ctrl+K / Cmd+K to focus
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault()
        inputRef.current?.focus()
        setOpen(true)
      }
      if (e.key === "Escape") {
        setOpen(false)
        inputRef.current?.blur()
      }
    }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [])

  const search = useCallback(async (q: string) => {
    if (!q.trim() || !authToken) {
      setResults([])
      return
    }
    setLoading(true)
    try {
      const [patientsRes, appointmentsRes, testsRes] = await Promise.allSettled([
        fetch(`${API_BASE_URL}/api/admin/patients?search=${encodeURIComponent(q)}`, {
          headers: { Authorization: `Bearer ${authToken}` },
        }),
        fetch(`${API_BASE_URL}/api/admin/appointments?search=${encodeURIComponent(q)}&per_page=5`, {
          headers: { Authorization: `Bearer ${authToken}` },
        }),
        fetch(`${API_BASE_URL}/api/admin/tests?search=${encodeURIComponent(q)}`, {
          headers: { Authorization: `Bearer ${authToken}` },
        }),
      ])

      const combined: SearchResult[] = []

      // Patients
      if (patientsRes.status === "fulfilled" && patientsRes.value.ok) {
        const data = await patientsRes.value.json()
        const patients = Array.isArray(data) ? data : data.patients || []
        patients.slice(0, 4).forEach((p: any) => {
          combined.push({
            id: p.id,
            title: p.name || p.full_name || "Unknown Patient",
            subtitle: p.email || p.phone || "",
            type: "patient",
            href: `/admin/patients/${p.id}`,
          })
        })
      }

      // Appointments
      if (appointmentsRes.status === "fulfilled" && appointmentsRes.value.ok) {
        const data = await appointmentsRes.value.json()
        const appts = data.appointments || []
        appts.slice(0, 4).forEach((a: any) => {
          combined.push({
            id: a.id,
            title: a.test_name || "Test Appointment",
            subtitle: `${a.patient_name || ""} · ${a.status}`,
            type: "appointment",
            href: "/admin/appointments",
          })
        })
      }

      // Tests
      if (testsRes.status === "fulfilled" && testsRes.value.ok) {
        const data = await testsRes.value.json()
        const tests = Array.isArray(data) ? data : data.tests || []
        tests.slice(0, 4).forEach((t: any) => {
          combined.push({
            id: t.id,
            title: t.name,
            subtitle: `PKR ${t.price} · ${t.category || "General"}`,
            type: "test",
            href: "/admin/tests",
          })
        })
      }

      setResults(combined)
    } catch {
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [authToken])

  // Debounce
  useEffect(() => {
    const timer = setTimeout(() => search(query), 300)
    return () => clearTimeout(timer)
  }, [query, search])

  const navigate = (href: string) => {
    router.push(href)
    setOpen(false)
    setQuery("")
    setResults([])
  }

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    const items = results.length > 0 ? results : []
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setSelected((s) => Math.min(s + 1, items.length - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setSelected((s) => Math.max(s - 1, -1))
    } else if (e.key === "Enter" && selected >= 0 && items[selected]) {
      navigate(items[selected].href)
    } else if (e.key === "Escape") {
      setOpen(false)
    }
  }

  const showPanel = open && (query.length > 0 || true) // always show on focus

  return (
    <div className="relative w-full max-w-md hidden sm:block" ref={panelRef}>
      {/* Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setSelected(-1) }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search patients, tests, appointments… (Ctrl+K)"
          className="w-full pl-9 pr-9 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
        />
        {query && (
          <button
            onClick={() => { setQuery(""); setResults([]); inputRef.current?.focus() }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Dropdown panel */}
      {showPanel && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl shadow-slate-900/10 dark:shadow-slate-900/50 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">

          {query === "" ? (
            /* Quick links when no query */
            <div className="p-3">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-2 mb-2">Quick Navigation</p>
              {quickLinks.map((link) => (
                <button
                  key={link.href}
                  onClick={() => navigate(link.href)}
                  className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left group"
                >
                  <span className="text-slate-400 dark:text-slate-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{link.icon}</span>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">{link.label}</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-auto text-slate-300 dark:text-slate-600 group-hover:text-blue-500 opacity-0 group-hover:opacity-100 transition-all" />
                </button>
              ))}
            </div>
          ) : loading ? (
            <div className="p-4 flex flex-col gap-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse flex gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 shrink-0" />
                  <div className="flex-1 space-y-2 py-0.5">
                    <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-2/3" />
                    <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : results.length === 0 ? (
            <div className="py-12 text-center px-4">
              <Search className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <p className="font-semibold text-slate-600 dark:text-slate-300 text-sm">No results for "{query}"</p>
              <p className="text-xs text-slate-400 mt-1">Try searching by name, email, or test code</p>
            </div>
          ) : (
            <div className="p-2 max-h-[400px] overflow-y-auto">
              {/* Group by type */}
              {(["patient", "appointment", "test"] as const).map((type) => {
                const group = results.filter((r) => r.type === type)
                if (group.length === 0) return null
                const cfg = typeConfig[type]
                return (
                  <div key={type} className="mb-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-3 py-1.5">{cfg.label}s</p>
                    {group.map((item, i) => {
                      const globalIdx = results.indexOf(item)
                      return (
                        <button
                          key={`${item.type}-${item.id}`}
                          onClick={() => navigate(item.href)}
                          className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl transition-colors text-left ${selected === globalIdx ? "bg-blue-50 dark:bg-blue-900/20" : "hover:bg-slate-50 dark:hover:bg-slate-800"}`}
                        >
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${cfg.bg} ${cfg.color}`}>
                            {cfg.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{item.title}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{item.subtitle}</p>
                          </div>
                          <ArrowRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 shrink-0" />
                        </button>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default AdminSearch
