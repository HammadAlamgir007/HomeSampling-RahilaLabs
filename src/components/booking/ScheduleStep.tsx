"use client"
import { useState, useEffect } from "react"
import { useBookingContext } from "./BookingContext"
import { Calendar, Clock, Loader2 } from "lucide-react"
import { API_BASE_URL } from "@/lib/api_config"

export default function ScheduleStep() {
    const { schedule, setSchedule, notes, setNotes, setStep, address } = useBookingContext()
    const [availableSlots, setAvailableSlots] = useState<string[]>([])
    const [isLoadingSlots, setIsLoadingSlots] = useState(false)

    useEffect(() => {
        if (!schedule.date) return;
        
        const fetchSlots = async () => {
            setIsLoadingSlots(true)
            try {
                // Fetch dynamic slots based on city and date
                const res = await fetch(`${API_BASE_URL}/api/v2/bookings/available-slots?date=${schedule.date}&city=${address.city}`)
                if (res.ok) {
                    const data = await res.json()
                    const slots: string[] = data.slots || []
                    
                    // Client-side safety filter: remove past slots for today's date
                    const now = new Date()
                    const selectedDate = new Date(schedule.date + 'T00:00:00')
                    const isToday = selectedDate.toDateString() === now.toDateString()
                    
                    if (isToday) {
                        const leadTimeHours = 2 // 2-hour buffer to allow prep time
                        const filteredSlots = slots.filter(slot => {
                            const [time, modifier] = slot.split(' ')
                            let [hours, minutes] = time.split(':').map(Number)
                            
                            if (modifier === 'PM' && hours !== 12) hours += 12
                            if (modifier === 'AM' && hours === 12) hours = 0
                            
                            const slotDate = new Date(now)
                            slotDate.setHours(hours, minutes, 0, 0)
                            
                            // Only show slots at least leadTimeHours in the future
                            return slotDate > new Date(now.getTime() + leadTimeHours * 60 * 60 * 1000)
                        })
                        setAvailableSlots(filteredSlots)
                    } else {
                        setAvailableSlots(slots)
                    }
                }
            } catch (error) {
                console.error("Failed to fetch dynamic slots", error)
            } finally {
                setIsLoadingSlots(false)
            }
        }
        fetchSlots()
    }, [schedule.date, address.city])

    return (
        <div className="max-w-3xl mx-auto animate-in fade-in slide-in-from-right-4 duration-500">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <Calendar className="text-blue-600" /> Schedule Collection
            </h2>
            <div className="space-y-6">
                <div>
                    <label className="block text-sm font-semibold uppercase text-slate-500 mb-2">Collection Date <span className="text-red-500">*</span></label>
                    <input
                        type="date"
                        min={new Date().toISOString().split('T')[0]}
                        value={schedule.date}
                        onChange={(e) => setSchedule({...schedule, date: e.target.value, time: ""})} // Reset time on date change
                        className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                </div>
                <div>
                    <label className="block text-sm font-semibold uppercase text-slate-500 mb-2 flex items-center gap-2">
                        <Clock className="w-4 h-4" /> Preferred Time Slot <span className="text-red-500">*</span>
                    </label>
                    
                    {!schedule.date ? (
                        <div className="p-4 bg-blue-50 text-blue-700 rounded-xl text-sm border border-blue-100">
                            Please select a date first to view available dynamic slots.
                        </div>
                    ) : isLoadingSlots ? (
                        <div className="flex items-center gap-2 text-slate-500 p-4">
                            <Loader2 className="w-5 h-5 animate-spin" /> Calculating availability based on technician routes...
                        </div>
                    ) : availableSlots.length === 0 ? (
                        <div className="p-4 bg-red-50 text-red-700 rounded-xl text-sm border border-red-100">
                            No slots available for this date in your area. Please try another day.
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {availableSlots.map((slot) => (
                                <div
                                    key={slot}
                                    onClick={() => setSchedule({...schedule, time: slot})}
                                    className={`p-3 text-center rounded-xl border-2 cursor-pointer transition ${schedule.time === slot
                                        ? "border-blue-600 bg-blue-50 text-blue-700 font-bold dark:bg-blue-900/40 dark:text-blue-300"
                                        : "border-slate-200 text-slate-600 hover:border-blue-300 dark:border-slate-700 dark:text-slate-400"
                                        }`}
                                >
                                    {slot}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <div>
                    <label className="block text-sm font-semibold uppercase text-slate-500 mb-2">Additional Notes (Optional)</label>
                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={3}
                        className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="Any special instructions for the home collector (e.g. ring bell, aggressive dog)..."
                    />
                </div>
            </div>
            <div className="flex justify-between gap-4 mt-8 pt-6 border-t border-slate-100">
                <button onClick={() => setStep(2)} className="px-6 py-2 border border-slate-300 rounded-lg font-medium hover:bg-slate-50">Back</button>
                <button
                    onClick={() => setStep(4)}
                    disabled={!schedule.date || !schedule.time}
                    className="px-8 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold disabled:opacity-50"
                >
                    Review Booking
                </button>
            </div>
        </div>
    )
}
