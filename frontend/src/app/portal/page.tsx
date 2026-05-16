"use client"

import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import Link from "next/link"
import { ShieldCheck, UserCircle, ArrowRight } from "lucide-react"

export default function PortalSelectionPage() {
    return (
        <>
            <Navbar />
            <main className="min-h-screen bg-gray-50 dark:bg-slate-950 flex items-center justify-center p-4 transition-colors duration-300">
                <div className="max-w-4xl w-full">
                    <div className="text-center mb-12">
                        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Select Your Portal</h1>
                        <p className="text-xl text-gray-600 dark:text-slate-400">Choose how you want to access Rahila Labs</p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8">
                        {/* Patient Portal Card */}
                        <Link
                            href="/login"
                            className="group relative bg-white dark:bg-slate-900 border-2 border-transparent hover:border-blue-500 dark:hover:border-blue-400 rounded-2xl shadow-xl overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 block"
                        >
                            <div className="p-8 flex flex-col items-center text-center h-full">
                                <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                                    <UserCircle className="w-10 h-10 text-blue-600 dark:text-blue-400" />
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Patient Portal</h2>
                                <p className="text-gray-600 dark:text-slate-400 mb-8 flex-grow">
                                    Access your test results, book new appointments, and manage your health records.
                                </p>
                                <div className="flex items-center text-blue-600 dark:text-blue-400 font-semibold group-hover:gap-2 transition-all">
                                    Login as Patient <ArrowRight className="w-4 h-4 ml-1" />
                                </div>
                            </div>
                        </Link>

                        {/* Admin Portal Card */}
                        <Link
                            href="/admin/login"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group relative bg-white dark:bg-slate-900 border-2 border-transparent hover:border-indigo-500 dark:hover:border-indigo-400 rounded-2xl shadow-xl overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 block"
                        >
                            <div className="p-8 flex flex-col items-center text-center h-full">
                                <div className="w-20 h-20 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                                    <ShieldCheck className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Admin Portal</h2>
                                <p className="text-gray-600 dark:text-slate-400 mb-8 flex-grow">
                                    Manage patients, appointments, lab reports, and system settings.
                                </p>
                                <div className="flex items-center text-indigo-600 dark:text-indigo-400 font-semibold group-hover:gap-2 transition-all">
                                    Login as Admin <ArrowRight className="w-4 h-4 ml-1" />
                                </div>
                            </div>
                        </Link>
                    </div>
                </div>
            </main>
            <Footer />
        </>
    )
}
