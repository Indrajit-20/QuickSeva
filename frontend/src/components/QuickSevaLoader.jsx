import React from "react";
import { BRAND, BrandLogoIcon } from "../config/brand";

/**
 * QuickSevaLoader — Brand-consistent full-screen loading screen.
 * All branding (name, colors, logo) comes from /src/config/brand.js
 * To rename the app, only update brand.js — this component updates automatically.
 */
export default function QuickSevaLoader({ message = "Loading..." }) {
  return (
    <>
      <style>{`
        @keyframes qs-dash {
          0%   { left: -60%; opacity: 0; }
          10%  { opacity: 1; }
          80%  { opacity: 1; }
          100% { left: 110%; opacity: 0; }
        }
        @keyframes qs-dash-short {
          0%   { left: -40%; opacity: 0; }
          15%  { opacity: 0.6; }
          85%  { opacity: 0.6; }
          100% { left: 110%; opacity: 0; }
        }
        @keyframes qs-logo-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.75; transform: scale(0.97); }
        }
        .qs-loader-track {
          position: relative;
          width: 180px;
          height: 3px;
          background: ${BRAND.primaryLight};
          border-radius: 99px;
          overflow: hidden;
        }
        .qs-loader-dash {
          position: absolute;
          top: 0;
          height: 3px;
          border-radius: 99px;
          animation: qs-dash 1.4s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
        .qs-loader-dash.primary {
          width: 60%;
          background: linear-gradient(90deg, transparent, ${BRAND.primaryColor}, ${BRAND.accentColor}, ${BRAND.primaryColor}, transparent);
          animation-delay: 0s;
        }
        .qs-loader-dash.secondary {
          width: 30%;
          background: linear-gradient(90deg, transparent, #a5b4fc, transparent);
          animation: qs-dash-short 1.4s cubic-bezier(0.4, 0, 0.2, 1) infinite;
          animation-delay: 0.25s;
        }
        .qs-logo-anim {
          animation: qs-logo-pulse 2s ease-in-out infinite;
        }
      `}</style>

      <div
        style={{
          position: "fixed",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: BRAND.bgColor,
          zIndex: 9999,
          gap: "24px",
          fontFamily: "'Inter', 'Plus Jakarta Sans', sans-serif",
        }}
      >
        {/* Logo — reads from brand.js */}
        <div className="qs-logo-anim" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <BrandLogoIcon size={30} />
          <span style={{ fontSize: "20px", fontWeight: 800, color: BRAND.textDark, letterSpacing: "-0.5px" }}>
            {BRAND.namePart1}<span style={{ color: BRAND.primaryColor }}>{BRAND.namePart2}</span>
          </span>
        </div>

        {/* Speed Dash Track */}
        <div className="qs-loader-track">
          <div className="qs-loader-dash primary" />
          <div className="qs-loader-dash secondary" />
        </div>

        {/* Message */}
        <p style={{ fontSize: "11px", fontWeight: 700, color: BRAND.textMuted, letterSpacing: "0.1em", textTransform: "uppercase" }}>
          {message}
        </p>
      </div>
    </>
  );
}

