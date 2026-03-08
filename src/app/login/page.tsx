"use client"

import type React from "react"
import { useState, useRef, Suspense } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useStore } from "@/lib/store"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import { API_BASE_URL } from "@/lib/api_config"
import { toast } from "react-toastify"

import { PasswordInput } from "@/components/ui/password-input"
import { SubmitButton } from "@/components/ui/submit-button"
import { CheckCircle2 } from "lucide-react"

function LoginContent() {
  const router = useRouter()
  const setUser = useStore((state) => state.setUser)
  const setAuthToken = useStore((state) => state.setAuthToken)

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const searchParams = useSearchParams()
  const redirectPath = searchParams.get("redirect") || "/patient/dashboard"

  const refs = {
    email: useRef<HTMLInputElement>(null),
    password: useRef<HTMLDivElement>(null),
  }

  const scrollToFirstError = (errObj: Record<string, string>) => {
    const firstErrorKey = Object.keys(errObj)[0] as keyof typeof refs
    if (firstErrorKey && refs[firstErrorKey]?.current) {
      refs[firstErrorKey].current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    let newErrors: Record<string, string> = {}

    if (!email) newErrors.email = "Email is required"
    if (!password) newErrors.password = "Password is required"

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      scrollToFirstError(newErrors)
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, remember_me: rememberMe }),
      })

      const data = await response.json()

      if (!data.success || !response.ok) {
        if (data.field) {
          setErrors({ [data.field]: data.message })
          scrollToFirstError({ [data.field]: data.message })
        } else {
          setErrors({ global: data.message })
        }
        throw new Error(data.message || "Login failed")
      }

      toast.success(data.message)
      setUser(data.data.user)
      setAuthToken(data.data.access_token)

      // Store in cookies for Next.js Middleware Edge detection
      const maxAgeStr = rememberMe ? "max-age=2592000;" : "" // 30 days or session
      document.cookie = `patient_token=${data.data.access_token}; path=/; ${maxAgeStr}`
      document.cookie = `patient_role=patient; path=/; ${maxAgeStr}`

      router.push(redirectPath)
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value.toLowerCase())
    if (errors.email) setErrors(prev => ({ ...prev, email: "" }))
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value)
    if (errors.password) setErrors(prev => ({ ...prev, password: "" }))
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-950 dark:to-slate-900 transition-colors duration-300 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="bg-white dark:bg-slate-950 dark:border dark:border-slate-800 rounded-lg shadow-lg p-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {redirectPath?.includes("book-test") ? "Login to Book Test" : "Welcome Back"}
              </h1>
              <p className="text-gray-600 dark:text-slate-400">
                {redirectPath?.includes("book-test")
                  ? "Create an account or login to continue booking"
                  : "Sign in to your Rahila Labs account"}
              </p>
            </div>

            {errors.global && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm rounded-lg border border-red-200 dark:border-red-800 flex items-start">
                <span className="font-semibold block">{errors.global}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Email Address</label>
                <div className="relative">
                  <input
                    ref={refs.email}
                    type="email"
                    value={email}
                    onChange={handleEmailChange}
                    className={`w-full px-4 py-2 border ${errors.email ? 'border-red-400' : 'border-gray-300'} dark:border-slate-700 dark:bg-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none`}
                    placeholder="you@example.com"
                  />
                  {!errors.email && email.includes('@') && email.includes('.') && <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500 w-5 h-5 pointer-events-none" />}
                </div>
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
              </div>

              <div ref={refs.password}>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Password</label>
                <PasswordInput
                  value={password}
                  onChange={handlePasswordChange}
                  className={errors.password ? "border-red-400" : ""}
                  placeholder="••••••••"
                />
                {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
              </div>

              <div className="flex items-center justify-between mt-1">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-slate-700 rounded bg-white dark:bg-slate-900"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700 dark:text-slate-300">
                    Remember me
                  </label>
                </div>
                <Link href="/forgot-password" className="text-sm text-blue-600 hover:underline">
                  Forgot Password?
                </Link>
              </div>

              <SubmitButton isLoading={isLoading} type="submit" className="mt-2">
                {isLoading ? "Signing in..." : "Sign In"}
              </SubmitButton>
            </form>

            <div className="mt-6 text-center">
              <p className="text-gray-600 dark:text-slate-400">
                Don't have an account?{" "}
                <Link href="/register" className="text-blue-600 hover:underline font-semibold">
                  Register here
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">Loading...</div>}>
      <LoginContent />
    </Suspense>
  )
}
