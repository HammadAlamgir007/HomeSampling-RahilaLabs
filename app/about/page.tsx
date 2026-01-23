import Navbar from "@/components/navbar"
import Footer from "@/components/footer"

export default function AboutPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto">
            <div className="mb-12">
              <h1 className="text-5xl font-bold text-gray-900 mb-4">About Rahila Labs</h1>
              <p className="text-xl text-gray-600">Bringing Quality Healthcare to Your Doorstep</p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 mb-12">
              <div className="bg-white rounded-lg shadow-lg p-8">
                <h2 className="text-2xl font-bold text-blue-900 mb-4">Our Mission</h2>
                <p className="text-gray-700 leading-relaxed">
                  At Rahila Labs, we believe that quality healthcare should be accessible to everyone. Our mission is to
                  revolutionize diagnostic testing by bringing professional phlebotomists and advanced testing services
                  directly to your home.
                </p>
              </div>

              <div className="bg-white rounded-lg shadow-lg p-8">
                <h2 className="text-2xl font-bold text-blue-900 mb-4">Our Vision</h2>
                <p className="text-gray-700 leading-relaxed">
                  We envision a world where getting tested for medical conditions is convenient, affordable, and
                  hassle-free. By leveraging technology and trained professionals, we aim to make preventive healthcare
                  accessible to all.
                </p>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-8 mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Why Choose Rahila Labs?</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white">
                      ✓
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Home Sample Collection</h3>
                    <p className="text-gray-600">Phlebotomists collect samples from your home at your convenience</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white">
                      ✓
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Certified Labs</h3>
                    <p className="text-gray-600">All tests conducted in NABL certified diagnostic centers</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white">
                      ✓
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Quick Results</h3>
                    <p className="text-gray-600">Get your reports within 24 hours via email and mobile app</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white">
                      ✓
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Expert Guidance</h3>
                    <p className="text-gray-600">Consult with our expert pathologists for test interpretation</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 rounded-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Our Commitment</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                We are committed to providing the highest quality diagnostic services with utmost privacy and care.
                Every test is handled with precision, and every patient is treated with respect.
              </p>
              <p className="text-gray-700 leading-relaxed">
                Our team of certified professionals ensures that your samples are collected safely and tested
                accurately, giving you reliable results you can trust.
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
