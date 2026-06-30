import React from "react";
import { Search } from "lucide-react";

export default function Hero() {
  const triggerSearch = () => {
    window.dispatchEvent(new CustomEvent("open-global-search"));
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[#15123a] to-[#0f0d2b] py-20 sm:py-28 border-b border-indigo-950">
      {/* Background Decorative Glow Elements */}
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-72 h-72 rounded-full bg-[#4f46e5]/10 blur-[80px] pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 -translate-y-1/2 w-80 h-80 rounded-full bg-[#1fbf75]/5 blur-[100px] pointer-events-none" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        {/* Welcome Tag */}
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold tracking-widest uppercase bg-[#4f46e5]/10 text-indigo-300 border border-[#4f46e5]/25 mb-5 select-none animate-pulse">
          ⚡ On-Demand Home Services
        </span>

        {/* Hero Title */}
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-none mb-6">
          Find the Best Local Services,{" "}
          <span className="bg-gradient-to-r from-indigo-300 via-emerald-400 to-indigo-200 bg-clip-text text-transparent">
            Instantly
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-base sm:text-lg lg:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed mb-8">
          Connect with trusted, verified local professionals for plumbing, electrical, cleaning, painting, and appliance repairs in your neighborhood.
        </p>

        {/* Primary Search Container Trigger */}
        <div
          onClick={triggerSearch}
          className="max-w-2xl mx-auto w-full bg-[#1b1850]/40 backdrop-blur-md border border-[#4f46e5]/30 hover:border-[#4f46e5]/75 hover:shadow-2xl hover:shadow-[#4f46e5]/10 hover:-translate-y-0.5 rounded-full p-1.5 pl-5 sm:pl-6 flex items-center gap-3 cursor-pointer transition-all duration-300 group"
        >
          <Search className="w-5 h-5 text-indigo-300 group-hover:text-white transition-colors flex-shrink-0" />
          <span className="text-sm sm:text-base text-indigo-200/50 text-left select-none truncate">
            Search for services (e.g. Plumber, AC Repair, Electrician...)
          </span>
          <button
            type="button"
            className="hidden sm:inline-flex items-center justify-center bg-[#1fbf75] hover:bg-[#1bc678] text-[#15123a] font-bold text-sm px-6 py-3 rounded-full shadow-lg transition-colors cursor-pointer ml-auto"
          >
            Search
          </button>
        </div>

        {/* Mobile Search Button Fallback */}
        <div className="mt-4 sm:hidden flex justify-center">
          <button
            type="button"
            onClick={triggerSearch}
            className="w-full max-w-[200px] py-3 bg-[#1fbf75] hover:bg-[#1bc678] text-[#15123a] font-bold text-sm rounded-full shadow-lg transition-colors cursor-pointer"
          >
            Search Services
          </button>
        </div>

        {/* Popular Tags Indicator */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-2.5 text-xs text-slate-400 select-none">
          <span className="font-semibold uppercase tracking-wider text-[10px] text-indigo-300/80">Try searching:</span>
          {["Plumber", "Electrician", "AC Repair", "Cleaning"].map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={triggerSearch}
              className="px-3 py-1 bg-[#1b1850]/30 hover:bg-[#4f46e5]/25 border border-indigo-900 rounded-full text-indigo-200 hover:text-white transition-all cursor-pointer"
            >
              {tag}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
