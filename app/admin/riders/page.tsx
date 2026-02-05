'use client'

import { useState, useEffect } from 'react'
import { useStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, MapPin, Phone, Mail, TrendingUp } from 'lucide-react'
import Link from 'next/link'

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
}

export default function RidersPage() {
    const authToken = useStore((state) => state.authToken)
    const [riders, setRiders] = useState<Rider[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        fetchRiders()
    }, [])

    const fetchRiders = async () => {
        try {
            // Check if token exists
            if (!authToken) {
                setError('Not authenticated. Please login again.')
                setLoading(false)
                return
            }

            const response = await fetch('http://localhost:5000/api/admin/riders', {
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            })

            if (!response.ok) {
                if (response.status === 401 || response.status === 403) {
                    throw new Error('Authentication failed. Please login again.')
                }
                throw new Error('Failed to fetch riders')
            }

            const data = await response.json()
            setRiders(data.riders || [])
            setError('') // Clear any previous errors
        } catch (err: any) {
            setError(err.message || 'Failed to load riders')
            console.error('Fetch riders error:', err)
        } finally {
            setLoading(false)
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

    const getStatusText = (status: string) => {
        return status.charAt(0).toUpperCase() + status.slice(1)
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-lg">Loading riders...</div>
            </div>
        )
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Rider Management</h1>
                    <p className="text-gray-600 mt-1">Manage and monitor sample collection riders</p>
                </div>
                <Link href="/admin/riders/create">
                    <Button className="flex items-center gap-2">
                        <Plus className="h-4 w-4" />
                        Add New Rider
                    </Button>
                </Link>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Total Riders</CardDescription>
                        <CardTitle className="text-3xl">{riders.length}</CardTitle>
                    </CardHeader>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Available Now</CardDescription>
                        <CardTitle className="text-3xl text-green-600">
                            {riders.filter(r => r.availability_status === 'available').length}
                        </CardTitle>
                    </CardHeader>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Currently Busy</CardDescription>
                        <CardTitle className="text-3xl text-yellow-600">
                            {riders.filter(r => r.availability_status === 'busy').length}
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

            {/* Riders List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {riders.map((rider) => (
                    <Card key={rider.id} className="hover:shadow-lg transition-shadow">
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle className="text-xl">{rider.name}</CardTitle>
                                    <CardDescription className="mt-1">ID: #{rider.id}</CardDescription>
                                </div>
                                <Badge className={getStatusColor(rider.availability_status)}>
                                    {getStatusText(rider.availability_status)}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {/* Contact Info */}
                            <div className="space-y-2 text-sm">
                                <div className="flex items-center gap-2 text-gray-600">
                                    <Mail className="h-4 w-4" />
                                    <span>{rider.email}</span>
                                </div>
                                <div className="flex items-center gap-2 text-gray-600">
                                    <Phone className="h-4 w-4" />
                                    <span>{rider.phone}</span>
                                </div>
                                {rider.gps_latitude && rider.gps_longitude && (
                                    <div className="flex items-center gap-2 text-gray-600">
                                        <MapPin className="h-4 w-4" />
                                        <span className="text-xs">
                                            {rider.gps_latitude.toFixed(4)}, {rider.gps_longitude.toFixed(4)}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Stats */}
                            {rider.stats && (
                                <div className="flex gap-4 pt-3 border-t">
                                    <div className="flex items-center gap-2">
                                        <TrendingUp className="h-4 w-4 text-green-600" />
                                        <div>
                                            <div className="text-xs text-gray-500">Completed</div>
                                            <div className="font-semibold">{rider.stats.completed_tasks}</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="h-4 w-4 rounded-full bg-yellow-500" />
                                        <div>
                                            <div className="text-xs text-gray-500">Pending</div>
                                            <div className="font-semibold">{rider.stats.pending_tasks}</div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex gap-2 pt-2">
                                <Link href={`/admin/riders/${rider.id}`} className="flex-1">
                                    <Button variant="outline" className="w-full">View Details</Button>
                                </Link>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Empty State */}
            {riders.length === 0 && !loading && (
                <Card className="p-12 text-center">
                    <CardTitle className="text-xl mb-2">No Riders Found</CardTitle>
                    <CardDescription className="mb-4">
                        Get started by adding your first rider
                    </CardDescription>
                    <Link href="/admin/riders/create">
                        <Button>
                            <Plus className="h-4 w-4 mr-2" />
                            Add First Rider
                        </Button>
                    </Link>
                </Card>
            )}
        </div>
    )
}
