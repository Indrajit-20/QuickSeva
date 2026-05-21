import React from "react";
import { Link } from "react-router-dom";

import Hero from "../components/Hero";
import NearbyServices from "../components/NearbyServices";

const Home = () => {
  return (
    <main className="min-h-screen bg-brand-bg">
      <Hero />

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Hero */}
          <div className="space-y-6">
            <h1 className="text-5xl lg:text-6xl font-bold text-slate-900 leading-tight">
              Welcome to <span className="text-indigo-600">QuickSeva</span>
            </h1>
            <p className="text-xl text-slate-600 leading-relaxed">
              A modern, secure authentication system built with React and .NET.
              Sign up or log in to get started.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                to="/login"
                className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-lg transition duration-200 text-center shadow-md hover:shadow-lg"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="inline-block bg-white hover:bg-red-50 text-red-600 font-bold py-3 px-8 rounded-lg border-2 border-red-500 transition duration-200 text-center"
              >
                Create Account
              </Link>
            </div>
          </div>

          {/* Hero Image */}
          <div className="flex items-center justify-center">
            <div className="w-full max-w-130">
              <div className="grid grid-cols-2 gap-2.5 max-w-[420px]">
                {/* 1st column */}
                <img
                  src="/images/close-up-of-repairman-in-uniform-standing-on-home-kitchen-and-holding-his-tool-bag.webp"
                  alt="Home repair services"
                  className="w-full h-50 rounded-[14px] shadow-sm object-cover"
                  loading="lazy"
                />
                <img
                  src="/images/233-kitchen-cleaning.webp"
                  alt="Kitchen cleaning"
                  className="w-full h-37.5 rounded-[14px] shadow-sm object-cover"
                  loading="lazy"
                />

                {/* 2nd column */}
                <img
                  src="/images/a-to-z-aircon-gorwa-vadodara-ac-repair-and-services-ra1caj6hjs-250.webp"
                  alt="AC repair"
                  className="w-full h-37.5 rounded-[14px] shadow-sm object-cover"
                  loading="lazy"
                />
                <img
                  src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400"
                  alt="Toilet cleaning"
                  className="w-full h-50 rounded-[14px] shadow-sm object-cover"
                  loading="lazy"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Near You */}
      <section className="bg-indigo-950 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-white">
              Services Near You
            </h2>
            <p className="text-indigo-200 mt-2">
              Showing verified providers within 5km of your location — search by area or service type
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
