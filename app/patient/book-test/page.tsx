"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useStore } from "@/lib/store"
import Link from "next/link"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import BookingStepper from "@/components/booking-stepper"
import { TIME_SLOTS, STATES } from "@/lib/constants"
import { API_BASE_URL } from "@/lib/api_config"

export default function BookTestPage() {
  const router = useRouter()
  const user = useStore((state) => state.user)
  const authToken = useStore((state) => state.authToken)
  // We'll use local state for tests to ensure we get them from backend
  const [tests, setTests] = useState<any[]>([])

  // Fetch tests on load
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

  const addBooking = useStore((state) => state.addBooking)

  const [step, setStep] = useState(1)
  const [selectedTests, setSelectedTests] = useState<string[]>([])
  const [address, setAddress] = useState({
    house: "",
    street: "",
    area: "",
    city: "",
    state: "",
    zipCode: "",
  })
  const [schedule, setSchedule] = useState({
    date: "",
    time: "",
  })
  const [notes, setNotes] = useState("")

  if (!user) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center max-w-md mx-auto p-8 bg-white rounded-lg shadow-lg">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Please log in to continue</h1>
            <p className="text-gray-600 mb-8">You need to be logged in to book a test. Please login or create a new account.</p>
            <div className="flex flex-col gap-4">
              <Link href="/login" className="w-full">
                <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition">
                  Login
                </button>
              </Link>
              <Link href="/register" className="w-full">
                <button className="w-full bg-white hover:bg-gray-100 text-blue-600 font-bold py-2 px-4 rounded border border-blue-600 transition">
                  Register
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

  const handleAddressChange = (field: string, value: string) => {
    setAddress((prev) => ({ ...prev, [field]: value }))
  }

  const handleScheduleChange = (field: string, value: string) => {
    setSchedule((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async () => {
    console.log("Confirm button clicked")
    console.log("State:", { selectedTests, address, schedule })

    if (selectedTests.length === 0 || !address.house || !address.street || !address.city || !schedule.date || !schedule.time) {
      console.log("Validation failed")
      alert("Please fill in all required fields")
      return
    }

    const fullAddress = `House # ${address.house}, Street # ${address.street}${address.area ? ", " + address.area : ""}, ${address.city}, ${address.state} ${address.zipCode}`

    // ISO format for date roughly
    // Handle 12h format "12:00 PM" -> 24h
    let time24 = schedule.time;
    if (schedule.time.includes(' ')) {
      const [timePart, period] = schedule.time.split(' ');
      let [hours, minutes] = timePart.split(':');
      let hoursInt = parseInt(hours);

      if (period === 'PM' && hoursInt !== 12) hoursInt += 12;
      else if (period === 'AM' && hoursInt === 12) hoursInt = 0;

      time24 = `${hoursInt.toString().padStart(2, '0')}:${minutes}`;
    }

    // Construct ISO string manually to ensure consistency
    const appointmentDate = new Date(`${schedule.date}T${time24}:00`).toISOString();

    if (!authToken) {
      alert("Session expired. Please log in again.");
      router.push("/login");
      return;
    }

    try {
      // Create bookings sequentially
      for (const testId of selectedTests) {
        const response = await fetch(`${API_BASE_URL}/api/patient/book`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${authToken}`
          },
          body: JSON.stringify({
            test_id: testId,
            date: appointmentDate,
            address: fullAddress
          }),
        })

        if (!response.ok) {
          const err = await response.json()
          throw new Error(err.error || "Failed to book")
        }
      }

      alert("Booking confirmed successfully!")
      router.push("/patient/dashboard")

    } catch (error: any) {
      console.error("Booking error:", error)
      alert(`Booking failed: ${error.message} \n Check console for details.`)
    }
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto">
            <div className="mb-12">
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Book a Test</h1>
              <p className="text-gray-600">Follow the steps to schedule your home sample collection</p>
            </div>

            <BookingStepper currentStep={step} />

            <div className="bg-white rounded-lg shadow-lg p-8 mt-8">
              {step === 1 && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Select Tests</h2>
                  <div className="grid md:grid-cols-2 gap-4">
                    {tests.map((test) => (
                      <div
                        key={test.id}
                        className={`p-4 border-2 rounded-lg cursor-pointer transition ${selectedTests.includes(test.id)
                          ? "border-blue-600 bg-blue-50"
                          : "border-gray-200 hover:border-blue-300"
                          }`}
                        onClick={() => handleSelectTest(test.id)}
                      >
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            checked={selectedTests.includes(test.id)}
                            onChange={() => { }}
                            className="mt-1"
                          />
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900">{test.name}</h3>
                            <p className="text-sm text-gray-600">{test.description}</p>
                            <div className="flex justify-between mt-2">
                              <span className="text-sm text-gray-600">{test.sampleType}</span>
                              <span className="font-bold text-blue-600">Rs. {test.price}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-end gap-4 mt-6">
                    <button
                      onClick={() => router.push("/patient/dashboard")}
                      className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => setStep(2)}
                      disabled={selectedTests.length === 0}
                      className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Delivery Address</h2>
                  <div className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">House / Building #</label>
                        <input
                          type="text"
                          value={address.house}
                          onChange={(e) => handleAddressChange("house", e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                          placeholder="e.g. 12-A"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Street / Road</label>
                        <input
                          type="text"
                          value={address.street}
                          onChange={(e) => handleAddressChange("street", e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                          placeholder="e.g. 5 or Main Boulevard"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Area / Sector (Optional)</label>
                      <input
                        type="text"
                        value={address.area}
                        onChange={(e) => handleAddressChange("area", e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        placeholder="e.g. G-10, Model Town, Bahria Town"
                      />
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                        <select
                          value={address.city}
                          onChange={(e) => handleAddressChange("city", e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        >
                          <option value="">Select City</option>
                          <option value="Islamabad">Islamabad</option>
                          <option value="Lahore">Lahore</option>
                          <option value="Sialkot">Sialkot</option>
                          <option value="Rawalpindi">Rawalpindi</option>
                          <option value="Karachi">Karachi</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                        <select
                          value={address.state}
                          onChange={(e) => handleAddressChange("state", e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        >
                          <option value="">Select State</option>
                          {STATES.map((state) => (
                            <option key={state} value={state}>
                              {state}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Zip Code</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={5}
                        value={address.zipCode}
                        onChange={(e) => handleAddressChange("zipCode", e.target.value.replace(/\D/g, ''))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        placeholder="44000"
                      />
                    </div>
                  </div>
                  <div className="flex justify-between gap-4 mt-6">
                    <button
                      onClick={() => setStep(1)}
                      className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                    >
                      Back
                    </button>
                    <button
                      onClick={() => setStep(3)}
                      className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Schedule Collection</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                      <input
                        type="date"
                        min={new Date().toISOString().split('T')[0]}
                        value={schedule.date}
                        onChange={(e) => handleScheduleChange("date", e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Time Slot</label>
                      <select
                        value={schedule.time}
                        onChange={(e) => handleScheduleChange("time", e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      >
                        <option value="">Select Time</option>
                        {TIME_SLOTS.map((slot) => (
                          <option key={slot} value={slot}>
                            {slot}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Additional Notes (Optional)
                      </label>
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={3}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        placeholder="Any special instructions..."
                      />
                    </div>
                  </div>
                  <div className="flex justify-between gap-4 mt-6">
                    <button
                      onClick={() => setStep(2)}
                      className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                    >
                      Back
                    </button>
                    <button
                      onClick={() => setStep(4)}
                      className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                    >
                      Review
                    </button>
                  </div>
                </div>
              )}

              {step === 4 && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Confirm Booking</h2>
                  <div className="space-y-4 mb-6">
                    <div className="border-l-4 border-blue-600 pl-4 py-2">
                      <h3 className="font-semibold text-gray-900 mb-2">Selected Tests</h3>
                      <ul className="text-gray-700 space-y-1">
                        {tests
                          .filter((t) => selectedTests.includes(t.id))
                          .map((t) => (
                            <li key={t.id}>
                              • {t.name} - Rs. {t.price}
                            </li>
                          ))}
                      </ul>
                    </div>
                    <div className="border-l-4 border-green-600 pl-4 py-2">
                      <h3 className="font-semibold text-gray-900 mb-2">Delivery Address</h3>
                      <p className="text-gray-700">
                        House # {address.house}, Street # {address.street}
                        {address.area && `, ${address.area}`}
                      </p>
                      <p className="text-gray-700">
                        {address.city}, {address.state} {address.zipCode}
                      </p>
                    </div>
                    <div className="border-l-4 border-purple-600 pl-4 py-2">
                      <h3 className="font-semibold text-gray-900 mb-2">Collection Schedule</h3>
                      <p className="text-gray-700">Date: {schedule.date}</p>
                      <p className="text-gray-700">Time: {schedule.time}</p>
                    </div>
                  </div>

                  <div className="flex justify-between gap-4 mt-8">
                    <button
                      onClick={() => setStep(3)}
                      className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleSubmit}
                      className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold"
                    >
                      Confirm Booking
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
