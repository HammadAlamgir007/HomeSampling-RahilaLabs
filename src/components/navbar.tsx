"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation" // Added useRouter
import { Menu, X, User, LogOut, Sun, Moon, Bell, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
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
    <nav className="bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-800/50 sticky top-0 z-[100] transition-colors duration-300">
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
            <Link href="/services" className="text-blue-900 hover:text-blue-700 dark:text-gray-300 dark:hover:text-blue-400 font-bold transition-colors">
              Services
            </Link>
            <Link href="/patient/book-test" className="text-blue-900 hover:text-blue-700 dark:text-gray-300 dark:hover:text-blue-400 font-bold transition-colors">
              Book Test
            </Link>
            <Link href="/contact" className="text-blue-900 hover:text-blue-700 dark:text-gray-300 dark:hover:text-blue-400 font-bold transition-colors">
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
              <div className="flex items-center gap-4">
                <button className="relative p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 rounded-full transition-colors group">
                  <Bell className="w-5 h-5 group-hover:animate-swing" />
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-950"></span>
                </button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-full bg-slate-50 border border-slate-200 hover:bg-slate-100 hover:border-slate-300 dark:bg-slate-900 dark:border-slate-800 dark:hover:bg-slate-800 transition-all font-semibold text-sm text-slate-700 dark:text-slate-200">
                      <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-700 dark:text-blue-400 overflow-hidden">
                        {(user as any).name ? (user as any).name.charAt(0).toUpperCase() : <User className="w-3.5 h-3.5" />}
                      </div>
                      <span className="max-w-[100px] truncate">{(user as any).name || 'Patient'}</span>
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 mt-2 rounded-xl">
                    <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                      <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{(user as any).name || 'Patient Profile'}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
                    </div>
                    <div className="p-1">
                      <DropdownMenuItem asChild>
                        <Link href="/patient/dashboard" className="flex items-center gap-2 cursor-pointer font-medium py-2">
                          <User className="w-4 h-4 text-slate-500" /> Dashboard
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="my-1" />
                      <DropdownMenuItem
                        onClick={() => {
                          logout()
                          document.cookie = "patient_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
                          document.cookie = "patient_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
                          router.push('/')
                        }}
                        className="flex items-center gap-2 cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-500/10 font-medium py-2"
                      >
                        <LogOut className="w-4 h-4" /> Logout
                      </DropdownMenuItem>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
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
            <Link href="/services" className="block px-4 py-2 text-blue-900 hover:bg-blue-50 dark:text-gray-300 dark:hover:bg-slate-800 dark:hover:text-blue-400 font-bold transition-colors">
              Services
            </Link>
            <Link href="/patient/book-test" className="block px-4 py-2 text-blue-900 hover:bg-blue-50 dark:text-gray-300 dark:hover:bg-slate-800 dark:hover:text-blue-400 font-bold transition-colors">
              Book Test
            </Link>
            <Link href="/contact" className="block px-4 py-2 text-blue-900 hover:bg-blue-50 dark:text-gray-300 dark:hover:bg-slate-800 dark:hover:text-blue-400 font-bold transition-colors">
              Contact
            </Link>
            <div className="flex flex-col gap-2 px-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              {user ? (
                <>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-700 dark:text-blue-400">
                      {(user as any).name ? (user as any).name.charAt(0).toUpperCase() : <User className="w-5 h-5" />}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">{(user as any).name || 'Patient'}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{user.email}</p>
                    </div>
                    <button className="ml-auto p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 rounded-full transition-colors relative">
                      <Bell className="w-5 h-5" />
                      <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-950"></span>
                    </button>
                  </div>
                  <Link href="/patient/dashboard">
                    <Button variant="outline" className="w-full justify-start text-blue-900 dark:text-blue-400 font-bold border-slate-200 dark:border-slate-800">
                      <User className="w-4 h-4 mr-2" /> Dashboard
                    </Button>
                  </Link>
                  <Button
                    onClick={() => {
                      logout()
                      document.cookie = "patient_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
                      document.cookie = "patient_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
                      setIsOpen(false)
                      router.push('/')
                    }}
                    variant="ghost"
                    className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 font-bold"
                  >
                    <LogOut className="w-4 h-4 mr-2" /> Logout
                  </Button>
                </>
              ) : (
                <div className="flex gap-2">
                  <Link href="/portal" className="flex-1">
                    <Button variant="outline" className="w-full bg-transparent border-blue-900 text-blue-900 hover:bg-blue-50 dark:border-blue-400 dark:text-blue-400 dark:hover:bg-blue-950 font-bold">
                      Login
                    </Button>
                  </Link>
                  <Link href="/register" className="flex-1">
                    <Button className="w-full bg-blue-900 text-white hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500 font-bold">Register</Button>
                  </Link>
                </div>
              )}
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
