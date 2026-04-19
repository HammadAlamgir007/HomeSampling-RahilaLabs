"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useStore } from "@/lib/store"
import Link from "next/link"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import BookingStepper from "@/components/booking-stepper"
import { toast } from "react-toastify"
import { TIME_SLOTS, BRANCHES, CITIES } from "@/lib/constants"
import { API_BASE_URL } from "@/lib/api_config"
import { Search, Filter, CheckCircle2, AlertTriangle } from "lucide-react"

export default function BookTestPage() {
  const router = useRouter()
  const user = useStore((state) => state.user)
  const authToken = useStore((state) => state.authToken)
  const [hasHydrated, setHasHydrated] = useState(false)

  const [tests, setTests] = useState<any[]>([])

  useEffect(() => {
    setHasHydrated(true)
    const pendingTestId = localStorage.getItem("pending_test")
    if (pendingTestId) {
      setSelectedTests([pendingTestId])
      localStorage.removeItem("pending_test")
    }
  }, [])

  useEffect(() => {
    const fetchTests = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/patient/tests`)
        if (res.ok) {
          const data = await res.json()
          setTests(data)
        }
      } catch (error) {
        console.error("Failed to fetch tests", error)
      }
    }
    fetchTests()
  }, [])

  const [step, setStep] = useState(1)
  const [selectedTests, setSelectedTests] = useState<string[]>([])
  const [address, setAddress] = useState({
    house: "", street: "", area: "", city: "", state: "", zipCode: "",
  })
  const [schedule, setSchedule] = useState({ date: "", time: "" })
  const [notes, setNotes] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [duplicateDialog, setDuplicateDialog] = useState<{
    testId: string; testName: string; date: string; address: string; resolve: (force: boolean) => void
  } | null>(null)

  // Filtering State
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')

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
    }).slice(0, 50) // Limit to 50 to prevent frontend lag with ~900 catalog items
  }, [tests, searchTerm, selectedCategory])

  // Get full objects of selected tests for displaying in summary
  const selectedTestObjects = useMemo(() => {
    return tests.filter(t => selectedTests.includes(t.id))
  }, [tests, selectedTests])

  const selectedTotal = selectedTestObjects.reduce((acc, curr) => acc + curr.price, 0)

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
          <div className="text-center max-w-md mx-auto p-10 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 animate-in fade-in zoom-in duration-700">
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

  const handleSelectTest = (testId: string) => {
    setSelectedTests((prev) => (prev.includes(testId) ? prev.filter((id) => id !== testId) : [...prev, testId]))
  }

  const handleAddressChange = (field: string, value: string) => setAddress((prev) => ({ ...prev, [field]: value }))
  const handleScheduleChange = (field: string, value: string) => setSchedule((prev) => ({ ...prev, [field]: value }))


  const bookSingle = async (testId: string, appointmentDate: string, fullAddress: string, force = false): Promise<any> => {
    const response = await fetch(`${API_BASE_URL}/api/patient/book`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${authToken}` },
      body: JSON.stringify({ test_id: testId, date: appointmentDate, address: fullAddress, force }),
    })
    if (!response.ok) {
      const err = await response.json()
      if (response.status === 409) {
        // Ask user if they want to book anyway
        const shouldForce = await new Promise<boolean>((resolve) => {
          const test = tests.find((t: any) => String(t.id) === String(testId))
          setDuplicateDialog({
            testId,
            testName: test?.name || testId,
            date: appointmentDate,
            address: fullAddress,
            resolve
          })
        })
        setDuplicateDialog(null)
        if (shouldForce) {
          // Retry with force flag – backend ignores idempotency check when force=true
          return bookSingle(testId, appointmentDate, fullAddress, true)
        }
        return null // user chose not to duplicate
      }
      throw new Error(err.error || "Failed to book")
    }
    return response.json()
  }

  const handleSubmit = async () => {
    if (isSubmitting) return;

    if (selectedTests.length === 0 || !address.house || !address.street || !address.city || !schedule.date || !schedule.time) {
      toast.error("Please fill in all required fields")
      return
    }

    const fullAddress = `House # ${address.house}, Street # ${address.street}${address.area ? ", " + address.area : ""}, ${address.city}, ${address.state} ${address.zipCode}`

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

    if (!authToken) {
      toast.error("Session expired. Please log in again.");
      router.push("/login");
      return;
    }

    setIsSubmitting(true);

    try {
      const orderIds: string[] = [];
      let emailSent = false;

      for (const testId of selectedTests) {
        const data = await bookSingle(testId, appointmentDate, fullAddress)
        if (!data) continue // user cancelled duplicate
        if (data.appointment?.booking_order_id) orderIds.push(data.appointment.booking_order_id)
        if (data.email_sent) emailSent = true
      }

      toast.success(
        <div>
          <p>Booking confirmed successfully!</p>
          <p className="text-sm opacity-90 mt-1">Order IDs: {orderIds.join(', ')}</p>
        </div>,
        { autoClose: 5000 }
      );

      if (emailSent) toast.success("Confirmation email sent successfully!");

      router.push("/patient/dashboard")

    } catch (error: any) {
      console.error("Booking error:", error)
      toast.error(`Booking failed: ${error.message}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <Navbar />

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
                  <p className="text-sm text-amber-700 dark:text-amber-400 font-medium">You already have a booking at this time slot</p>
                </div>
              </div>
            </div>
            <div className="p-6">
              <p className="text-slate-600 dark:text-slate-300 text-sm mb-2">
                You already have a booking for <strong className="text-slate-900 dark:text-white">{duplicateDialog.testName}</strong> at this date and time.
              </p>
              <p className="text-slate-500 dark:text-slate-400 text-sm">Would you like to proceed and create an additional booking anyway?</p>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => duplicateDialog.resolve(true)}
                  className="flex-1 py-3 px-4 rounded-xl bg-blue-900 hover:bg-blue-800 text-white font-bold text-sm transition-colors"
                >
                  Book Anyway
                </button>
                <button
                  onClick={() => duplicateDialog.resolve(false)}
                  className="flex-1 py-3 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-sm transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <main className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20">
        <div className="bg-blue-900 text-white pt-24 pb-20 px-4">
          <div className="max-w-4xl mx-auto text-center mb-10">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Book a Test</h1>
            <p className="text-blue-100 text-lg md:text-xl max-w-2xl mx-auto">
              Schedule your home sample collection from our comprehensive catalog of {tests.length || 800}+ diagnostic tests.
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
              {step === 1 && (
                <div className="flex flex-col lg:flex-row gap-8">
                  <div className="flex-1 space-y-6">
                    {/* Search & Filter */}
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
                            <option key={cat as string} value={cat as string}>{cat}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Test List */}
                    <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                      {filteredTests.length === 0 ? (
                        <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                          We couldn't find any tests matching your search.
                        </div>
                      ) : (
                        filteredTests.map((test) => {
                          const isSelected = selectedTests.includes(test.id)
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
                                      <span className="text-xs font-mono text-slate-500">#{test.code || test.id}</span>
                                    </div>
                                    <h3 className="font-bold text-slate-900 dark:text-white leading-tight">{test.name}</h3>
                                    {test.description && <p className="text-sm text-slate-500 mt-1 line-clamp-1">{test.description}</p>}
                                  </div>
                                  <div className="text-left sm:text-right shrink-0">
                                    <span className="text-lg font-bold text-slate-900 dark:text-white">PKR {test.price}</span>
                                  </div>
                                </div>
                                <div className="flex gap-4 mt-3 text-xs text-slate-500 dark:text-slate-400">
                                  {test.specimen && <span><b className="font-medium text-slate-700 dark:text-slate-300">Sample:</b> {test.specimen}</span>}
                                  {test.reporting_time && <span><b className="font-medium text-slate-700 dark:text-slate-300">Report:</b> {test.reporting_time}</span>}
                                </div>
                              </div>
                            </div>
                          )
                        })
                      )}
                      {tests.some(t => {
                        const matchesSearch = t.name.toLowerCase().includes(searchTerm.toLowerCase()) || (t.code || '').toLowerCase().includes(searchTerm.toLowerCase())
                        const matchesCategory = selectedCategory === 'All' || t.category === selectedCategory
                        return matchesSearch && matchesCategory
                      }) && filteredTests.length === 50 && (
                          <div className="text-center text-sm text-slate-500 py-4 italic">
                            Showing top 50 results. Keep typing to filter more effectively.
                          </div>
                        )}
                    </div>
                  </div>

                  {/* Summary Sidebar */}
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
              )}

              {step === 2 && (
                <div className="max-w-3xl mx-auto">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Delivery Address</h2>
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
                    <button onClick={() => setStep(1)} className="px-6 py-2 border border-slate-300 rounded-lg font-medium hover:bg-slate-50">Back</button>
                    <button
                      onClick={() => setStep(3)}
                      disabled={!address.house || !address.street || !address.city || !address.state || !address.zipCode}
                      className="px-8 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold disabled:opacity-50"
                    >
                      Next Step
                    </button>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="max-w-3xl mx-auto">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Schedule Collection</h2>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-semibold uppercase text-slate-500 mb-2">Collection Date <span className="text-red-500">*</span></label>
                      <input
                        type="date"
                        min={new Date().toISOString().split('T')[0]}
                        value={schedule.date}
                        onChange={(e) => handleScheduleChange("date", e.target.value)}
                        className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold uppercase text-slate-500 mb-2">Preferred Time Slot <span className="text-red-500">*</span></label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {TIME_SLOTS.map((slot) => (
                          <div
                            key={slot}
                            onClick={() => handleScheduleChange("time", slot)}
                            className={`p-3 text-center rounded-xl border-2 cursor-pointer transition ${schedule.time === slot
                              ? "border-blue-600 bg-blue-50 text-blue-700 font-bold dark:bg-blue-900/40 dark:text-blue-300"
                              : "border-slate-200 text-slate-600 hover:border-blue-300 dark:border-slate-700 dark:text-slate-400"
                              }`}
                          >
                            {slot}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold uppercase text-slate-500 mb-2">Additional Notes (Optional)</label>
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={3}
                        className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="Any special instructions for the home collector..."
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
              )}

              {step === 4 && (
                <div className="max-w-3xl mx-auto">
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
                        {selectedTestObjects.map((t) => (
                          <div key={t.id} className="flex justify-between py-2 text-sm">
                            <span className="text-slate-700 dark:text-slate-300">{t.name}</span>
                            <span className="font-medium shrink-0">PKR {t.price}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
                        <h3 className="font-bold text-gray-900 dark:text-white mb-3">Home Collection Address</h3>
                        <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                          House # {address.house}, Street # {address.street}<br />
                          {address.area && `${address.area}`}<br />
                          {address.city}, {address.state} {address.zipCode}
                        </p>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
                        <h3 className="font-bold text-gray-900 dark:text-white mb-3">Scheduled Time</h3>
                        <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed font-medium">
                          Date: {new Date(schedule.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}<br />
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
                      {isSubmitting ? "Processing..." : "Confirm & Book"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
