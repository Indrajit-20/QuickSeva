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

export default function FeedSkeleton() {
  return (
    <>
      <style>{`
        @keyframes qs-shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>

      <div className="space-y-4 py-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4"
          >
            <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              {/* Avatar */}
              <Shimmer style={{ width: 56, height: 56, borderRadius: 14, flexShrink: 0 }} />
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
                {/* Name */}
                <Shimmer style={{ width: "55%", height: 16 }} />
                {/* Trade + location */}
                <div style={{ display: "flex", gap: 8 }}>
                  <Shimmer style={{ width: 70, height: 22, borderRadius: 20 }} />
                  <Shimmer style={{ width: 90, height: 22, borderRadius: 20 }} />
                </div>
                {/* Rating */}
                <Shimmer style={{ width: "30%", height: 12 }} />
              </div>
              {/* Contact button */}
              <Shimmer style={{ width: 80, height: 34, borderRadius: 10, flexShrink: 0 }} />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
