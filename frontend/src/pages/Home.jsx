import React from "react";
import { Link } from "react-router-dom";

import NearbyServices from "../components/NearbyServices";

const Home = () => {
  return (
    <main className="min-h-screen flex flex-col" style={{ backgroundColor: "#f8fafc" }}>

      {/* ── Services Near You Section (dark hero) ── */}
      <section className="bg-indigo-950 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center text-center mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Services Near You
            </h1>
            <p className="text-sm text-indigo-200/80 mt-1 max-w-xl">
              Find verified professionals within 5km of your location
            </p>
          </div>
          <NearbyServices />
        </div>
      </section>

      {/* ── Why Choose QuickSeva (white background) ── */}
      <section className="bg-white py-20 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-bold text-slate-900 mb-3">
              Why Choose QuickSeva?
            </h2>
            <p className="text-lg text-slate-500">
              Secure, reliable, and easy to use
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Secure */}
            <div className="bg-white border border-slate-100 rounded-2xl p-8 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col items-start">
              <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center mb-5">
                <svg className="w-7 h-7 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Secure</h3>
              <p className="text-slate-500 leading-relaxed">
                Industry-standard encryption and security protocols to protect your data.
              </p>
            </div>

            {/* Fast */}
            <div className="bg-white border border-slate-100 rounded-2xl p-8 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col items-start">
              <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center mb-5">
                <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Fast</h3>
              <p className="text-slate-500 leading-relaxed">
                Lightning-quick authentication with optimized .NET backend performance.
              </p>
            </div>

            {/* User-Friendly */}
            <div className="bg-white border border-slate-100 rounded-2xl p-8 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col items-start">
              <div className="w-14 h-14 bg-purple-50 rounded-2xl flex items-center justify-center mb-5">
                <svg className="w-7 h-7 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">User-Friendly</h3>
              <p className="text-slate-500 leading-relaxed">
                Intuitive interface designed for seamless user experience and easy integration.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Call to Action ── */}
      <section
        className="py-20 flex-grow flex items-center justify-center relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)" }}
      >
        {/* subtle dot pattern */}
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h2 className="text-4xl font-bold text-white mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-indigo-100 mb-8">
            Join thousands of partners who trust QuickSeva for their onboarding.
          </p>
          <Link
            to="/seller-register"
            className="inline-block bg-white hover:bg-slate-50 text-indigo-700 font-bold py-3 px-8 rounded-xl transition-all duration-200 hover:shadow-lg hover:scale-[1.02]"
          >
            Become a Partner
          </Link>
        </div>
      </section>

    </main>
  );
};

export default Home;
