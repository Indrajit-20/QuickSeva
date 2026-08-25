import React from "react";

/**
 * SellerProfileSkeleton — Shimmer placeholder matching SellerPublicProfile layout.
 * Shown instead of a spinner while seller data loads on slow networks.
 */

function Shimmer({ className = "", style = {} }) {
  return (
    <div
      className={className}
      style={{
        background: "linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%)",
        backgroundSize: "200% 100%",
        animation: "qs-shimmer 1.5s infinite",
        borderRadius: "8px",
        ...style,
      }}
    />
  );
}

export default function SellerProfileSkeleton() {
  return (
    <>
      <style>{`
        @keyframes qs-shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>

      <main className="min-h-screen bg-slate-50 px-4 py-8">
        <div className="max-w-3xl mx-auto space-y-5">

          {/* Back button placeholder */}
          <Shimmer style={{ width: 80, height: 28, borderRadius: 8 }} />

          {/* Profile Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">

            {/* Banner */}
            <Shimmer style={{ width: "100%", height: 120, borderRadius: 0 }} />

            {/* Avatar + Name section */}
            <div style={{ padding: "16px 20px 20px", display: "flex", alignItems: "flex-end", gap: 16, marginTop: -32 }}>
              <Shimmer style={{ width: 72, height: 72, borderRadius: "50%", flexShrink: 0, border: "3px solid #f8fafc" }} />
              <div style={{ flex: 1, paddingBottom: 4, display: "flex", flexDirection: "column", gap: 8 }}>
                <Shimmer style={{ width: "60%", height: 20 }} />
                <Shimmer style={{ width: "40%", height: 14 }} />
              </div>
              {/* Rating Badge */}
              <Shimmer style={{ width: 64, height: 28, borderRadius: 12, flexShrink: 0 }} />
            </div>

            {/* Stats row */}
            <div style={{ display: "flex", gap: 12, padding: "0 20px 20px" }}>
              {[1, 2, 3].map((i) => (
                <Shimmer key={i} style={{ flex: 1, height: 56, borderRadius: 12 }} />
              ))}
            </div>
          </div>

          {/* Services Section */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3">
            <Shimmer style={{ width: 120, height: 18, marginBottom: 8 }} />
            {[1, 2, 3].map((i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <Shimmer style={{ width: 40, height: 40, borderRadius: 10, flexShrink: 0 }} />
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                  <Shimmer style={{ width: "70%", height: 14 }} />
                  <Shimmer style={{ width: "45%", height: 12 }} />
                </div>
                <Shimmer style={{ width: 64, height: 28, borderRadius: 8, flexShrink: 0 }} />
              </div>
            ))}
          </div>

          {/* Photos Section */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <Shimmer style={{ width: 100, height: 18, marginBottom: 12 }} />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
              {[1, 2, 3].map((i) => (
                <Shimmer key={i} style={{ width: "100%", aspectRatio: "1", borderRadius: 10 }} />
              ))}
            </div>
          </div>

          {/* Map placeholder */}
          <Shimmer style={{ width: "100%", height: 180, borderRadius: 16 }} />
        </div>
      </main>
    </>
  );
}
