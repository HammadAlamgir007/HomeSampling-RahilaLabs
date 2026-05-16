"use client"
import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useStore } from "@/lib/store"
import { useBookingContext } from "./BookingContext"
import { CheckCircle2, AlertTriangle } from "lucide-react"
import { toast } from "react-toastify"
import { API_BASE_URL } from "@/lib/api_config"

export default function ConfirmationStep() {
    const router = useRouter()
    const { selectedTests, address, schedule, notes, idempotencyKey, setStep } = useBookingContext()
    const authToken = useStore((state) => state.authToken)
    
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [testObjects, setTestObjects] = useState<any[]>([])
    const [duplicateDialog, setDuplicateDialog] = useState<{
        resolve: (force: boolean) => void
    } | null>(null)

    // Fetch tests to calculate total
    useEffect(() => {
        const fetchTests = async () => {
            const res = await fetch(`${API_BASE_URL}/api/patient/tests`)
            if (res.ok) {
                const data = await res.json()
                const tests = data.tests || data
                setTestObjects(tests.filter((t: any) => selectedTests.includes(String(t.id))))
            }
        }
        fetchTests()
    }, [selectedTests])

    const selectedTotal = useMemo(() => testObjects.reduce((acc, curr) => acc + curr.price, 0), [testObjects])

    const handleSubmit = async () => {
        if (isSubmitting) return;

        let time24 = schedule.time;
        if (schedule.time.includes(' ')) {
            const [timePart, period] = schedule.time.split(' ');
            let [hours, minutes] = timePart.split(':');
            let hoursInt = parseInt(hours);

            if (period === 'PM' && hoursInt !== 12) hoursInt += 12;
            else if (period === 'AM' && hoursInt === 12) hoursInt = 0;

            time24 = `${hoursInt.toString().padStart(2, '0')}:${minutes}`;
        }
        const appointmentDate = new Date(`${schedule.date}T${time24}:00`).toISOString();

        setIsSubmitting(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/v2/bookings`, {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${authToken}` },
                body: JSON.stringify({
                    test_ids: selectedTests.map(Number),
                    date: appointmentDate,
                    address_data: address,
                    notes: notes,
                    idempotency_key: idempotencyKey
                }),
            })

            if (!response.ok) {
                const err = await response.json()
                if (response.status === 409) {
                    const shouldForce = await new Promise<boolean>((resolve) => {
                        setDuplicateDialog({ resolve })
                    })
                    setDuplicateDialog(null)
                    if (shouldForce) {
                        // Normally we would append force=true but for idempotency it might require a new key
                        throw new Error("Duplicate booking logic needs to be finalized")
                    }
                    return; // user cancelled duplicate
                }
                throw new Error(err.error || "Failed to book")
            }
            
            const data = await response.json()
            toast.success(
                <div>
                    <p>Booking confirmed successfully!</p>
                    <p className="text-sm opacity-90 mt-1">Order ID: {data.booking.booking_order_id}</p>
                </div>,
                { autoClose: 5000 }
            );
            router.push("/patient/dashboard")

        } catch (error: any) {
            console.error("Booking error:", error)
            toast.error(`Booking failed: ${error.message}`)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="max-w-3xl mx-auto animate-in fade-in slide-in-from-right-4 duration-500">
            {/* Duplicate Booking Dialog */}
            {duplicateDialog && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
                    <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="bg-amber-50 dark:bg-amber-900/30 border-b border-amber-200 dark:border-amber-800 p-6">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900 rounded-xl flex items-center justify-center">
                                    <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                                </div>
                                <div>
                                    <h3 className="font-black text-slate-900 dark:text-white text-lg">Existing Booking Found</h3>
                                    <p className="text-sm text-amber-700 dark:text-amber-400 font-medium">You already have an identical booking</p>
                                </div>
                            </div>
                        </div>
                        <div className="p-6">
                            <p className="text-slate-600 dark:text-slate-300 text-sm mb-2">
                                We detected that you already have an identical pending transaction for this exact date and location.
                            </p>
                            <p className="text-slate-500 dark:text-slate-400 text-sm">What would you like to do?</p>
                            <div className="flex flex-col gap-3 mt-6">
                                <button
                                    onClick={() => router.push("/patient/dashboard")}
                                    className="w-full py-3 px-4 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold text-sm transition-colors"
                                >
                                    View Existing Booking
                                </button>
                                <button
                                    onClick={() => duplicateDialog.resolve(true)}
                                    className="w-full py-3 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-sm transition-colors"
                                >
                                    Force Duplicate Booking
                                </button>
                                <button
                                    onClick={() => duplicateDialog.resolve(false)}
                                    className="w-full py-3 px-4 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 font-bold text-sm transition-colors"
                                >
                                    Cancel Transaction
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Confirm Your Booking</h2>
            <div className="space-y-4 mb-8">
                <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5 text-green-500" /> Selected Tests
                        </h3>
                        <span className="font-bold text-blue-600 text-lg">Total: PKR {selectedTotal}</span>
                    </div>
                    <div className="space-y-2 divide-y divide-slate-200 dark:divide-slate-700">
                        {testObjects.map((t) => (
                            <div key={t.id} className="flex justify-between py-2 text-sm">
                                <span className="text-slate-700 dark:text-slate-300">{t.name}</span>
                                <span className="font-medium shrink-0">PKR {t.price}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
                        <h3 className="font-bold text-gray-900 dark:text-white mb-3 flex justify-between">
                            Home Collection Address
                            <button onClick={() => setStep(2)} className="text-xs text-blue-600 hover:underline">Edit</button>
                        </h3>
                        <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                            House # {address.house}, Street # {address.street}<br />
                            {address.area && `${address.area}`}<br />
                            {address.city}, {address.state} {address.zipCode}
                        </p>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
                        <h3 className="font-bold text-gray-900 dark:text-white mb-3 flex justify-between">
                            Scheduled Time
                            <button onClick={() => setStep(3)} className="text-xs text-blue-600 hover:underline">Edit</button>
                        </h3>
                        <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed font-medium">
                            Date: {schedule.date ? new Date(schedule.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : ""}<br />
                            {schedule.time}
                        </p>
                    </div>
                </div>
            </div>

            <div className="flex justify-between gap-4 mt-8 pt-6 border-t border-slate-100">
                <button onClick={() => setStep(3)} className="px-6 py-3 border border-slate-300 rounded-lg font-medium hover:bg-slate-50" disabled={isSubmitting}>Back</button>
                <button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="px-10 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl shadow-lg shadow-green-600/20 font-bold disabled:opacity-50 transition-all text-lg"
                >
                    {isSubmitting ? "Processing Transaction..." : "Confirm & Pay"}
                </button>
            </div>
        </div>
    )
}
