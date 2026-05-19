import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-linear-to-br from-emerald-50 to-emerald-100 flex items-center justify-center p-4">
      <div className="text-center max-w-lg">
        {/* 404 Number */}
        <div className="mb-6">
          <h1 className="text-9xl font-extrabold text-emerald-600 mb-2 drop-shadow-lg">
            404
          </h1>
          <p className="text-2xl font-bold text-slate-700 mb-4">
            Page Not Found
          </p>
        </div>

        {/* Error Description */}
        <div className="bg-white rounded-lg shadow-xl p-8 mb-8">
          <svg
            className="w-20 h-20 mx-auto mb-6 text-red-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>

          <p className="text-slate-600 text-lg mb-2">
            Oops! The page you're looking for doesn't exist.
          </p>
          <p className="text-slate-500 text-sm mb-6">
            It might have been moved or deleted. Let's get you back on track!
          </p>

          {/* Error Code */}
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 text-left rounded">
            <p className="text-sm text-red-700">
              <span className="font-semibold">Error:</span> Invalid route path
              requested
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/"
              className="px-8 py-3 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105"
            >
              Go to Home
            </Link>

            <button
              onClick={() => window.history.back()}
              className="px-8 py-3 bg-slate-600 text-white font-semibold rounded-lg hover:bg-slate-700 transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105"
            >
              Go Back
            </button>
          </div>
        </div>

        {/* Quick Links */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <p className="text-slate-700 font-semibold mb-4">Quick Links:</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              to="/"
              className="px-4 py-2 bg-emerald-50 text-emerald-700 rounded-full hover:bg-emerald-100 transition-colors text-sm font-medium"
            >
              Home
            </Link>
            <Link
              to="/login"
              className="px-4 py-2 bg-emerald-50 text-emerald-700 rounded-full hover:bg-emerald-100 transition-colors text-sm font-medium"
            >
              Login
            </Link>
            <Link
              to="/register"
              className="px-4 py-2 bg-emerald-50 text-emerald-700 rounded-full hover:bg-emerald-100 transition-colors text-sm font-medium"
            >
              Register
            </Link>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="mt-8 text-slate-400">
          <p className="text-sm">
            Still having trouble? Check the URL and try again.
          </p>
        </div>
      </div>
    </div>
  );
}
