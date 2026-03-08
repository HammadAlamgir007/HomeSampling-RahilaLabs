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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Account</h1>
              <p className="text-gray-600">Join Rahila Labs for easy home sample collection</p>
            </div>

            {!isOtpStep ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <div className="relative">
                    <input
                      ref={refs.name}
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className={`w-full px-4 py-2 border ${errors.name ? 'border-red-400' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none`}
                      placeholder="John Doe"
                    />
                    {!errors.name && formData.name.length > 2 && <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500 w-5 h-5" />}
                  </div>
                  {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                  <p className="text-xs text-gray-500 mb-1">Format: example@domain.com</p>
                  <div className="relative">
                    <input
                      ref={refs.email}
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={(e) => {
                        setFormData({ ...formData, email: e.target.value.toLowerCase() })
                        if (errors.email) setErrors(prev => ({ ...prev, email: "" }))
                      }}
                      className={`w-full px-4 py-2 border ${errors.email ? 'border-red-400' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none`}
                      placeholder="you@example.com"
                    />
                    {!errors.email && formData.email.includes('@') && formData.email.includes('.') && <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500 w-5 h-5" />}
                  </div>
                  {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                  <p className="text-xs text-gray-500 mb-1">Format: 03XX XXXXXXX</p>
                  <div className="relative" ref={refs.phone}>
                    <PhoneInput
                      value={formData.phone}
                      onChange={(val) => {
                        setFormData({ ...formData, phone: val })
                        if (errors.phone) setErrors(prev => ({ ...prev, phone: "" }))
                      }}
                      className={errors.phone ? 'border-red-400' : 'border-gray-300'}
                    />
                    {!errors.phone && formData.phone.length >= 10 && <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500 w-5 h-5" />}
                  </div>
                  {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                  <select
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  >
                    <option value="">Select City</option>
                    <option value="Islamabad">Islamabad</option>
                    <option value="Lahore">Lahore</option>
                    <option value="Sialkot">Sialkot</option>
                    <option value="Rawalpindi">Rawalpindi</option>
                    <option value="Karachi">Karachi</option>
                  </select>
                </div>

                <div ref={refs.password}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <p className="text-xs text-gray-500 mb-1">At least 8 chars, include uppercase, number {"&"} symbol</p>
                  <PasswordInput
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    showStrengthMeter={true}
                    className={errors.password ? "border-red-400" : ""}
                  />
                  {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
                </div>

                <div ref={refs.confirmPassword}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                  <PasswordInput
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className={errors.confirmPassword ? "border-red-400" : ""}
                  />
                  {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>}
                </div>

                <SubmitButton isLoading={isLoading} type="submit">
                  Send Verification Code
                </SubmitButton>
              </form>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Enter 6-digit Code</label>
                  <p className="text-sm text-gray-500 mb-4">We sent a verification code to <strong>{formData.email}</strong></p>
                  <input
                    type="text"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    maxLength={6}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-center text-xl tracking-widest"
                    placeholder="000000"
                  />
                </div>
                <SubmitButton isLoading={isLoading} type="submit" className="mt-4">
                  Verify & Create Account
                </SubmitButton>
                <div className="text-center mt-4">
                  <button type="button" onClick={() => setIsOtpStep(false)} className="text-sm text-blue-600 hover:underline">
                    Back to edit details
                  </button>
                </div>
              </form>
            )}

            <div className="mt-6 text-center">
              <p className="text-gray-600">
                Already have an account?{" "}
                <Link href="/login" className="text-blue-600 hover:underline font-semibold">
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
