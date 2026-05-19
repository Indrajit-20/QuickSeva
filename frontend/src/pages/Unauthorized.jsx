import { Link } from "react-router-dom";

export default function Unauthorized() {
  return (
    <div className="min-h-screen bg-linear-to-br from-red-50 to-red-100 flex items-center justify-center p-4">
      <div className="text-center max-w-lg">
        {/* 403 Number */}
        <div className="mb-6">
          <h1 className="text-9xl font-extrabold text-red-600 mb-2 drop-shadow-lg">
            403
          </h1>
          <p className="text-2xl font-bold text-slate-700 mb-4">
            Access Denied
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
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>

          <p className="text-slate-600 text-lg mb-2">
            You don't have permission to access this page.
          </p>
          <p className="text-slate-500 text-sm mb-6">
            Your role or credentials don't match the required access level.
          </p>

          {/* Error Code */}
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 text-left rounded">
            <p className="text-sm text-red-700">
              <span className="font-semibold">Error:</span> Insufficient
              permissions
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

            <Link
              to="/login"
              className="px-8 py-3 bg-slate-600 text-white font-semibold rounded-lg hover:bg-slate-700 transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105"
            >
              Log In Again
            </Link>
          </div>
        </div>

        {/* Help Text */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <p className="text-slate-700 font-semibold mb-3">What to do next?</p>
          <ul className="text-left text-slate-600 text-sm space-y-2">
            <li className="flex items-start">
              <span className="text-emerald-600 font-bold mr-3">•</span>
              <span>Check if you're logged in with the correct account</span>
            </li>
            <li className="flex items-start">
              <span className="text-emerald-600 font-bold mr-3">•</span>
              <span>Verify that your account has the required permissions</span>
            </li>
            <li className="flex items-start">
              <span className="text-emerald-600 font-bold mr-3">•</span>
              <span>Contact support if you believe this is an error</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
