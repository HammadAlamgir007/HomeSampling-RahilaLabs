'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, MapPin, Phone, Mail, TrendingUp, Clock, CheckCircle, XCircle } from 'lucide-react'
import Link from 'next/link'

interface RiderPerformance {
    rider: {
        id: number
        name: string
        email: string
        phone: string
        availability_status: string
        gps_latitude: number | null
        gps_longitude: number | null
    }
    performance: {
        total_assigned: number
        completed: number
        rejected: number
        in_progress: number
        success_rate: number
        avg_completion_time_hours: number | null
    }
}

export default function RiderDetailPage() {
    const params = useParams()
    const router = useRouter()
    const authToken = useStore((state) => state.authToken)
    const riderId = params.id as string

    const [data, setData] = useState<RiderPerformance | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        fetchRiderPerformance()
    }, [riderId])

    const fetchRiderPerformance = async () => {
        try {
            const response = await fetch(`http://localhost:5000/api/admin/riders/${riderId}/performance`, {
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            })

            if (!response.ok) throw new Error('Failed to fetch rider data')

            const result = await response.json()
            setData(result)
        } catch (err) {
            setError('Failed to load rider information')
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this rider? This action cannot be undone.')) {
            return
        }

        try {
            const response = await fetch(`http://localhost:5000/api/admin/riders/${riderId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            })

            if (!response.ok) {
                const data = await response.json()
                throw new Error(data.error || 'Failed to delete rider')
            }

            router.push('/admin/riders')
        } catch (err: any) {
            alert(err.message || 'Failed to delete rider')
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'available': return 'bg-green-500'
            case 'busy': return 'bg-yellow-500'
            case 'offline': return 'bg-gray-500'
            default: return 'bg-gray-500'
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-lg">Loading rider details...</div>
            </div>
        )
    }

    if (error || !data) {
        return (
            <div className="p-6">
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                    {error || 'Rider not found'}
                </div>
            </div>
        )
    }

    const { rider, performance } = data

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/admin/riders">
                        <Button variant="outline" size="icon">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold">{rider.name}</h1>
                        <p className="text-gray-600 mt-1">Rider ID: #{rider.id}</p>
                    </div>
                    <Badge className={getStatusColor(rider.availability_status)}>
                        {rider.availability_status.toUpperCase()}
                    </Badge>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={handleDelete} className="text-red-600">
                        Delete Rider
                    </Button>
                </div>
            </div>

            {/* Contact & Location Info */}
            <Card>
                <CardHeader>
                    <CardTitle>Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3">
                        <Mail className="h-5 w-5 text-gray-500" />
                        <div>
                            <div className="text-sm text-gray-500">Email</div>
                            <div className="font-medium">{rider.email}</div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Phone className="h-5 w-5 text-gray-500" />
                        <div>
                            <div className="text-sm text-gray-500">Phone</div>
                            <div className="font-medium">{rider.phone}</div>
                        </div>
                    </div>
                    {rider.gps_latitude && rider.gps_longitude && (
                        <div className="flex items-center gap-3 md:col-span-2">
                            <MapPin className="h-5 w-5 text-gray-500" />
                            <div>
                                <div className="text-sm text-gray-500">Last Known Location</div>
                                <div className="font-medium">
                                    {rider.gps_latitude.toFixed(6)}, {rider.gps_longitude.toFixed(6)}
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Performance Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription className="flex items-center gap-2">
                            <TrendingUp className="h-4 w-4" />
                            Total Assigned
                        </CardDescription>
                        <CardTitle className="text-3xl">{performance.total_assigned}</CardTitle>
                    </CardHeader>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            Completed
                        </CardDescription>
                        <CardTitle className="text-3xl text-green-600">{performance.completed}</CardTitle>
                    </CardHeader>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-yellow-600" />
                            In Progress
                        </CardDescription>
                        <CardTitle className="text-3xl text-yellow-600">{performance.in_progress}</CardTitle>
                    </CardHeader>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription className="flex items-center gap-2">
                            <XCircle className="h-4 w-4 text-red-600" />
                            Rejected
                        </CardDescription>
                        <CardTitle className="text-3xl text-red-600">{performance.rejected}</CardTitle>
                    </CardHeader>
                </Card>
            </div>

            {/* Performance Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Success Rate</CardTitle>
                        <CardDescription>Percentage of completed tasks</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-bold text-green-600">
                            {performance.success_rate.toFixed(1)}%
                        </div>
                        <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-green-600 transition-all"
                                style={{ width: `${performance.success_rate}%` }}
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Average Completion Time</CardTitle>
                        <CardDescription>From assignment to delivery</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-bold">
                            {performance.avg_completion_time_hours
                                ? `${performance.avg_completion_time_hours.toFixed(1)}h`
                                : 'N/A'}
                        </div>
                        <div className="text-sm text-gray-500 mt-2">
                            {performance.avg_completion_time_hours
                                ? 'Average time per task'
                                : 'No completed tasks yet'}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Task History Link */}
            <Card>
                <CardHeader>
                    <CardTitle>Task History</CardTitle>
                    <CardDescription>View all tasks assigned to this rider</CardDescription>
                </CardHeader>
                <CardContent>
                    <Link href={`/admin/riders/${riderId}/history`}>
                        <Button variant="outline">View Task History</Button>
                    </Link>
                </CardContent>
            </Card>
        </div>
    )
}
