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

                document.cookie = `admin_token=${data.token}; path=/; max-age=86400;`
                document.cookie = `admin_role=admin; path=/; max-age=86400;`

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
        <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex items-center justify-center p-4 transition-colors duration-500">
            <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in duration-500">
                <div className="bg-blue-900 dark:bg-blue-950 p-8 text-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.1),transparent)] pointer-events-none" />
                    <div className="mx-auto bg-blue-800/50 dark:bg-blue-900/50 w-16 h-16 rounded-2xl flex items-center justify-center mb-4 backdrop-blur-sm border border-white/10">
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
                            <label htmlFor="username" className="block text-sm font-bold text-slate-700 dark:text-slate-300">Username</label>
                            <Input
                                id="username"
                                type="text"
                                placeholder="Enter admin username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-blue-500 rounded-xl"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="password" className="block text-sm font-bold text-slate-700 dark:text-slate-300">Password</label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-blue-500 rounded-xl"
                                required
                            />
                        </div>

                        <Button type="submit" className="w-full bg-blue-900 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-500 h-12 rounded-xl text-lg font-bold shadow-lg shadow-blue-500/20" disabled={loading}>
                            {loading ? "Authenticating..." : "Login to Dashboard"}
                        </Button>
                    </form>
                </div>

                <div className="bg-slate-50 dark:bg-slate-950/50 p-4 text-center text-xs text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800">
                    Authorized personnel only. All activities are monitored.
                </div>
            </div>
        </div>
    )
}
