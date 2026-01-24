"use client"

import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { TopHero } from "@/components/top-hero"
import { TestCard } from "@/components/test-card"
import { StatCard } from "@/components/stat-card"

export default function Home() {
  const tests = [
    {
      id: "1",
      name: "Complete Blood Count",
      description: "Full blood work analysis",
      price: 1500,
      tests: ["RBC", "WBC", "Hemoglobin", "Platelet Count"],
    },
    {
      id: "2",
      name: "Thyroid Profile",
      description: "Thyroid function tests",
      price: 2000,
      tests: ["TSH", "Free T3", "Free T4"],
    },
    {
      id: "3",
      name: "Lipid Profile",
      description: "Cholesterol and lipid levels",
      price: 1800,
      tests: ["Total Cholesterol", "LDL", "HDL", "Triglycerides"],
    },
    {
      id: "4",
      name: "Liver Function",
      description: "Liver health assessment",
      price: 2200,
      tests: ["ALT", "AST", "Bilirubin", "Albumin"],
    },
  ]

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-white dark:bg-slate-950 transition-colors duration-300">
        <TopHero />

        {/* Tests Section */}
        <section className="py-16 bg-gray-50 dark:bg-slate-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center mb-12 text-gray-900 dark:text-white">Featured Tests</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {tests.map((test) => (
                <TestCard key={test.id} {...test} />
              ))}
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-16 dark:bg-slate-950">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center mb-12 text-gray-900 dark:text-white">Why Choose Us</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatCard number="10K+" label="Happy Patients" />
              <StatCard number="50+" label="Tests Available" />
              <StatCard number="24/7" label="Support" />
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-16 bg-gray-50 dark:bg-slate-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center mb-12 text-gray-900 dark:text-white">How It Works</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="bg-blue-900 text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4 text-lg font-bold">
                  1
                </div>
                <h3 className="font-bold mb-2 text-gray-900 dark:text-white">Book a Test</h3>
                <p className="text-gray-600 dark:text-slate-400">Select your test and preferred time</p>
              </div>
              <div className="text-center">
                <div className="bg-blue-900 text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4 text-lg font-bold">
                  2
                </div>
                <h3 className="font-bold mb-2 text-gray-900 dark:text-white">Confirm Address</h3>
                <p className="text-gray-600 dark:text-slate-400">Provide your home address</p>
              </div>
              <div className="text-center">
                <div className="bg-blue-900 text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4 text-lg font-bold">
                  3
                </div>
                <h3 className="font-bold mb-2 text-gray-900 dark:text-white">Home Visit</h3>
                <p className="text-gray-600 dark:text-slate-400">Our technician visits your home</p>
              </div>
              <div className="text-center">
                <div className="bg-blue-900 text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4 text-lg font-bold">
                  4
                </div>
                <h3 className="font-bold mb-2 text-gray-900 dark:text-white">Get Results</h3>
                <p className="text-gray-600 dark:text-slate-400">Results within 24 hours</p>
              </div>
            </div>
          </div>
        </section>
      </main >
      <Footer />
    </>
  )
}
