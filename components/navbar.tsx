"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation" // Added useRouter
import { Menu, X, User, LogOut, Sun, Moon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTheme } from "next-themes"
import { useStore } from "@/lib/store" // Added store import

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const user = useStore((state) => state.user) // Get user from store
  const logout = useStore((state) => state.logout) // Get logout action
  const router = useRouter()

  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <nav className="bg-white dark:bg-slate-950 border-b border-gray-200 dark:border-slate-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="font-bold text-2xl text-blue-900 dark:text-blue-400">
            Rahila Labs
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex gap-8">
            <Link href="/" className="text-blue-900 hover:text-blue-700 dark:text-gray-300 dark:hover:text-blue-400 font-bold">
              Home
            </Link>
            <Link href="/about" className="text-blue-900 hover:text-blue-700 dark:text-gray-300 dark:hover:text-blue-400 font-bold">
              About
            </Link>
            <Link href="/services" className="text-blue-900 hover:text-blue-700 dark:text-gray-300 dark:hover:text-blue-400 font-bold">
              Services
            </Link>
            <Link href="/contact" className="text-blue-900 hover:text-blue-700 dark:text-gray-300 dark:hover:text-blue-400 font-bold">
              Contact
            </Link>
          </div>

          {/* Auth Buttons and Dark Mode Toggle */}
          <div className="hidden md:flex gap-4 items-center">
            {mounted && (
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
              >
                {theme === "dark" ? (
                  <Sun className="w-5 h-5 text-yellow-500" />
                ) : (
                  <Moon className="w-5 h-5 text-slate-600" />
                )}
              </button>
            )}
            {user ? (
              <>
                <Link href="/patient/dashboard">
                  <Button variant="outline" className="border-blue-900 text-blue-900 hover:bg-blue-50 dark:border-blue-400 dark:text-blue-400 dark:hover:bg-blue-950 font-bold">
                    <User className="w-4 h-4 mr-2" />
                    Dashboard
                  </Button>
                </Link>
                <Button
                  onClick={() => {
                    logout()
                    document.cookie = "rahila_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
                    document.cookie = "rahila_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
                    router.push('/')
                  }}
                  variant="ghost"
                  className="text-blue-900 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-950 font-bold"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Link href="/portal">
                  <Button variant="outline" className="border-blue-900 text-blue-900 hover:bg-blue-50 dark:border-blue-400 dark:text-blue-400 dark:hover:bg-blue-950 font-bold">Login</Button>
                </Link>
                <Link href="/register">
                  <Button className="bg-blue-900 text-white hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500 font-bold">Register</Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button className="md:hidden" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <X /> : <Menu />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden pb-4 space-y-2">
            <Link href="/" className="block px-4 py-2 text-blue-900 hover:bg-blue-50 dark:text-gray-300 dark:hover:bg-slate-800 dark:hover:text-blue-400 font-bold">
              Home
            </Link>
            <Link href="/about" className="block px-4 py-2 text-blue-900 hover:bg-blue-50 dark:text-gray-300 dark:hover:bg-slate-800 dark:hover:text-blue-400 font-bold">
              About
            </Link>
            <Link href="/services" className="block px-4 py-2 text-blue-900 hover:bg-blue-50 dark:text-gray-300 dark:hover:bg-slate-800 dark:hover:text-blue-400 font-bold">
              Services
            </Link>
            <Link href="/contact" className="block px-4 py-2 text-blue-900 hover:bg-blue-50 dark:text-gray-300 dark:hover:bg-slate-800 dark:hover:text-blue-400 font-bold">
              Contact
            </Link>
            <div className="flex gap-2 px-4 pt-2">
              <Link href="/portal" className="flex-1">
                <Button variant="outline" className="w-full bg-transparent border-blue-900 text-blue-900 hover:bg-blue-50 dark:border-blue-400 dark:text-blue-400 dark:hover:bg-blue-950 font-bold">
                  Login
                </Button>
              </Link>
              <Link href="/register" className="flex-1">
                <Button className="w-full bg-blue-900 text-white hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500 font-bold">Register</Button>
              </Link>
            </div>
            {mounted && (
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
              >
                {theme === "dark" ? (
                  <Sun className="w-5 h-5 text-yellow-500" />
                ) : (
                  <Moon className="w-5 h-5 text-slate-600" />
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </nav >
  )
}

export default Navbar
