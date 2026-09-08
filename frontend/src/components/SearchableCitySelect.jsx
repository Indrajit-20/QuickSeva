import React, { useState, useEffect, useRef } from "react";
import { MapPin, Search, Plus, Check } from "lucide-react";
import { searchCitiesMaster, ALL_INDIAN_CITIES } from "../data/indiaLocationsData";

export default function SearchableCitySelect({
  value = "",
  onChange,
  placeholder = "Search or select city/town...",
  required = false,
  className = "",
  showIcon = true,
}) {
  const [query, setQuery] = useState(value);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  // Sync external value changes to local state when value prop updates
  useEffect(() => {
    setQuery(value || "");
  }, [value]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter cities based on query
  const filteredCities = searchCitiesMaster(query, 20);

  // Check if current query matches any existing city in master dataset exactly
  const isExactMatch = filteredCities.some(
    (item) => item.city.toLowerCase() === query.trim().toLowerCase()
  );

  const handleSelectCity = (cityName) => {
    setQuery(cityName);
    if (onChange) onChange(cityName);
    setIsOpen(false);
    setSelectedIndex(-1);
  };

  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === "ArrowDown" || e.key === "Enter") {
        setIsOpen(true);
      }
      return;
    }

    const totalItems = filteredCities.length + (!isExactMatch && query.trim() ? 1 : 0);

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < totalItems - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : totalItems - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < filteredCities.length) {
        handleSelectCity(filteredCities[selectedIndex].city);
      } else if (!isExactMatch && query.trim()) {
        handleSelectCity(query.trim());
      } else if (filteredCities.length > 0) {
        handleSelectCity(filteredCities[0].city);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      <div className="flex items-center gap-2 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus-within:bg-white focus-within:border-amber-600 transition shadow-xs">
        {showIcon && <MapPin size={16} className="text-amber-600 shrink-0" />}
        <input
          ref={inputRef}
          type="text"
          required={required}
          value={query}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            if (onChange) onChange(e.target.value);
            setIsOpen(true);
            setSelectedIndex(-1);
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full bg-transparent text-xs font-bold text-slate-900 outline-none placeholder:font-normal placeholder:text-slate-400"
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              if (onChange) onChange("");
              inputRef.current?.focus();
            }}
            className="text-slate-400 hover:text-slate-600 text-xs font-bold px-1 rounded"
          >
            ✕
          </button>
        )}
      </div>

      {/* Floating Dropdown List */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 max-h-60 overflow-y-auto rounded-xl bg-white border border-slate-200 shadow-xl py-1 text-slate-800">
          <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 flex items-center justify-between">
            <span>Select or type city name</span>
            <span className="text-slate-400 font-semibold">{filteredCities.length} cities</span>
          </div>

          {filteredCities.length > 0 ? (
            filteredCities.map((item, idx) => {
              const isSelected = item.city.toLowerCase() === value.toLowerCase();
              const isHighlighted = idx === selectedIndex;
              return (
                <button
                  key={`${item.state}-${item.city}`}
                  type="button"
                  onClick={() => handleSelectCity(item.city)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between transition-colors cursor-pointer ${
                    isHighlighted ? "bg-amber-50 text-amber-900 font-bold" : "hover:bg-slate-50 text-slate-700"
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <MapPin size={13} className={isSelected ? "text-amber-600" : "text-slate-400"} />
                    <span className="truncate font-semibold text-slate-900">{item.city}</span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-medium">
                      {item.state}
                    </span>
                    {isSelected && <Check size={14} className="text-amber-600 shrink-0" />}
                  </div>
                </button>
              );
            })
          ) : (
            <div className="p-3 text-xs text-slate-500 text-center font-medium">
              No matching city found in master list.
            </div>
          )}

          {/* Custom City Entry Option */}
          {!isExactMatch && query.trim().length > 0 && (
            <button
              type="button"
              onClick={() => handleSelectCity(query.trim())}
              onMouseEnter={() => setSelectedIndex(filteredCities.length)}
              className={`w-full text-left px-3 py-2.5 text-xs flex items-center gap-2 border-t border-slate-100 transition-colors cursor-pointer ${
                selectedIndex === filteredCities.length
                  ? "bg-amber-100 text-amber-900 font-bold"
                  : "bg-slate-50 text-amber-800 hover:bg-amber-50 font-semibold"
              }`}
            >
              <Plus size={14} className="text-amber-600 shrink-0" />
              <span>Use custom city: <strong>"{query.trim()}"</strong></span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
