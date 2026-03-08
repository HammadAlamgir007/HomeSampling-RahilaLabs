'use client'

import { useState, useEffect } from 'react'
import { useStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
    Plus, MapPin, Phone, Mail, TrendingUp, Search,
    ListTodo, ChevronDown, ChevronUp, ExternalLink, RefreshCw
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { AdminNavbar } from "@/components/admin/admin-navbar"
import { API_BASE_URL } from "@/lib/api_config"

interface ActiveTask {
    id: number
    booking_order_id?: string
    status: string
    address?: string
    appointment_date?: string
    pickup_deadline?: string
    delivery_deadline?: string
    user?: { username: string }
    patient_name?: string
}

interface Rider {
    id: number
    name: string
    email: string
    phone: string
    availability_status: 'available' | 'busy' | 'offline'
    gps_latitude: number | null
    gps_longitude: number | null
    last_location_update: string | null
    stats?: {
        completed_tasks: number
        pending_tasks: number
    }
    activeTasks?: ActiveTask[]
    activeTasksLoading?: boolean
    activeTasksExpanded?: boolean
}

export default function RidersPage() {
    const authToken = useStore((state) => state.authToken)
    const [riders, setRiders] = useState<Rider[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [searchTerm, setSearchTerm] = useState('')

    useEffect(() => {
        fetchRiders()
    }, [])

    const fetchRiders = async () => {
        try {
            if (!authToken) {
                setError('Not authenticated. Please login again.')
                setLoading(false)
                return
            }
            const response = await fetch(`${API_BASE_URL}/api/admin/riders`, {
                headers: { 'Authorization': `Bearer ${authToken}` }
            })
            if (!response.ok) {
                if (response.status === 401 || response.status === 403) {
                    throw new Error('Authentication failed. Please login again.')
                }
                throw new Error('Failed to fetch riders')
            }
            const data = await response.json()
            setRiders((data.riders || []).map((r: Rider) => ({ ...r, activeTasksExpanded: false })))
            setError('')
        } catch (err: any) {
            setError(err.message || 'Failed to load riders')
        } finally {
            setLoading(false)
        }
    }

    const toggleActiveTasks = async (riderId: number) => {
        setRiders(prev => prev.map(r => {
            if (r.id !== riderId) return r
            // If already expanded, collapse
            if (r.activeTasksExpanded) return { ...r, activeTasksExpanded: false }
            // If already loaded, just expand
            if (r.activeTasks !== undefined) return { ...r, activeTasksExpanded: true }
            // Need to load
            return { ...r, activeTasksLoading: true, activeTasksExpanded: true }
        }))

        const rider = riders.find(r => r.id === riderId)
        if (!rider || rider.activeTasks !== undefined) return

        try {
            const res = await fetch(`${API_BASE_URL}/api/admin/riders/${riderId}/active-tasks`, {
                headers: { 'Authorization': `Bearer ${authToken}` }
            })
            const data = await res.json()
            setRiders(prev => prev.map(r =>
                r.id === riderId
                    ? { ...r, activeTasks: data.tasks || [], activeTasksLoading: false }
                    : r
            ))
        } catch {
            setRiders(prev => prev.map(r =>
                r.id === riderId
                    ? { ...r, activeTasks: [], activeTasksLoading: false }
                    : r
            ))
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'available': return 'bg-green-500 hover:bg-green-600'
            case 'busy': return 'bg-amber-500 hover:bg-amber-600'
            case 'offline': return 'bg-slate-400 hover:bg-slate-500'
            default: return 'bg-slate-400'
        }
    }

    const getTaskStatusLabel = (status: string) => {
        const labels: Record<string, string> = {
            rider_accepted: 'Accepted',
            rider_on_way: 'On Way',
            rider_arrived: 'Arrived',
            sample_collected: 'Sample Collected',
        }
        return labels[status] || status
    }

    const getTaskStatusColor = (status: string) => {
        switch (status) {
            case 'rider_accepted': return 'bg-blue-100 text-blue-800'
            case 'rider_on_way': return 'bg-purple-100 text-purple-800'
            case 'rider_arrived': return 'bg-orange-100 text-orange-800'
            case 'sample_collected': return 'bg-green-100 text-green-800'
            default: return 'bg-slate-100 text-slate-700'
        }
    }

    const formatDateTime = (dt?: string | null) => {
        if (!dt) return '—'
        return new Date(dt).toLocaleString('en-PK', { dateStyle: 'short', timeStyle: 'short' })
    }

    const filteredRiders = riders.filter(r =>
        r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.availability_status.toLowerCase().includes(searchTerm.toLowerCase())
    )

    if (loading) {
        return (
            <div className="flex">
                <AdminSidebar />
                <div className="flex-1 md:ml-64 transition-all duration-300">
                    <AdminNavbar />
                    <main className="p-4 md:p-8 bg-slate-50 dark:bg-slate-950 min-h-screen flex items-center justify-center">
                        <div className="text-lg">Loading riders...</div>
                    </main>
                </div>
            </div>
        )
    }

    return (
        <div className="flex">
            <AdminSidebar />
            <div className="flex-1 md:ml-64 transition-all duration-300">
                <AdminNavbar />
                <main className="p-4 md:p-8 bg-slate-50 dark:bg-slate-950 min-h-screen">
                    <div className="max-w-7xl mx-auto space-y-6">
                        {/* Header */}
                        <div className="flex justify-between items-center">
                            <div>
                                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Rider Management</h1>
                                <p className="text-slate-600 dark:text-slate-400 mt-1">Monitor and manage sample collection riders</p>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" onClick={fetchRiders} className="flex items-center gap-2">
                                    <RefreshCw className="h-4 w-4" />
                                    Refresh
                                </Button>
                                <Link href="/admin/riders/create">
                                    <Button className="flex items-center gap-2 bg-blue-900 hover:bg-blue-800">
                                        <Plus className="h-4 w-4" />
                                        Add New Rider
                                    </Button>
                                </Link>
                            </div>
                        </div>

                        {/* Stats Cards */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                                <CardHeader className="pb-2">
                                    <CardDescription>Total Riders</CardDescription>
                                    <CardTitle className="text-3xl">{riders.length}</CardTitle>
                                </CardHeader>
                            </Card>
                            <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                                <CardHeader className="pb-2">
                                    <CardDescription>Available</CardDescription>
                                    <CardTitle className="text-3xl text-green-600">
                                        {riders.filter(r => r.availability_status === 'available').length}
                                    </CardTitle>
                                </CardHeader>
                            </Card>
                            <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                                <CardHeader className="pb-2">
                                    <CardDescription>Busy (can get more tasks)</CardDescription>
                                    <CardTitle className="text-3xl text-amber-600">
                                        {riders.filter(r => r.availability_status === 'busy').length}
                                    </CardTitle>
                                </CardHeader>
                            </Card>
                            <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                                <CardHeader className="pb-2">
                                    <CardDescription>Offline</CardDescription>
                                    <CardTitle className="text-3xl text-slate-500">
                                        {riders.filter(r => r.availability_status === 'offline').length}
                                    </CardTitle>
                                </CardHeader>
                            </Card>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                                {error}
                            </div>
                        )}

                        {/* Search Bar */}
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-2.5 w-5 h-5 text-slate-400" />
                                <Input
                                    placeholder="Search by name, email, phone, or status..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10 bg-slate-50 dark:bg-slate-800 border-0"
                                />
                            </div>
                        </div>

                        {/* Riders List */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {filteredRiders.map((rider) => (
                                <Card key={rider.id} className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:shadow-lg transition-shadow">
                                    <CardHeader className="pb-3">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <CardTitle className="text-xl flex items-center gap-2">
                                                    {rider.name}
                                                </CardTitle>
                                                <CardDescription className="mt-1">ID: #{rider.id}</CardDescription>
                                            </div>
                                            <div className="flex flex-col items-end gap-1">
                                                <Badge className={`${getStatusColor(rider.availability_status)} text-white`}>
                                                    {rider.availability_status === 'available' ? '🟢 Online' :
                                                        rider.availability_status === 'busy' ? '🟡 Busy' : '⚫ Offline'}
                                                </Badge>
                                                {rider.availability_status === 'busy' && rider.stats && (
                                                    <span className="text-xs text-amber-600 font-medium">
                                                        {rider.stats.pending_tasks} active task{rider.stats.pending_tasks !== 1 ? 's' : ''}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </CardHeader>

                                    <CardContent className="space-y-3">
                                        {/* Contact Info */}
                                        <div className="space-y-1.5 text-sm">
                                            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                                                <Mail className="h-4 w-4 flex-shrink-0" />
                                                <span className="truncate">{rider.email}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                                                <Phone className="h-4 w-4 flex-shrink-0" />
                                                <span>{rider.phone}</span>
                                            </div>
                                            {rider.gps_latitude && rider.gps_longitude ? (
                                                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                                                    <MapPin className="h-4 w-4 flex-shrink-0 text-blue-500" />
                                                    <a
                                                        href={`https://www.google.com/maps?q=${rider.gps_latitude},${rider.gps_longitude}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-blue-600 hover:underline flex items-center gap-1 text-xs"
                                                    >
                                                        {rider.gps_latitude.toFixed(4)}, {rider.gps_longitude.toFixed(4)}
                                                        <ExternalLink className="h-3 w-3" />
                                                    </a>
                                                    {rider.last_location_update && (
                                                        <span className="text-xs text-slate-400">
                                                            (updated {formatDateTime(rider.last_location_update)})
                                                        </span>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2 text-slate-400">
                                                    <MapPin className="h-4 w-4 flex-shrink-0" />
                                                    <span className="text-xs italic">Location not available</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Stats */}
                                        {rider.stats && (
                                            <div className="flex gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                                                <div className="flex items-center gap-2">
                                                    <TrendingUp className="h-4 w-4 text-green-600" />
                                                    <div>
                                                        <div className="text-xs text-slate-500">Completed</div>
                                                        <div className="font-semibold text-sm">{rider.stats.completed_tasks}</div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <ListTodo className="h-4 w-4 text-amber-500" />
                                                    <div>
                                                        <div className="text-xs text-slate-500">Active Tasks</div>
                                                        <div className="font-semibold text-sm">{rider.stats.pending_tasks}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Active Tasks Expandable */}
                                        {(rider.stats?.pending_tasks ?? 0) > 0 && (
                                            <div>
                                                <button
                                                    onClick={() => toggleActiveTasks(rider.id)}
                                                    className="w-full flex items-center justify-between text-sm text-blue-700 dark:text-blue-400 hover:text-blue-900 font-medium py-1.5 border border-blue-200 dark:border-blue-800 rounded-md px-3 bg-blue-50 dark:bg-blue-950"
                                                >
                                                    <span>View Assigned Tasks</span>
                                                    {rider.activeTasksExpanded
                                                        ? <ChevronUp className="h-4 w-4" />
                                                        : <ChevronDown className="h-4 w-4" />
                                                    }
                                                </button>

                                                {rider.activeTasksExpanded && (
                                                    <div className="mt-2 space-y-2">
                                                        {rider.activeTasksLoading ? (
                                                            <div className="text-xs text-slate-500 text-center py-2">Loading tasks…</div>
                                                        ) : (rider.activeTasks || []).length === 0 ? (
                                                            <div className="text-xs text-slate-500 text-center py-2">No active tasks</div>
                                                        ) : (
                                                            (rider.activeTasks || []).map(task => (
                                                                <div key={task.id} className="bg-slate-50 dark:bg-slate-800 rounded-md p-2.5 text-xs space-y-1">
                                                                    <div className="flex justify-between items-center">
                                                                        <span className="font-semibold">#{task.id} — {task.user?.username || 'Patient'}</span>
                                                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getTaskStatusColor(task.status)}`}>
                                                                            {getTaskStatusLabel(task.status)}
                                                                        </span>
                                                                    </div>
                                                                    {task.address && (
                                                                        <div className="text-slate-500 truncate">{task.address}</div>
                                                                    )}
                                                                    {task.pickup_deadline && (
                                                                        <div className="text-slate-400">Pickup by: {formatDateTime(task.pickup_deadline)}</div>
                                                                    )}
                                                                </div>
                                                            ))
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Actions */}
                                        <div className="flex gap-2 pt-1">
                                            <Link href={`/admin/riders/${rider.id}`} className="flex-1">
                                                <Button variant="outline" className="w-full text-sm">View Details</Button>
                                            </Link>
                                            <Link href={`/admin/appointments?rider=${rider.id}`} className="flex-1">
                                                <Button variant="outline" className="w-full text-sm text-blue-700 border-blue-300 hover:bg-blue-50">
                                                    Assign Task
                                                </Button>
                                            </Link>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        {/* Empty State */}
                        {filteredRiders.length === 0 && !loading && (
                            <Card className="p-12 text-center bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                                <CardTitle className="text-xl mb-2">
                                    {searchTerm ? 'No riders match your search' : 'No Riders Found'}
                                </CardTitle>
                                <CardDescription className="mb-4">
                                    {searchTerm ? 'Try a different name, email, or phone number.' : 'Get started by adding your first rider'}
                                </CardDescription>
                                <Link href="/admin/riders/create">
                                    <Button className="bg-blue-900 hover:bg-blue-800">
                                        <Plus className="h-4 w-4 mr-2" />
                                        Add First Rider
                                    </Button>
                                </Link>
                            </Card>
                        )}
                    </div>
                </main>
            </div>
        </div>
    )
}
