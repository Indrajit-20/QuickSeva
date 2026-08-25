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

export default function BookingsSkeleton() {
  return (
    <>
      <style>{`
        @keyframes qs-shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>

      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
          >
            {/* Top status bar */}
            <Shimmer style={{ width: "100%", height: 4, borderRadius: 0 }} />
            <div style={{ padding: "16px 20px", display: "flex", gap: 14 }}>
              {/* Avatar */}
              <Shimmer style={{ width: 52, height: 52, borderRadius: 12, flexShrink: 0 }} />
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
                {/* Service name */}
                <Shimmer style={{ width: "65%", height: 16 }} />
                {/* Provider */}
                <Shimmer style={{ width: "45%", height: 12 }} />
                {/* Date + Status pills */}
                <div style={{ display: "flex", gap: 8, marginTop: 2 }}>
                  <Shimmer style={{ width: 80, height: 24, borderRadius: 20 }} />
                  <Shimmer style={{ width: 60, height: 24, borderRadius: 20 }} />
                </div>
              </div>
              {/* Action button */}
              <Shimmer style={{ width: 72, height: 32, borderRadius: 10, flexShrink: 0 }} />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
