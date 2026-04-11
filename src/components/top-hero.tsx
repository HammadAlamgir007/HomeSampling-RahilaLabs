"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useStore } from "@/lib/store"
import { Activity, Beaker, CheckCircle, HeartPulse, Star } from "lucide-react"

export function TopHero() {
  const user = useStore((state) => state.user)

  return (
    <section className="relative overflow-hidden bg-slate-100 dark:bg-[#020617] pt-16 md:pt-28 pb-32 transition-colors duration-500">
      {/* Premium Background Decorative Gradients */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[60%] rounded-full bg-blue-500/20 dark:bg-blue-600/10 mix-blend-multiply dark:mix-blend-lighten filter blur-[100px] opacity-70 animate-blob" />
        <div className="absolute top-[10%] right-[-5%] w-[40%] h-[50%] rounded-full bg-teal-400/20 dark:bg-teal-600/10 mix-blend-multiply dark:mix-blend-lighten filter blur-[100px] opacity-70 animate-blob" style={{ animationDelay: "2s" }} />
        <div className="absolute bottom-[-20%] left-[20%] w-[60%] h-[60%] rounded-full bg-indigo-500/20 dark:bg-indigo-600/10 mix-blend-multiply dark:mix-blend-lighten filter blur-[100px] opacity-70 animate-blob" style={{ animationDelay: "4s" }} />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

          {/* Left Text Column */}
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-blue-100 dark:border-blue-900/50 text-blue-700 dark:text-blue-400 text-sm font-bold shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-700">
              <Activity className="w-4 h-4 animate-pulse" />
              <span>Premium Home Diagnostic Testing</span>
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-slate-900 dark:text-white leading-[1.1] tracking-tight animate-in fade-in slide-in-from-bottom-6 duration-700 delay-150 fill-mode-both">
              Accurate Diagnostics. <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-teal-500 dark:from-blue-400 dark:to-teal-300 block mt-2 mb-2">Trusted Results.</span> Better Health.
            </h1>

            <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-xl animate-in fade-in slide-in-from-bottom-6 duration-700 delay-300 fill-mode-both font-medium">
              Get reliable health tests from the comfort of your home. Our certified phlebotomists bring the lab to you with fast, secure reporting.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-4 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-500 fill-mode-both">
              <Link href={user ? "/patient/dashboard" : "/patient/book-test"}>
                <Button size="lg" className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white shadow-xl shadow-blue-600/20 dark:shadow-blue-900/40 rounded-full px-8 py-6 text-lg tracking-wide font-bold transition-all duration-300 hover:scale-105 active:scale-95">
                  Book a Test
                </Button>
              </Link>
              <Link href={user ? "/patient/dashboard" : "/patient/dashboard"}>
                <Button size="lg" variant="outline" className="w-full sm:w-auto border-blue-200 dark:border-slate-700 text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-full px-8 py-6 text-lg font-bold transition-all duration-300 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm hover:scale-105 active:scale-95">
                  {user ? "View Dashboard" : "Download Report"}
                </Button>
              </Link>
            </div>
          </div>

          {/* Right Visual Column */}
          <div className="relative mt-8 lg:mt-0 lg:ml-8 hidden md:block animate-in fade-in zoom-in-95 duration-1000 delay-300 fill-mode-both">
            {/* Main Visual Card */}
            <div className="relative bg-white/60 dark:bg-slate-900/60 backdrop-blur-2xl rounded-[2.5rem] p-10 shadow-2xl shadow-blue-900/10 dark:shadow-blue-900/20 border border-white/50 dark:border-slate-700/50 z-10 w-full max-w-md mx-auto aspect-square flex flex-col items-center justify-center transform transition-transform duration-700 hover:rotate-1 hover:scale-105 group">
              <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-blue-50/10 dark:from-slate-800/40 dark:to-blue-900/10 rounded-[2.5rem] pointer-events-none" />
              <HeartPulse className="w-32 h-32 text-blue-500 dark:text-blue-400 mb-6 drop-shadow-xl group-hover:scale-110 transition-transform duration-500" />
              <h3 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">Rahila Labs</h3>
              <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">Precision you can trust</p>
            </div>

            {/* Floating Trust Badges */}
            <div className="absolute -top-6 -left-8 bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl p-4 rounded-2xl shadow-xl shadow-blue-900/10 dark:shadow-slate-950/50 border border-white/20 dark:border-slate-700 flex items-center gap-4 z-20 animate-[blob_6s_infinite] hover:scale-110 transition-transform cursor-pointer">
              <div className="bg-amber-100 dark:bg-amber-900/30 p-2.5 rounded-full">
                <Star className="w-6 h-6 text-amber-500 dark:text-amber-400 fill-current" />
              </div>
              <div className="flex flex-col">
                <span className="font-black text-slate-900 dark:text-white leading-tight text-lg">1600+</span>
                <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">5-Star Reviews</span>
              </div>
            </div>

            <div className="absolute top-1/2 -right-12 translate-y-[-50%] bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl p-4 rounded-2xl shadow-xl shadow-blue-900/10 dark:shadow-slate-950/50 border border-white/20 dark:border-slate-700 flex items-center gap-4 z-20 animate-[blob_8s_infinite] hover:scale-110 transition-transform cursor-pointer" style={{ animationDelay: "1s" }}>
              <div className="bg-emerald-100 dark:bg-emerald-900/30 p-2.5 rounded-full">
                <CheckCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="flex flex-col">
                <span className="font-black text-slate-900 dark:text-white leading-tight text-lg">98%</span>
                <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">Accuracy Rate</span>
              </div>
            </div>

            <div className="absolute -bottom-8 left-1/2 translate-x-[-50%] bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl p-4 rounded-2xl shadow-xl shadow-blue-900/10 dark:shadow-slate-950/50 border border-white/20 dark:border-slate-700 flex items-center gap-4 z-20 animate-[blob_7s_infinite] hover:scale-110 transition-transform cursor-pointer" style={{ animationDelay: "2s" }}>
              <div className="bg-blue-100 dark:bg-blue-900/40 p-2.5 rounded-full">
                <Beaker className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex flex-col">
                <span className="font-black text-slate-900 dark:text-white leading-tight text-lg">Certified</span>
                <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">Clinical Lab</span>
              </div>
            </div>

          </div>

        </div>
      </div>
    </section>
  )
}
