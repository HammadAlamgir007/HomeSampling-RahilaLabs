"use client"

import type React from "react"

import { useState } from "react"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import { API_BASE_URL } from "@/lib/api_config"
import { toast } from "react-toastify"
import { BRANCHES, CONTACT_INFO } from "@/lib/constants"
import { MapPin, CheckCircle2 } from "lucide-react"

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  })
  const [submitted, setSubmitted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch(`${API_BASE_URL}/api/contact`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        setSubmitted(true)
        setFormData({ name: "", email: "", phone: "", subject: "", message: "" })
        toast.success("Message sent successfully!")
        setTimeout(() => setSubmitted(false), 5000)
      } else {
        toast.error(data.error || "Failed to send message")
      }
    } catch (error) {
      console.error("Contact form error:", error)
      toast.error("Network error. Please try again later.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 transition-colors duration-500">
        <div className="container mx-auto px-4 py-16 relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute top-[10%] left-[-10%] w-[40%] h-[40%] bg-blue-400/10 dark:bg-blue-600/5 rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute bottom-[10%] right-[-10%] w-[40%] h-[40%] bg-emerald-400/10 dark:bg-emerald-600/5 rounded-full blur-[120px] pointer-events-none" />
          
          <div className="max-w-6xl mx-auto relative z-10">
            <div className="mb-16 text-center animate-in fade-in slide-in-from-top-8 duration-700">
              <h1 className="text-5xl md:text-6xl font-black text-slate-900 dark:text-white mb-6 tracking-tight">
                Get in <span className="text-blue-600">Touch</span>
              </h1>
              <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto font-medium">
                Have questions about our services? We're here to help you with your diagnostic needs.
              </p>
            </div>

            <div className="grid lg:grid-cols-5 gap-8 mb-12">
              <div className="lg:col-span-2 space-y-6 animate-in fade-in slide-in-from-left-8 duration-700 delay-200">
                <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-xl shadow-blue-900/5">
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-8 flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/40 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400">
                      <MapPin className="w-5 h-5" />
                    </div>
                    Contact Info
                  </h2>
                  <div className="space-y-8">
                    <div>
                      <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">Phone</h3>
                      <p className="text-lg font-bold text-slate-700 dark:text-slate-200 hover:text-blue-600 transition-colors cursor-pointer">{CONTACT_INFO.phone}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">Email</h3>
                      <p className="text-lg font-bold text-slate-700 dark:text-slate-200 hover:text-blue-600 transition-colors cursor-pointer">{CONTACT_INFO.email}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-4">Our Branches</h3>
                      <ul className="grid gap-3">
                        {BRANCHES.map((branch) => (
                          <li key={branch.name} className="flex items-start gap-4 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 hover:border-blue-200 dark:hover:border-blue-900 transition-all group">
                            <MapPin className="w-5 h-5 text-blue-500 shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                            <div>
                                <p className="font-bold text-slate-800 dark:text-slate-200">{branch.name}</p>
                                <p className="text-sm text-slate-500 dark:text-slate-400">{branch.city}</p>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                      <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">Working Hours</h3>
                      <div className="flex justify-between text-slate-600 dark:text-slate-400">
                        <span className="font-medium">Mon - Fri:</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">9 AM - 6 PM</span>
                      </div>
                      <div className="flex justify-between text-slate-600 dark:text-slate-400 mt-2">
                        <span className="font-medium">Sat - Sun:</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">10 AM - 4 PM</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-3 animate-in fade-in slide-in-from-right-8 duration-700 delay-400">
                <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-3xl p-8 sm:p-10 shadow-xl shadow-blue-900/5">
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-8">Send us a Message</h2>
                  {submitted && (
                    <div className="mb-8 p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-400 rounded-2xl flex items-center gap-3 animate-in zoom-in">
                      <CheckCircle2 className="w-5 h-5 shrink-0" />
                      <span className="font-bold">Thank you! Your message has been sent successfully.</span>
                    </div>
                  )}
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid sm:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Full Name</label>
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          required
                          placeholder="John Doe"
                          className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 dark:text-white outline-none transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Email Address</label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          required
                          placeholder="john@example.com"
                          className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 dark:text-white outline-none transition-all"
                        />
                      </div>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Phone Number</label>
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          placeholder="+92 3XX XXXXXXX"
                          className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 dark:text-white outline-none transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Subject</label>
                        <input
                          type="text"
                          name="subject"
                          value={formData.subject}
                          onChange={handleChange}
                          required
                          placeholder="General Inquiry"
                          className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 dark:text-white outline-none transition-all"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Message</label>
                      <textarea
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        required
                        rows={4}
                        placeholder="How can we help you?"
                        className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 dark:text-white outline-none transition-all resize-none"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-500/20 transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:hover:translate-y-0"
                    >
                      {isLoading ? "Sending Message..." : "Send Message"}
                    </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
      </main>
      <Footer />
    </>
  )
}
