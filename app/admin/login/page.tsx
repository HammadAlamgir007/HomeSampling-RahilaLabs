"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useStore } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Lock, ShieldCheck } from "lucide-react"
import { API_BASE_URL } from "@/lib/api_config"

export default function AdminLoginPage() {
    const router = useRouter()
    const setAuthToken = useStore((state) => state.setAuthToken)
    const setAdmin = useStore((state) => state.setAdmin)
    const setUserRole = useStore((state) => state.setUserRole)

    const [username, setUsername] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")
        setLoading(true)

        try {
            const res = await fetch(`${API_BASE_URL}/api/admin/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password }),
            })

            const data = await res.json()

            if (res.ok) {
                setAuthToken(data.token)
                setAdmin(data.user)
                setUserRole("admin")
                router.push("/admin")
            } else {
                setError(data.error || "Invalid credentials")
            }
        } catch (err) {
            setError("Failed to connect to server")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-md rounded-lg shadow-2xl overflow-hidden">
                <div className="bg-blue-900 p-8 text-center">
                    <div className="mx-auto bg-blue-800 w-16 h-16 rounded-full flex items-center justify-center mb-4">
                        <ShieldCheck className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-white">Admin Portal</h1>
                    <p className="text-blue-200 mt-2">Restricted Access Only</p>
                </div>

                <div className="p-8">
                    <form onSubmit={handleLogin} className="space-y-6">
                        {error && (
                            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center font-medium">
                                {error}
                            </div>
                        )}

                        <div className="space-y-2">
                            <label htmlFor="username" className="block text-sm font-medium text-gray-700">Username</label>
                            <Input
                                id="username"
                                type="text"
                                placeholder="Enter admin username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>

                        <Button type="submit" className="w-full bg-blue-900 hover:bg-blue-800" disabled={loading}>
                            {loading ? "Authenticating..." : "Login to Dashboard"}
                        </Button>
                    </form>
                </div>

                <div className="bg-gray-50 p-4 text-center text-xs text-gray-500 border-t border-gray-100">
                    Authorized personnel only. All activities are monitored.
                </div>
            </div>
        </div>
    )
}
