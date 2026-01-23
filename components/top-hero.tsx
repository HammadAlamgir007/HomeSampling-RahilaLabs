"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useStore } from "@/lib/store"

export function TopHero() {
  const user = useStore((state) => state.user)

  return (
    <section className="bg-gradient-to-r from-blue-900 to-blue-700 text-white py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-5xl font-bold mb-6">Professional Home Diagnostic Testing</h1>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Get reliable health tests from the comfort of your home. Our trained phlebotomists bring the lab to you.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href={user ? "/patient/dashboard" : "/patient/book-test"}>
              <Button size="lg" className="bg-white text-blue-900 hover:bg-gray-100">
                Book a Test Now
              </Button>
            </Link>
            <Link href="/services">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-blue-800 bg-transparent">
                View All Tests
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
