import React from "react";

function Shimmer({ style = {} }) {
  return (
    <div
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

export default function ContractorProfileSkeleton() {
  return (
    <>
      <style>{`
        @keyframes qs-shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>

      <div className="min-h-screen bg-slate-50 px-4 py-8">
        <div className="max-w-3xl mx-auto space-y-5">

          {/* Back button */}
          <Shimmer style={{ width: 90, height: 32, borderRadius: 10 }} />

          {/* Hero card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <Shimmer style={{ width: "100%", height: 140, borderRadius: 0 }} />
            <div style={{ padding: "16px 20px 20px", display: "flex", gap: 16, marginTop: -36 }}>
              <Shimmer style={{ width: 80, height: 80, borderRadius: 16, flexShrink: 0 }} />
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8, paddingTop: 8 }}>
                <Shimmer style={{ width: "55%", height: 20 }} />
                <Shimmer style={{ width: "35%", height: 14 }} />
                <Shimmer style={{ width: "45%", height: 14 }} />
              </div>
            </div>

            {/* Stats */}
            <div style={{ display: "flex", gap: 8, padding: "0 20px 20px" }}>
              {[1, 2, 3, 4].map((i) => (
                <Shimmer key={i} style={{ flex: 1, height: 52, borderRadius: 12 }} />
              ))}
            </div>
          </div>

          {/* About section */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3">
            <Shimmer style={{ width: 80, height: 16, marginBottom: 4 }} />
            <Shimmer style={{ width: "100%", height: 12 }} />
            <Shimmer style={{ width: "85%", height: 12 }} />
            <Shimmer style={{ width: "70%", height: 12 }} />
          </div>

          {/* Skills/Trades */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <Shimmer style={{ width: 100, height: 16, marginBottom: 12 }} />
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {[1, 2, 3, 4, 5].map((i) => (
                <Shimmer key={i} style={{ width: 80, height: 28, borderRadius: 20 }} />
              ))}
            </div>
          </div>

          {/* Portfolio photos */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <Shimmer style={{ width: 110, height: 16, marginBottom: 12 }} />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Shimmer key={i} style={{ width: "100%", aspectRatio: "1", borderRadius: 10 }} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
