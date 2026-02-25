"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useStore } from "@/lib/store"
import { Activity, Beaker, CheckCircle, HeartPulse, Star } from "lucide-react"

export function TopHero() {
  const user = useStore((state) => state.user)

  return (
    <section className="relative overflow-hidden bg-slate-50 pt-16 md:pt-24 pb-32">
      {/* Background Decorative Gradients */}
      <div className="absolute top-0 left-1/2 w-full -translate-x-1/2 h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-100/50 blur-3xl" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[50%] h-[50%] rounded-full bg-blue-200/40 blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

          {/* Left Text Column */}
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm font-medium">
              <Activity className="w-4 h-4" />
              <span>Premium Home Diagnostic Testing</span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-slate-900 leading-tight tracking-tight">
              Accurate Diagnostics. <br />
              <span className="text-blue-600">Trusted Results.</span> <br />
              Better Health.
            </h1>

            <p className="text-lg md:text-xl text-slate-600 max-w-xl">
              Get reliable health tests from the comfort of your home. Our certified phlebotomists bring the lab to you with fast, secure reporting.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link href={user ? "/patient/dashboard" : "/patient/book-test"}>
                <Button size="lg" className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20 rounded-full px-8 py-6 text-lg transition-transform hover:-translate-y-0.5">
                  Book a Test
                </Button>
              </Link>
              <Link href="/patient/dashboard">
                <Button size="lg" variant="outline" className="w-full sm:w-auto border-blue-200 text-blue-700 hover:bg-blue-50 rounded-full px-8 py-6 text-lg transition-transform hover:-translate-y-0.5 bg-white">
                  Download Report
                </Button>
              </Link>
            </div>
          </div>

          {/* Right Visual Column */}
          <div className="relative mt-8 lg:mt-0 lg:ml-8 hidden md:block">
            {/* Main Visual Card */}
            <div className="relative bg-white rounded-3xl p-8 shadow-2xl shadow-blue-900/10 border border-slate-100 z-10 w-full max-w-md mx-auto aspect-square flex flex-col items-center justify-center bg-gradient-to-br from-white to-blue-50 text-center">
              <HeartPulse className="w-32 h-32 text-blue-500 mb-6 opacity-80" />
              <h3 className="text-2xl font-bold text-slate-800">Rahila Labs</h3>
              <p className="text-slate-500 mt-2">Precision you can trust</p>
            </div>

            {/* Floating Trust Badges */}
            <div className="absolute -top-6 -left-8 bg-white p-4 rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-50 flex items-center gap-3 z-20 animate-fade-in-up">
              <div className="bg-yellow-100 p-2 rounded-full">
                <Star className="w-6 h-6 text-yellow-600 fill-current" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-slate-900 leading-tight">1600+</span>
                <span className="text-xs text-slate-500">5-Star Reviews</span>
              </div>
            </div>

            <div className="absolute top-1/2 -right-12 translate-y-[-50%] bg-white p-4 rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-50 flex items-center gap-3 z-20">
              <div className="bg-green-100 p-2 rounded-full">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-slate-900 leading-tight">98%</span>
                <span className="text-xs text-slate-500">Accuracy Rate</span>
              </div>
            </div>

            <div className="absolute -bottom-8 left-1/2 translate-x-[-50%] bg-white p-4 rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-50 flex items-center gap-3 z-20">
              <div className="bg-blue-100 p-2 rounded-full">
                <Beaker className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-slate-900 leading-tight">Certified</span>
                <span className="text-xs text-slate-500">Clinical Lab</span>
              </div>
            </div>

          </div>

        </div>
      </div>
    </section>
  )
}
