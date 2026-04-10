"use client"

import { useState, useEffect } from "react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { TopHero } from "@/components/top-hero"
import { TestCard } from "@/components/test-card"
import { StatCard } from "@/components/stat-card"
import { Users, ClipboardList, Clock, ArrowRight, MapPin } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { API_BASE_URL } from "@/lib/api_config"

export default function Home() {
  const router = useRouter()
  const [tests, setTests] = useState<any[]>([])

  useEffect(() => {
    const fetchTests = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/patient/tests`)
        if (res.ok) {
          const data = await res.json()
          setTests(data.slice(0, 8)) // Get 8 featured tests
        }
      } catch (error) {
        console.error("Failed to fetch featured tests", error)
      }
    }
    fetchTests()
  }, [])

  const handleBookNow = (id: string) => {
    localStorage.setItem("pending_test", id)
    router.push("/patient/book-test")
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-white dark:bg-slate-950 transition-colors duration-300">
        <TopHero />

        {/* Tests Section */}
        <section className="py-20 md:py-32 bg-slate-50 dark:bg-slate-900 border-t border-slate-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white mb-4">Featured Health Tests</h2>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">Explore our most popular home diagnostic packages designed for comprehensive wellness screening.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {tests.length === 0 ? (
                <div className="col-span-4 text-center text-slate-500">Loading featured health tests...</div>
              ) : (
                tests.map((test) => (
                  <TestCard
                    key={test.id}
                    id={test.id}
                    name={test.name}
                    description={test.description}
                    price={test.price}
                    tests={[test.specimen, test.reporting_time].filter(Boolean)}
                    onSelect={handleBookNow}
                    buttonText="Book Now"
                  />
                ))
              )}
            </div>
            <div className="mt-16 text-center">
              <Link href="/services">
                <Button size="lg" className="bg-white text-blue-600 border border-blue-200 hover:bg-blue-50 hover:border-blue-300 rounded-full px-8 shadow-sm transition-all hover:-translate-y-0.5 font-semibold font-sans">
                  View All Services
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-20 md:py-24 bg-white dark:bg-slate-950">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl md:text-4xl font-extrabold text-center mb-16 text-slate-900 dark:text-white">Why Choose Us</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <StatCard number="10K+" label="Happy Patients" icon={<Users className="w-8 h-8" />} />
              <StatCard number="5" label="Branches in Sialkot" icon={<MapPin className="w-8 h-8" />} />
              <StatCard number="24/7" label="Support" icon={<Clock className="w-8 h-8" />} />
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-20 md:py-32 bg-slate-50 dark:bg-slate-900 border-t border-slate-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl md:text-4xl font-extrabold text-center mb-16 text-slate-900 dark:text-white">How It Works</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8 relative">
              {/* Optional connector line hidden for simplicity, but easily addable */}

              <div className="text-center relative">
                <div className="bg-blue-100 text-blue-600 shadow-sm rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6 text-xl font-extrabold">
                  1
                </div>
                <h3 className="font-bold mb-2 text-slate-900 text-xl dark:text-white">Book a Test</h3>
                <p className="text-slate-600 dark:text-slate-400">Select your test and preferred time slots online.</p>
              </div>
              <div className="text-center relative">
                <div className="bg-blue-100 text-blue-600 shadow-sm rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6 text-xl font-extrabold">
                  2
                </div>
                <h3 className="font-bold mb-2 text-slate-900 text-xl dark:text-white">Confirm Address</h3>
                <p className="text-slate-600 dark:text-slate-400">Provide your exact home location for the visit.</p>
              </div>
              <div className="text-center relative">
                <div className="bg-blue-100 text-blue-600 shadow-sm rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6 text-xl font-extrabold">
                  3
                </div>
                <h3 className="font-bold mb-2 text-slate-900 text-xl dark:text-white">Home Visit</h3>
                <p className="text-slate-600 dark:text-slate-400">Our certified phlebotomist arrives to collect samples.</p>
              </div>
              <div className="text-center relative">
                <div className="bg-blue-100 text-blue-600 shadow-sm rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6 text-xl font-extrabold">
                  4
                </div>
                <h3 className="font-bold mb-2 text-slate-900 text-xl dark:text-white">Get Results</h3>
                <p className="text-slate-600 dark:text-slate-400">Digital reports are available securely online within 24 hours.</p>
              </div>
            </div>
          </div>
        </section>
      </main >
      <Footer />
    </>
  )
}
