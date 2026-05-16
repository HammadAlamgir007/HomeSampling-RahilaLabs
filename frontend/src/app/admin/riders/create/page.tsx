'use client'

import { useState } from 'react'
import { useStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Copy, CheckCircle, Eye, EyeOff, UserCheck } from 'lucide-react'
import Link from 'next/link'
import { API_BASE_URL } from "@/lib/api_config"

interface CreatedRider {
    name: string
    email: string
    password: string
    id: number
}

export default function CreateRiderPage() {
    const authToken = useStore((state) => state.authToken)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [createdRider, setCreatedRider] = useState<CreatedRider | null>(null)
    const [copiedField, setCopiedField] = useState<string | null>(null)
    const [showPassword, setShowPassword] = useState(false)
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: ''
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            const response = await fetch(`${API_BASE_URL}/api/admin/riders`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify(formData)
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.message || data.error || 'Failed to create rider')
            }

            // Success — show credentials panel instead of redirecting
            setCreatedRider({
                name: formData.name,
                email: formData.email,
                password: formData.password,
                id: data.rider?.id,
            })
        } catch (err: any) {
            setError(err.message || 'Failed to create rider')
        } finally {
            setLoading(false)
        }
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    const copyToClipboard = async (text: string, field: string) => {
        try {
            await navigator.clipboard.writeText(text)
            setCopiedField(field)
            setTimeout(() => setCopiedField(null), 2000)
        } catch {
            // fallback
        }
    }

    // ── Credentials Panel ─────────────────────────────────────────────────────
    if (createdRider) {
        return (
            <div className="p-6 max-w-2xl mx-auto space-y-6">
                <div className="flex items-center gap-4">
                    <div className="p-3 rounded-full bg-green-100">
                        <UserCheck className="h-8 w-8 text-green-600" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-green-700">Rider Created!</h1>
                        <p className="text-slate-500 mt-1">Share these credentials with <strong>{createdRider.name}</strong></p>
                    </div>
                </div>

                <Card className="border-green-200 bg-green-50">
                    <CardHeader>
                        <CardTitle className="text-green-800">🔐 Login Credentials</CardTitle>
                        <CardDescription className="text-green-700">
                            These credentials are shown <strong>only once</strong>. Make sure to share them with the rider securely.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Rider Name */}
                        <div className="space-y-1">
                            <Label className="text-slate-600 text-xs uppercase tracking-widest">Rider Name</Label>
                            <div className="flex items-center gap-2 bg-white border border-green-200 rounded-md px-3 py-2">
                                <span className="flex-1 font-medium">{createdRider.name}</span>
                                <span className="text-xs text-slate-400">ID #{createdRider.id}</span>
                            </div>
                        </div>

                        {/* Email */}
                        <div className="space-y-1">
                            <Label className="text-slate-600 text-xs uppercase tracking-widest">Email (Login Username)</Label>
                            <div className="flex items-center gap-2 bg-white border border-green-200 rounded-md px-3 py-2">
                                <span className="flex-1 font-mono text-sm">{createdRider.email}</span>
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => copyToClipboard(createdRider.email, 'email')}
                                    className="h-7 px-2"
                                >
                                    {copiedField === 'email'
                                        ? <CheckCircle className="h-4 w-4 text-green-600" />
                                        : <Copy className="h-4 w-4 text-slate-400" />}
                                </Button>
                            </div>
                        </div>

                        {/* Password */}
                        <div className="space-y-1">
                            <Label className="text-slate-600 text-xs uppercase tracking-widest">Password</Label>
                            <div className="flex items-center gap-2 bg-white border border-green-200 rounded-md px-3 py-2">
                                <span className="flex-1 font-mono text-sm">
                                    {showPassword ? createdRider.password : '•'.repeat(createdRider.password.length)}
                                </span>
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => setShowPassword(v => !v)}
                                    className="h-7 px-2"
                                >
                                    {showPassword
                                        ? <EyeOff className="h-4 w-4 text-slate-400" />
                                        : <Eye className="h-4 w-4 text-slate-400" />}
                                </Button>
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => copyToClipboard(createdRider.password, 'password')}
                                    className="h-7 px-2"
                                >
                                    {copiedField === 'password'
                                        ? <CheckCircle className="h-4 w-4 text-green-600" />
                                        : <Copy className="h-4 w-4 text-slate-400" />}
                                </Button>
                            </div>
                        </div>

                        {/* Copy All */}
                        <Button
                            type="button"
                            variant="outline"
                            className="w-full border-green-300 text-green-800 hover:bg-green-100"
                            onClick={() => copyToClipboard(
                                `Rider App Login Credentials\nName: ${createdRider.name}\nEmail: ${createdRider.email}\nPassword: ${createdRider.password}`,
                                'all'
                            )}
                        >
                            {copiedField === 'all'
                                ? <><CheckCircle className="h-4 w-4 mr-2 text-green-600" /> Copied!</>
                                : <><Copy className="h-4 w-4 mr-2" /> Copy All Credentials</>}
                        </Button>
                    </CardContent>
                </Card>

                <div className="flex gap-3">
                    <Link href="/admin/riders" className="flex-1">
                        <Button className="w-full bg-blue-900 hover:bg-blue-800">
                            Back to Riders List
                        </Button>
                    </Link>
                    <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                            setCreatedRider(null)
                            setFormData({ name: '', email: '', phone: '', password: '' })
                        }}
                    >
                        Add Another Rider
                    </Button>
                </div>
            </div>
        )
    }

    // ── Create Form ───────────────────────────────────────────────────────────
    return (
        <div className="p-6 max-w-2xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/admin/riders">
                    <Button variant="outline" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold">Add New Rider</h1>
                    <p className="text-gray-600 mt-1">Create a new rider account for sample collection</p>
                </div>
            </div>

            {/* Form Card */}
            <Card>
                <CardHeader>
                    <CardTitle>Rider Information</CardTitle>
                    <CardDescription>
                        After creation, you will see the login credentials to share with the rider.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                                {error}
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="name">Full Name *</Label>
                            <Input id="name" name="name" type="text" placeholder="e.g., Ahmed Khan"
                                value={formData.name} onChange={handleChange} required />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email">Email Address *</Label>
                            <Input id="email" name="email" type="email" placeholder="e.g., ahmed@example.com"
                                value={formData.email} onChange={handleChange} required />
                            <p className="text-sm text-gray-500">This will be the rider's login username</p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="phone">Phone Number *</Label>
                            <Input id="phone" name="phone" type="tel" placeholder="e.g., 03001234567"
                                value={formData.phone} onChange={handleChange} required />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password">Initial Password *</Label>
                            <Input id="password" name="password" type="text"
                                placeholder="Enter a password to share with the rider"
                                value={formData.password} onChange={handleChange} required minLength={6} />
                            <p className="text-sm text-gray-500">
                                Minimum 6 characters. Will be shown to you after creation.
                            </p>
                        </div>

                        <div className="flex gap-3 pt-4">
                            <Button type="submit" disabled={loading} className="flex-1">
                                {loading ? 'Creating...' : 'Create Rider & Show Credentials'}
                            </Button>
                            <Link href="/admin/riders" className="flex-1">
                                <Button type="button" variant="outline" className="w-full">Cancel</Button>
                            </Link>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
