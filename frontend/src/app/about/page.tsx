import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import { BRANCHES, CONTACT_INFO } from "@/lib/constants"
import { MapPin, Phone, Mail, CheckCircle } from "lucide-react"

const features = [
  {
    title: "Home Sample Collection",
    description: "Phlebotomists collect samples from your home at your convenience",
  },
  {
    title: "Certified Labs",
    description: "All tests conducted in NABL certified diagnostic centers",
  },
  {
    title: "Quick Results",
    description: "Get your reports within 24 hours via email and mobile app",
  },
  {
    title: "Expert Guidance",
    description: "Consult with our expert pathologists for test interpretation",
  },
]

export default function AboutPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 transition-colors duration-500">
        {/* Hero Header */}
        <div className="relative overflow-hidden py-24 px-4">
          <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[60%] bg-blue-400/10 dark:bg-blue-600/5 rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute bottom-0 right-[-5%] w-[30%] h-[50%] bg-indigo-400/10 dark:bg-indigo-600/5 rounded-full blur-[120px] pointer-events-none" />
          <div className="max-w-4xl mx-auto text-center relative z-10 animate-in fade-in slide-in-from-top-8 duration-700">
            <h1 className="text-5xl md:text-6xl font-black text-slate-900 dark:text-white mb-6 tracking-tight">
              About <span className="text-blue-600">Rahila Labs</span>
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto font-medium">
              Bringing Quality Healthcare to Your Doorstep
            </p>
          </div>
        </div>

        <div className="container mx-auto px-4 pb-20">
          <div className="max-w-5xl mx-auto space-y-8">

            {/* Mission & Vision */}
            <div className="grid md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
              <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-xl shadow-blue-900/5 hover:shadow-blue-900/10 transition-shadow">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/40 rounded-2xl flex items-center justify-center text-blue-600 dark:text-blue-400 mb-6">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-bold text-blue-700 dark:text-blue-400 mb-4">Our Mission</h2>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  At Rahila Labs, we believe that quality healthcare should be accessible to everyone. Our mission is to
                  revolutionize diagnostic testing by bringing professional phlebotomists and advanced testing services
                  directly to your home.
                </p>
              </div>

              <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-xl shadow-blue-900/5 hover:shadow-blue-900/10 transition-shadow">
                <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/40 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-6">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-bold text-blue-700 dark:text-blue-400 mb-4">Our Vision</h2>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  We envision a world where getting tested for medical conditions is convenient, affordable, and
                  hassle-free. By leveraging technology and trained professionals, we aim to make preventive healthcare
                  accessible to all.
                </p>
              </div>
            </div>

            {/* Why Choose Us */}
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-3xl p-8 md:p-10 shadow-xl shadow-blue-900/5 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-8">Why Choose Rahila Labs?</h2>
              <div className="grid md:grid-cols-2 gap-6">
                {features.map((feature) => (
                  <div key={feature.title} className="flex gap-5 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 hover:border-blue-200 dark:hover:border-blue-900/50 transition-all group">
                    <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-xl bg-blue-600 text-white font-bold text-lg shadow-lg shadow-blue-500/20">
                      ✓
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{feature.title}</h3>
                      <p className="text-slate-600 dark:text-slate-400 mt-1 text-sm leading-relaxed">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Commitment */}
            <div className="bg-gradient-to-br from-blue-600 to-blue-800 dark:from-blue-900 dark:to-slate-900 rounded-3xl p-8 md:p-10 border border-blue-500/20 dark:border-blue-800 relative overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
              <div className="relative z-10">
                <h2 className="text-2xl font-bold text-white mb-4">Our Commitment</h2>
                <p className="text-blue-100 leading-relaxed mb-4">
                  We are committed to providing the highest quality diagnostic services with utmost privacy and care.
                  Every test is handled with precision, and every patient is treated with respect.
                </p>
                <p className="text-blue-100 leading-relaxed">
                  Our team of certified professionals ensures that your samples are collected safely and tested
                  accurately, giving you reliable results you can trust.
                </p>
              </div>
            </div>

            {/* Our Branches */}
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-3xl p-8 md:p-10 shadow-xl shadow-blue-900/5 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-400">
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-3">Our Locations</h2>
              <p className="text-slate-500 dark:text-slate-400 mb-8 font-medium">Serving the Sialkot community from 5 convenient locations.</p>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {BRANCHES.map((branch) => (
                  <div key={branch.name} className="flex items-start gap-4 p-4 bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800 rounded-2xl hover:border-blue-200 dark:hover:border-blue-900 transition-all group">
                    <MapPin className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0 group-hover:scale-110 transition-transform" />
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white text-sm">{branch.name}</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{branch.area}, {branch.city}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-6">
                <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer">
                  <div className="w-9 h-9 bg-blue-100 dark:bg-blue-900/40 rounded-xl flex items-center justify-center">
                    <Phone className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{CONTACT_INFO.phone}</span>
                </div>
                <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer">
                  <div className="w-9 h-9 bg-blue-100 dark:bg-blue-900/40 rounded-xl flex items-center justify-center">
                    <Mail className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{CONTACT_INFO.email}</span>
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
