import React from "react";
import { Link } from "react-router-dom";

export default function Logo({
  size = "md", // "xs" | "sm" | "md" | "lg"
  showText = true,
  className = "",
  onClick,
  to = "/",
}) {
  // Sizing maps
  const iconSizes = {
    xs: "w-5 h-5",
    sm: "w-6 h-6 sm:w-7 sm:h-7",
    md: "w-7 h-7 sm:w-8 sm:h-8",
    lg: "w-9 h-9 sm:w-11 sm:h-11",
  };

  const textSizes = {
    xs: "text-xs sm:text-sm",
    sm: "text-base sm:text-lg",
    md: "text-lg sm:text-xl",
    lg: "text-xl sm:text-2xl",
  };

  const badgeSizes = {
    xs: "w-1 h-1",
    sm: "w-1.5 h-1.5",
    md: "w-2 h-2",
    lg: "w-2.5 h-2.5",
  };

  const logoContent = (
    <div className={`flex items-center gap-1.5 select-none group ${className}`}>
      {/* Brand Icon Mark */}
      <div className={`relative flex items-center justify-center shrink-0 ${iconSizes[size]} transition-transform duration-300 group-hover:scale-105`}>
        <svg
          viewBox="0 0 44 44"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-md"
        >
          <defs>
            {/* Primary Gradient */}
            <linearGradient id="qsLogoBg" x1="0" y1="0" x2="44" y2="44" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#0284c7" />
              <stop offset="50%" stopColor="#2563eb" />
              <stop offset="100%" stopColor="#4f46e5" />
            </linearGradient>
            {/* Lightning Spark Gold Gradient */}
            <linearGradient id="qsSparkGold" x1="16" y1="8" x2="28" y2="36" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#fbbf24" />
              <stop offset="100%" stopColor="#f59e0b" />
            </linearGradient>
          </defs>

          {/* Squircle Background Shield */}
          <rect width="44" height="44" rx="13" fill="url(#qsLogoBg)" />
          
          {/* Subtle Outer Border Line inside emblem */}
          <rect x="1" y="1" width="42" height="42" rx="12" stroke="white" strokeOpacity="0.25" strokeWidth="1.5" fill="none" />

          {/* Location Pin Silhouette (Background Path) */}
          <path
            d="M22 9C16.477 9 12 13.477 12 19C12 25.5 22 34 22 34C22 34 32 25.5 32 19C32 13.477 27.523 9 22 9Z"
            fill="white"
            fillOpacity="0.18"
          />

          {/* White Pin Ring */}
          <path
            d="M22 10.5C17.3056 10.5 13.5 14.3056 13.5 19C13.5 24.6 21.2 32.1 22 32.8C22.8 32.1 30.5 24.6 30.5 19C30.5 14.3056 26.6944 10.5 22 10.5Z"
            stroke="white"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Speed Lightning Spark ("Quick" accent) */}
          <path
            d="M23.5 13.5L16.5 22.5H22.5L20.5 30.5L27.5 21.5H21.5L23.5 13.5Z"
            fill="url(#qsSparkGold)"
            stroke="white"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />
        </svg>

        {/* Live Service Pulse Dot */}
        <span className={`absolute -top-0.5 -right-0.5 ${badgeSizes[size]} rounded-full bg-emerald-500 ring-2 ring-white shadow-xs`} />
      </div>

      {/* Typography */}
      {showText && (
        <div className="flex items-center leading-none">
          <span
            className={`font-black text-slate-900 tracking-tight ${textSizes[size]}`}
            style={{ fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif" }}
          >
            Quick
          </span>
          <span
            className={`font-black bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent tracking-tight ${textSizes[size]}`}
            style={{ fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif" }}
          >
            Seva
          </span>
        </div>
      )}
    </div>
  );

  if (to) {
    return (
      <Link to={to} onClick={onClick} className="inline-block no-underline">
        {logoContent}
      </Link>
    );
  }

  return logoContent;
}
