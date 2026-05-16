"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import { API_BASE_URL } from "@/lib/api_config"

export default function ForgotPasswordPage() {
    const router = useRouter()
    const [step, setStep] = useState<"email" | "reset">("email")
    const [email, setEmail] = useState("")
    const [otpCode, setOtpCode] = useState("")
    const [newPassword, setNewPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [error, setError] = useState("")
    const [message, setMessage] = useState("")
    const [isLoading, setIsLoading] = useState(false)

    const handleSendOtp = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")
        setMessage("")
        setIsLoading(true)

        if (!email) {
            setError("Please enter your email address")
            setIsLoading(false)
            return
        }

        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            })
            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || "Failed to process request")
            }

            setMessage(data.message || "If the email is registered, you will receive a reset code shortly.")
            setStep("reset")
        } catch (err: any) {
            setError(err.message)
        } finally {
            setIsLoading(false)
        }
    }

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")
        setMessage("")
        setIsLoading(true)

        if (!otpCode || !newPassword || !confirmPassword) {
            setError("Please fill in all fields")
            setIsLoading(false)
            return
        }

        if (newPassword !== confirmPassword) {
            setError("Passwords do not match")
            setIsLoading(false)
            return
        }

        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/
        if (!passwordRegex.test(newPassword)) {
            setError("Password must be at least 8 characters long, including an uppercase letter, a lowercase letter, a number, and a special character.")
            setIsLoading(false)
            return
        }

        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, otp_code: otpCode, new_password: newPassword }),
            })
            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || "Failed to reset password")
            }

            setMessage("Password successfully reset. Redirecting to login...")
            setTimeout(() => {
                router.push("/login")
            }, 2000)
        } catch (err: any) {
            setError(err.message)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <>
            <Navbar />
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-950 dark:to-slate-900 transition-colors duration-300 flex items-center justify-center px-4 py-12">
                <div className="w-full max-w-md">
                    <div className="bg-white dark:bg-slate-950 dark:border dark:border-slate-800 rounded-lg shadow-lg p-8">
                        <div className="mb-8">
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Reset Password</h1>
                            <p className="text-gray-600 dark:text-slate-400">
                                {step === "email" ? "Enter your email to receive a reset code" : "Enter your reset code and new password"}
                            </p>
                        </div>

                        {error && <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">{error}</div>}
                        {message && <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">{message}</div>}

                        {step === "email" ? (
                            <form onSubmit={handleSendOtp} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Email Address</label>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 dark:bg-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                        placeholder="you@example.com"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition disabled:opacity-50"
                                >
                                    {isLoading ? "Sending..." : "Send Reset Code"}
                                </button>
                            </form>
                        ) : (
                            <form onSubmit={handleResetPassword} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">6-digit Code</label>
                                    <input
                                        type="text"
                                        maxLength={6}
                                        value={otpCode}
                                        onChange={(e) => setOtpCode(e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 dark:bg-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-center tracking-widest text-lg"
                                        placeholder="000000"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">New Password</label>
                                    <input
                                        type="password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 dark:bg-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                        placeholder="••••••••"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Confirm New Password</label>
                                    <input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 dark:bg-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                        placeholder="••••••••"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition disabled:opacity-50"
                                >
                                    {isLoading ? "Resetting..." : "Reset Password"}
                                </button>
                                <div className="text-center mt-2">
                                    <button type="button" onClick={() => setStep("email")} className="text-sm text-blue-600 hover:underline">
                                        Back to email entry
                                    </button>
                                </div>
                            </form>
                        )}

                        <div className="mt-6 text-center">
                            <p className="text-gray-600 dark:text-slate-400">
                                Remember your password?{" "}
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
