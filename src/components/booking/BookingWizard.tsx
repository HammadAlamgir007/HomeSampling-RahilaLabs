"use client"
import { useState, useEffect } from "react"
import { useStore } from "@/lib/store"
import { useRouter } from "next/navigation"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import BookingStepper from "@/components/booking-stepper"
import { CheckCircle2 } from "lucide-react"
import Link from "next/link"
import { useBookingContext } from "./BookingContext"

// We will create these next
import TestSelectionStep from "./TestSelectionStep"
import AddressStep from "./AddressStep"
import ScheduleStep from "./ScheduleStep"
import ConfirmationStep from "./ConfirmationStep"

export function BookingWizard() {
    const { step } = useBookingContext()
    const user = useStore((state) => state.user)
    const [hasHydrated, setHasHydrated] = useState(false)

    useEffect(() => {
        setHasHydrated(true)
    }, [])

    if (!hasHydrated) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    if (!user) {
        return (
            <>
                <Navbar />
                <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 transition-colors duration-500">
                    <div className="text-center max-w-md mx-auto p-10 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800">
                        <div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center mb-6">
                            <CheckCircle2 className="w-8 h-8" />
                        </div>
                        <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-4 tracking-tight">Please log in to continue</h1>
                        <p className="text-slate-500 dark:text-slate-400 mb-10 font-medium">You need to be logged in to book a test. Please login or create a new account.</p>
                        <div className="flex flex-col gap-4">
                            <Link href="/login" className="w-full">
                                <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-2xl shadow-lg shadow-blue-500/20 transition-all hover:-translate-y-0.5 active:translate-y-0">
                                    Login to Account
                                </button>
                            </Link>
                            <Link href="/register" className="w-full">
                                <button className="w-full bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-900 text-blue-600 dark:text-blue-400 font-bold py-4 px-6 rounded-2xl border-2 border-blue-600 dark:border-blue-500/50 transition-all hover:-translate-y-0.5 active:translate-y-0">
                                    Create New Account
                                </button>
                            </Link>
                        </div>
                    </div>
                </div>
                <Footer />
            </>
        )
    }

    return (
        <>
            <Navbar />
            <main className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20">
                <div className="bg-blue-900 text-white pt-24 pb-20 px-4">
                    <div className="max-w-4xl mx-auto text-center mb-10">
                        <h1 className="text-4xl md:text-5xl font-bold mb-4">Book a Test</h1>
                        <p className="text-blue-100 text-lg md:text-xl max-w-2xl mx-auto">
                            Schedule your home sample collection using our secure booking wizard.
                        </p>
                    </div>
                    <div className="container mx-auto px-4">
                        <div className="max-w-5xl mx-auto">
                            <BookingStepper currentStep={step} />
                        </div>
                    </div>
                </div>

                <div className="container mx-auto px-4 -mt-4 relative z-10">
                    <div className="max-w-5xl mx-auto">
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-6 md:p-8 mt-8">
                            {step === 1 && <TestSelectionStep />}
                            {step === 2 && <AddressStep />}
                            {step === 3 && <ScheduleStep />}
                            {step === 4 && <ConfirmationStep />}
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </>
    )
}
