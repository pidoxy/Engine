import { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Logo from '@/components/Logo';
import { getSavedUser } from '@/utils/auth';
import { trackConversions } from '@/lib/gtag';
import { IoPlayCircleOutline, IoCheckmarkCircle, IoPeople, IoGrid, IoPerson, IoArrowForward } from 'react-icons/io5';

export default function Home() {
  const [user, setUser] = useState(null);
  const [showVideo, setShowVideo] = useState(false);

  // Hydration-safe: getSavedUser only on client
  useEffect(() => {
    try {
      const saved = getSavedUser();
      if (saved) setUser(saved);
    } catch {}
    
    // Track landing page view
    trackConversions.landingPageView();
  }, []);

  // Close on ESC
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') setShowVideo(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <Head>
        <title>AidCare – AI‑Powered Healthcare Support for Communities & Clinicians</title>
        <meta name="description" content="AidCare helps CHWs and clinicians capture consultations, extract key clinical details, and receive role‑aware guidance for triage or clinical decision support." />
        <meta name="keywords" content="AidCare, healthcare, CHW, clinician, triage, clinical decision support, documentation, AI" />
        <link rel="canonical" href="https://www.aidcare.example" />
        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content="AidCare – AI‑Powered Healthcare Support" />
        <meta property="og:description" content="Record, extract, and act. Role‑aware guidance for CHWs and clinicians." />
        <meta property="og:url" content="https://www.aidcare.example" />
        <meta property="og:image" content="/logo.svg" />
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="AidCare – AI‑Powered Healthcare Support" />
        <meta name="twitter:description" content="Record, extract, and act. Role‑aware guidance for CHWs and clinicians." />
        <meta name="twitter:image" content="/logo.svg" />
      </Head>
      {/* Top Navigation */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Logo compact />
            <span className="sr-only">AidCare</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm text-gray-600">
            <a href="#features" className="hover:text-gray-900">Features</a>
            <a href="#how-it-works" className="hover:text-gray-900">How it works</a>
            <a href="#product-tour" className="hover:text-gray-900">Product tour</a>
            <a href="#faq" className="hover:text-gray-900">FAQ</a>
          </nav>
          <div className="flex items-center gap-2">
            {user ? (
              <Link href="/app" className="px-4 py-2 rounded-xl bg-gray-900 text-white hover:bg-gray-800 transition-colors">Go to app</Link>
            ) : (
              <>
                <Link 
                  href="/login" 
                  className="px-4 py-2 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors"
                  onClick={() => trackConversions.loginFromLanding()}
                >
                  Log in
                </Link>
                <Link 
                  href="/signup" 
                  className="px-4 py-2 rounded-xl bg-gray-900 text-white hover:bg-gray-800 transition-colors"
                  onClick={() => trackConversions.signupFromLanding()}
                >
                  Get started
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section id="hero" className="bg-white py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl md:text-6xl font-bold text-gray-900 leading-tight">
                AI-Powered Healthcare Support for Communities & Clinicians
              </h1>
              <p className="mt-6 text-lg text-gray-600 max-w-2xl">
                A dual-purpose system designed for frontline health workers and doctors to improve access, triage, and decision-making in Nigerian healthcare.
              </p>
              <div className="mt-8">
                <Link 
                  href="/signup" 
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors"
                  onClick={() => trackConversions.signupFromLanding()}
                >
                  Sign Up
                  <IoArrowForward className="w-4 h-4" />
                </Link>
              </div>
              <p className="mt-4 text-sm text-gray-500 flex items-center gap-2">
                <IoPlayCircleOutline className="w-4 h-4" />
                Watch the live demo of AidCare below.
              </p>
            </div>
            
            {/* Hero Image/Video Placeholder */}
            <div className="relative">
              <div className="aspect-video bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl overflow-hidden border border-gray-200 shadow-lg">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                      <IoPlayCircleOutline className="w-8 h-8 text-white" />
                    </div>
                    <p className="text-sm text-gray-600">Product Demo Video</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problems Section */}
      <section id="problems" className="bg-gray-50 py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <p className="text-sm text-gray-500 uppercase tracking-wide">The problems</p>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mt-2">
              Bridging the Gap in Nigerian Healthcare
            </h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {/* Problem 1 - Overwhelmed Clinicians */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mb-6">
                <IoPerson className="w-6 h-6 text-indigo-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Overwhelmed clinicians with high patient loads.
              </h3>
              <p className="text-gray-600 mb-6">
                Doctors in cities face overwhelming patient volumes, leading to rushed consultations and potential misdiagnoses. The pressure to see more patients often compromises the quality of care.
              </p>
              <div className="aspect-video bg-gray-100 rounded-lg mb-4 overflow-hidden">
                <img 
                  src="/doctor_image.svg" 
                  alt="Overwhelmed doctor" 
                  className="w-full h-full object-cover"
                />
              </div>
              <a href="#" className="text-indigo-600 hover:text-indigo-700 font-medium transition-colors">
                View Solution →
              </a>
            </div>

            {/* Problem 2 - CHW Diagnostic Support */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mb-6">
                <IoGrid className="w-6 h-6 text-indigo-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Community Health Workers Lacking Diagnostic Support
              </h3>
              <p className="text-gray-600 mb-6">
                CHWs in remote areas lack access to diagnostic tools and real-time guidance, making it difficult to provide effective triage and initial care to their communities.
              </p>
              <div className="aspect-video bg-gray-100 rounded-lg mb-4 overflow-hidden">
                <img 
                  src="/chw_image.svg" 
                  alt="Community Health Worker" 
                  className="w-full h-full object-cover"
                />
              </div>
              <a href="#" className="text-indigo-600 hover:text-indigo-700 font-medium transition-colors">
                View Solution →
              </a>
            </div>

            {/* Problem 3 - Limited Access */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mb-6">
                <IoPerson className="w-6 h-6 text-indigo-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Limited Access in Remote Communities
              </h3>
              <p className="text-gray-600 mb-6">
                Nigerians in remote areas struggle to access quality healthcare services, often traveling long distances for basic medical care or going without proper treatment.
              </p>
              <div className="aspect-video bg-gray-100 rounded-lg mb-4 overflow-hidden">
                <img 
                  src="/patient_image.svg" 
                  alt="Patient in hospital" 
                  className="w-full h-full object-cover"
                />
              </div>
              <a href="#" className="text-indigo-600 hover:text-indigo-700 font-medium transition-colors">
                View Solution →
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Key Features */}
      <section id="features" className="max-w-6xl mx-auto px-4 py-16">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900">What you can do with AidCare</h2>
        <div className="mt-8 grid md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow">
            <h3 className="font-semibold text-gray-900">Voice to structured data</h3>
            <p className="mt-2 text-gray-600 text-sm">Record the consultation. AidCare extracts symptoms, history, and flags to speed up documentation.</p>
          </div>
          <div className="p-6 rounded-2xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow">
            <h3 className="font-semibold text-gray-900">Role‑aware guidance</h3>
            <p className="mt-2 text-gray-600 text-sm">CHWs receive triage actions; consultants get differentials, investigations, and alerts.</p>
          </div>
          <div className="p-6 rounded-2xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow">
            <h3 className="font-semibold text-gray-900">Patient timeline</h3>
            <p className="mt-2 text-gray-600 text-sm">Quick access to past consultations and documents for context.</p>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 py-16">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900">How to use AidCare</h2>
          <ol className="mt-8 grid md:grid-cols-3 gap-6 list-decimal list-inside">
            <li className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <span className="font-semibold text-gray-900">Create or select a patient</span>
              <p className="mt-2 text-gray-600 text-sm">Use the left sidebar to search or add a new patient.</p>
            </li>
            <li className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <span className="font-semibold text-gray-900">Capture the encounter</span>
              <p className="mt-2 text-gray-600 text-sm">Tap “Use audio” to record, or type notes/upload lab images.</p>
            </li>
            <li className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <span className="font-semibold text-gray-900">Review guidance & export</span>
              <p className="mt-2 text-gray-600 text-sm">See triage or clinical support, then generate a shareable report.</p>
            </li>
          </ol>
          <div className="mt-8 text-sm text-gray-600">
            Tip: Log in as a CHW to see triage; log in as a Consultant to see clinical support.
          </div>
        </div>
      </section>

      {/* Product Tour (navigation guide) */}
      <section id="product-tour" className="max-w-6xl mx-auto px-4 py-16">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Navigating the app</h2>
        <div className="mt-8 grid md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl border bg-white border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <h3 className="font-semibold text-gray-900">Sidebar</h3>
            <p className="mt-2 text-gray-600 text-sm">Access patients, create new records, and open organization onboarding.</p>
          </div>
          <div className="p-6 rounded-2xl border bg-white border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <h3 className="font-semibold text-gray-900">Header</h3>
            <p className="mt-2 text-gray-600 text-sm">Patient details and session context appear here for quick reference.</p>
          </div>
          <div className="p-6 rounded-2xl border bg-white border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <h3 className="font-semibold text-gray-900">Workspace</h3>
            <p className="mt-2 text-gray-600 text-sm">Record audio, add notes, upload documents, and review AI guidance.</p>
          </div>
        </div>
        <div className="mt-8 flex flex-wrap gap-3">
                <Link href={user ? '/app' : '/signup'} className="px-5 py-3 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-colors">{user ? 'Open dashboard' : 'Try AidCare'}</Link>
          <Link href="/login" className="px-5 py-3 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors">Log in</Link>
        </div>
      </section>

      {/* Impact Section */}
      <section id="impacts" className="bg-gray-50 py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-sm text-gray-500 uppercase tracking-wide mb-2">Why It Matters</p>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Improving Healthcare Outcomes for Millions
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                AidCare is more than just an app—it's built to make quality healthcare accessible, faster, and smarter for everyone.
              </p>
              
              <div className="space-y-4 mb-8">
                <div className="flex items-center gap-3">
                  <IoCheckmarkCircle className="w-5 h-5 text-green-500" />
                  <span className="text-gray-700">50% faster triage decisions with AI-guided support</span>
                </div>
                <div className="flex items-center gap-3">
                  <IoCheckmarkCircle className="w-5 h-5 text-green-500" />
                  <span className="text-gray-700">Designed to support doctors nationwide through real-time clinical insights</span>
                </div>
                <div className="flex items-center gap-3">
                  <IoCheckmarkCircle className="w-5 h-5 text-green-500" />
                  <span className="text-gray-700">Built to scale across Nigerian communities with offline-first access</span>
                </div>
              </div>

              <Link 
                href="/signup" 
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors"
                onClick={() => trackConversions.signupFromLanding()}
              >
                Get Started
                <IoArrowForward className="w-4 h-4" />
              </Link>
            </div>

            {/* Image Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="aspect-square bg-gray-200 rounded-lg overflow-hidden">
                  <img 
                    src="/healthcare_professional.svg" 
                    alt="Healthcare Professional" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="aspect-square bg-gray-200 rounded-lg overflow-hidden">
                  <img 
                    src="/patient_care.svg" 
                    alt="Patient Care" 
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              <div className="space-y-4 mt-8">
                <div className="aspect-square bg-gray-200 rounded-lg overflow-hidden">
                  <img 
                    src="/community_health.svg" 
                    alt="Community Health" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="aspect-square bg-gray-200 rounded-lg overflow-hidden">
                  <img 
                    src="/nedical_team.svg" 
                    alt="Medical Team" 
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ / Footer */}
      <section id="faq" className="bg-white">
        <div className="max-w-6xl mx-auto px-4 py-16">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900">FAQ</h2>
          <div className="mt-6 grid md:grid-cols-2 gap-6">
            <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <h3 className="font-semibold text-gray-900">Who is AidCare for?</h3>
              <p className="mt-2 text-gray-600 text-sm">Frontline Community Health Workers and clinical consultants who need faster documentation and guidance.</p>
            </div>
            <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <h3 className="font-semibold text-gray-900">Does it work offline?</h3>
              <p className="mt-2 text-gray-600 text-sm">Core features require connectivity for AI processing. Documents and patient lists cache locally in the browser.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA band */}
      <section className="bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 py-12 md:py-16">
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm px-6 py-8 md:px-8 md:py-10">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div className="max-w-2xl">
                <h3 className="text-gray-900 text-2xl md:text-3xl font-extrabold leading-tight">Ready to support your patients with smarter AI tools</h3>
                <p className="mt-2 text-gray-600 text-sm md:text-base">Reduce documentation time and improve triage and clinical decisions for communities and clinicians.</p>
              </div>
              <div className="flex flex-wrap gap-3 md:justify-end">
                <Link 
                  href="/signup" 
                  className="px-5 py-3 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors"
                  onClick={() => trackConversions.signupFromLanding()}
                >
                  Sign up today
                </Link>
                <Link 
                  href="/login" 
                  className="px-5 py-3 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                  onClick={() => trackConversions.loginFromLanding()}
                >
                  Log in
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mini footer */}
      <footer className="bg-white border-t border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-6 text-center text-sm text-gray-500">
          © {new Date().getFullYear()} AidCare. All rights reserved.
        </div>
      </footer>
    </div>
  );
}