"use client"
import { useState, useEffect, useMemo } from "react"
import { useBookingContext } from "./BookingContext"
import { Search, Filter, CheckCircle2 } from "lucide-react"
import { API_BASE_URL } from "@/lib/api_config"

export default function TestSelectionStep() {
    const { selectedTests, setSelectedTests, setStep } = useBookingContext()
    const [tests, setTests] = useState<any[]>([])
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedCategory, setSelectedCategory] = useState('All')

    useEffect(() => {
        const fetchTests = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/api/patient/tests`)
                if (res.ok) {
                    const data = await res.json()
                    setTests(data.tests || data) // handle depending on how old api returned
                }
            } catch (error) {
                console.error("Failed to fetch tests", error)
            }
        }
        fetchTests()
    }, [])

    const categories = useMemo(() => {
        const cats = new Set(tests.map(t => t.category).filter(Boolean))
        return ['All', ...Array.from(cats).sort()]
    }, [tests])

    const filteredTests = useMemo(() => {
        return tests.filter(t => {
            const matchesSearch =
                t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (t.code || '').toLowerCase().includes(searchTerm.toLowerCase())
            const matchesCategory = selectedCategory === 'All' || t.category === selectedCategory
            return matchesSearch && matchesCategory
        }).slice(0, 50)
    }, [tests, searchTerm, selectedCategory])

    const selectedTestObjects = useMemo(() => {
        return tests.filter(t => selectedTests.includes(String(t.id)))
    }, [tests, selectedTests])

    const selectedTotal = selectedTestObjects.reduce((acc, curr) => acc + curr.price, 0)

    const handleSelectTest = (testId: string) => {
        const idStr = String(testId)
        setSelectedTests(selectedTests.includes(idStr) 
            ? selectedTests.filter((id) => id !== idStr) 
            : [...selectedTests, idStr])
    }

    return (
        <div className="flex flex-col lg:flex-row gap-8 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="flex-1 space-y-6">
                <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl space-y-4 border border-slate-100 dark:border-slate-700">
                    <div className="relative">
                        <Search className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search tests by name or code..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                    <div className="flex items-center gap-3">
                        <Filter className="w-5 h-5 text-slate-500" />
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="flex-1 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                        >
                            {categories.map(cat => (
                                <option key={cat as string} value={cat as string}>{cat as string}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                    {filteredTests.length === 0 ? (
                        <div className="text-center py-12 text-slate-500">
                            We couldn't find any tests matching your search.
                        </div>
                    ) : (
                        filteredTests.map((test) => {
                            const isSelected = selectedTests.includes(String(test.id))
                            return (
                                <div
                                    key={test.id}
                                    onClick={() => handleSelectTest(test.id)}
                                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 flex gap-4 ${isSelected
                                        ? "border-blue-600 bg-blue-50/50 dark:bg-blue-900/20"
                                        : "border-slate-100 hover:border-blue-200 hover:shadow-md dark:border-slate-800 dark:hover:border-slate-700"
                                        }`}
                                >
                                    <div className="pt-1">
                                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${isSelected ? 'bg-blue-600 border-blue-600' : 'border-slate-300 dark:border-slate-600'}`}>
                                            {isSelected && <CheckCircle2 className="w-4 h-4 text-white" />}
                                        </div>
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    {test.category && (
                                                        <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 px-2 py-0.5 rounded-full">
                                                            {test.category}
                                                        </span>
                                                    )}
                                                </div>
                                                <h3 className="font-bold text-slate-900 dark:text-white leading-tight">{test.name}</h3>
                                            </div>
                                            <div className="text-left sm:text-right shrink-0">
                                                <span className="text-lg font-bold text-slate-900 dark:text-white">PKR {test.price}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )
                        })
                    )}
                </div>
            </div>

            <div className="w-full lg:w-[340px] shrink-0">
                <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700 sticky top-24">
                    <h3 className="font-bold text-lg mb-4 text-slate-900 dark:text-white">Selected Tests ({selectedTests.length})</h3>
                    <div className="space-y-3 mb-6 max-h-[300px] overflow-y-auto">
                        {selectedTestObjects.length === 0 ? (
                            <p className="text-sm text-slate-500 text-center py-6">No tests selected yet. Search and click to add tests to your booking.</p>
                        ) : (
                            selectedTestObjects.map(test => (
                                <div key={test.id} className="flex justify-between items-start text-sm bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-100 dark:border-slate-700">
                                    <span className="font-medium pr-4 line-clamp-2 leading-tight">{test.name}</span>
                                    <span className="font-bold shrink-0">PKR {test.price}</span>
                                </div>
                            ))
                        )}
                    </div>

                    {selectedTestObjects.length > 0 && (
                        <div className="pt-4 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center mb-6">
                            <span className="text-slate-600 dark:text-slate-400 font-medium">Estimated Total</span>
                            <span className="text-xl font-bold text-blue-700 dark:text-blue-400">PKR {selectedTotal}</span>
                        </div>
                    )}

                    <button
                        onClick={() => setStep(2)}
                        disabled={selectedTests.length === 0}
                        className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed shadow-md transition-all"
                    >
                        Continue to Address
                    </button>
                </div>
            </div>
        </div>
    )
}
