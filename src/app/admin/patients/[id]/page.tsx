'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useStore } from '@/lib/store'
import { AdminSidebar } from '@/components/admin/admin-sidebar'
import { AdminNavbar } from '@/components/admin/admin-navbar'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { API_BASE_URL } from '@/lib/api_config'
import {
    ArrowLeft, User, Mail, Phone, MapPin, Calendar, Hash,
    CheckCircle, Clock, XCircle, AlertCircle, FileText, Bike
} from 'lucide-react'

interface Appointment {
    id: number
    booking_order_id: string | null
    test_name: string
    test_price: number | null
    status: string
    appointment_date: string | null
    address: string | null
    city: string | null
    created_at: string | null
    report_path: string | null
    rider_name: string | null
}

interface PatientDetail {
    patient: {
        id: number
        username: string
        email: string
        phone: string
        city: string
        mrn: string | null
        status: string
        is_verified: boolean
        created_at: string | null
    }
    stats: {
        total: number
        pending: number
        confirmed: number
        completed: number
        cancelled: number
    }
    appointments: Appointment[]
}

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; icon: any }> = {
    pending: { label: 'Pending', bg: 'bg-yellow-100 dark:bg-yellow-900', text: 'text-yellow-800 dark:text-yellow-200', icon: Clock },
    confirmed: { label: 'Confirmed', bg: 'bg-blue-100 dark:bg-blue-900', text: 'text-blue-800 dark:text-blue-200', icon: CheckCircle },
    collected: { label: 'Collected', bg: 'bg-purple-100 dark:bg-purple-900', text: 'text-purple-800 dark:text-purple-200', icon: CheckCircle },
    completed: { label: 'Completed', bg: 'bg-green-100 dark:bg-green-900', text: 'text-green-800 dark:text-green-200', icon: CheckCircle },
    cancelled: { label: 'Cancelled', bg: 'bg-red-100 dark:bg-red-900', text: 'text-red-800 dark:text-red-200', icon: XCircle },
    assigned_to_rider: { label: 'Assigned to Rider', bg: 'bg-indigo-100 dark:bg-indigo-900', text: 'text-indigo-800 dark:text-indigo-200', icon: Bike },
    rider_accepted: { label: 'Rider Accepted', bg: 'bg-indigo-100 dark:bg-indigo-900', text: 'text-indigo-800 dark:text-indigo-200', icon: Bike },
    rider_on_way: { label: 'Rider On Way', bg: 'bg-indigo-100 dark:bg-indigo-900', text: 'text-indigo-800 dark:text-indigo-200', icon: Bike },
    sample_collected: { label: 'Sample Collected', bg: 'bg-teal-100 dark:bg-teal-900', text: 'text-teal-800 dark:text-teal-200', icon: CheckCircle },
    delivered_to_lab: { label: 'Delivered to Lab', bg: 'bg-green-100 dark:bg-green-900', text: 'text-green-800 dark:text-green-200', icon: CheckCircle },
}

function StatusBadge({ status }: { status: string }) {
    const cfg = STATUS_CONFIG[status] ?? { label: status, bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-800 dark:text-gray-200', icon: AlertCircle }
    const Icon = cfg.icon
    return (
        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text}`}>
            <Icon className="w-3 h-3" />
            {cfg.label}
        </span>
    )
}

function formatDate(iso: string | null) {
    if (!iso) return '—'
    return new Date(iso).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function PatientDetailPage() {
    const params = useParams()
    const router = useRouter()
    const { authToken } = useStore()
    const [data, setData] = useState<PatientDetail | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        const fetchDetail = async () => {
            if (!authToken || !params.id) return
            try {
                const res = await fetch(`${API_BASE_URL}/api/admin/patients/${params.id}`, {
                    headers: { Authorization: `Bearer ${authToken}` }
                })
                if (!res.ok) throw new Error('Failed to load patient details')
                const json = await res.json()
                setData(json)
            } catch (err: any) {
                setError(err.message || 'Error loading patient')
            } finally {
                setLoading(false)
            }
        }
        fetchDetail()
    }, [authToken, params.id])

    return (
        <div className="flex">
            <AdminSidebar />
            <div className="flex-1 md:ml-64 transition-all duration-300">
                <AdminNavbar />
                <main className="p-4 md:p-8 bg-slate-50 dark:bg-slate-950 min-h-screen">
                    <div className="max-w-6xl mx-auto space-y-6">

                        {/* Back button */}
                        <Button
                            variant="outline"
                            onClick={() => router.push('/admin/patients')}
                            className="flex items-center gap-2"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back to Patients
                        </Button>

                        {loading && (
                            <div className="flex justify-center items-center h-64">
                                <div className="text-slate-500 dark:text-slate-400 text-lg">Loading patient details...</div>
                            </div>
                        )}

                        {error && (
                            <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg">
                                {error}
                            </div>
                        )}

                        {data && (
                            <>
                                {/* Profile Card */}
                                <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                                    <CardHeader className="border-b border-slate-100 dark:border-slate-800">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="w-16 h-16 rounded-full bg-blue-900 flex items-center justify-center text-white text-2xl font-bold">
                                                    {data.patient.username.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <CardTitle className="text-2xl text-slate-900 dark:text-white">{data.patient.username}</CardTitle>
                                                    <CardDescription className="mt-1 flex items-center gap-1">
                                                        <Hash className="w-3.5 h-3.5" />
                                                        MRN: {data.patient.mrn ?? 'Not assigned'}
                                                    </CardDescription>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end gap-2">
                                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${data.patient.status === 'active'
                                                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                                        : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                                                    }`}>
                                                    {data.patient.status}
                                                </span>
                                                {data.patient.is_verified && (
                                                    <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                                                        <CheckCircle className="w-3.5 h-3.5" /> Verified
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="pt-6">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                            <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                                                <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                                                <span className="truncate">{data.patient.email}</span>
                                            </div>
                                            <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                                                <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                                                <span>{data.patient.phone || '—'}</span>
                                            </div>
                                            <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                                                <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                                                <span>{data.patient.city || '—'}</span>
                                            </div>
                                            <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                                                <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                                                <span>Registered: {formatDate(data.patient.created_at)}</span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Stats Bar */}
                                <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                                    {[
                                        { label: 'Total Bookings', value: data.stats.total, color: 'text-slate-900 dark:text-white' },
                                        { label: 'Pending', value: data.stats.pending, color: 'text-yellow-600' },
                                        { label: 'Confirmed', value: data.stats.confirmed, color: 'text-blue-600' },
                                        { label: 'Completed', value: data.stats.completed, color: 'text-green-600' },
                                        { label: 'Cancelled', value: data.stats.cancelled, color: 'text-red-600' },
                                    ].map(stat => (
                                        <Card key={stat.label} className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                                            <CardContent className="pt-5 pb-5 text-center">
                                                <div className={`text-3xl font-bold ${stat.color}`}>{stat.value}</div>
                                                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{stat.label}</div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>

                                {/* Appointment History */}
                                <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                                    <CardHeader className="border-b border-slate-100 dark:border-slate-800">
                                        <CardTitle className="text-lg flex items-center gap-2">
                                            <FileText className="w-5 h-5" />
                                            Appointment History
                                        </CardTitle>
                                        <CardDescription>{data.appointments.length} booking{data.appointments.length !== 1 ? 's' : ''} found</CardDescription>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                        {data.appointments.length === 0 ? (
                                            <div className="text-center py-16 text-slate-400 dark:text-slate-500">
                                                <Calendar className="w-10 h-10 mx-auto mb-3 opacity-40" />
                                                <p>No appointments yet</p>
                                            </div>
                                        ) : (
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-sm">
                                                    <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                                                        <tr>
                                                            <th className="px-5 py-3 text-left font-semibold text-slate-700 dark:text-slate-300">#</th>
                                                            <th className="px-5 py-3 text-left font-semibold text-slate-700 dark:text-slate-300">Test</th>
                                                            <th className="px-5 py-3 text-left font-semibold text-slate-700 dark:text-slate-300">Booking Date</th>
                                                            <th className="px-5 py-3 text-left font-semibold text-slate-700 dark:text-slate-300">Appointment Date</th>
                                                            <th className="px-5 py-3 text-left font-semibold text-slate-700 dark:text-slate-300">Address</th>
                                                            <th className="px-5 py-3 text-left font-semibold text-slate-700 dark:text-slate-300">Rider</th>
                                                            <th className="px-5 py-3 text-left font-semibold text-slate-700 dark:text-slate-300">Price</th>
                                                            <th className="px-5 py-3 text-left font-semibold text-slate-700 dark:text-slate-300">Status</th>
                                                            <th className="px-5 py-3 text-left font-semibold text-slate-700 dark:text-slate-300">Report</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {data.appointments.map((appt, index) => (
                                                            <tr
                                                                key={appt.id}
                                                                className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                                                            >
                                                                <td className="px-5 py-4 text-slate-400 dark:text-slate-500 text-xs">
                                                                    {appt.booking_order_id ?? `#${appt.id}`}
                                                                </td>
                                                                <td className="px-5 py-4 font-medium text-slate-900 dark:text-white">
                                                                    {appt.test_name}
                                                                    {appt.test_price && (
                                                                        <div className="text-xs text-slate-400 dark:text-slate-500">PKR {appt.test_price}</div>
                                                                    )}
                                                                </td>
                                                                <td className="px-5 py-4 text-slate-600 dark:text-slate-400">
                                                                    {formatDate(appt.created_at)}
                                                                </td>
                                                                <td className="px-5 py-4 text-slate-600 dark:text-slate-400">
                                                                    {formatDate(appt.appointment_date)}
                                                                </td>
                                                                <td className="px-5 py-4 text-slate-600 dark:text-slate-400 max-w-[180px]">
                                                                    <span className="line-clamp-2">{appt.address ?? '—'}</span>
                                                                </td>
                                                                <td className="px-5 py-4 text-slate-600 dark:text-slate-400">
                                                                    {appt.rider_name ? (
                                                                        <span className="flex items-center gap-1">
                                                                            <Bike className="w-3.5 h-3.5 text-indigo-500" />
                                                                            {appt.rider_name}
                                                                        </span>
                                                                    ) : '—'}
                                                                </td>
                                                                <td className="px-5 py-4 text-slate-600 dark:text-slate-400">
                                                                    {appt.test_price ? `PKR ${appt.test_price}` : '—'}
                                                                </td>
                                                                <td className="px-5 py-4">
                                                                    <StatusBadge status={appt.status} />
                                                                </td>
                                                                <td className="px-5 py-4">
                                                                    {appt.report_path ? (
                                                                        <a
                                                                            href={`${API_BASE_URL}/uploads/reports/${appt.report_path}`}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline text-xs"
                                                                        >
                                                                            <FileText className="w-3.5 h-3.5" />
                                                                            View
                                                                        </a>
                                                                    ) : (
                                                                        <span className="text-slate-400 dark:text-slate-500 text-xs">—</span>
                                                                    )}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </>
                        )}
                    </div>
                </main>
            </div>
        </div>
    )
}
