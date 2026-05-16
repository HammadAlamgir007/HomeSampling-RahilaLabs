"use client"

import { Settings, LogOut, Sun, Moon, Menu } from "lucide-react"
import { useTheme } from "next-themes"
import { useState, useEffect } from "react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useStore } from "@/lib/store"
import { useRouter } from "next/navigation"
import { AdminNotificationBell } from "@/components/admin/admin-notification-bell"
import { AdminSearch } from "@/components/admin/admin-search"

export function AdminNavbar() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const { toggleSidebar, setAuthToken, setAdmin, admin } = useStore()
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleLogout = () => {
    setAuthToken(null)
    setAdmin(null)
    document.cookie = "admin_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
    document.cookie = "admin_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
    router.push("/admin/login")
  }

  const adminInitial = (admin as any)?.name?.charAt(0).toUpperCase() || "A"

  return (
    <nav className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 md:px-6 flex items-center justify-between sticky top-0 z-40 transition-all duration-300">

      <div className="flex items-center gap-4 flex-1">
        {/* Mobile Toggle */}
        <button
          onClick={toggleSidebar}
          className="md:hidden p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
        >
          <Menu className="w-5 h-5 text-slate-600 dark:text-slate-400" />
        </button>

        {/* Search */}
        <AdminSearch />
      </div>

      <div className="flex items-center gap-2">
        {/* Notification Bell */}
        <AdminNotificationBell />

        {/* Theme Toggle */}
        {mounted && (
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
            title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          >
            {theme === "dark" ? (
              <Sun className="w-5 h-5 text-yellow-500" />
            ) : (
              <Moon className="w-5 h-5 text-slate-600" />
            )}
          </button>
        )}

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 cursor-pointer outline-none ml-1">
            <div className="w-9 h-9 bg-blue-900 dark:bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm hover:ring-2 hover:ring-blue-500 hover:ring-offset-2 dark:hover:ring-offset-slate-950 transition-all">
              {adminInitial}
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52 mt-2 rounded-xl">
            {(admin as any)?.name && (
              <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                <p className="text-sm font-semibold text-slate-900 dark:text-white">{(admin as any).name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{(admin as any).email || "Administrator"}</p>
              </div>
            )}
            <div className="p-1">
              <DropdownMenuItem
                onClick={() => router.push("/admin/settings")}
                className="flex items-center gap-2 cursor-pointer py-2 font-medium"
              >
                <Settings className="w-4 h-4 text-slate-500" />
                Profile Settings
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleLogout}
                className="flex items-center gap-2 cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-500/10 py-2 font-medium"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </DropdownMenuItem>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  )
}

export default AdminNavbar
