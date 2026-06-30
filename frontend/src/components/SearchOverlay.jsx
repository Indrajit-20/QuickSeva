import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search, X, ArrowLeft, Zap, Hammer, Droplets, Car, ShieldAlert, Sparkles, Paintbrush, Truck, Tv } from "lucide-react";
import { ALL_SERVICE_SUGGESTIONS, serviceToCategory, categoryToKeywords } from "../data/servicesData";

const POPULAR_SEARCHES = [
  { term: "Electrician", volume: "133.5k searches" },
  { term: "Carpenter", volume: "91k searches" },
  { term: "Driver", volume: "56.9k searches" },
  { term: "Plumber", volume: "55.6k searches" },
  { term: "Welder", volume: "53.9k searches" },
  { term: "Construction Work", volume: "40.3k searches" },
  { term: "Painter", volume: "24.7k searches" },
  { term: "Cook", volume: "21.4k searches" },
  { term: "AC Mechanic", volume: "17.8k searches" },
];

const CATEGORY_CHIPS = [
  { label: "Home Repair", icon: "🛠️", category: "Plumbing" },
  { label: "Cleaning & Pest", icon: "🧼", category: "Cleaning Essentials" },
  { label: "Beauty & Wellness", icon: "🌸", category: "Beauty & Wellness" },
  { label: "Painting & Renovation", icon: "🎨", category: "Home Painting" },
  { label: "Moving & Storage", icon: "📦", category: "Moving & Storage" },
  { label: "Electronics", icon: "🔌", category: "Electrician" },
];

export default function SearchOverlay({ isOpen, onClose }) {
  const [inputValue, setInputValue] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const inputRef = useRef(null);
  const navigate = useNavigate();

  // Debounce input value change by 150ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(inputValue);
    }, 150);

    return () => clearTimeout(timer);
  }, [inputValue]);

  // Focus input field when overlay opens
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Close overlay on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Resolve search query or item to parent category for redirection compatibility
  const mapQueryToCategory = (query) => {
    if (!query) return "";
    const normalized = query.trim().toLowerCase();

    // 1. Direct match with a category name
    const exactCategory = Object.keys(categoryToKeywords).find(
      (cat) => cat.toLowerCase() === normalized
    );
    if (exactCategory) return exactCategory;

    // 2. Match with sub-service in serviceToCategory
    const exactService = Object.keys(serviceToCategory).find(
      (svc) => svc.toLowerCase() === normalized
    );
    if (exactService) return serviceToCategory[exactService];

    // 3. Match keyword in categoryToKeywords
    const matchedCatByKeyword = Object.entries(categoryToKeywords).find(
      ([cat, keywords]) => keywords.some((kw) => normalized.includes(kw) || kw.includes(normalized))
    );
    if (matchedCatByKeyword) return matchedCatByKeyword[0];

    // 4. Case-insensitive substring match with any category name
    const partialCategory = Object.keys(categoryToKeywords).find(
      (cat) => cat.toLowerCase().includes(normalized) || normalized.includes(cat.toLowerCase())
    );
    if (partialCategory) return partialCategory;

    return query;
  };

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
      className="fixed inset-0 z-[2000] flex items-start justify-center bg-black/70 backdrop-blur-md p-0 sm:p-4 sm:pt-20"
    >
      <div className="w-full h-full sm:h-auto sm:max-h-[85vh] sm:max-w-2xl bg-[#15123a] border-0 sm:border border-[#4f46e5]/30 sm:rounded-2xl text-white shadow-2xl flex flex-col overflow-hidden animate-fade-in">
        {/* Top Header Pin */}
        <div className="flex items-center gap-3 p-4 border-b border-[#4f46e5]/25 bg-[#1b1850]">
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-300 hover:text-white rounded-full hover:bg-white/10 transition cursor-pointer"
            aria-label="Close search"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-300" />
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
              className="w-full h-11 pl-10 pr-10 bg-[#15123a] border border-[#4f46e5]/30 rounded-full text-white placeholder-indigo-300/60 focus:outline-none focus:border-[#4f46e5] text-sm transition"
            />
            {inputValue && (
              <button
                type="button"
                onClick={() => setInputValue("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {inputValue ? (
            /* Autocomplete Results State */
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-300 mb-3">
                Suggestions Matching "{inputValue}"
              </h3>
              {filteredSuggestions.length > 0 ? (
                <div className="space-y-1">
                  {filteredSuggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => handleSearchSubmit(suggestion)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[#1b1850] text-left text-sm text-slate-100 hover:text-white transition duration-150 cursor-pointer border border-transparent hover:border-[#4f46e5]/20"
                    >
                      <Search className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                      <span>{suggestion}</span>
                    </button>
                  ))}
                </div>
              ) : (
                /* Empty state */
                <div className="py-8 text-center bg-[#1b1850]/50 rounded-xl border border-[#4f46e5]/10">
                  <ShieldAlert className="w-12 h-12 text-yellow-500 mx-auto mb-2 opacity-80" />
                  <p className="text-sm text-slate-300 font-medium">
                    No services found for "{inputValue}"
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
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
                <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-300 mb-3">
                  Popular Searches
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {POPULAR_SEARCHES.map(({ term, volume }) => (
                    <button
                      key={term}
                      type="button"
                      onClick={() => handleSearchSubmit(term)}
                      className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-[#1b1850] text-left text-sm text-slate-100 hover:text-white transition duration-150 cursor-pointer border border-transparent hover:border-[#4f46e5]/20 group"
                    >
                      <div className="flex items-center gap-3">
                        <Search className="w-4 h-4 text-[#1fbf75] flex-shrink-0 opacity-80" />
                        <span className="font-medium group-hover:text-[#4f46e5] transition-colors">{term}</span>
                      </div>
                      <span className="text-xs text-slate-400/80 font-mono">{volume}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Browse By Category */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-300 mb-3">
                  Browse by category
                </h3>
                <div className="flex flex-wrap gap-2">
                  {CATEGORY_CHIPS.map(({ label, icon, category }) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => handleSearchSubmit(category)}
                      className="flex items-center gap-2 px-4 py-2 bg-[#1b1850] hover:bg-[#4f46e5]/30 border border-[#4f46e5]/20 rounded-full text-sm text-slate-200 hover:text-white hover:border-[#4f46e5]/50 transition duration-150 cursor-pointer font-medium"
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
