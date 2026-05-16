"use client"

import { useState, useEffect, useMemo } from "react"
import { useStore } from "@/lib/store"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import Link from "next/link"
import { Search } from "lucide-react"
import { useRouter } from "next/navigation"
import { API_BASE_URL } from "@/lib/api_config"

export default function ServicesPage() {
  const user = useStore((state) => state.user)
  const [tests, setTests] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const router = useRouter()

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
      } finally {
        setLoading(false)
      }
    }
    fetchTests()
  }, [])

  const handleBookNow = (id: string) => {
    localStorage.setItem("pending_test", id)
    router.push("/patient/book-test")
  }

  const filteredTests = useMemo(() => {
    return tests.filter(test =>
      test.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (test.description || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (test.code || "").toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [tests, searchQuery])

  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 20

  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery])

  const totalPages = Math.ceil(filteredTests.length / itemsPerPage)
  const currentTests = filteredTests.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-500">

        {/* Page Header */}
        <div className="bg-slate-950 dark:bg-slate-950 py-20 px-4 sm:px-6 lg:px-8 border-b border-slate-900 relative overflow-hidden">
          <div className="absolute top-[-30%] left-[10%] w-[40%] h-[200%] bg-blue-600/5 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute top-[-30%] right-[10%] w-[30%] h-[200%] bg-indigo-600/5 rounded-full blur-[100px] pointer-events-none" />
          <div className="max-w-4xl mx-auto text-center space-y-6 relative z-10">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white tracking-tight">
              Our Diagnostic <span className="text-blue-500">Services</span>
            </h1>
            <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
              Comprehensive health testing at your doorstep. We offer a wide range of laboratory tests to help you stay ahead of your health.
            </p>
          </div>
        </div>

        {/* Tests Grid */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">

          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
              {loading ? "Loading tests..." : `${tests.length} ${tests.length === 1 ? 'Test' : 'Tests'} Available`}
            </h2>

            <div className="relative w-full md:w-[350px] group">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
              </div>
              <input
                type="text"
                placeholder="Search tests..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm font-medium text-sm"
              />
            </div>
          </div>

          {filteredTests.length > 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold">
                    <tr>
                      <th className="px-6 py-4">Sr.#</th>
                      <th className="px-6 py-4">Code</th>
                      <th className="px-6 py-4 w-full">Test Name</th>
                      <th className="px-6 py-4">Category</th>
                      <th className="px-6 py-4">Specimen</th>
                      <th className="px-6 py-4">Reporting Time</th>
                      <th className="px-6 py-4">Charges</th>
                      <th className="px-6 py-4 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {currentTests.map((test, index) => (
                      <tr key={test.id} className="hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors">
                        <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                        <td className="px-6 py-4 font-mono text-slate-500 dark:text-slate-400">{test.code || '—'}</td>
                        <td className="px-6 py-4 font-bold text-slate-900 dark:text-white whitespace-normal min-w-[200px]">
                          {test.name}
                          {test.description && <p className="text-xs text-slate-500 dark:text-slate-400 font-normal mt-1">{test.description}</p>}
                        </td>
                        <td className="px-6 py-4">
                          {test.category ? <span className="bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider">{test.category}</span> : '—'}
                        </td>
                        <td className="px-6 py-4 text-slate-600 dark:text-slate-400 truncate max-w-[150px]" title={test.specimen}>{test.specimen || '—'}</td>
                        <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{test.reporting_time || '—'}</td>
                        <td className="px-6 py-4 font-bold text-blue-700 dark:text-blue-400">Rs. {test.price}</td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => handleBookNow(test.id)}
                            className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-semibold transition shadow-sm"
                          >
                            Book
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 px-6 py-4 gap-4">
                  <span className="text-sm text-slate-600 dark:text-slate-400">
                    Showing <span className="font-bold">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-bold">{Math.min(currentPage * itemsPerPage, filteredTests.length)}</span> of <span className="font-bold">{filteredTests.length}</span> tests
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-medium hover:bg-white dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-medium hover:bg-white dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : !loading && (
            <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
              <Search className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">No tests found</h3>
              <p className="text-slate-500 dark:text-slate-400">We couldn't find any tests matching "{searchQuery}". Try a different keyword.</p>
              <button
                onClick={() => setSearchQuery("")}
                className="mt-6 text-blue-600 dark:text-blue-400 font-semibold hover:text-blue-700 dark:hover:text-blue-300 hover:underline"
              >
                Clear Search
              </button>
            </div>
          )}

          {/* Call to action */}
          <div className="mt-20 bg-gradient-to-br from-blue-600 to-blue-800 rounded-3xl p-10 lg:p-16 text-center text-white shadow-xl shadow-blue-900/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-400/20 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3 pointer-events-none"></div>

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
