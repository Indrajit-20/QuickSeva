import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import NearbyServices from "../components/NearbyServices";

const ALL_SERVICES = [
  "Cleaning",
  "Electrical",
  "Plumbing",
  "Carpentry",
  "AC Repair",
  "Pest Control",
  "Home Painting",
  "Appliance Repair",
];

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
  const query = searchParams.get("q") || "";
  const [searchValue, setSearchValue] = useState(query);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [sellers, setSellers] = useState(() => loadSellers());
  const searchRef = useRef(null);
  const mapRef = useRef(null);

  useEffect(() => {
    setSearchValue(query);
    setSellers(loadSellers());
  }, [query]);

  useEffect(() => {
    const onDocMouseDown = (e) => {
      if (!searchRef.current) return;
      if (searchRef.current.contains(e.target)) return;
      setDropdownOpen(false);
    };

    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, []);

  const suggestions = useMemo(() => {
    const normalized = searchValue.trim().toLowerCase();
    if (!normalized) return [];
    return ALL_SERVICES.filter((service) =>
      service.toLowerCase().includes(normalized),
    ).slice(0, 5);
  }, [searchValue]);

  const updateQuery = (nextQuery) => {
    navigate(`/services?q=${encodeURIComponent(nextQuery)}`);
  };

  const handleSearchChange = (value) => {
    setSearchValue(value);
    setDropdownOpen(true);
    updateQuery(value);
  };

  const results = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const filtered = normalized
      ? sellers.filter((seller) =>
          String(seller?.service || "")
            .toLowerCase()
            .includes(normalized),
        )
      : sellers;

    return [...filtered].sort((a, b) => {
      if (a.isPremium && !b.isPremium) return -1;
      if (!a.isPremium && b.isPremium) return 1;
      return new Date(b.registeredAt || 0) - new Date(a.registeredAt || 0);
    });
  }, [query, sellers]);

  const scrollToMap = () => {
    mapRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <main className="min-h-screen bg-brand-bg">
      <section className="border-b border-indigo-100 bg-white py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <p className="text-sm font-bold text-indigo-600">QuickSeva Search</p>
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
                value={searchValue}
                onChange={(e) => handleSearchChange(e.target.value)}
                onFocus={() => setDropdownOpen(true)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    updateQuery(searchValue);
                    setDropdownOpen(false);
                  }
                }}
                placeholder="Search services (e.g. Plumber, AC Repair...)"
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

          <div className="mt-5 flex flex-wrap gap-2">
            {["All", ...ALL_SERVICES].map((service) => {
              const active =
                service === "All" ? !query : query.toLowerCase() === service.toLowerCase();
              return (
                <button
                  key={service}
                  type="button"
                  onClick={() => updateQuery(service === "All" ? "" : service)}
                  className={`rounded-full border px-4 py-2 text-sm font-bold transition ${
                    active
                      ? "border-indigo-600 bg-indigo-600 text-white"
                      : "border-indigo-300 bg-white text-indigo-700 hover:bg-indigo-50"
                  }`}
                >
                  {service}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-xl font-bold text-slate-900">
            Showing {results.length} service providers for "{query}"
          </h2>
          <button
            type="button"
            onClick={scrollToMap}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700"
          >
            🗺 View on Map
          </button>
        </div>

        {results.length === 0 ? (
          <div className="rounded-2xl border border-indigo-100 bg-white p-10 text-center shadow-sm">
            <div className="text-4xl">😕</div>
            <h3 className="mt-3 text-2xl font-black text-slate-900">
              No providers found for "{query}"
            </h3>
            <p className="mt-2 text-slate-600">Try searching for:</p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {["Cleaning", "Plumbing", "AC Repair"].map((service) => (
                <button
                  key={service}
                  type="button"
                  onClick={() => updateQuery(service)}
                  className="rounded-full border border-indigo-300 bg-white px-4 py-2 text-sm font-bold text-indigo-700 hover:bg-indigo-50"
                >
                  {service}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {results.map((seller) => (
              <article
                key={seller.id}
                className="rounded-xl border-l-4 border-l-[#6366f1] bg-white p-5 shadow-sm"
              >
                <h3 className="text-lg font-black text-slate-900">
                  🔧 {seller.name}
                </h3>
                <p className="mt-2 text-sm font-semibold text-slate-700">
                  🛠 {seller.service}
                </p>
                <p className="mt-2 text-sm text-slate-600">
                  📍 {seller.address}
                </p>

                {seller.isPremium ? (
                  <p className="mt-4 text-sm font-bold text-emerald-700">
                    📞 {seller.phone}
                  </p>
                ) : (
                  <p className="mt-4 text-sm font-semibold text-slate-600">
                    📞 Contact available on booking
                  </p>
                )}

                <Link
                  to={`/seller/${seller.id}`}
                  className="mt-5 inline-block rounded-lg bg-indigo-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-indigo-700"
                >
                  View Profile →
                </Link>
              </article>
            ))}
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
          <NearbyServices key={query} initialSearch={query} />
        </div>
      </section>
    </main>
  );
}
