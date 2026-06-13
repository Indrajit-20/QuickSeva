import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";


import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  deductContactView,
  deductSearchImpression,
  isWalletSufficient,
  trackSearchImpression,
} from "../utils/wallet";
import { getPlanRank } from "../utils/premium";

import {
  MapContainer,
  TileLayer,
  Circle,
  Marker,
  Popup,
  useMap,
  useMapEvents,
} from "react-leaflet";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import MarkerClusterGroup from "react-leaflet-markercluster";

// Fix Leaflet marker icon URLs in this map component
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const GREEN_PIN_ICON_HTML =
  "<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none'>" +
  "<path d='M12 21s7-5.3 7-12a7 7 0 1 0-14 0c0 6.7 7 12 7 12z' fill='#16a34a' stroke='#166534' stroke-width='1.5'/>" +
  "<circle cx='12' cy='9' r='3.2' fill='#22c55e' stroke='#166534' stroke-width='1.2'/>" +
  "</svg>";

const GREEN_ICON = L.divIcon({
  className: "green-service-pin",
  html: GREEN_PIN_ICON_HTML,
  iconSize: [24, 24],
  iconAnchor: [12, 24],
});

const PREMIUM_PIN_HTML =
  "<svg xmlns='http://www.w3.org/2000/svg' width='28' height='28' viewBox='0 0 24 24' fill='none'>" +
  "<path d='M12 21s7-5.3 7-12a7 7 0 1 0-14 0c0 6.7 7 12 7 12z' fill='#16a34a' stroke='#166534' stroke-width='1.5'/>" +
  "<circle cx='12' cy='9' r='3.2' fill='#22c55e' stroke='#166534' stroke-width='1.2'/>" +
  "</svg>";

const PREMIUM_ICON = L.divIcon({
  className: "premium-service-pin",
  html: PREMIUM_PIN_HTML,
  iconSize: [28, 28],
  iconAnchor: [14, 28],
});

const GOLD_PIN_HTML =
  "<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 24 24' fill='none'>" +
  "<path d='M12 21s7-5.3 7-12a7 7 0 1 0-14 0c0 6.7 7 12 7 12z' fill='#f59e0b' stroke='#92400e' stroke-width='1.5'/>" +
  "<circle cx='12' cy='9' r='3.2' fill='#fde68a' stroke='#92400e' stroke-width='1.2'/>" +
  "</svg>";

const GOLD_ICON = L.divIcon({
  className: "gold-service-pin",
  html: GOLD_PIN_HTML,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

const SERVICE_FILTERS = [
  "All",
  "Cleaning",
  "Electrical",
  "Plumbing",
  "Carpentry",
  "AC Repair",
  "Pest Control",
  "Home Painting",
  "Appliance Repair",
];

function getDistanceKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function MapController({ center }) {
  const map = useMap();
  const hasInitialized = useRef(false);
  useEffect(() => {
    if (!center) return;
    if (!hasInitialized.current) {
      map.flyTo(center, 14, { animate: true, duration: 1.2 });
      hasInitialized.current = true;
    } else {
      map.flyTo(center, map.getZoom(), { animate: true, duration: 1.0 });
    }
  }, [center, map]);
  return null;
}

function MapClickHandler({ onMapClick }) {
  useMapEvents({
    click: (e) => onMapClick?.(e.latlng),
  });
  return null;
}

function isSellerPackageActive(seller) {
  if (!seller?.isPremium || !seller?.premiumExpiresAt) return false;
  const expiresAt = new Date(seller.premiumExpiresAt);
  return !Number.isNaN(expiresAt.getTime()) && expiresAt.getTime() > Date.now();
}

function getSellerPackageRank(seller) {
  return isSellerPackageActive(seller) ? getPlanRank(seller.plan) : 0;
}

function getSellerPinIcon(seller) {
  const rank = getSellerPackageRank(seller);
  if (rank >= 3) return GOLD_ICON;
  if (rank >= 2) return PREMIUM_ICON;
  return GREEN_ICON;
}

const getShortAddress = (data) => {
  const address = data?.address || {};
  return [
    address.road,
    address.suburb || address.neighbourhood,
    address.city || address.town || address.village,
  ]
    .filter(Boolean)
    .join(", ");
};

const reverseGeocode = async (lat, lng) => {
  const url = `https://nominatim.openstreetmap.org/reverse?lat=${encodeURIComponent(
    lat,
  )}&lon=${encodeURIComponent(lng)}&format=json`;
  const res = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": "QuickSeva/1.0",
    },
  });
  if (!res.ok) throw new Error(`Reverse geocode failed: ${res.status}`);
  return getShortAddress(await res.json());
};

export function useNearbyLocation() {
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    if (!navigator.geolocation) {
      setLoading(false);
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        if (cancelled) return;
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        try {
          const nextAddress = await reverseGeocode(lat, lng);
          if (!cancelled) setAddress(nextAddress || "");
        } catch {
          if (!cancelled) setAddress("");
        } finally {
          if (!cancelled) setLoading(false);
        }
      },
      () => {
        if (!cancelled) {
          setAddress("");
          setLoading(false);
        }
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );

    return () => {
      cancelled = true;
    };
  }, []);

  return { address, loading };
}

export default function NearbyServices({
  initialSearch = "",
  centerLat = null,
  centerLon = null,
  locationFilter = "",
}) {
  const [buyerPos, setBuyerPos] = useState(null);
  const [geoError, setGeoError] = useState("");
  const [search, setSearch] = useState(initialSearch);
  const [locationQuery, setLocationQuery] = useState("");
  const [locationResults, setLocationResults] = useState([]);
  const [locationLoading, setLocationLoading] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);

  const [locationMode, setLocationMode] = useState("area"); // "area" | "pincode"
  const [pincode, setPincode] = useState("");
  const [pincodeLoading, setPincodeLoading] = useState(false);
  const [pincodeError, setPincodeError] = useState("");
  const [pincodeResults, setPincodeResults] = useState([]);

  const [selectedSellerId, setSelectedSellerId] = useState(null);
  const [dropdownStyle, setDropdownStyle] = useState(null);

  // Provider listing filters (frontend-only, mock data)
  const [filterServiceMode, setFilterServiceMode] = useState("All"); // All | Online | Offline | Both
  const [filterAvailability, setFilterAvailability] = useState("All"); // All | Instant
  const [filterRating, setFilterRating] = useState("All"); // All | 4 | 4.5

  const FILTER_SERVICE_MODE = ["All", "Online", "Offline", "Both"];
  const FILTER_AVAILABILITY = ["All", "Instant Service"];
  const FILTER_RATINGS = [
    { value: "All", label: "All" },
    { value: "4", label: "4★+" },
    { value: "4.5", label: "4.5★+" },
  ];

  // ── NEW: Refine Results filters ──────────────────────────────────────────
  const [filterPrice, setFilterPrice] = useState("all");
  const [filterDuration, setFilterDuration] = useState("all");
  const [filterBooking, setFilterBooking] = useState("all");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const PRICE_OPTIONS = [
    { value: "all", label: "All" },
    { value: "under500", label: "Under ₹500" },
    { value: "500-1000", label: "₹500–₹1k" },
    { value: "1000-2000", label: "₹1k–₹2k" },
    { value: "2000+", label: "₹2k+" },
  ];
  const DURATION_OPTIONS = [
    { value: "all", label: "All" },
    { value: "under1", label: "< 1 hr" },
    { value: "1-2", label: "1–2 hrs" },
    { value: "2-4", label: "2–4 hrs" },
    { value: "4+", label: "4+ hrs" },
  ];
  const BOOKING_OPTIONS = [
    { value: "all", label: "All" },
    { value: "instant", label: "⚡ Instant" },
    { value: "scheduled", label: "📅 Scheduled" },
  ];

  // ── Duration bucket helpers ──────────────────────────────────────────────
  const parseDurationToMinutes = (str) => {
    if (!str || typeof str !== "string") return null;
    const t = str.trim().toLowerCase();
    const hourMatch = t.match(/(\d+)\s*h/);
    const minMatch  = t.match(/(\d+)\s*m(?!o)/); // 'm' but not 'mo' (month)
    const hours = hourMatch ? Number(hourMatch[1]) : 0;
    const mins  = minMatch  ? Number(minMatch[1])  : 0;
    if (!hourMatch && !minMatch) {
      const range  = t.match(/(\d+)\s*-\s*(\d+)/);
      if (range) return Math.round(((Number(range[1]) + Number(range[2])) * 60) / 2);
      const single = t.match(/(\d+)\s*hours?/);
      if (single) return Number(single[1]) * 60;
      const bare   = t.match(/^(\d+)$/);
      if (bare)   return Number(bare[1]) * 60;
      return null;
    }
    return hours * 60 + mins;
  };

  const getDurationBucket = (str) => {
    const mins = parseDurationToMinutes(str);
    if (mins === null) return null;
    if (mins < 60)  return "under1";
    if (mins <= 120) return "1-2";
    if (mins <= 240) return "2-4";
    return "4+";
  };

  const activeFilterCount =
    (filterPrice    !== "all" ? 1 : 0) +
    (filterDuration !== "all" ? 1 : 0) +
    (filterBooking  !== "all" ? 1 : 0);

  const clearAllFilters = () => {
    setFilterPrice("all");
    setFilterDuration("all");
    setFilterBooking("all");
  };

  const clickedSellers = useRef(new Set());


  const [radiusKm, setRadiusKm] = useState(5);

  const [locationNotFoundMsg, setLocationNotFoundMsg] = useState("");

  const deductedSellers = useRef(new Set());

  const handlePremiumSellerClick = (seller) => {
    if (seller?.id) setSelectedSellerId(seller.id);
  };

  const viewedContacts = useRef(new Set());
  const [revealedContacts, setRevealedContacts] = useState(() => new Set());

  const navigateToSeller = (seller) => {
    window.location.href = `/seller/${seller.id}`;
  };

  const handleViewDetailsClick = (seller, e) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    if (seller?.id) {
      setSelectedSellerId(seller.id);
    }
    navigateToSeller(seller);
  };

  const gpsPosRef = useRef(null);
  const locationSearchRef = useRef(null);
  const portalDropdownRef = useRef(null);

  const nominatimSearch = async (q) => {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
        q,
      )}&format=json&limit=5&countrycodes=in`,
      {
        headers: {
          Accept: "application/json",
          "User-Agent": "QuickSeva/1.0",
        },
      },
    );
    if (!res.ok) throw new Error(`Location search failed: ${res.status}`);
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  };

  const smartSearch = async (query) => {
    const trimmed = query.trim();
    if (trimmed.length < 2) return [];

    let results = await nominatimSearch(trimmed);
    if (results.length > 0) return results;

    results = await nominatimSearch(`${trimmed}, India`);
    if (results.length > 0) return results;

    results = await nominatimSearch(`${trimmed}, Gujarat, India`);
    if (results.length > 0) return results;

    if (trimmed.length > 4) {
      results = await nominatimSearch(`${trimmed.slice(0, -2)}, India`);
      if (results.length > 0) return results;
    }

    return [];
  };

  const searchLocation = async (query) => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setLocationResults([]);
      setLocationNotFoundMsg("");
      return;
    }

    setLocationLoading(true);
    setLocationNotFoundMsg("");
    try {
      const results = await smartSearch(trimmed);
      if (!results || results.length === 0) {
        setLocationResults([]);
        setLocationNotFoundMsg(
          "Area not found. Try a nearby landmark, or click the map to set location manually.",
        );
        return;
      }
      setLocationResults(results);
    } catch {
      setLocationResults([]);
      setLocationNotFoundMsg(
        "Area not found. Try a nearby landmark, or click the map to set location manually.",
      );
    } finally {
      setLocationLoading(false);
    }
  };

  useEffect(() => {
    if (!navigator.geolocation) {
      setGeoError("Please allow location access to find nearby services");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const nextPos = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
        gpsPosRef.current = nextPos;
        setBuyerPos(nextPos);
      },
      () => {
        setGeoError("Please allow location access to find nearby services");
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }, []);

  useEffect(() => {
    const handleMouseDown = (e) => {
      if (!locationSearchRef.current) return;
      // Ignore clicks inside the search form
      if (locationSearchRef.current.contains(e.target)) return;
      // Ignore clicks inside the portal dropdown (it lives outside the form in the DOM)
      if (portalDropdownRef.current && portalDropdownRef.current.contains(e.target)) return;
      setLocationResults([]);
    };

    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, []);

  // Position the portal dropdown and close it when user scrolls
  useEffect(() => {
    if (locationResults.length === 0) return;

    const updatePos = () => {
      if (!locationSearchRef.current) return;
      const rect = locationSearchRef.current.getBoundingClientRect();
      // Never let the dropdown go above 72px (below the fixed navbar)
      const top = Math.max(rect.bottom + 4, 72);
      setDropdownStyle({
        position: "fixed",
        top,
        left: rect.left,
        width: rect.width,
        zIndex: 45,          // below navbar (z-50 = 50) but above page content
      });
    };

    // Close dropdown when page scrolls — prevents floating above navbar
    const closeOnScroll = () => setLocationResults([]);

    updatePos();
    window.addEventListener("resize", updatePos);
    window.addEventListener("scroll", closeOnScroll, { passive: true, capture: true });

    return () => {
      window.removeEventListener("resize", updatePos);
      window.removeEventListener("scroll", closeOnScroll, { capture: true });
    };
  }, [locationResults.length]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (locationMode !== "area") return;
      if (locationQuery.trim().length >= 2) {
        searchLocation(locationQuery);
      } else {
        setLocationResults([]);
        setLocationNotFoundMsg("");
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [locationQuery, locationMode]);


  useEffect(() => {
    if (!selectedSellerId) return;
    const el = document.getElementById(`seller-card-${selectedSellerId}`);
    el?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [selectedSellerId]);

  const sellers = useMemo(() => {
    try {
      const raw = localStorage.getItem("sellers");
      const arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    } catch {
      return [];
    }
  }, []);

  const nearby = useMemo(() => {
    if (!buyerPos) return [];

    const filteredByDistance = sellers.filter((s) => {
      if (typeof s?.lat !== "number" || typeof s?.lng !== "number") return false;
      return getDistanceKm(buyerPos.lat, buyerPos.lng, s.lat, s.lng) <= radiusKm;
    });

    const withDistance = filteredByDistance.map((s) => ({
      ...s,
      distanceKm: getDistanceKm(buyerPos.lat, buyerPos.lng, s.lat, s.lng),
    }));

    const normalizedSearch = search.trim().toLowerCase();
    const filteredBySearch = normalizedSearch
      ? withDistance.filter((s) =>
          (s?.service || "").toLowerCase().includes(normalizedSearch),
        )
      : withDistance;

    const filteredByServiceMode =
      filterServiceMode === "All"
        ? filteredBySearch
        : filteredBySearch.filter((s) => {
            const mode = s?.serviceMode;
            if (!mode) return false;
            if (filterServiceMode === "Online")  return mode === "online" || mode === "both";
            if (filterServiceMode === "Offline") return mode === "offline" || mode === "both";
            if (filterServiceMode === "Both")    return mode === "both";
            return true;
          });

    const filteredByAvailability =
      filterAvailability === "All"
        ? filteredByServiceMode
        : filteredByServiceMode.filter((s) => Boolean(s?.instantService));

    const filteredByRating =
      filterRating === "All"
        ? filteredByAvailability
        : filteredByAvailability.filter((s) => {
            const r = Number(s?.rating || 0);
            if (filterRating === "4")   return r >= 4;
            if (filterRating === "4.5") return r >= 4.5;
            return true;
          });

    // ── NEW: price range filter ──────────────────────────────────────────
    const filteredByPrice =
      filterPrice === "all"
        ? filteredByRating
        : filteredByRating.filter((s) => {
            const svcs = Array.isArray(s?.services) ? s.services : [];
            if (!svcs.length) return false;
            return svcs.some((svc) => {
              const p = Number(svc?.price || 0);
              if (filterPrice === "under500")  return p > 0 && p < 500;
              if (filterPrice === "500-1000")  return p >= 500 && p <= 1000;
              if (filterPrice === "1000-2000") return p > 1000 && p <= 2000;
              if (filterPrice === "2000+")     return p > 2000;
              return true;
            });
          });

    // ── NEW: duration bucket filter ──────────────────────────────────────
    const filteredByDuration =
      filterDuration === "all"
        ? filteredByPrice
        : filteredByPrice.filter((s) => {
            const svcs = Array.isArray(s?.services) ? s.services : [];
            if (!svcs.length) return false;
            return svcs.some(
              (svc) => getDurationBucket(svc?.duration) === filterDuration,
            );
          });

    // ── NEW: booking type filter ─────────────────────────────────────────
    // Uses service-level is_instant if available; falls back to seller.instantService
    const filteredByBooking =
      filterBooking === "all"
        ? filteredByDuration
        : filteredByDuration.filter((s) => {
            const svcs = Array.isArray(s?.services) ? s.services : [];
            const sellerInstant = Boolean(s?.instantService);

            if (filterBooking === "instant") {
              if (svcs.length > 0) return svcs.some((svc) => Boolean(svc?.is_instant));
              return sellerInstant;
            }
            if (filterBooking === "scheduled") {
              if (svcs.length > 0) return svcs.every((svc) => !svc?.is_instant);
              return !sellerInstant;
            }
            return true;
          });

    return filteredByBooking.sort((a, b) => {
      const rankA = getSellerPackageRank(a);
      const rankB = getSellerPackageRank(b);
      if (rankA !== rankB) return rankB - rankA;
      return a.distanceKm - b.distanceKm;
    });
  }, [
    buyerPos, sellers, search, radiusKm,
    filterServiceMode, filterAvailability, filterRating,
    filterPrice, filterDuration, filterBooking,
  ]);

  const handleLocationSubmit = (e) => {
    e.preventDefault();
    if (locationMode !== "area") return;
    searchLocation(locationQuery);
  };


  const handleResultClick = (result) => {
    setBuyerPos({
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
    });
    setLocationQuery(result.display_name || "");
    setLocationResults([]);
    setLocationNotFoundMsg("");
    setPincodeResults([]);
    setPincodeError("");
    setGeoError("");
  };


  const handlePincodeSearch = async () => {
    const trimmed = pincode.trim();
    if (trimmed.length !== 6 || !/^\d{6}$/.test(trimmed)) {
      setPincodeError("Enter a valid 6-digit pincode");
      return;
    }
    setPincodeLoading(true);
    setPincodeError("");
    try {
      const results = await nominatimSearch(`${trimmed}, India`);
      if (results.length > 0) {
        const r = results[0];
        setBuyerPos({ lat: parseFloat(r.lat), lng: parseFloat(r.lon) });
        setLocationQuery(r.display_name.split(",")[0] + " - " + trimmed);
        setLocationResults([]);
        setLocationNotFoundMsg("");
        setGeoError("");
      } else {
        setPincodeError("Pincode not found. Try a nearby pincode.");
      }
    } catch {
      setPincodeError("Search failed. Try again.");
    } finally {
      setPincodeLoading(false);
    }
  };

  const handleMapClick = (latlng) => {
    if (!latlng) return;
    const nextPos = { lat: latlng.lat, lng: latlng.lng };
    gpsPosRef.current = nextPos;
    setBuyerPos(nextPos);
    setLocationResults([]);
    setLocationNotFoundMsg("");
    setPincodeResults([]);
    setPincodeError("");
    setGeoError("");
  };


  const handleUseMyLocation = () => {
    if (gpsPosRef.current) {
      setBuyerPos(gpsPosRef.current);
      setLocationResults([]);
      setLocationNotFoundMsg("");
      setPincodeResults([]);
      setPincodeError("");
      setGeoError("");
      return;
    }


    if (!navigator.geolocation) return;
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const nextPos = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
        gpsPosRef.current = nextPos;
        setBuyerPos(nextPos);
        setGeoError("");
        setGeoLoading(false);
      },
      () => {
        setGeoError("Please allow location access to find nearby services");
        setGeoLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  // ============================================================
  // ====================== REDESIGNED UI =======================
  // ============================================================
  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* =================== SEARCH / FILTER / RADIUS GLASS CARD =================== */}
      <div className="qs-glass-panel relative p-5 sm:p-6">
        {/* decorative glow blobs — own overflow-hidden so they don't clip the dropdown */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
          <div className="absolute -top-24 -left-24 h-56 w-56 rounded-full bg-indigo-500/20 blur-3xl" />
          <div className="absolute -bottom-24 -right-24 h-56 w-56 rounded-full bg-fuchsia-500/10 blur-3xl" />
        </div>

        <form
          ref={locationSearchRef}
          onSubmit={handleLocationSubmit}
          className="relative z-10"
        >
          <label className="mb-2.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-200/90">
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-indigo-500/20 text-indigo-200">
              🔍
            </span>
            Search Location
          </label>

          <div className="flex flex-col gap-2.5 sm:flex-row">
            {/* Input with animated focus ring + dropdown overlay */}
            <div className="relative min-w-0 flex-1">
              <div className="qs-input-wrap group relative">
                <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-indigo-300/70 transition-colors group-focus-within:text-indigo-200">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
                </span>
                <input
                  value={locationQuery}
                  onChange={(e) => setLocationQuery(e.target.value)}
                  autoComplete="off"
                  className="qs-input peer w-full rounded-xl border border-indigo-400/20 bg-indigo-950/40 py-3 pl-10 pr-4 text-sm font-medium text-white placeholder-indigo-300/60 transition-all duration-300 focus:border-indigo-400/60 focus:bg-indigo-950/60 focus:outline-none focus:ring-4 focus:ring-indigo-500/20"
                  placeholder="Search area (e.g., Bopal, SG Highway, your office)"
                />
                <span className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-inset ring-white/5" />
              </div>
            </div>

            <button
              type="submit"
              className="qs-btn-primary inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold text-white"
            >
              {locationLoading ? (
                <>
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  Searching
                </>
              ) : (
                <>Search</>
              )}
            </button>

            <button
              type="button"
              onClick={handleUseMyLocation}
              className={`qs-btn-locate inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold text-white ${geoLoading ? "qs-pulse" : ""}`}
            >
              <span className="text-base leading-none">📍</span>
              <span className="hidden sm:inline">Use My Location</span>
              <span className="sm:hidden">My Location</span>
            </button>
          </div>

          {/* Portal dropdown — renders at body level so it never clips or overlaps siblings */}
          {locationResults.length > 0 && dropdownStyle && createPortal(
            <div
              ref={portalDropdownRef}
              style={dropdownStyle}
              className="max-h-[300px] overflow-y-auto overflow-x-hidden rounded-xl border border-indigo-400/30 bg-[#0a0918] shadow-2xl"
            >
              {locationResults.map((result) => (
                <button
                  key={`${result.place_id}-${result.lat}-${result.lon}`}
                  type="button"
                  onClick={() => handleResultClick(result)}
                  className="block w-full border-b border-indigo-400/10 px-4 py-3 text-left text-sm text-indigo-100 transition-colors hover:bg-indigo-500/15"
                >
                  <span className="flex items-start gap-3">
                    <span className="mt-0.5 inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-lg border border-indigo-400/20 bg-indigo-500/10 text-indigo-200">
                      📍
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block font-semibold text-white">
                        {result.display_name.split(",")[0]}
                      </span>
                      <span className="block truncate text-xs text-indigo-300/80">
                        {result.display_name.split(",").slice(1, 3).join(",").trim()}
                      </span>
                    </span>
                  </span>
                </button>
              ))}
            </div>,
            document.body
          )}


          {locationNotFoundMsg && (
            <p className="mt-2.5 text-sm text-indigo-200/90">
              {locationNotFoundMsg}
            </p>
          )}

          {/* ── Pincode Badge / Inline Search ── */}
          <div className="mt-2.5">
            {/**
             * Desktop: show pincode as a right-side chip aligned with the search input row.
             * Mobile: it naturally wraps under due to flex behavior in the parent.
             */}
            <div className="hidden sm:flex items-center justify-end">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-400/20 bg-indigo-950/40 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm backdrop-blur">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-indigo-500/15">📮</span>
                <input
                  className="w-24 bg-transparent text-center text-sm font-extrabold tracking-widest outline-none"
                  inputMode="numeric"
                  maxLength={6}
                  value={pincode}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "").slice(0, 6);
                    setPincode(val);
                    setPincodeError("");
                  }}
                  onKeyDown={(e) => e.key === "Enter" && handlePincodeSearch()}
                  placeholder="389320"
                />
              </span>

              <button
                type="button"
                onClick={handlePincodeSearch}
                disabled={pincode.length !== 6 || pincodeLoading}
                className="ml-3 inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white transition-all hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {pincodeLoading ? (
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                ) : (
                  "Go →"
                )}
              </button>
            </div>

            {/** Mobile + fallback row */}
            <div className="sm:hidden">
              <div className="flex items-center gap-2">
                <div className="relative flex-1 min-w-0">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-indigo-300/70 text-sm">
                    📮
                  </span>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={pincode}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "").slice(0, 6);
                      setPincode(val);
                      setPincodeError("");
                    }}
                    onKeyDown={(e) => e.key === "Enter" && handlePincodeSearch()}
                    placeholder="Enter 6-digit pincode"
                    className="w-full rounded-xl border border-indigo-400/20 bg-indigo-950/40 py-2.5 pl-9 pr-4 text-sm font-medium text-white placeholder-indigo-300/50 focus:border-indigo-400/60 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
                <button
                  type="button"
                  onClick={handlePincodeSearch}
                  disabled={pincode.length !== 6 || pincodeLoading}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white transition-all hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {pincodeLoading ? (
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  ) : (
                    "Go →"
                  )}
                </button>
              </div>
            </div>

            {pincodeError && (
              <p className="mt-1.5 text-xs font-medium text-red-300">⚠ {pincodeError}</p>
            )}
          </div>
        </form>

        {/* ============ CATEGORY CHIPS ============ */}
        <div className="relative z-10 mt-5">
          <div className="qs-chip-row flex gap-2 overflow-x-auto pb-1.5 scrollbar-none snap-x snap-mandatory">
            {SERVICE_FILTERS.map((serviceFilter) => {
              const active =
                serviceFilter === "All" ? !search : search === serviceFilter;
              return (
                <button
                  key={serviceFilter}
                  type="button"
                  onClick={() =>
                    setSearch(serviceFilter === "All" ? "" : serviceFilter)
                  }
                  className={`qs-chip snap-start ${active ? "qs-chip-active" : ""}`}
                >
                  {serviceFilter}
                </button>
              );
            })}
          </div>
        </div>

        {/* ============ RADIUS SLIDER ============ */}
        <div className="relative z-10 mt-5 rounded-xl border border-indigo-400/15 bg-indigo-950/30 p-3.5">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-200/90">
              <span>📏</span> Search Radius
            </span>
            <span className="qs-radius-badge">{radiusKm} km</span>
          </div>
          <div className="mt-3">
            <input
              type="range"
              min={1}
              max={20}
              step={1}
              value={radiusKm}
              onChange={(e) => setRadiusKm(parseInt(e.target.value || "5", 10))}
              className="qs-range w-full"
              style={{
                background: `linear-gradient(to right, #818cf8 0%, #6366f1 ${((radiusKm - 1) / 19) * 100}%, rgba(99,102,241,0.18) ${((radiusKm - 1) / 19) * 100}%, rgba(99,102,241,0.18) 100%)`,
              }}
            />
            <div className="mt-1 flex justify-between text-[10px] font-medium text-indigo-300/70">
              <span>1 km</span>
              <span>10 km</span>
              <span>20 km</span>
            </div>
          </div>
        </div>

        {/* ============ REFINE RESULTS FILTER PANEL ============ */}
        <div className="relative z-10 mt-4">
          {/* Toggle button */}
          <button
            type="button"
            onClick={() => setFiltersOpen((prev) => !prev)}
            className="inline-flex items-center gap-2 rounded-xl border border-indigo-400/25 bg-indigo-950/40 px-4 py-2 text-sm font-semibold text-indigo-200 transition-all hover:border-indigo-400/50 hover:bg-indigo-950/60"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/>
            </svg>
            Refine Results
            {activeFilterCount > 0 && (
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-indigo-500 text-[11px] font-bold text-white">
                {activeFilterCount}
              </span>
            )}
            <span className={`ml-auto transition-transform duration-200 ${filtersOpen ? "rotate-180" : ""}`}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 9l6 6 6-6"/></svg>
            </span>
          </button>

          {/* Collapsible panel */}
          {filtersOpen && (
            <div className="mt-2 rounded-xl border border-indigo-400/20 bg-indigo-950/30 p-4 space-y-4">

              {/* Price Range */}
              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-wider text-indigo-300/80">
                  💰 Price Range
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {PRICE_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setFilterPrice(opt.value)}
                      className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all ${
                        filterPrice === opt.value
                          ? "border-indigo-400/60 bg-indigo-500 text-white shadow-lg shadow-indigo-500/25"
                          : "border-indigo-400/20 bg-white/5 text-indigo-200 hover:border-indigo-400/40 hover:bg-white/10"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Duration */}
              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-wider text-indigo-300/80">
                  ⏱ Time to Complete
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {DURATION_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setFilterDuration(opt.value)}
                      className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all ${
                        filterDuration === opt.value
                          ? "border-indigo-400/60 bg-indigo-500 text-white shadow-lg shadow-indigo-500/25"
                          : "border-indigo-400/20 bg-white/5 text-indigo-200 hover:border-indigo-400/40 hover:bg-white/10"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Booking Type */}
              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-wider text-indigo-300/80">
                  📅 Booking Type
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {BOOKING_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setFilterBooking(opt.value)}
                      className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all ${
                        filterBooking === opt.value
                          ? opt.value === "instant"
                            ? "border-emerald-400/60 bg-emerald-500 text-white shadow-lg shadow-emerald-500/25"
                            : "border-indigo-400/60 bg-indigo-500 text-white shadow-lg shadow-indigo-500/25"
                          : "border-indigo-400/20 bg-white/5 text-indigo-200 hover:border-indigo-400/40 hover:bg-white/10"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Clear all */}
              {activeFilterCount > 0 && (
                <div className="border-t border-indigo-400/15 pt-3">
                  <button
                    type="button"
                    onClick={clearAllFilters}
                    className="text-xs font-semibold text-red-300 hover:text-red-200 transition-colors"
                  >
                    ✕ Clear All Filters
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {buyerPos && (
          <div className="relative z-10 mt-4 flex flex-wrap items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2.5 py-1 font-semibold text-emerald-200">
              <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
              Live
            </span>
            <span className="text-indigo-200/90">
              <strong className="font-bold text-white">{nearby.length}</strong>{" "}
              provider{nearby.length !== 1 ? "s" : ""} within{" "}
              <strong className="font-bold text-white">{radiusKm}km</strong>
            </span>
            {search && (
              <span className="rounded-md bg-indigo-500/15 px-2 py-0.5 text-indigo-200">
                for "{search}"
              </span>
            )}
            {activeFilterCount > 0 && (
              <span className="rounded-md bg-indigo-500/20 px-2 py-0.5 font-semibold text-indigo-300">
                · {activeFilterCount} filter{activeFilterCount > 1 ? "s" : ""} active
              </span>
            )}
          </div>
        )}

        {geoError && (
          <p className="relative z-10 mt-3 rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            ⚠ {geoError}
          </p>
        )}
      </div>

      {/* =================== MAP + PROVIDER LIST =================== */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
        {/* ============ MAP ============ */}
        <div className="w-full lg:w-[58%]">
          <div
            className="qs-map-frame relative isolate overflow-hidden rounded-3xl"
            style={{ height: 520 }}
          >
            {/* Top-left: providers count */}
            <div className="pointer-events-none absolute left-3 top-3 z-[600]">
              <div className="qs-map-pill flex items-center gap-2">
                <span className="text-base">🛠️</span>
                <div className="leading-tight">
                  <div className="text-[10px] uppercase tracking-wider text-indigo-200/80">
                    Providers
                  </div>
                  <div className="text-sm font-bold text-white">
                    {nearby.length} found
                  </div>
                </div>
              </div>
            </div>

            {/* Top-right: live radius badge */}
            <div className="pointer-events-none absolute right-3 top-3 z-[600]">
              <div className="qs-map-pill flex items-center gap-2">
                <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.9)]" />
                <div className="leading-tight">
                  <div className="text-[10px] uppercase tracking-wider text-indigo-200/80">
                    Live Radius
                  </div>
                  <div className="text-sm font-bold text-white">
                    {radiusKm} km
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom: user location badge */}
            {buyerPos && (
              <div className="pointer-events-none absolute bottom-3 left-1/2 z-[600] -translate-x-1/2">
                <div className="qs-map-pill flex items-center gap-2">
                  <span className="text-base">📍</span>
                  <span className="text-xs font-semibold text-indigo-100">
                    You are here
                  </span>
                  <span className="text-[10px] text-indigo-300/80">
                    {buyerPos.lat.toFixed(3)}, {buyerPos.lng.toFixed(3)}
                  </span>
                </div>
              </div>
            )}

            {/* Loading overlay */}
            {!buyerPos && (
              <div className="absolute inset-0 z-[500] flex flex-col items-center justify-center bg-indigo-950/80 backdrop-blur-sm">
                <div className="relative h-12 w-12">
                  <div className="absolute inset-0 animate-ping rounded-full bg-indigo-500/40" />
                  <div className="absolute inset-2 rounded-full bg-indigo-500 shadow-[0_0_30px_rgba(99,102,241,0.8)]" />
                </div>
                <p className="mt-4 text-sm font-semibold text-indigo-200">
                  Locating you on the map…
                </p>
              </div>
            )}

            <MapContainer
              center={
                buyerPos ? [buyerPos.lat, buyerPos.lng] : [20.5937, 78.9629]
              }
              zoom={buyerPos ? 14 : 5}
              style={{ height: "100%", width: "100%" }}
              scrollWheelZoom
            >
              <MapController
                center={buyerPos ? [buyerPos.lat, buyerPos.lng] : null}
              />
              <MapClickHandler onMapClick={handleMapClick} />

              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {buyerPos && (
                <>
                  <Circle
                    center={[buyerPos.lat, buyerPos.lng]}
                    radius={radiusKm * 1000}
                    pathOptions={{
                      color: "#818cf8",
                      weight: 2,
                      fillColor: "#6366f1",
                      fillOpacity: 0.12,
                    }}
                  />

                  <Marker
                    position={[buyerPos.lat, buyerPos.lng]}
                    icon={L.divIcon({
                      className: "blue-buyer-icon",
                      html:
                        "<svg xmlns='http://www.w3.org/2000/svg' width='22' height='22' viewBox='0 0 24 24' fill='none'>" +
                        "<path d='M12 21s7-5.3 7-12a7 7 0 1 0-14 0c0 6.7 7 12 7 12z' fill='#6366f1' stroke='#4338ca' stroke-width='1.5'/>" +
                        "<circle cx='12' cy='9' r='3.2' fill='#a5b4fc' stroke='#4338ca' stroke-width='1.2'/>" +
                        "</svg>",
                      iconSize: [22, 22],
                      iconAnchor: [11, 22],
                    })}
                  />
                </>
              )}

              {buyerPos && nearby.length > 0 && (
                <MarkerClusterGroup chunkedLoading>
                  {nearby.map((seller) => {
                    const packageRank = getSellerPackageRank(seller);

                    if (packageRank > 0 && !isWalletSufficient()) {
                      return null;
                    }

                    return (
                      <Marker
                        key={seller.id}
                        position={[seller.lat, seller.lng]}
                        icon={getSellerPinIcon(seller)}
                        eventHandlers={{
                          click: () => setSelectedSellerId(seller.id),
                        }}
                      >
                        <Popup minWidth={240}>
                          <div style={{ fontSize: 13, lineHeight: 1.4, padding: 4 }}>
                            <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 4 }}>
                              🔧 {seller.name}
                            </div>
                            <div style={{ fontSize: 12, color: "#4b5563", marginBottom: 2 }}>
                              🛠 {seller.service}
                            </div>
                            <div style={{ fontSize: 12, color: "#4b5563", marginBottom: 2 }}>
                              {seller?.serviceMode === "offline" ? `📍 ${seller.address}` : "🌐 Works Across India"}
                            </div>
                            <div style={{ fontSize: 12, color: "#16a34a", fontWeight: 700, marginBottom: 8 }}>
                              {seller?.serviceMode === "online" || seller?.serviceMode === "both"
                                ? "⚡ Available Online"
                                : `📏 ${Number(seller.distanceKm || 0).toFixed(1)} km away`}
                            </div>

                            {packageRank > 0 ? (
                              <div style={{ fontSize: 12, color: "#16a34a", marginBottom: 6 }}>
                                📞 {seller.phone}
                              </div>
                            ) : (
                              <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 6, fontStyle: "italic" }}>
                                📞 Contact available on booking
                              </div>
                            )}

                            <a
                              href={`/seller/${seller.id}`}
                              style={{
                                display: "block",
                                width: "100%",
                                padding: "8px 0",
                                borderRadius: 8,
                                background: "linear-gradient(135deg, #6366f1, #4f46e5)",
                                color: "#fff",
                                fontWeight: 700,
                                fontSize: 12,
                                border: "none",
                                cursor: "pointer",
                                textAlign: "center",
                                textDecoration: "none",
                                boxShadow: "0 4px 14px rgba(99,102,241,0.45)",
                              }}
                            >
                              View Profile &amp; Services →
                            </a>
                          </div>
                        </Popup>
                      </Marker>
                    );
                  })}
                </MarkerClusterGroup>
              )}
            </MapContainer>
          </div>
        </div>

        {/* ============ PROVIDER LIST ============ */}
        <div className="w-full lg:w-[42%]">
          <div
            className="qs-list flex gap-3 overflow-x-auto pb-2 pr-1 snap-x snap-mandatory lg:block lg:h-[520px] lg:space-y-3 lg:overflow-y-auto lg:overflow-x-hidden lg:pb-0 lg:snap-none"
          >
            {nearby.length === 0 && buyerPos && (
              <div className="qs-glass-panel w-full py-14 text-center text-indigo-300">
                <div className="text-5xl">🔍</div>
                <p className="mt-3 text-base font-semibold text-white">
                  {activeFilterCount > 0
                    ? "No providers match your filters"
                    : "No providers found"}
                </p>
                <p className="mt-1 text-xs text-indigo-300/80">
                  {activeFilterCount > 0
                    ? "Try adjusting your price, duration, or booking type filters."
                    : "Try increasing radius or changing service"}
                </p>
                {activeFilterCount > 0 && (
                  <button
                    type="button"
                    onClick={clearAllFilters}
                    className="mt-4 rounded-xl border border-indigo-400/30 bg-indigo-500/15 px-5 py-2 text-sm font-semibold text-indigo-200 transition hover:bg-indigo-500/25"
                  >
                    ✕ Clear All Filters
                  </button>
                )}
              </div>
            )}

            {nearby.map((seller, idx) => {
              const packageRank = getSellerPackageRank(seller);

              if (packageRank > 0 && !isWalletSufficient()) {
                return null;
              }

              const isSelected = selectedSellerId === seller.id;
              const distanceLabel = Number(seller.distanceKm || 0).toFixed(1);

              return (
                <div
                  key={seller.id}
                  id={`seller-card-${seller.id}`}
                  onClick={() => handlePremiumSellerClick(seller)}
                  style={{ animationDelay: `${Math.min(idx * 50, 400)}ms` }}
                  className={`qs-card group w-[290px] flex-shrink-0 cursor-pointer snap-start lg:w-auto ${isSelected ? "qs-card-active" : ""}`}
                >
                  {/* Header: avatar + name + distance */}
                  <div className="flex items-center gap-3">
                    <div className="qs-avatar-ring">
                      <div className="qs-avatar">
                        {seller.name?.[0]?.toUpperCase() || "?"}
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <h4 className="truncate text-sm font-bold text-white">
                          {seller.name}
                        </h4>
                        {packageRank > 0 && (
                          <span className="qs-verified-tick" title="Verified">
                            ✓
                          </span>
                        )}
                      </div>
                      <div className="truncate text-xs font-medium text-indigo-300/90">
                        {seller.service}
                      </div>
                    </div>
                    <div className="qs-distance-badge">
                      <span className="text-[10px] opacity-80">
                        {seller?.serviceMode === "online" || seller?.serviceMode === "both" ? "🌐" : "📍"}
                      </span>
                      <span>
                        {seller?.serviceMode === "online" || seller?.serviceMode === "both"
                          ? "Works Across India"
                          : `${distanceLabel}km away`}
                      </span>
                    </div>
                  </div>

                  {/* Address */}
                  <div className="mt-2.5 flex items-start gap-1.5 text-xs text-indigo-300/80">
                    <span className="mt-0.5">📌</span>
                    <span className="truncate">{seller.address}</span>
                  </div>

                  {/* Badge row */}
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {/* Service Mode badges */}
                    {seller?.serviceMode === "online" && (
                      <span className="qs-tag qs-tag-indigo">🌐 Online Service</span>
                    )}
                    {seller?.serviceMode === "offline" && (
                      <span className="qs-tag qs-tag-emerald">📍 Offline Service</span>
                    )}
                    {seller?.serviceMode === "both" && (
                      <span className="qs-tag qs-tag-amber">🔄 Online + Offline</span>
                    )}

                    {/* Instant Service */}
                    {seller?.instantService && (
                      <span className="qs-instant-badge" title="⚡ Instant Service">
                        <span className="qs-instant-badge-dot" />
                        ⚡ Instant Service
                      </span>
                    )}

                    {/* Rating badge */}
                    <span className="qs-tag qs-tag-indigo">
                      ⭐ {Number(seller?.rating || 0).toFixed(1)}
                      <span className="opacity-80"> ({Number(seller?.reviews || 0)} Reviews)</span>
                    </span>

                    {/* Top Rated */}
                    {seller?.isTopRated && (
                      <span className="qs-tag qs-tag-gold">⭐ Top Rated</span>
                    )}

                    {/* Verified (keep premium tick + add text badge) */}
                    {packageRank > 0 && <span className="qs-tag qs-tag-green">✓ Verified</span>}

                    {packageRank >= 3 && (
                      <span className="qs-tag qs-tag-gold">⭐ Gold</span>
                    )}
                    {packageRank === 2 && (
                      <span className="qs-tag qs-tag-emerald">⭐ Featured</span>
                    )}
                    {packageRank === 1 && (
                      <span className="qs-tag qs-tag-indigo">⭐ Top</span>
                    )}
                    {packageRank >= 2 && (
                      <span className="qs-tag qs-tag-amber">⚡ Fast Response</span>
                    )}
                    <span className="qs-tag qs-tag-green">
                      <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                      Available
                    </span>
                  </div>

                  {/* Contact row */}
                  <div className="mt-3">
                    {packageRank > 0 ? (
                      <div className="text-xs">
                        {revealedContacts.has(seller.id) ? (
                          <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-400/30 bg-emerald-500/10 px-2.5 py-1 font-semibold text-emerald-200">
                            📞 {seller.phone}
                          </span>
                        ) : (
                          <button
                            type="button"
                            className="qs-contact-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();

                              if (viewedContacts.current.has(seller.id)) {
                                setRevealedContacts((prev) => {
                                  const next = new Set(prev);
                                  next.add(seller.id);
                                  return next;
                                });
                                return;
                              }

                              if (packageRank <= 0) return;

                              if (
                                Number(
                                  localStorage.getItem("sellerWallet")
                                    ? JSON.parse(
                                        localStorage.getItem("sellerWallet"),
                                      ).balance
                                    : 0,
                                ) <= 0
                              ) {
                                setRevealedContacts((prev) => {
                                  const next = new Set(prev);
                                  next.add(seller.id);
                                  return next;
                                });
                                viewedContacts.current.add(seller.id);
                                return;
                              }

                              viewedContacts.current.add(seller.id);
                              deductContactView(seller.id, seller.service);
                              setRevealedContacts((prev) => {
                                const next = new Set(prev);
                                next.add(seller.id);
                                return next;
                              });
                            }}
                          >
                            📞 View Contact
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="text-xs text-indigo-300/70 italic">
                        📞 Contact available on booking
                      </div>
                    )}
                  </div>

                  {/* CTA */}
                  <a
                    href={`/seller/${seller.id}`}
                    onClick={(e) => handleViewDetailsClick(seller, e)}
                    className="qs-cta mt-3 block w-full rounded-xl py-2.5 text-center text-xs font-bold text-white"
                  >
                    View Details
                    <span className="ml-1 inline-block transition-transform duration-200 group-hover:translate-x-1">
                      →
                    </span>
                  </a>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}