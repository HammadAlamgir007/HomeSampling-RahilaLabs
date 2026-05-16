"use client"

import type React from "react"
import { useState, useRef } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useStore } from "@/lib/store"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import { API_BASE_URL } from "@/lib/api_config"
import { toast } from "react-toastify"
import { CITIES } from "@/lib/constants"

import { PasswordInput } from "@/components/ui/password-input"
import { PhoneInput } from "@/components/ui/phone-input"
import { SubmitButton } from "@/components/ui/submit-button"
import { CheckCircle2 } from "lucide-react"

export default function RegisterPage() {
  const router = useRouter()
  const setUser = useStore((state) => state.setUser)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    city: "",
    dateOfBirth: "",
    password: "",
    confirmPassword: "",
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isOtpStep, setIsOtpStep] = useState(false)
  const [otpCode, setOtpCode] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const refs = {
    name: useRef<HTMLInputElement>(null),
    email: useRef<HTMLInputElement>(null),
    phone: useRef<HTMLInputElement>(null),
    password: useRef<HTMLDivElement>(null),
    confirmPassword: useRef<HTMLDivElement>(null),
  }

  const scrollToFirstError = (errObj: Record<string, string>) => {
    const firstErrorKey = Object.keys(errObj)[0] as keyof typeof refs
    if (firstErrorKey && refs[firstErrorKey]?.current) {
      refs[firstErrorKey].current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      toast.error(`Please fix the errors to continue`)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
    if (errors[e.target.name]) {
      setErrors(prev => ({ ...prev, [e.target.name]: "" }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    let newErrors: Record<string, string> = {}

    if (!formData.name) newErrors.name = "Name is required"
    if (!formData.email) newErrors.email = "Email is required"
    if (!formData.phone) newErrors.phone = "Phone is required"
    if (!formData.password) newErrors.password = "Password is required"

    if (!/^[A-Za-z\s]{3,}$/.test(formData.name)) {
      newErrors.name = "Name must be at least 3 characters and contain only letters"
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    if (!emailRegex.test(formData.email)) {
      newErrors.email = "Please enter a valid email format"
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match"
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/
    if (!passwordRegex.test(formData.password)) {
      newErrors.password = "Password must be strong (8+ chars, uppercase, number, symbol)"
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      scrollToFirstError(newErrors)
      return
    }

    setIsLoading(true)

    if (!isOtpStep) {
      try {
        const response = await fetch(`${API_BASE_URL}/api/auth/send-otp`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: formData.email }),
        })

        const data = await response.json()
        if (!data.success) {
          throw new Error(data.message || "Failed to send OTP")
        }

        toast.success("Verification code sent to your email!", { autoClose: 10000 })
        setIsOtpStep(true)
      } catch (err: any) {
        toast.error(err.message)
      } finally {
        setIsLoading(false)
      }
      return
    }

    // Step 2
    if (!otpCode || otpCode.length !== 6) {
      toast.error("Please enter the 6-digit OTP code")
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: formData.name,
          email: formData.email,
          password: formData.password,
          phone: formData.phone,
          city: formData.city,
          otp_code: otpCode
        }),
      })

      const data = await response.json()

      if (!data.success) {
        if (data.field) {
          setErrors({ [data.field]: data.message })
          scrollToFirstError({ [data.field]: data.message })
        }
        throw new Error(data.message || "Registration failed")
      }

      toast.success(data.message)
      setTimeout(() => router.push("/login"), 1500)
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <Navbar />
      <div className="min-h-[85vh] bg-gradient-to-br from-slate-100 via-blue-50 to-slate-200 dark:from-[#0B1120] dark:via-[#020617] dark:to-[#0F172A] flex items-center justify-center px-4 py-16 relative overflow-hidden">
        {/* Decorative background blurs */}
        <div className="absolute top-[10%] left-[10%] p-32 bg-blue-400/20 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-[10%] right-[10%] p-32 bg-teal-400/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="w-full max-w-[480px] relative z-10">
          <div className="bg-white dark:bg-slate-800 border-2 border-white/40 dark:border-slate-700 rounded-3xl shadow-2xl shadow-blue-900/10 dark:shadow-none p-8 sm:p-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="mb-8 text-center">
              <div className="mx-auto w-12 h-12 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center mb-4 transform rotate-3 hover:rotate-0 transition-transform">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">Create Account</h1>
              <p className="text-slate-500 dark:text-slate-400 font-medium">Join Rahila Labs for exact diagnostics</p>
            </div>

            {!isOtpStep ? (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-1.5">
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 transition-colors focus-within:text-blue-600">Full Name</label>
                  <div className="relative group">
                    <input
                      ref={refs.name}
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 bg-slate-50 dark:bg-slate-950/50 border ${errors.name ? 'border-red-400 animate-shake focus:ring-red-500/20' : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'} dark:text-white rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all duration-300`}
                      placeholder="John Doe"
                    />
                    {!errors.name && formData.name.length > 2 && <CheckCircle2 className="absolute right-3.5 top-1/2 -translate-y-1/2 text-emerald-500 w-5 h-5 pointer-events-none animate-in zoom-in duration-300 drop-shadow-sm" />}
                  </div>
                  {errors.name && <p className="text-red-500 text-sm font-medium mt-1 animate-in fade-in">{errors.name}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 transition-colors focus-within:text-blue-600">Email Address</label>
                  <div className="relative group">
                    <input
                      ref={refs.email}
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={(e) => {
                        setFormData({ ...formData, email: e.target.value.toLowerCase() })
                        if (errors.email) setErrors(prev => ({ ...prev, email: "" }))
                      }}
                      className={`w-full px-4 py-3 bg-slate-50 dark:bg-slate-950/50 border ${errors.email ? 'border-red-400 animate-shake focus:ring-red-500/20' : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'} dark:text-white rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all duration-300`}
                      placeholder="you@example.com"
                    />
                    {!errors.email && formData.email.includes('@') && formData.email.includes('.') && <CheckCircle2 className="absolute right-3.5 top-1/2 -translate-y-1/2 text-emerald-500 w-5 h-5 pointer-events-none animate-in zoom-in duration-300 drop-shadow-sm" />}
                  </div>
                  {errors.email && <p className="text-red-500 text-sm font-medium mt-1 animate-in fade-in">{errors.email}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 transition-colors focus-within:text-blue-600">Phone Number</label>
                  <div className="relative group" ref={refs.phone}>
                    <div className={errors.phone ? "animate-shake" : ""}>
                      <PhoneInput
                        value={formData.phone}
                        onChange={(val) => {
                          setFormData({ ...formData, phone: val })
                          if (errors.phone) setErrors(prev => ({ ...prev, phone: "" }))
                        }}
                        className={`w-full bg-slate-50 dark:bg-slate-950/50 border ${errors.phone ? 'border-red-400 focus:ring-red-500/20' : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'} dark:text-white rounded-xl outline-none transition-all duration-300 [&>input]:bg-transparent [&>input]:py-3 [&>input]:border-none [&>input]:focus:ring-0`}
                      />
                    </div>
                    {!errors.phone && formData.phone.length >= 10 && <CheckCircle2 className="absolute right-3.5 top-1/2 -translate-y-1/2 text-emerald-500 w-5 h-5 pointer-events-none animate-in zoom-in duration-300 drop-shadow-sm" />}
                  </div>
                  {errors.phone && <p className="text-red-500 text-sm font-medium mt-1 animate-in fade-in">{errors.phone}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 transition-colors focus-within:text-blue-600">City</label>
                  <select
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 dark:text-white rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all duration-300 appearance-none font-medium cursor-pointer"
                  >
                    <option value="" disabled className="text-slate-400">Select your branch location</option>
                    {CITIES.map((city) => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                </div>

                <div ref={refs.password} className="space-y-1.5">
                  <div className="flex justify-between items-end mb-1">
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 transition-colors focus-within:text-blue-600">Password</label>
                    <span className="text-[10px] uppercase font-bold text-slate-500">8+ Chars & Symbols</span>
                  </div>
                  <div className={errors.password ? "animate-shake" : ""}>
                    <PasswordInput
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      showStrengthMeter={true}
                      className={`py-3 bg-slate-50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 rounded-xl transition-all duration-300 ${errors.password ? 'border-red-400 focus:ring-red-500/20 focus:border-red-500' : ''}`}
                    />
                  </div>
                  {errors.password && <p className="text-red-500 text-sm font-medium mt-1 animate-in fade-in">{errors.password}</p>}
                </div>

                <div ref={refs.confirmPassword} className="space-y-1.5">
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 transition-colors focus-within:text-blue-600">Confirm Password</label>
                  <div className={errors.confirmPassword ? "animate-shake" : ""}>
                    <PasswordInput
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className={`py-3 bg-slate-50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 rounded-xl transition-all duration-300 ${errors.confirmPassword ? 'border-red-400 focus:ring-red-500/20 focus:border-red-500' : ''}`}
                    />
                  </div>
                  {errors.confirmPassword && <p className="text-red-500 text-sm font-medium mt-1 animate-in fade-in">{errors.confirmPassword}</p>}
                </div>

                <SubmitButton isLoading={isLoading} type="submit" className="w-full mt-6 py-3.5 rounded-xl text-md font-bold shadow-lg shadow-blue-500/20 transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:hover:translate-y-0">
                  Send Verification Code
                </SubmitButton>
              </form>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in zoom-in-95 fill-mode-both duration-500">
                <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 text-center">
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Enter 6-digit Code</label>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-6">We securely sent a verification code to <span className="font-bold text-slate-700 dark:text-slate-200">{formData.email}</span></p>
                  <input
                    type="text"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    maxLength={6}
                    className="w-full px-4 py-4 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-center text-3xl font-mono tracking-widest transition-all shadow-inner"
                    placeholder="------"
                  />
                </div>
                <SubmitButton isLoading={isLoading} type="submit" className="w-full mt-4 py-3.5 rounded-xl text-md font-bold shadow-lg shadow-blue-500/20 transition-all hover:-translate-y-0.5">
                  Verify & Create Account
                </SubmitButton>
                <div className="text-center mt-4">
                  <button type="button" onClick={() => setIsOtpStep(false)} className="text-sm font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors underline decoration-slate-300 underline-offset-4">
                    Wait, let me edit my details
                  </button>
                </div>
              </form>
            )}

            <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 text-center">
              <p className="text-slate-500 dark:text-slate-400 font-medium">
                Already have an account?{" "}
                <Link href="/login" className="text-blue-600 hover:text-blue-700 hover:underline font-bold transition-colors decoration-2 underline-offset-2">
                  Sign in here
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
