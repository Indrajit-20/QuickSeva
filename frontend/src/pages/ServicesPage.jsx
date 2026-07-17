import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { categoriesData, categoryToKeywords } from "../data/servicesData";
import NearbyServices from "../components/NearbyServices";

import apiClient from "../api/axiosConfig";

// Sellers come from backend — never from localStorage.
const fetchSellersByKeyword = async (keyword) => {
  try {
    const params = keyword ? { keyword } : {};
    // Reuse the public services search; flatten unique sellers.
    const res = await apiClient.get("/services/search", { params });
    const services =
      res?.data?.data?.services || res?.data?.services || [];
    const sellerMap = new Map();
    services.forEach((svc) => {
      const sid = svc.seller_id;
      if (!sid || sellerMap.has(sid)) return;
      sellerMap.set(sid, {
        id: sid,
        name: svc.seller_business_name || svc.seller_name || "Seller",
        service: svc.category_name || svc.title || "",
        address: svc.seller_address || svc.address || "",
        phone: svc.seller_phone || "",
        isPremium: Boolean(svc.is_premium),
        lat: svc.lat,
        lng: svc.lng,
      });
    });
    return Array.from(sellerMap.values());
  } catch {
    return [];
  }
};

export default function ServicesPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const categoryParam = searchParams.get("category");
  const queryFromUrl = searchParams.get("q");

  // Prefer `category` (navbar + chips). Fallback to legacy `q`.
  const category = categoryParam || queryFromUrl || "";

  const [query, setQuery] = useState(queryFromUrl || "");
  const [sellers, setSellers] = useState([]);

  const mapRef = useRef(null);
  const contentRef = useRef(null);

  useEffect(() => {
    setQuery(searchParams.get("q") || "");
    const kw = searchParams.get("category") || searchParams.get("q") || "";
    fetchSellersByKeyword(kw).then(setSellers);
  }, [searchParams]);

  const filteredCategory = useMemo(() => {
    if (!category) return null;

    const categoryLower = String(category).toLowerCase();

    const matchedCat = categoriesData.find(
      (cat) =>
        cat.title.toLowerCase() === categoryLower ||
        cat.title.toLowerCase().includes(categoryLower) ||
        categoryLower.includes(cat.title.toLowerCase()),
    );

    return matchedCat || null;
  }, [category]);



  const scrollToMap = () => {
    mapRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const activeCategory = category;

  const categoryParamLower = category ? category.toLowerCase() : "";

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

  const categorySellers = useMemo(() => {
    const allSellers = sellers || [];
    if (!category) return allSellers; // If no category, show all loaded sellers

    const selectedCategoryKeywords = mapKeywordsForCategory(category);
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
  }, [sellers, category, categoryParamLower]);

  const sellerCard = (seller) => {
    const serviceType = seller?.service || "";
    const isPremium = Boolean(seller?.isPremium);

    return (
      <article
        key={seller.id}
        className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm text-left"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">{seller.name}</h3>
            {isPremium ? (
              <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700">
                ✓ Verified
              </div>
            ) : null}
          </div>
        </div>

        {serviceType ? (
          <div className="mt-2 inline-flex rounded-full bg-emerald-50 px-3 py-0.5 text-xs font-semibold text-emerald-700">
            {serviceType}
          </div>
        ) : null}

        <p className="mt-2 text-sm text-slate-500">📍 {seller.address}</p>

        {isPremium && seller.phone ? (
          <p className="mt-1 text-sm font-semibold text-emerald-600">
            📞 {seller.phone}
          </p>
        ) : null}

        <button
          type="button"
          onClick={() => navigate(`/seller/${seller.id}`)}
          className="mt-3 w-full border border-blue-500 text-blue-600 text-xs font-bold py-2 rounded-lg hover:bg-blue-600 hover:text-white transition cursor-pointer"
        >
          View Profile →
        </button>
      </article>
    );
  };

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col">
      <section className="border-b border-slate-200 bg-white py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* minimal header removed (kept filter chips + map section) */}

          {/* Filter chips (category titles) */}
          <div className="mt-5 flex flex-wrap gap-2 justify-center sm:justify-start">
            <button
              type="button"
              onClick={() => navigate("/services")}
              className={`rounded-full border px-4 py-2 text-sm font-bold transition cursor-pointer ${!category
                  ? "border-blue-600 bg-blue-600 text-white"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
            >
              All
            </button>
            {categoriesData.map((cat) => {
              const chipLower = cat.title.toLowerCase();
              const active =
                chipLower === category.toLowerCase() ||
                chipLower.includes(category.toLowerCase());

              return (
                <button
                  key={cat.title}
                  type="button"
                  onClick={() =>
                    navigate(
                      `/services?category=${encodeURIComponent(cat.title)}${query ? `&q=${encodeURIComponent(query)}` : ""}`,
                    )
                  }
                  className={`rounded-full border px-4 py-2 text-sm font-bold transition cursor-pointer ${active
                      ? "border-blue-600 bg-blue-600 text-white"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                >
                  {cat.title}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section
        ref={contentRef}
        style={{ scrollMarginTop: "90px" }}
        className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8"
      >
        <div className="mb-6 text-left">
          {category ? (
            <>
              <div className="text-sm text-slate-400 mb-2">
                <Link to="/">Home</Link> › <Link to="/services">Services</Link>{" "}
                › {category}
              </div>
              <h1 className="text-2xl font-black text-slate-900">
                {filteredCategory?.title || `Results for '${category}'`}
              </h1>
            </>
          ) : (
            <h1 className="text-2xl font-black text-slate-900">All Services</h1>
          )}
        </div>

        {categorySellers.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <div className="text-4xl">🔍</div>
            <h3 className="mt-3 text-xl font-bold text-slate-900">
              No active providers available for "{category || "your search"}" yet
            </h3>
            <p className="mt-2 text-sm text-slate-500 font-semibold">
              Try selecting a different category or checking back later.
            </p>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-black text-slate-900 text-left">
                {category ? `Active Providers in ${category}` : "All Active Providers"} ({categorySellers.length})
              </h3>
            </div>
            
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {categorySellers.map((seller) => sellerCard(seller))}
            </div>
          </div>
        )}
      </section>

      <section ref={mapRef} className="bg-slate-50 border-t border-slate-200 py-10 flex-grow">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-left">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-800">View on Map</h2>
            <p className="mt-1 text-sm text-slate-500 font-semibold">
              Nearby providers matching your service search.
            </p>
          </div>
          <NearbyServices
            key={category || query}
            initialSearch={query || category || ""}
          />
        </div>
      </section>
    </main>
  );
}
