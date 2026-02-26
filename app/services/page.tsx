"use client"

import { useState } from "react"
import { useStore } from "@/lib/store"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import TestCard from "@/components/test-card"
import Link from "next/link"
import { Search } from "lucide-react"
import { useRouter } from "next/navigation"

export default function ServicesPage() {
  const user = useStore((state) => state.user)
  const tests = useStore((state) => state.tests)
  const [searchQuery, setSearchQuery] = useState("")
  const router = useRouter()

  const handleBookNow = (id: string) => {
    localStorage.setItem("pending_test", id)
    router.push("/patient/book-test")
  }

  const filteredTests = tests.filter(test =>
    test.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    test.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-slate-50">

        {/* Page Header */}
        <div className="bg-slate-950 py-20 px-4 sm:px-6 lg:px-8 border-b border-slate-900">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white tracking-tight">
              Our Diagnostic <span className="text-blue-500">Services</span>
            </h1>
            <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
              Comprehensive health testing at your doorstep. We offer a wide range of laboratory tests to help you stay ahead of your health.
            </p>

            {/* Search Bar */}
            <div className="max-w-2xl mx-auto mt-10 relative group">
              <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                <Search className="h-6 w-6 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
              </div>
              <input
                type="text"
                placeholder="Search for blood tests, profiles, e.g. 'Thyroid'"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-14 pr-6 py-5 bg-white border-2 border-transparent rounded-2xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all shadow-2xl text-lg"
              />
            </div>
          </div>
        </div>

        {/* Tests Grid */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">

          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-slate-800">
              {filteredTests.length} {filteredTests.length === 1 ? 'Test' : 'Tests'} Available
            </h2>
          </div>

          {filteredTests.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {filteredTests.map((test) => (
                <TestCard
                  key={test.id}
                  id={test.id}
                  name={test.name}
                  description={test.description}
                  price={test.price}
                  tests={[test.sampleType, test.turnaroundTime]}
                  onSelect={handleBookNow}
                  buttonText="Book Now"
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm">
              <Search className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-slate-800 mb-2">No tests found</h3>
              <p className="text-slate-500">We couldn't find any tests matching "{searchQuery}". Try a different keyword.</p>
              <button
                onClick={() => setSearchQuery("")}
                className="mt-6 text-blue-600 font-semibold hover:text-blue-700 hover:underline"
              >
                Clear Search
              </button>
            </div>
          )}

          {/* Call to action */}
          <div className="mt-20 bg-gradient-to-br from-blue-600 to-blue-800 rounded-3xl p-10 lg:p-16 text-center text-white shadow-xl shadow-blue-900/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-400/20 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3"></div>

            <h2 className="text-3xl md:text-4xl font-bold mb-4 relative z-10">Ready to get tested?</h2>
            <p className="text-blue-100 mb-8 max-w-2xl mx-auto relative z-10 text-lg">
              Book your home sample collection now and get accurate results delivered straight to your portal.
            </p>
            <Link
              href={user ? "/patient/dashboard" : "/patient/book-test"}
              className="inline-block bg-white text-blue-700 hover:bg-slate-50 font-bold py-4 px-10 rounded-xl transition-transform hover:-translate-y-1 shadow-lg relative z-10 text-lg"
            >
              Book a Home Visit
            </Link>
          </div>

        </div>
      </main>
      <Footer />
    </>
  )
}
