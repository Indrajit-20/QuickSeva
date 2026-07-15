import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search, X, ShieldAlert } from "lucide-react";

// Use a debouncer to prevent excessive filtering during typing
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Hardcoded static search suggestions
const ALL_SERVICE_SUGGESTIONS = [
  "AC General Service / एसी सर्विस",
  "AC Installation / एसी लगाना",
  "AC Gas Charging / गैस भरना",
  "Home Deep Cleaning / घर की सफाई",
  "Bathroom Cleaning / बाथरूम सफाई",
  "Kitchen Cleaning / किचन सफाई",
  "Ceiling Fan Repair / पंखा सुधारना",
  "House Rewiring / घर की वायरिंग",
  "Switchboard Repair / बोर्ड रिपेयर",
  "Tap Leakage Fix / नल सुधारना",
  "Toilet Flush Repair / फ्लश रिपेयर",
  "Water Tank Cleaning / टंकी सफाई",
  "Sofa Cleaning / सोफा सफाई",
  "Wall Painting / दीवार पुताई",
  "Wooden Door Repair / दरवाजा रिपेयर",
  "Modular Kitchen Fit / मॉड्युलर किचन",
];

const POPULAR_SEARCHES = [
  { term: "AC Gas Leakage Repair", volume: "1.2k searches" },
  { term: "Bathroom Sanitization", volume: "850 searches" },
  { term: "Electrician for Board Installation", volume: "620 searches" },
  { term: "Kitchen Deep Cleaning", volume: "450 searches" },
];

const CATEGORY_CHIPS = [
  { label: "AC Repair", icon: "❄️", category: "AC Repair" },
  { label: "Cleaning", icon: "🧹", category: "Cleaning Essentials" },
  { label: "Electrician", icon: "⚡", category: "Electrician" },
  { label: "Plumbing", icon: "🔧", category: "Plumbing" },
];

const mapQueryToCategory = (query) => {
  const q = String(query).toLowerCase();
  if (q.includes("ac") || q.includes("air condition") || q.includes("split") || q.includes("window")) {
    return "AC Repair";
  }
  if (q.includes("clean") || q.includes("wash") || q.includes("sofa") || q.includes("bathroom") || q.includes("deep")) {
    return "Cleaning Essentials";
  }
  if (q.includes("electric") || q.includes("wire") || q.includes("fan") || q.includes("board") || q.includes("light")) {
    return "Electrician";
  }
  if (q.includes("plumb") || q.includes("water") || q.includes("tank") || q.includes("leak") || q.includes("flush") || q.includes("tap")) {
    return "Plumbing";
  }
  return "AC Repair"; // default fallback
};

export default function SearchOverlay({ isOpen, onClose }) {
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const [inputValue, setInputValue] = useState("");
  const debouncedQuery = useDebounce(inputValue, 150);

  // Focus input automatically on render
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  // Handle escape key to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSearchSubmit = (value) => {
    const term = value?.trim();
    if (!term) return;
    const resolvedCategory = mapQueryToCategory(term);
    navigate(`/services?category=${encodeURIComponent(resolvedCategory)}`);
    onClose();
  };

  // Get matching results from the full service list
  const filteredSuggestions = ALL_SERVICE_SUGGESTIONS.filter((service) =>
    service.toLowerCase().includes(debouncedQuery.toLowerCase())
  ).slice(0, 12); // Limit visible results to 12

  // Close when clicking backdrop (desktop centered modal only)
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      onClick={handleBackdropClick}
      className="fixed inset-0 z-[2000] flex items-start justify-center bg-slate-900/50 backdrop-blur-sm p-0 sm:p-4 sm:pt-20 text-slate-800"
    >
      <div className="w-full h-full sm:h-auto sm:max-h-[85vh] sm:max-w-2xl bg-white border-0 sm:border border-slate-200 sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-fade-in">
        {/* Top Header Pin */}
        <div className="flex items-center gap-3 p-4 border-b border-slate-100 bg-slate-50">
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-550 hover:text-slate-800 rounded-full hover:bg-slate-200/50 transition cursor-pointer"
            aria-label="Close search"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="relative flex-1 text-left">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSearchSubmit(inputValue);
                }
              }}
              placeholder="Search services (e.g. Plumber, AC Repair...)"
              className="w-full h-11 pl-10 pr-10 bg-white border border-slate-200 rounded-full text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm transition font-medium"
            />
            {inputValue && (
              <button
                type="button"
                onClick={() => setInputValue("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6 text-left">
          {inputValue ? (
            /* Autocomplete Results State */
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                Suggestions Matching "{inputValue}"
              </h3>
              {filteredSuggestions.length > 0 ? (
                <div className="space-y-1">
                  {filteredSuggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => handleSearchSubmit(suggestion)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 text-left text-sm text-slate-700 hover:text-slate-900 transition duration-150 cursor-pointer border border-transparent hover:border-slate-100"
                    >
                      <Search className="w-4 h-4 text-blue-500 flex-shrink-0" />
                      <span>{suggestion}</span>
                    </button>
                  ))}
                </div>
              ) : (
                /* Empty state */
                <div className="py-8 text-center bg-slate-50 rounded-xl border border-slate-200">
                  <ShieldAlert className="w-12 h-12 text-amber-500 mx-auto mb-2 opacity-80" />
                  <p className="text-sm text-slate-700 font-bold">
                    No services found for "{inputValue}"
                  </p>
                  <p className="text-xs text-slate-550 mt-1 font-semibold">
                    Try checking spelling or type another query.
                  </p>
                </div>
              )}
            </div>
          ) : (
            /* Popular Searches and Browse Categories State */
            <>
              {/* Popular Searches */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-450 mb-3">
                  Popular Searches
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {POPULAR_SEARCHES.map(({ term, volume }) => (
                    <button
                      key={term}
                      type="button"
                      onClick={() => handleSearchSubmit(term)}
                      className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-slate-50 text-left text-sm text-slate-700 hover:text-slate-900 transition duration-150 cursor-pointer border border-transparent hover:border-slate-100 group"
                    >
                      <div className="flex items-center gap-3">
                        <Search className="w-4 h-4 text-emerald-500 flex-shrink-0 opacity-80" />
                        <span className="font-semibold group-hover:text-blue-600 transition-colors">{term}</span>
                      </div>
                      <span className="text-xs text-slate-400 font-mono font-bold">{volume}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Browse By Category */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-455 mb-3">
                  Browse by category
                </h3>
                <div className="flex flex-wrap gap-2">
                  {CATEGORY_CHIPS.map(({ label, icon, category }) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => handleSearchSubmit(category)}
                      className="flex items-center gap-2 px-4 py-2 bg-slate-50 hover:bg-slate-100 hover:border-slate-300 border border-slate-200 rounded-full text-sm text-slate-700 hover:text-slate-900 transition duration-150 cursor-pointer font-bold shadow-2xs"
                    >
                      <span className="text-base leading-none">{icon}</span>
                      <span>{label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
