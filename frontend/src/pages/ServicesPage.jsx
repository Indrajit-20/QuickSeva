import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import { categoriesData } from "../data/servicesData";
import NearbyServices from "../components/NearbyServices";

const loadSellers = () => {
  try {
    const parsed = JSON.parse(localStorage.getItem("sellers") || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export default function ServicesPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const categoryParam = searchParams.get("category");

  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [sellers, setSellers] = useState(() => loadSellers());

  const searchRef = useRef(null);
  const mapRef = useRef(null);

  useEffect(() => {
    setQuery(searchParams.get("q") || "");
    setSellers(loadSellers());
  }, [searchParams]);

  useEffect(() => {
    const onDocMouseDown = (e) => {
      if (!searchRef.current) return;
      if (searchRef.current.contains(e.target)) return;
      setDropdownOpen(false);
    };

    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, []);

  const categoriesFlatTitles = useMemo(() => {
    // used only for search suggestions
    return categoriesData.map((c) => c.title);
  }, []);

  const suggestions = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return [];
    return categoriesFlatTitles
      .filter((t) => t.toLowerCase().includes(normalized))
      .slice(0, 5);
  }, [query, categoriesFlatTitles]);

  const updateQuery = (nextQuery) => {
    navigate(
      `/services?q=${encodeURIComponent(nextQuery)}${categoryParam ? `&category=${encodeURIComponent(categoryParam)}` : ""}`,
    );
  };

  const handleSearchChange = (value) => {
    setQuery(value);
    setDropdownOpen(true);
    updateQuery(value);
  };

  const filteredCategory = useMemo(() => {
    if (!categoryParam) return null;
    return categoriesData.find((c) => c.title === categoryParam) || null;
  }, [categoryParam]);

  const groupedResults = useMemo(() => {
    // For "no category": group by headings.
    if (filteredCategory) {
      return [
        {
          heading: filteredCategory.title,
          services: filteredCategory.services,
        },
      ];
    }

    return categoriesData.map((cat) => ({
      heading: cat.title,
      services: cat.services,
    }));
  }, [filteredCategory]);

  const resultsCount = useMemo(() => {
    const total = groupedResults.reduce(
      (acc, g) => acc + (g.services?.length || 0),
      0,
    );
    return total;
  }, [groupedResults]);

  const scrollToMap = () => {
    mapRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const categoryParamLower = categoryParam ? categoryParam.toLowerCase() : "";

  const categoryToServiceMap = {
    "Cleaning Essentials": ["cleaning"],
    "Appliance Repair & Service": ["appliance", "repair"],
    "AC Repair": ["ac", "air condition"],
    Electrician: ["electrical", "electrician"],
    Plumbing: ["plumbing", "plumber"],
    "Pest Control": ["pest"],
    Carpentry: ["carpentry", "carpenter"],
  };

  const mapKeywordsForCategory = (title) => {
    if (!title) return [];
    const exact = Object.keys(categoryToServiceMap).find((k) => k === title);
    if (exact) return categoryToServiceMap[exact];

    // fallback keyword extraction
    const lowered = String(title).toLowerCase();
    if (lowered.includes("clean"))
      return categoryToServiceMap["Cleaning Essentials"];
    if (lowered.includes("appliance"))
      return categoryToServiceMap["Appliance Repair & Service"];
    if (lowered.includes("ac")) return categoryToServiceMap["AC Repair"];
    if (lowered.includes("electric"))
      return categoryToServiceMap["Electrician"];
    if (lowered.includes("plumb")) return categoryToServiceMap["Plumbing"];
    if (lowered.includes("pest")) return categoryToServiceMap["Pest Control"];
    if (lowered.includes("carp")) return categoryToServiceMap["Carpentry"];
    return [];
  };

  const [selectedService, setSelectedService] = useState(null);

  const visibleSellers = useMemo(() => {
    const allSellers = sellers || [];
    if (!selectedService || !categoryParam) return [];

    const selectedCategoryKeywords = mapKeywordsForCategory(categoryParam);
    const sellerService = (s) => String(s?.service || "").toLowerCase();

    return allSellers.filter((s) => {
      const sService = sellerService(s);
      if (!sService) return false;

      // keyword partial match
      if (selectedCategoryKeywords.length) {
        return selectedCategoryKeywords.some((kw) => sService.includes(kw));
      }

      // fallback: includes category text
      return sService.includes(categoryParamLower);
    });
  }, [sellers, selectedService, categoryParam, categoryParamLower]);

  const servicesCard = (service) => {
    return (
      <article
        key={service.id}
        className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"
      >
        <div className="h-40 overflow-hidden rounded-t-xl">
          <img
            src={service.image}
            alt={service.name}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        </div>

        <div className="pt-4">
          <h3 className="text-lg font-black text-slate-900">{service.name}</h3>

          <div className="mt-2 flex items-center gap-2 text-sm">
            <span className="text-amber-400">★</span>
            <span className="font-semibold text-amber-500">
              {service.rating.toFixed(2)}
            </span>
          </div>

          <div className="mt-3 flex items-baseline gap-3">
            <div className="text-lg font-bold text-slate-900">
              ₹{service.price}
            </div>
            <div className="text-sm font-semibold text-slate-400 line-through">
              ₹{service.originalPrice}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setSelectedService(service)}
            className="mt-4 w-full rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-indigo-700"
          >
            View Sellers →
          </button>
        </div>
      </article>
    );
  };

  const sellerCard = (seller) => {
    const callOrBookingText = seller?.isPremium
      ? seller?.phone
      : "Contact on booking";

    return (
      <article
        key={seller.id}
        className="rounded-xl border-l-4 border-l-[#6366f1] bg-white p-5 shadow-sm"
      >
        <h3 className="text-lg font-black text-slate-900">🔧 {seller.name}</h3>
        <p className="mt-2 text-sm font-semibold text-slate-700">
          🛠 {seller.service}
        </p>
        <p className="mt-2 text-sm text-slate-600">📍 {seller.address}</p>

        <p className="mt-2 text-sm font-semibold text-slate-600">
          ⭐ {seller.rating || "4.5"}
        </p>

        {seller.isPremium ? (
          <div className="mt-3 inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
            ✓ Premium
          </div>
        ) : null}

        <p className="mt-3 text-sm text-slate-600">📞 {callOrBookingText}</p>

        <button
          type="button"
          onClick={() => navigate(`/seller/${seller.id}`)}
          className="mt-5 inline-block rounded-lg bg-indigo-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-indigo-700"
        >
          View Profile →
        </button>
      </article>
    );
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <section className="border-b border-indigo-100 bg-white py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <p className="text-sm font-bold text-indigo-600">
              QuickSeva Search
            </p>
            <h1 className="mt-1 text-4xl font-black text-slate-900">
              Find trusted service providers
            </h1>
          </div>

          <div ref={searchRef} className="relative">
            <div className="relative">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                🔍
              </span>
              <input
                value={query}
                onChange={(e) => handleSearchChange(e.target.value)}
                onFocus={() => setDropdownOpen(true)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    updateQuery(query);
                    setDropdownOpen(false);
                  }
                }}
                placeholder="Search services (e.g. Cleaning Essentials...)"
                className="w-full rounded-xl border border-indigo-200 bg-white py-3 pl-11 pr-4 text-base text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            {dropdownOpen && suggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full z-[1000] mt-2 overflow-hidden rounded-xl border border-indigo-100 bg-white shadow-xl">
                {suggestions.map((service) => (
                  <button
                    key={service}
                    type="button"
                    onClick={() => {
                      updateQuery(service);
                      setDropdownOpen(false);
                    }}
                    className="block w-full px-4 py-2 text-left text-sm font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-700"
                  >
                    {service}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Filter chips (category titles) */}
          <div className="mt-5 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => navigate("/services")}
              className={`rounded-full border px-4 py-2 text-sm font-bold transition ${
                !categoryParam
                  ? "border-indigo-600 bg-indigo-600 text-white"
                  : "border-indigo-300 bg-white text-indigo-700 hover:bg-indigo-50"
              }`}
            >
              All
            </button>
            {categoriesData.map((cat) => {
              const active = categoryParam === cat.title;
              return (
                <button
                  key={cat.title}
                  type="button"
                  onClick={() =>
                    navigate(
                      `/services?category=${encodeURIComponent(cat.title)}${query ? `&q=${encodeURIComponent(query)}` : ""}`,
                    )
                  }
                  className={`rounded-full border px-4 py-2 text-sm font-bold transition ${
                    active
                      ? "border-indigo-600 bg-indigo-600 text-white"
                      : "border-indigo-300 bg-white text-indigo-700 hover:bg-indigo-50"
                  }`}
                >
                  {cat.title}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-xl font-bold text-slate-900">
            {categoryParam
              ? `Showing services for "${categoryParam}"`
              : `Showing all services`}
            {query ? ` (search: "${query}")` : ""}
          </h2>

          <button
            type="button"
            onClick={scrollToMap}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700"
          >
            📚 View on Map
          </button>
        </div>

        {!selectedService ? (
          categoryParam && !filteredCategory ? (
            <div className="rounded-2xl border border-indigo-100 bg-white p-10 text-center shadow-sm">
              <div className="text-4xl">🔍</div>
              <h3 className="mt-3 text-2xl font-black text-slate-900">
                No services found for "{categoryParam}"
              </h3>
              <p className="mt-2 text-slate-600">
                Try selecting a different category.
              </p>
            </div>
          ) : (
            <div className="space-y-10">
              {groupedResults.map((group) => (
                <div key={group.heading}>
                  {!categoryParam && (
                    <h3 className="mb-5 text-2xl font-black text-slate-900">
                      {group.heading}
                    </h3>
                  )}

                  <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                    {group.services.map((service) => servicesCard(service))}
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          <div className="space-y-6">
            <button
              type="button"
              onClick={() => setSelectedService(null)}
              className="inline-flex items-center gap-2 rounded-lg border border-indigo-200 bg-white px-4 py-2 text-sm font-bold text-indigo-700 hover:bg-indigo-50"
            >
              ← Back to services
            </button>

            <div className="rounded-2xl border border-indigo-100 bg-white p-5 shadow-sm">
              <div className="flex flex-col md:flex-row gap-5">
                <div className="h-48 md:h-40 w-full md:w-72 overflow-hidden rounded-xl">
                  <img
                    src={selectedService.image}
                    alt={selectedService.name}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                </div>

                <div className="flex-1">
                  <h3 className="text-2xl font-black text-slate-900">
                    {selectedService.name}
                  </h3>

                  <div className="mt-2 flex items-center gap-2 text-sm">
                    <span className="text-amber-400">★</span>
                    <span className="font-semibold text-amber-500">
                      {selectedService.rating.toFixed(2)}
                    </span>
                  </div>

                  <div className="mt-3 flex items-baseline gap-3">
                    <div className="text-lg font-bold text-slate-900">
                      ₹{selectedService.price}
                    </div>
                    <div className="text-sm font-semibold text-slate-400 line-through">
                      ₹{selectedService.originalPrice}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-xl font-black text-slate-900">
                Available Service Providers
              </h4>

              {visibleSellers.length === 0 ? (
                <div className="mt-4 rounded-2xl border border-indigo-100 bg-white p-8 text-center shadow-sm">
                  <div className="text-4xl">🔎</div>
                  <h3 className="mt-3 text-2xl font-black text-slate-900">
                    No providers found for this service yet.
                  </h3>
                  <p className="mt-2 text-slate-600">
                    Browse all providers to explore more options.
                  </p>

                  <button
                    type="button"
                    onClick={() => navigate("/services")}
                    className="mt-6 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-indigo-700"
                  >
                    Browse all providers
                  </button>
                </div>
              ) : (
                <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                  {visibleSellers.map((seller) => sellerCard(seller))}
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      <section ref={mapRef} className="bg-indigo-950 py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-white">View on Map</h2>
            <p className="mt-1 text-sm text-indigo-200">
              Nearby providers matching your service search.
            </p>
          </div>
          <NearbyServices
            key={categoryParam || query}
            initialSearch={query || categoryParam || ""}
          />
        </div>
      </section>
    </main>
  );
}
