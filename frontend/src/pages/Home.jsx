import React from "react";
import { Link } from "react-router-dom";

import Hero from "../components/Hero";
import NearbyServices from "../components/NearbyServices";

const Home = () => {
  return (
    <main className="min-h-screen bg-brand-bg">
      <Hero />

      {/* Services Near You */}
      <section className="bg-indigo-950 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center text-center mb-12">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold tracking-widest uppercase bg-[#1fbf75]/10 text-[#1fbf75] border border-[#1fbf75]/25 mb-3 select-none">
              📍 Location Radar
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Services Near You
            </h2>
            <p className="text-indigo-200 mt-3 max-w-2xl text-sm sm:text-base leading-relaxed">
              Showing verified providers within 5km of your location — search by area, pincode, or service type
            </p>
          </div>
          <NearbyServices />
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-indigo-950 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              Why Choose QuickSeva?
            </h2>
            <p className="text-xl text-indigo-200">
              Secure, reliable, and easy to use
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-indigo-900 rounded-lg p-8 hover:shadow-lg transition border-l-4 border-red-500">
              <div className="w-12 h-12 bg-red-500 rounded-lg flex items-center justify-center mb-4">
                <span className="text-white text-xl font-bold">🔒</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Secure</h3>
              <p className="text-indigo-200">
                Industry-standard encryption and security protocols to protect
                your data.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-indigo-900 rounded-lg p-8 hover:shadow-lg transition border-l-4 border-red-500">
              <div className="w-12 h-12 bg-red-500 rounded-lg flex items-center justify-center mb-4">
                <span className="text-white text-xl font-bold">⚡</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Fast</h3>
              <p className="text-indigo-200">
                Lightning-quick authentication with optimized .NET backend
                performance.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-indigo-900 rounded-lg p-8 hover:shadow-lg transition border-l-4 border-red-500">
              <div className="w-12 h-12 bg-red-500 rounded-lg flex items-center justify-center mb-4">
                <span className="text-white text-xl font-bold">👥</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                User-Friendly
              </h3>
              <p className="text-indigo-200">
                Intuitive interface designed for seamless user experience and
                easy integration.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="bg-[#1B6B3A] py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-gray-200 mb-8">
            Join thousands of partners who trust QuickSeva for their onboarding.
          </p>
          <Link
            to="/seller-register"
            className="inline-block bg-white hover:bg-gray-200 text-[#1B6B3A] font-bold py-3 px-8 rounded-lg transition duration-200"
          >
            Become a Partner
          </Link>
        </div>
      </section>
    </main>
  );
};

export default Home;
