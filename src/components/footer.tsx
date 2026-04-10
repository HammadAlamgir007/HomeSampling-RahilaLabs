"use client"

import Link from "next/link"
import { Mail, Phone, MapPin, Facebook, Twitter, Instagram, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "react-toastify"
import { BRANCHES, CONTACT_INFO } from "@/lib/constants"

export function Footer() {
  return (
    <footer className="bg-slate-950 text-slate-300 mt-20 border-t border-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">

          {/* Brand & Description */}
          <div className="space-y-6">
            <h3 className="font-extrabold text-2xl text-white tracking-tight">Rahila Labs</h3>
            <p className="text-slate-400 leading-relaxed">
              Premium home-based diagnostic testing services delivering accurate, secure, and fast results straight to you.
            </p>
            <div className="flex gap-4">
              <a href="#" className="p-2 bg-slate-900 rounded-full hover:bg-blue-600 hover:text-white transition-colors duration-300">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="p-2 bg-slate-900 rounded-full hover:bg-blue-400 hover:text-white transition-colors duration-300">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="p-2 bg-slate-900 rounded-full hover:bg-pink-600 hover:text-white transition-colors duration-300">
                <Instagram className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-bold text-white mb-6 uppercase tracking-wider text-sm">Patient Portal</h4>
            <ul className="space-y-4">
              <li>
                <Link href="/patient/book-test" className="text-slate-400 hover:text-blue-400 hover:translate-x-1 inline-flex transition-all duration-300">
                  Book a Home Test
                </Link>
              </li>
              <li>
                <Link href="/patient/dashboard" className="text-slate-400 hover:text-blue-400 hover:translate-x-1 inline-flex transition-all duration-300">
                  Download Reports
                </Link>
              </li>
              <li>
                <Link href="/patient/my-bookings" className="text-slate-400 hover:text-blue-400 hover:translate-x-1 inline-flex transition-all duration-300">
                  Track Appointments
                </Link>
              </li>
              <li>
                <Link href="/services" className="text-slate-400 hover:text-blue-400 hover:translate-x-1 inline-flex transition-all duration-300">
                  View All Packages
                </Link>
              </li>
            </ul>
          </div>

          {/* Our Branches */}
          <div>
            <h4 className="font-bold text-white mb-6 uppercase tracking-wider text-sm">Our Branches</h4>
            <ul className="space-y-3">
              {BRANCHES.map((branch) => (
                <li key={branch.name} className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                  <span className="text-slate-400 text-sm">{branch.name}, {branch.city}</span>
                </li>
              ))}
              <li className="pt-2 space-y-2">
                <div className="flex items-start gap-2">
                  <Phone className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                  <span className="text-slate-400 text-sm">{CONTACT_INFO.phone}</span>
                </div>
                <div className="flex items-start gap-2">
                  <Mail className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                  <span className="text-slate-400 text-sm">{CONTACT_INFO.email}</span>
                </div>
              </li>
            </ul>
          </div>

          {/* Mini Contact Form / Newsletter */}
          <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800">
            <h4 className="font-bold text-white mb-3">Have a Question?</h4>
            <p className="text-sm text-slate-400 mb-4">Send us a quick message and our support team will reach out.</p>
            <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); toast.success('Message sent!'); }}>
              <input
                type="email"
                placeholder="Your email address"
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all text-white"
                required
              />
              <textarea
                placeholder="How can we help?"
                rows={2}
                className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all text-white resize-none"
                required
              ></textarea>
              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-900/50 group">
                Send Message
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </form>
          </div>

        </div>

        {/* Footer Bottom */}
        <div className="flex flex-col md:flex-row justify-between items-center border-t border-slate-800 mt-16 pt-8 text-sm text-slate-500">
          <p>&copy; {new Date().getFullYear()} Rahila Labs. All rights reserved.</p>
          <div className="flex gap-6 mt-4 md:mt-0">
            <Link href="/privacy" className="hover:text-blue-400 transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-blue-400 transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
