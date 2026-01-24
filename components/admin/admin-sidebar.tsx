"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Users,
  TestTube,
  Calendar,
  FileText,
  Users2,
  MessageSquare,
  CreditCard,
  Settings,
  LogOut,
} from "lucide-react"
import { cn } from "@/lib/utils"

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/admin" },
  { icon: Users, label: "Manage Patients", href: "/admin/patients" },
  { icon: TestTube, label: "Manage Tests", href: "/admin/tests" },
  { icon: Calendar, label: "Appointments", href: "/admin/appointments" },
  { icon: FileText, label: "Reports", href: "/admin/reports" },
  { icon: Users2, label: "Staff", href: "/admin/staff" },
  { icon: MessageSquare, label: "Messages", href: "/admin/messages" },
  { icon: CreditCard, label: "Payments", href: "/admin/payments" },
  { icon: Settings, label: "Settings", href: "/admin/settings" },
]

import { useStore } from "@/lib/store"
import { useRouter } from "next/navigation"

export function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { setAuthToken, setAdmin } = useStore()

  const handleLogout = () => {
    setAuthToken(null)
    setAdmin(null)
    router.push("/admin/login")
  }

  return (
    <aside className="w-64 bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 fixed left-0 top-0 h-screen overflow-y-auto">
      <div className="p-6 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-900 dark:bg-blue-600 rounded-lg flex items-center justify-center">
            <TestTube className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-slate-900 dark:text-white">Rahila Labs</h1>
            <p className="text-xs text-slate-600 dark:text-slate-400">Admin</p>
          </div>
        </div>
      </div>

      <nav className="p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                isActive
                  ? "bg-blue-900 text-white"
                  : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800",
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-slate-200 dark:border-slate-800 absolute bottom-0 w-full">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-950 w-full transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </aside>
  )
}

export default AdminSidebar
