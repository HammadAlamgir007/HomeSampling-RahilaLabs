"use client"
import { useBookingContext } from "./BookingContext"
import { MapPin } from "lucide-react"
import { CITIES, BRANCHES } from "@/lib/constants"

export default function AddressStep() {
    const { address, setAddress, setStep } = useBookingContext()

    const handleAddressChange = (field: string, value: string) => {
        setAddress({ ...address, [field]: value })
    }

    return (
        <div className="max-w-3xl mx-auto animate-in fade-in slide-in-from-right-4 duration-500">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <MapPin className="text-blue-600" /> Delivery Address
            </h2>
            
            <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-semibold uppercase text-slate-500 mb-2">House / Building # <span className="text-red-500">*</span></label>
                        <input
                            type="text"
                            value={address.house}
                            onChange={(e) => handleAddressChange("house", e.target.value)}
                            className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                            placeholder="e.g. 12-A"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold uppercase text-slate-500 mb-2">Street / Road <span className="text-red-500">*</span></label>
                        <input
                            type="text"
                            value={address.street}
                            onChange={(e) => handleAddressChange("street", e.target.value)}
                            className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                            placeholder="e.g. 5 or Main Boulevard"
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-semibold uppercase text-slate-500 mb-2">Area / Sector (Optional)</label>
                    <input
                        type="text"
                        value={address.area}
                        onChange={(e) => handleAddressChange("area", e.target.value)}
                        className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                        placeholder="e.g. G-10, Model Town, Bahria Town"
                    />
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-semibold uppercase text-slate-500 mb-2">City <span className="text-red-500">*</span></label>
                        <select
                            value={address.city}
                            onChange={(e) => handleAddressChange("city", e.target.value)}
                            className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                        >
                            <option value="">Select City</option>
                            {CITIES.map((city) => (
                                <option key={city} value={city}>{city}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold uppercase text-slate-500 mb-2">Branch <span className="text-red-500">*</span></label>
                        <select
                            value={address.state}
                            onChange={(e) => handleAddressChange("state", e.target.value)}
                            className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                        >
                            <option value="">Select Branch</option>
                            {BRANCHES.map((branch) => (
                                <option key={branch.name} value={branch.name}>{branch.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-semibold uppercase text-slate-500 mb-2">Zip Code <span className="text-red-500">*</span></label>
                    <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={5}
                        value={address.zipCode}
                        onChange={(e) => handleAddressChange("zipCode", e.target.value.replace(/\D/g, ''))}
                        className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                        placeholder="44000"
                    />
                </div>
            </div>

            <div className="flex justify-between gap-4 mt-8 pt-6 border-t border-slate-100">
                <button onClick={() => setStep(1)} className="px-6 py-2 border border-slate-300 rounded-lg font-medium hover:bg-slate-50 dark:hover:bg-slate-800">Back</button>
                <button
                    onClick={() => setStep(3)}
                    disabled={!address.house || !address.street || !address.city || !address.state || !address.zipCode}
                    className="px-8 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold disabled:opacity-50"
                >
                    Next Step
                </button>
            </div>
        </div>
    )
}
