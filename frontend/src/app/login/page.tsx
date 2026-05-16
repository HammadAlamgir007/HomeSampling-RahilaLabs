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
      <div className="min-h-[85vh] bg-gradient-to-br from-slate-100 via-blue-50 to-slate-200 dark:from-[#0B1120] dark:via-[#020617] dark:to-[#0F172A] flex items-center justify-center px-4 py-16 relative overflow-hidden">
        {/* Decorative background blurs */}
        <div className="absolute top-[10%] p-32 bg-blue-400/20 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-[10%] right-[10%] p-32 bg-teal-400/10 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="w-full max-w-[440px] relative z-10">
          <div className="bg-white dark:bg-slate-800 border-2 border-white/40 dark:border-slate-700 rounded-3xl shadow-2xl shadow-blue-900/10 dark:shadow-none p-8 sm:p-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="mb-8 text-center">
              <div className="mx-auto w-12 h-12 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center mb-4 transform -rotate-3 hover:rotate-0 transition-transform">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">
                {redirectPath?.includes("book-test") ? "Login to Book Test" : "Welcome Back"}
              </h1>
              <p className="text-slate-500 dark:text-slate-400 font-medium">
                {redirectPath?.includes("book-test")
                  ? "Create an account or login to continue booking"
                  : "Sign in to your Rahila Labs account"}
              </p>
            </div>

            {errors.global && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-xl border border-red-100 dark:border-red-900/30 flex items-center gap-3 animate-shake">
                <span className="font-bold flex-1">{errors.global}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 transition-colors focus-within:text-blue-600">Email Address</label>
                <div className="relative group">
                  <input
                    ref={refs.email}
                    type="email"
                    value={email}
                    onChange={handleEmailChange}
                    className={`w-full px-4 py-3 bg-slate-50 dark:bg-slate-950/50 border ${errors.email ? 'border-red-400 animate-shake focus:ring-red-500/20' : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'} dark:text-white rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all duration-300`}
                    placeholder="you@example.com"
                  />
                  {!errors.email && email.includes('@') && email.includes('.') && <CheckCircle2 className="absolute right-3.5 top-1/2 -translate-y-1/2 text-emerald-500 w-5 h-5 pointer-events-none animate-in zoom-in duration-300 drop-shadow-sm" />}
                </div>
                {errors.email && <p className="text-red-500 text-sm font-medium mt-1 animate-in fade-in">{errors.email}</p>}
              </div>

              <div ref={refs.password} className="space-y-1.5">
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 transition-colors focus-within:text-blue-600">Password</label>
                <div className={errors.password ? "animate-shake" : ""}>
                   <PasswordInput
                     value={password}
                     onChange={handlePasswordChange}
                     className={`py-3 bg-slate-50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 rounded-xl transition-all duration-300 ${errors.password ? 'border-red-400 focus:ring-red-500/20 focus:border-red-500' : ''}`}
                     placeholder="••••••••"
                   />
                </div>
                {errors.password && <p className="text-red-500 text-sm font-medium mt-1 animate-in fade-in">{errors.password}</p>}
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center group cursor-pointer" onClick={() => setRememberMe(!rememberMe)}>
                  <div className={`w-5 h-5 rounded border ${rememberMe ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 group-hover:border-blue-400'} flex items-center justify-center transition-colors duration-200 mr-2.5`}>
                    {rememberMe && <CheckCircle2 className="w-3.5 h-3.5" />}
                  </div>
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200 transition-colors">
                    Remember me
                  </span>
                </div>
                <Link href="/forgot-password" className="text-sm font-bold text-blue-600 hover:text-blue-700 hover:underline transition-colors decoration-2 underline-offset-2">
                  Forgot Password?
                </Link>
              </div>

              <SubmitButton isLoading={isLoading} type="submit" className="w-full mt-4 py-3.5 rounded-xl text-md font-bold shadow-lg shadow-blue-500/20 transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:hover:translate-y-0">
                {isLoading ? "Signing in securely..." : "Sign In"}
              </SubmitButton>
            </form>

            <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 text-center">
              <p className="text-slate-500 dark:text-slate-400 font-medium">
                New to Rahila Labs?{" "}
                <Link href="/register" className="text-blue-600 hover:text-blue-700 hover:underline font-bold transition-colors decoration-2 underline-offset-2">
                  Create an account
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
