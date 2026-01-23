"use client"

import { useStore } from "@/lib/store"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import TestCard from "@/components/test-card"
import Link from "next/link"

export default function ServicesPage() {
  const user = useStore((state) => state.user)
  const tests = useStore((state) => state.tests)

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
        <div className="container mx-auto px-4 py-16">
          <div className="mb-12 text-center">
            <h1 className="text-5xl font-bold text-gray-900 mb-4">Our Diagnostic Services</h1>
            <p className="text-xl text-gray-600">Comprehensive health testing at your doorstep</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {tests.map((test) => (
              <TestCard
                key={test.id}
                id={test.id}
                name={test.name}
                description={test.description}
                price={test.price}
                tests={[test.sampleType, test.turnaroundTime]}
              />
            ))}
          </div>

          <div className="bg-blue-50 rounded-lg p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Ready to get tested?</h2>
            <p className="text-gray-600 mb-6">Book your home sample collection now</p>
            <Link
              href={user ? "/patient/dashboard" : "/patient/book-test"}
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition"
            >
              Book a Test
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
