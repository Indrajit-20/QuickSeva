import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getPolicy } from "../api/policyService";
import { getBackendErrorMessage } from "../api/authService";

const RefundPolicy = () => {
  const [policy, setPolicy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    document.title = "Refund & Cancellation Policy - QuickSeva";
    const fetchPolicy = async () => {
      try {
        const result = await getPolicy("refund_policy");
        setPolicy(result.data);
      } catch (err) {
        console.error("Failed to load refund policy:", err);
        setError(getBackendErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };
    fetchPolicy();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 py-16 px-4 sm:px-6 lg:px-8 flex flex-col justify-between">
      <div className="max-w-4xl mx-auto w-full">
        {/* Navigation / Header */}
        <div className="mb-8 flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center text-blue-600 hover:text-blue-700 font-bold transition-colors duration-200 text-sm"
          >
            <span className="mr-2">←</span> Back to Home
          </Link>
          <span className="text-xs text-slate-550 bg-slate-100 px-3 py-1 rounded-full border border-slate-200 font-bold">
            Legal Document
          </span>
        </div>

        {/* Policy Content Card */}
        <div className="bg-white rounded-2xl p-8 sm:p-12 border border-slate-200 shadow-md relative overflow-hidden text-left">
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-emerald-600"></div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-4">
              <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-emerald-700 animate-pulse font-bold">
                Loading Refund Policy...
              </p>
            </div>
          ) : error ? (
            <div className="text-center py-12 space-y-4">
              <div className="text-5xl">⚠️</div>
              <h2 className="text-2xl font-bold text-slate-800">
                Failed to load content
              </h2>
              <p className="text-red-650 max-w-md mx-auto font-semibold">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-colors font-bold cursor-pointer"
              >
                Try Again
              </button>
            </div>
          ) : (
            <article className="prose prose-slate max-w-none">
              <h1 className="text-3xl font-bold text-slate-800 tracking-tight mb-2 border-b border-slate-100 pb-4">
                {policy?.title || "Refund & Cancellation Policy"}
              </h1>

              {policy?.updated_at && (
                <p className="text-xs text-slate-400 mb-8 font-semibold italic">
                  Last updated:{" "}
                  {new Date(policy.updated_at).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}{" "}
                  {policy.updated_by_name && `by ${policy.updated_by_name}`}
                </p>
              )}

              <div
                className="text-slate-600 space-y-6 leading-relaxed text-sm font-semibold"
                dangerouslySetInnerHTML={{ __html: policy?.content }}
              />
            </article>
          )}
        </div>
      </div>
    </div>
  );
};

export default RefundPolicy;
