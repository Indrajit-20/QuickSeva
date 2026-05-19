import React from "react";
import { Link } from "react-router-dom";

const Home = () => {
  return (
    <main className="min-h-screen bg-slate-50">
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Hero Text */}
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
            <div className="w-full max-w-md bg-indigo-950 rounded-xl shadow-2xl p-8 border-b-4 border-red-500">
              <div className="space-y-4">
                <div className="h-4 bg-indigo-600/30 rounded w-3/4"></div>
                <div className="h-4 bg-indigo-600/30 rounded w-2/3"></div>
                <div className="mt-8 h-3 bg-indigo-900 rounded w-full"></div>
                <div className="h-3 bg-indigo-900 rounded w-5/6"></div>
                <div className="h-3 bg-indigo-900 rounded w-4/5"></div>
                <div className="mt-8 h-10 bg-red-500 rounded-lg"></div>
              </div>
            </div>
          </div>
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
            Join thousands of users who trust QuickSeva for their authentication
            needs.
          </p>
          <Link
            to="/register"
            className="inline-block bg-white hover:bg-gray-200 text-[#1B6B3A] font-bold py-3 px-8 rounded-lg transition duration-200"
          >
            Sign Up Now
          </Link>
        </div>
      </section>
    </main>
  );
};

export default Home;
