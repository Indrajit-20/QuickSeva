import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { categoriesData, ALL_SERVICE_SUGGESTIONS } from "../data/servicesData";
import apiClient from "../api/axiosConfig";
import { getUserLocation } from "../utils/getLocation";
import {
  Search,
  MapPin,
  Navigation,
  Star,
  Phone,
  CheckCircle2,
  X,
  ChevronRight,
  Loader2,
  Tag,
  Wrench,
  User,
  SlidersHorizontal,
  RotateCcw
} from "lucide-react";

const INDIAN_STATES_AND_CITIES = {
  "Maharashtra": ["Mumbai", "Pune", "Thane", "Nagpur", "Nashik", "Navi Mumbai"],
  "Delhi NCR": ["New Delhi", "Noida", "Gurugram", "Ghaziabad", "Faridabad"],
  "Karnataka": ["Bengaluru", "Mysuru", "Hubli-Dharwad", "Mangaluru"],
  "Gujarat": ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Gandhinagar"],
  "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai", "Tiruchirappalli"],
  "Telangana": ["Hyderabad", "Warangal", "Nizamabad"],
  "West Bengal": ["Kolkata", "Howrah", "Durgapur", "Asansol"],
  "Uttar Pradesh": ["Lucknow", "Kanpur", "Agra", "Varanasi", "Meerut", "Prayagraj"],
  "Rajasthan": ["Jaipur", "Jodhpur", "Udaipur", "Kota", "Bikaner"],
  "Punjab": ["Ludhiana", "Amritsar", "Jalandhar", "Patiala", "Chandigarh"],
  "Haryana": ["Faridabad", "Gurugram", "Panipat", "Ambala", "Panchkula"],
  "Kerala": ["Kochi", "Thiruvananthapuram", "Kozhikode", "Thrissur"]
};

const CITY_COORDS = {
  ahmedabad: { lat: 23.0225, lng: 72.5714 },
  mumbai: { lat: 19.0760, lng: 72.8777 },
  pune: { lat: 18.5204, lng: 73.8567 },
  thane: { lat: 19.2183, lng: 72.9781 },
  surat: { lat: 21.1702, lng: 72.8311 },
  vadodara: { lat: 22.3072, lng: 73.1812 },
  delhi: { lat: 28.6139, lng: 77.2090 },
  "new delhi": { lat: 28.6139, lng: 77.2090 },
  noida: { lat: 28.5355, lng: 77.3910 },
  gurugram: { lat: 28.4595, lng: 77.0266 },
  bengaluru: { lat: 12.9716, lng: 77.5946 },
  bangalore: { lat: 12.9716, lng: 77.5946 },
  chennai: { lat: 13.0827, lng: 80.2707 },
  kolkata: { lat: 22.5726, lng: 88.3639 },
  hyderabad: { lat: 17.3850, lng: 78.4867 },
  jaipur: { lat: 26.9124, lng: 75.7873 },
  lucknow: { lat: 26.8467, lng: 80.9462 }
};

function getSellerCoords(seller) {
  if (
    typeof seller?.lat === "number" &&
    typeof seller?.lng === "number" &&
    seller.lat !== 0 &&
    seller.lng !== 0
  ) {
    return { lat: seller.lat, lng: seller.lng };
  }
  const addr = (seller?.address || "").toLowerCase();
  for (const [city, coords] of Object.entries(CITY_COORDS)) {
    if (addr.includes(city)) return coords;
  }
  const idNum = Number(seller?.id || 1);
  const latOffset = ((idNum * 17) % 50) / 100;
  const lngOffset = ((idNum * 23) % 50) / 100;
  return { lat: 23.0225 + latOffset, lng: 72.5714 + lngOffset };
}

const frontendToDbCategoryMap = {
  "Cleaning Essentials": "Cleaning",
  "Appliance Repair & Service": "Appliance Repair",
  "AC Repair": "AC Repair",
  "Electrician": "Electrical",
  "Plumbing": "Plumbing",
  "Pest Control": "Pest Control",
  "Carpentry": "Carpentry",
  "Home Painting": "Home Painting",
  "Cleaning": "Cleaning",
  "Electrical": "Electrical"
};

const DB_CATEGORIES = [
  "Cleaning",
  "Electrical",
  "Plumbing",
  "Carpentry",
  "AC Repair",
  "Pest Control",
  "Home Painting",
  "Appliance Repair"
];

// Calculate Haversine distance in KM
function getDistanceKm(lat1, lng1, lat2, lng2) {
  if (
    lat1 === null || lat1 === undefined ||
    lng1 === null || lng1 === undefined ||
    lat2 === null || lat2 === undefined ||
    lng2 === null || lng2 === undefined
  ) {
    return null;
  }
  const nLat1 = Number(lat1);
  const nLng1 = Number(lng1);
  const nLat2 = Number(lat2);
  const nLng2 = Number(lng2);

  if (isNaN(nLat1) || isNaN(nLng1) || isNaN(nLat2) || isNaN(nLng2)) return null;

  const R = 6371; // Earth radius in kilometers
  const dLat = ((nLat2 - nLat1) * Math.PI) / 180;
  const dLng = ((nLng2 - nLng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((nLat1 * Math.PI) / 180) *
      Math.cos((nLat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

const getInitials = (name) => {
  if (!name) return "S";
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
};

const fetchSellersByKeyword = async (keyword, category, state = "", city = "", page = 1) => {
  try {
    const params = { page, limit: 12 };
    if (keyword) params.keyword = keyword;
    if (category) {
      const dbCat = frontendToDbCategoryMap[category] || category;
      params.category = dbCat;
    }
    if (state) params.state = state;
    if (city) params.city = city;
    
    const res = await apiClient.get("/services/search", { params });
    const services = res?.data?.data?.services || res?.data?.services || [];
    const sellerMap = new Map();
    services.forEach((svc) => {
      const sid = svc.seller_id;
      if (!sid || sellerMap.has(sid)) return;
      
      const cityVal = svc.city || "";
      const stateVal = svc.state || "";
      const formattedAddress = svc.address || (cityVal ? `${cityVal}${stateVal ? `, ${stateVal}` : ""}` : "");
      
      sellerMap.set(sid, {
        id: sid,
        name: svc.business_name || svc.seller_business_name || svc.seller_name || "Seller",
        service: svc.category_name || svc.title || "",
        address: formattedAddress,
        phone: svc.phone || svc.seller_phone || "",
        isPremium: Boolean(svc.is_premium || svc.isPremium),
        lat: svc.lat,
        lng: svc.lng,
        avgRating: svc.avg_rating || 4.8,
        price: svc.price,
        priceType: svc.price_type
      });
    });
    return {
      sellers: Array.from(sellerMap.values()),
      hasMore: services.length === 12
    };
  } catch {
    return { sellers: [], hasMore: false };
  }
};

export default function ServicesPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const categoryParam = searchParams.get("category") || "";
  const queryFromUrl = searchParams.get("q") || "";

  const category = categoryParam;

  const [query, setQuery] = useState(queryFromUrl);
  const [sellers, setSellers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedState, setSelectedState] = useState("");
  const [selectedCity, setSelectedCity] = useState("");

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  // User location states - initialize with getUserLocation fallback
  const [userLocation, setUserLocation] = useState({ lat: 23.0225, lng: 72.5714 });
  const [isLocating, setIsLocating] = useState(false);

  // Autocomplete dropdown states
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchContainerRef = useRef(null);
  const contentRef = useRef(null);

  // Auto detect or fallback location
  const detectLocation = () => {
    setIsLocating(true);
    getUserLocation().then((loc) => {
      if (loc && typeof loc.lat === "number" && typeof loc.lng === "number") {
        setUserLocation({ lat: loc.lat, lng: loc.lng });
      }
      setIsLocating(false);
    });
  };

  useEffect(() => {
    detectLocation();
  }, []);

  useEffect(() => {
    const qParam = searchParams.get("q") || "";
    const catParam = searchParams.get("category") || "";
    setQuery(qParam);
    setPage(1);
    setIsLoading(true);
    fetchSellersByKeyword(qParam, catParam, selectedState, selectedCity, 1).then((res) => {
      setSellers(res.sellers);
      setHasMore(res.hasMore);
      setIsLoading(false);
    });
  }, [searchParams, selectedState, selectedCity]);

  // Click outside search container to close dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Compute autocomplete options based on search query
  const autocompleteOptions = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return [];

    const results = [];

    // 1. Match Categories
    DB_CATEGORIES.forEach((cat) => {
      if (cat.toLowerCase().includes(trimmed)) {
        results.push({
          type: "category",
          label: cat,
          subText: "Category",
          icon: <Tag className="w-4 h-4 text-blue-500" />
        });
      }
    });

    // 2. Match Service Keywords from ALL_SERVICE_SUGGESTIONS
    (ALL_SERVICE_SUGGESTIONS || []).forEach((item) => {
      if (item.toLowerCase().includes(trimmed) && results.length < 10) {
        if (!results.some(r => r.label.toLowerCase() === item.toLowerCase())) {
          results.push({
            type: "service",
            label: item,
            subText: "Service",
            icon: <Wrench className="w-4 h-4 text-emerald-500" />
          });
        }
      }
    });

    // 3. Match active sellers by business name or service
    (sellers || []).forEach((s) => {
      if (
        (s.name.toLowerCase().includes(trimmed) || s.service.toLowerCase().includes(trimmed)) &&
        results.length < 12
      ) {
        if (!results.some(r => r.label.toLowerCase() === s.name.toLowerCase())) {
          results.push({
            type: "seller",
            label: s.name,
            subText: `${s.service} • ${s.address || "Local Partner"}`,
            sellerId: s.id,
            icon: <User className="w-4 h-4 text-purple-500" />
          });
        }
      }
    });

    return results.slice(0, 8);
  }, [query, sellers]);

  const handleSelectOption = (opt) => {
    setQuery(opt.label);
    setIsDropdownOpen(false);
    setSelectedIndex(-1);

    const params = new URLSearchParams(searchParams);
    params.set("q", opt.label);
    if (opt.type === "category") {
      params.set("category", opt.label);
    }
    navigate(`/services?${params.toString()}`);
  };

  const handleKeyDown = (e) => {
    if (!isDropdownOpen || autocompleteOptions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % autocompleteOptions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + autocompleteOptions.length) % autocompleteOptions.length);
    } else if (e.key === "Enter") {
      if (selectedIndex >= 0 && selectedIndex < autocompleteOptions.length) {
        e.preventDefault();
        handleSelectOption(autocompleteOptions[selectedIndex]);
      }
    } else if (e.key === "Escape") {
      setIsDropdownOpen(false);
    }
  };

  const filteredCategory = useMemo(() => {
    if (!category) return null;
    const categoryLower = String(category).toLowerCase();
    return categoriesData.find(
      (cat) =>
        cat.title.toLowerCase() === categoryLower ||
        cat.title.toLowerCase().includes(categoryLower) ||
        categoryLower.includes(cat.title.toLowerCase())
    ) || null;
  }, [category]);

  const handleLoadMore = async () => {
    const nextPage = page + 1;
    const qParam = searchParams.get("q") || "";
    const catParam = searchParams.get("category") || "";
    
    const res = await fetchSellersByKeyword(qParam, catParam, selectedState, selectedCity, nextPage);
    
    setSellers((prev) => {
      const existingIds = new Set(prev.map((s) => s.id));
      const filteredNew = res.sellers.filter((s) => !existingIds.has(s.id));
      return [...prev, ...filteredNew];
    });
    setPage(nextPage);
    setHasMore(res.hasMore);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setIsDropdownOpen(false);
    const params = new URLSearchParams(searchParams);
    if (query.trim()) {
      params.set("q", query.trim());
    } else {
      params.delete("q");
    }
    navigate(`/services?${params.toString()}`);
  };

  const renderSellerCard = (seller) => {
    const serviceType = seller?.service || "";
    const isPremium = Boolean(seller?.isPremium);
    
    // Calculate distance with seller coords fallback
    const sellerCoords = getSellerCoords(seller);
    const distanceKm = userLocation
      ? getDistanceKm(userLocation.lat, userLocation.lng, sellerCoords.lat, sellerCoords.lng)
      : null;

    const formattedDistance = distanceKm !== null
      ? (distanceKm < 1 ? `${(distanceKm * 1000).toFixed(0)} m away` : `${distanceKm.toFixed(1)} km away`)
      : "2.4 km away";

    return (
      <article
        key={seller.id}
        onClick={() => navigate(`/seller/${seller.id}`)}
        className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-400 hover:shadow-md text-left cursor-pointer"
      >
        <div>
          {/* Card Header: Avatar, Name & Verified Badge */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-black text-sm shadow-md shadow-blue-500/20">
                {getInitials(seller.name)}
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                  {seller.name}
                </h3>
                {isPremium ? (
                  <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-700 border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Verified Partner
                  </span>
                ) : (
                  <span className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-slate-500">
                    Active Service Provider
                  </span>
                )}
              </div>
            </div>

            {/* Rating */}
            <div className="flex items-center gap-1 rounded-lg bg-amber-50 px-2 py-1 border border-amber-200/70 text-xs font-bold text-amber-700 shrink-0">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
              <span>{seller.avgRating ? seller.avgRating : "4.8"}</span>
            </div>
          </div>

          {/* Service Tag & Distance Pill */}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {serviceType ? (
              <span className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 border border-blue-100">
                <Wrench className="w-3 h-3 text-blue-500" /> {serviceType}
              </span>
            ) : null}

            {/* Prominent Distance Display (e.g. 23km away) */}
            <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 border border-emerald-200">
              <Navigation className="w-3 h-3 text-emerald-600 fill-emerald-600 animate-pulse" /> {formattedDistance}
            </span>
          </div>

          {/* Location Address */}
          <p className="mt-3 flex items-start gap-1.5 text-xs font-medium text-slate-600 leading-relaxed">
            <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <span className="line-clamp-2">{seller.address || "Local Service Area"}</span>
          </p>

          {/* Phone if available */}
          {isPremium && seller.phone ? (
            <p className="mt-2 flex items-center gap-1.5 text-xs font-bold text-emerald-600">
              <Phone className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>{seller.phone}</span>
            </p>
          ) : null}
        </div>
      </article>
    );
  };

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Header & Search Area - Clean Single-Layer Design without Double Borders */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-6 pb-2 w-full text-left">
        {/* Full-width Single Search Bar */}
        <div ref={searchContainerRef} className="relative mb-4 w-full">
          <form
            onSubmit={handleSearchSubmit}
            className="relative flex items-center bg-white rounded-2xl border border-slate-200 shadow-sm p-1.5 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all duration-200 z-20"
          >
            <div className="flex-grow flex items-center px-3">
              <Search className="w-5 h-5 text-slate-400 mr-3 shrink-0" />
              <input
                type="text"
                placeholder="Search services (e.g. plumber, electrician, ac repair, cleaning)..."
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setIsDropdownOpen(true);
                  setSelectedIndex(-1);
                }}
                onFocus={() => setIsDropdownOpen(true)}
                onKeyDown={handleKeyDown}
                className="w-full bg-transparent text-sm sm:text-base font-semibold text-slate-800 placeholder-slate-400 outline-none border-none py-2"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery("");
                    setIsDropdownOpen(false);
                    const params = new URLSearchParams(searchParams);
                    params.delete("q");
                    navigate(`/services?${params.toString()}`);
                  }}
                  className="p-1 text-slate-400 hover:text-slate-600 transition cursor-pointer mr-2"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm px-7 py-3 rounded-xl transition cursor-pointer shadow-sm active:scale-95 flex items-center gap-1.5 shrink-0"
            >
              <span>Search</span>
            </button>
          </form>

          {/* Live Autocomplete Dropdown List */}
          {isDropdownOpen && autocompleteOptions.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden z-30 divide-y divide-slate-100 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="bg-slate-50 px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Suggestions & Matching Services
              </div>
              <div className="max-h-72 overflow-y-auto">
                {autocompleteOptions.map((opt, idx) => {
                  const isSelected = idx === selectedIndex;
                  return (
                    <div
                      key={`${opt.type}-${opt.label}-${idx}`}
                      onClick={() => handleSelectOption(opt)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`flex items-center justify-between px-4 py-3 cursor-pointer transition-colors ${
                        isSelected ? "bg-blue-50 text-blue-700" : "hover:bg-slate-50 text-slate-700"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="shrink-0 p-2 rounded-lg bg-slate-100/80">
                          {opt.icon}
                        </div>
                        <div className="truncate">
                          <p className="text-sm font-bold truncate">{opt.label}</p>
                          <p className="text-xs text-slate-400 truncate">{opt.subText}</p>
                        </div>
                      </div>
                      <ChevronRight className={`w-4 h-4 shrink-0 ${isSelected ? "text-blue-600" : "text-slate-300"}`} />
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Location Selector Bar */}
        <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div className="text-left">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-800">Pan-India & City Directory</h3>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                  All India
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Browse sellers across Gujarat & India by State & City (or tap 📍 Nearby for GPS map search)
              </p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Country (Locked to India) */}
            <div className="flex flex-col gap-1 w-full sm:flex-1 md:w-32">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 text-left">Country</label>
              <div className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 flex items-center gap-1.5 shadow-sm min-h-[38px]">
                <span>🇮🇳</span> India
              </div>
            </div>

            {/* State select */}
            <div className="flex flex-col gap-1 w-full sm:flex-1 md:w-44">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 text-left">State</label>
              <select
                value={selectedState}
                onChange={(e) => {
                  setSelectedState(e.target.value);
                  setSelectedCity("");
                }}
                className="w-full bg-slate-50 border border-slate-200 hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl px-3 py-2 text-sm font-semibold text-slate-750 shadow-sm outline-none transition cursor-pointer min-h-[38px]"
              >
                <option value="">All States</option>
                {Object.keys(INDIAN_STATES_AND_CITIES).map((st) => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
            </div>

            {/* City select */}
            <div className="flex flex-col gap-1 w-full sm:flex-1 md:w-44">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 text-left">City</label>
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                disabled={!selectedState}
                className="w-full bg-slate-50 border border-slate-200 hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl px-3 py-2 text-sm font-semibold text-slate-750 shadow-sm outline-none transition cursor-pointer disabled:opacity-50 disabled:bg-slate-100 disabled:cursor-not-allowed min-h-[38px]"
              >
                <option value="">All Cities</option>
                {selectedState && INDIAN_STATES_AND_CITIES[selectedState]?.map((ct) => (
                  <option key={ct} value={ct}>{ct}</option>
                ))}
              </select>
            </div>

            {/* Detect Location Button */}
            <div className="flex flex-col gap-1 w-full sm:flex-1 md:w-auto md:mt-5">
              <button
                type="button"
                onClick={detectLocation}
                disabled={isLocating}
                className="w-full md:w-auto bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-bold text-xs px-3.5 py-2.5 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 shadow-sm active:scale-95 disabled:opacity-60"
                title="Detect GPS location for distance calculation"
              >
                {isLocating ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Navigation className="w-3.5 h-3.5 fill-emerald-600 text-emerald-600" />
                )}
                <span>Detect GPS</span>
              </button>
            </div>

            {/* Reset Filter Option */}
            {(selectedState || selectedCity || query || category) && (
              <div className="flex flex-col gap-1 w-full sm:flex-1 md:w-auto md:mt-5">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedState("");
                    setSelectedCity("");
                    setQuery("");
                    navigate("/services");
                  }}
                  className="text-xs font-bold text-red-600 hover:text-red-700 transition cursor-pointer h-fit px-3 py-2 hover:bg-red-50 rounded-xl flex items-center justify-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Results Section */}
      <section
        ref={contentRef}
        style={{ scrollMarginTop: "90px" }}
        className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 flex-grow w-full"
      >
        {/* Results Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-left">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
              <Link to="/" className="hover:text-blue-600">Home</Link> / <Link to="/services" className="hover:text-blue-600">Services</Link>
              {category && ` / ${category}`}
            </div>
            <h2 className="text-2xl font-black text-slate-900">
              {category
                ? `Providers in '${filteredCategory?.title || category}'`
                : query
                ? `Results for '${query}'`
                : "All Active Service Providers"}
            </h2>
          </div>

          {!isLoading && (
            <div className="text-xs font-bold text-slate-500 bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-sm self-start sm:self-auto">
              Showing <span className="text-blue-600 font-extrabold">{sellers.length}</span> providers
            </div>
          )}
        </div>

        {/* Loading Skeletons */}
        {isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div
                key={n}
                className="animate-pulse rounded-2xl border border-slate-200 bg-white p-5 space-y-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 bg-slate-200 rounded-2xl"></div>
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-slate-200 rounded w-2/3"></div>
                    <div className="h-3 bg-slate-200 rounded w-1/3"></div>
                  </div>
                </div>
                <div className="h-6 bg-slate-200 rounded w-1/2"></div>
                <div className="h-4 bg-slate-200 rounded w-full"></div>
                <div className="h-10 bg-slate-200 rounded-xl"></div>
              </div>
            ))}
          </div>
        ) : sellers.length === 0 ? (
          /* Empty State */
          <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-sm max-w-xl mx-auto my-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 mx-auto text-3xl mb-4">
              🔍
            </div>
            <h3 className="text-xl font-black text-slate-900">
              No service providers found
            </h3>
            <p className="mt-2 text-sm text-slate-500 font-semibold leading-relaxed">
              We couldn't find any active providers matching "{query || category || "your criteria"}" in the selected location.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setSelectedState("");
                  setSelectedCity("");
                  navigate("/services");
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition cursor-pointer shadow-sm"
              >
                View All Providers
              </button>
            </div>
          </div>
        ) : (
          /* Seller Cards Grid */
          <div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {sellers.map((seller) => renderSellerCard(seller))}
            </div>

            {hasMore && (
              <div className="mt-12 flex justify-center">
                <button
                  type="button"
                  onClick={handleLoadMore}
                  className="bg-white hover:bg-slate-50 text-blue-600 border border-slate-300 hover:border-blue-400 font-bold text-sm px-8 py-3 rounded-2xl transition shadow-sm active:scale-95 cursor-pointer flex items-center gap-2"
                >
                  <span>Load More Providers</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}
      </section>
    </main>
  );
}

