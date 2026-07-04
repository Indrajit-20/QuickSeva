import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getPolicy } from "../api/policyService";
import { getBackendErrorMessage } from "../api/authService";

const TermsOfService = () => {
  const [policy, setPolicy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    document.title = "Terms of Service - QuickSeva";
    const fetchPolicy = async () => {
      try {
        const result = await getPolicy("terms_of_service");
        setPolicy(result.data);
      } catch (err) {
        console.error(err);
        setError(getBackendErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };
    fetchPolicy();
  }, []);

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-indigo-950 to-black text-slate-100 py-16 px-4 sm:px-6 lg:px-8 flex flex-col justify-between">
      <div className="max-w-4xl mx-auto w-full">
        {/* Navigation / Header */}
        <div className="mb-8 flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center text-indigo-400 hover:text-indigo-300 font-semibold transition-colors duration-200"
          >
            <span className="mr-2">←</span> Back to Home
          </Link>
          <span className="text-xs text-slate-400 bg-indigo-950/80 px-3 py-1 rounded-full border border-indigo-900">
            Legal Document
          </span>
        </div>

        {/* Policy Content Card */}
        <div className="bg-indigo-950/40 backdrop-blur-md rounded-2xl p-8 sm:p-12 border border-indigo-500/20 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-linear-to-r from-indigo-500 via-purple-500 to-pink-500"></div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-4">
              <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-indigo-300 animate-pulse font-medium">Loading Terms of Service...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12 space-y-4">
              <div className="text-5xl">⚠️</div>
              <h2 className="text-2xl font-bold text-white">Failed to load content</h2>
              <p className="text-red-400 max-w-md mx-auto">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors font-medium"
              >
                Try Again
              </button>
            </div>
          ) : (
            <article className="prose prose-invert prose-indigo max-w-none">
              <h1 className="text-4xl font-extrabold text-white tracking-tight mb-4 border-b border-indigo-900 pb-4">
                {policy?.title}
              </h1>

              {policy?.updated_at && (
                <p className="text-xs text-indigo-400 mb-8 italic">
                  Last updated: {new Date(policy.updated_at).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })} {policy.updated_by_name && `by ${policy.updated_by_name}`}
                </p>
              )}

              <div
                className="text-slate-300 space-y-6 leading-relaxed text-base"
                dangerouslySetInnerHTML={{ __html: policy?.content }}
              />
            </article>
          )}
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;
