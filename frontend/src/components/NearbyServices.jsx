// QuickSeva - Map Performance Feature
import { Component, useEffect, useMemo, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { API_BASE_URL } from "../config/api";

import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/leaflet.markercluster";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import { getUserLocation } from "../utils/getLocation";
import {
  Sparkles,
  Zap,
  Droplets,
  Hammer,
  Snowflake,
  Bug,
  Palette,
  Tv,
  Wrench,
  Crosshair,
  X,
  ArrowUpDown,
  Clock3,
  BadgeCheck,
  Star,
} from "lucide-react";

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
  Tooltip,
  useMap,
  useMapEvents,
} from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-markercluster";
import { ALL_SERVICE_SUGGESTIONS } from "../data/servicesData";
import NoProvidersLeadForm from "./NoProvidersLeadForm";

// Fix Leaflet marker icon URLs in this map component
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const GREEN_PIN_HTML =
  "<svg xmlns='http://www.w3.org/2000/svg' width='30' height='30' viewBox='0 0 24 24' fill='none' style='filter: drop-shadow(0 4px 6px rgba(0,0,0,0.15));'>" +
  "<path d='M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z' fill='#10b981' stroke='#047857' stroke-width='1.5'/>" +
  "<circle cx='12' cy='9' r='3' fill='#ffffff'/>" +
  "</svg>";

const GREEN_ICON = L.divIcon({
  className: "service-pin-green",
  html: GREEN_PIN_HTML,
  iconSize: [30, 30],
  iconAnchor: [15, 30],
  popupAnchor: [0, -30],
  tooltipAnchor: [0, -30],
});

const PREMIUM_PIN_HTML =
  "<svg xmlns='http://www.w3.org/2000/svg' width='34' height='34' viewBox='0 0 24 24' fill='none' style='filter: drop-shadow(0 4px 6px rgba(0,0,0,0.15));'>" +
  "<path d='M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z' fill='#6366f1' stroke='#4338ca' stroke-width='1.5'/>" +
  "<polygon points='12,6 13.5,9 16.5,9.5 14,11.5 15,14.5 12,13 9,14.5 10,11.5 7.5,9.5 10.5,9' fill='#ffffff'/>" +
  "</svg>";

const PREMIUM_ICON = L.divIcon({
  className: "service-pin-premium",
  html: PREMIUM_PIN_HTML,
  iconSize: [34, 34],
  iconAnchor: [17, 34],
  popupAnchor: [0, -34],
  tooltipAnchor: [0, -34],
});

const GOLD_PIN_HTML =
  "<svg xmlns='http://www.w3.org/2000/svg' width='38' height='38' viewBox='0 0 24 24' fill='none' style='filter: drop-shadow(0 4px 6px rgba(0,0,0,0.25));'>" +
  "<path d='M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z' fill='#f59e0b' stroke='#b45309' stroke-width='1.5'/>" +
  "<polygon points='12,5.5 13.8,9.2 17.8,9.8 14.8,12.6 15.5,16.6 12,14.7 8.5,16.6 9.2,12.6 6.2,9.8 10.2,9.2' fill='#ffffff'/>" +
  "</svg>";

const GOLD_ICON = L.divIcon({
  className: "service-pin-gold",
  html: GOLD_PIN_HTML,
  iconSize: [38, 38],
  iconAnchor: [19, 38],
  popupAnchor: [0, -38],
  tooltipAnchor: [0, -38],
});

const USER_PIN_HTML =
  "<div class='relative flex items-center justify-center'>" +
  "<span class='absolute inline-flex h-6 w-6 animate-ping rounded-full bg-indigo-400 opacity-75'></span>" +
  "<div class='relative flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 border-2 border-white shadow-[0_0_10px_rgba(99,102,241,0.8)]'>" +
  "<div class='h-1.5 w-1.5 rounded-full bg-white'></div>" +
  "</div>" +
  "</div>";

const USER_ICON = L.divIcon({
  className: "user-location-pin",
  html: USER_PIN_HTML,
  iconSize: [24, 24],
});

const normalizeServiceName = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");

const sellerMatchesCategory = (seller, selectedCategory) => {
  const normalized = normalizeServiceName(selectedCategory);
  if (!normalized) return true;

  return [
    seller?.category,
    seller?.categoryName,
    seller?.service,
    seller?.serviceName,
  ].some((value) => normalizeServiceName(value) === normalized);
};

class MapErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error("QuickSeva map crashed:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-full min-h-[320px] items-center justify-center rounded-3xl border border-red-400/25 bg-red-500/10 p-6 text-center">
          <div>
            <p className="text-sm font-bold text-red-100">Map could not load safely.</p>
            <p className="mt-1 text-xs text-red-200/75">
              The provider list and lead form are still available.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function getServiceIcon(name) {
  const lowered = name.toLowerCase();
  if (lowered.includes("clean")) return Sparkles;
  if (lowered.includes("ac") || lowered.includes("cool")) return Snowflake;
  if (lowered.includes("electric") || lowered.includes("fan") || lowered.includes("wiring") || lowered.includes("switch") || lowered.includes("mcb") || lowered.includes("inverter")) return Zap;
  if (lowered.includes("plumb") || lowered.includes("leak") || lowered.includes("toilet") || lowered.includes("clog") || lowered.includes("sink") || lowered.includes("drain") || lowered.includes("water") || lowered.includes("faucet")) return Droplets;
  if (lowered.includes("pest") || lowered.includes("cockroach") || lowered.includes("bug") || lowered.includes("rodent") || lowered.includes("termite")) return Bug;
  if (lowered.includes("carpen") || lowered.includes("door") || lowered.includes("drawer") || lowered.includes("furnit") || lowered.includes("wood") || lowered.includes("shelf")) return Hammer;
  if (lowered.includes("appliance") || lowered.includes("wash") || lowered.includes("refrig") || lowered.includes("micro") || lowered.includes("ro ")) return Tv;
  if (lowered.includes("paint")) return Palette;
  return Wrench;
}

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

const SERVICE_DISPLAY = {
  All: { label: "🌐 All Services / सभी", icon: "🌐" },
  Cleaning: { label: "🧹 Cleaning / सफ़ाई", icon: "🧹" },
  Electrical: { label: "⚡ Electrical / बिजली काम", icon: "⚡" },
  Plumbing: { label: "🚰 Plumbing / नलसाजी", icon: "🚰" },
  Carpentry: { label: "🪚 Carpentry / बढ़ई", icon: "🪚" },
  "AC Repair": { label: "❄️ AC Repair / एसी काम", icon: "❄️" },
  "Pest Control": { label: "🐜 Pest Control / कीटनाशक", icon: "🐜" },
  "Home Painting": { label: "🎨 Painting / पुताई", icon: "🎨" },
  "Appliance Repair": { label: "🔌 Appliance / उपकरण", icon: "🔌" },
};

function getDistanceGuide(distKm) {
  if (typeof distKm !== "number") return "";
  if (distKm < 1) {
    return `🚶 ~${Math.round(distKm * 12) || 5} min walk / पैदल रास्ता`;
  }
  if (distKm <= 5) {
    return `🏍️ ~${Math.round(distKm * 2) + 2} min ride / बाइक से ५-१० मिनट`;
  }
  return `🚗 ~${Math.round(distKm * 2.5) + 3} min drive / वाहन से १५+ मिनट`;
}

function getRadiusVisualGuide(radius) {
  if (radius <= 2) {
    return {
      icon: "🚶",
      text: "Very Close / बहुत पास (Walking distance / पैदल दूरी)",
    };
  }
  if (radius <= 5) {
    return {
      icon: "🏍️",
      text: "Nearby / पास में (Quick ride / बाइक से 5-10 मिनट)",
    };
  }
  if (radius <= 10) {
    return {
      icon: "🚗",
      text: "Medium / थोड़ा दूर (15-20 min ride / गाड़ी से 15-20 मिनट)",
    };
  }
  return {
    icon: "🚛",
    text: "Far away / काफ़ी दूर (Long drive / 20 मिनट से ज़्यादा)",
  };
}

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

function formatDistance(distKm) {
  if (typeof distKm !== "number") return "";
  if (distKm < 1) {
    return `${Math.round(distKm * 1000)}m away`;
  }
  return `${distKm.toFixed(1)} km away`;
}

const getImageUrl = (url) => {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  return `${API_BASE_URL.replace("/api", "")}${url}`;
};

function MapController({ center, flyTrigger }) {
  const map = useMap();
  const lastTriggerRef = useRef(0);

  useEffect(() => {
    if (!center) return;
    if (flyTrigger > lastTriggerRef.current) {
      const currentZoom = map.getZoom();
      const nextZoom = currentZoom < 13 ? 14 : currentZoom;
      map.flyTo(center, nextZoom, { animate: true, duration: 1.2 });
      lastTriggerRef.current = flyTrigger;
    }
  }, [center, flyTrigger, map]);

  return null;
}

function MapClickHandler({ onMapClick }) {
  useMapEvents({
    click: (e) => onMapClick?.(e.latlng),
  });
  return null;
}

// QuickSeva - Map Performance Feature
function MapEventTracker({ mapRef, onMapReady, fetchSellersInView, onMapAreaChanged }) {
  const map = useMap();
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!map) return;
    mapRef.current = map;
    if (!initializedRef.current) {
      initializedRef.current = true;
      onMapReady(map);
    }

    const syncMapArea = () => {
      const center = map.getCenter();
      onMapAreaChanged?.({ lat: center.lat, lng: center.lng });
      fetchSellersInView(map);
    };

    map.on("moveend", syncMapArea);
    map.on("zoomend", syncMapArea);

    return () => {
      map.off("moveend", syncMapArea);
      map.off("zoomend", syncMapArea);
      if (mapRef.current === map) {
        mapRef.current = null;
      }
    };
  }, [map, mapRef, onMapReady, fetchSellersInView, onMapAreaChanged]);

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
  )}&lon=${encodeURIComponent(lng)}&format=json&email=support@quickseva.com`;
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
  const [address, setAddress] = useState(() => {
    try {
      return sessionStorage.getItem("qs_cached_address") || "";
    } catch {
      return "";
    }
  });
  const [loading, setLoading] = useState(() => {
    try {
      return !sessionStorage.getItem("qs_cached_address");
    } catch {
      return true;
    }
  });

  useEffect(() => {
    let cancelled = false;

    try {
      const cached = sessionStorage.getItem("qs_cached_address");
      if (cached) {
        setAddress(cached);
        setLoading(false);
        return;
      }
    } catch { }

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
          if (!cancelled) {
            setAddress(nextAddress || "");
            try {
              sessionStorage.setItem("qs_cached_address", nextAddress || "");
            } catch { }
          }
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
  const [mapFlyTrigger, setMapFlyTrigger] = useState(0);
  const [geoError, setGeoError] = useState("");
  const [showMap, setShowMap] = useState(true);
  const [search, setSearch] = useState(initialSearch);
  const [locationQuery, setLocationQuery] = useState("");
  const [showServiceDrop, setShowServiceDrop] = useState(false);
  const serviceDropRef = useRef(null);

  const filteredServiceSuggestions = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return ["Cleaning", "Electrical", "Plumbing", "Carpentry", "AC Repair", "Appliance Repair"];
    }
    return ALL_SERVICE_SUGGESTIONS.filter((s) =>
      s.toLowerCase().includes(query)
    ).slice(0, 8);
  }, [search]);

  const handleServiceSelect = (item) => {
    setSearch(item);
    setShowServiceDrop(false);
  };

  useEffect(() => {
    const handleMouseDown = (e) => {
      if (serviceDropRef.current && !serviceDropRef.current.contains(e.target)) {
        setShowServiceDrop(false);
      }
    };
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, []);

  const { address: detectedAddress } = useNearbyLocation();

  useEffect(() => {
    if (detectedAddress && !locationQuery) {
      setLocationQuery(detectedAddress);
    }
  }, [detectedAddress]);

  const [locationResults, setLocationResults] = useState([]);
  const [locationLoading, setLocationLoading] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const [mapToggleLocked, setMapToggleLocked] = useState(false);

  // QuickSeva - Map Performance Feature
  const mapRef = useRef(null);
  const [mapInitialized, setMapInitialized] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const toast = useMemo(() => ({
    info: (msg) => {
      setToastMessage(msg);
      setTimeout(() => setToastMessage(null), 4000);
    }
  }), []);

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
  const [quickFilters, setQuickFilters] = useState({
    nearest: false,
    openNow: false,
    verified: false,
    rating45: false,
  });

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
    const minMatch = t.match(/(\d+)\s*m(?!o)/); // 'm' but not 'mo' (month)
    const hours = hourMatch ? Number(hourMatch[1]) : 0;
    const mins = minMatch ? Number(minMatch[1]) : 0;
    if (!hourMatch && !minMatch) {
      const range = t.match(/(\d+)\s*-\s*(\d+)/);
      if (range)
        return Math.round(((Number(range[1]) + Number(range[2])) * 60) / 2);
      const single = t.match(/(\d+)\s*hours?/);
      if (single) return Number(single[1]) * 60;
      const bare = t.match(/^(\d+)$/);
      if (bare) return Number(bare[1]) * 60;
      return null;
    }
    return hours * 60 + mins;
  };

  const getDurationBucket = (str) => {
    const mins = parseDurationToMinutes(str);
    if (mins === null) return null;
    if (mins < 60) return "under1";
    if (mins <= 120) return "1-2";
    if (mins <= 240) return "2-4";
    return "4+";
  };

  const activeFilterCount =
    (filterPrice !== "all" ? 1 : 0) +
    (filterDuration !== "all" ? 1 : 0) +
    (filterBooking !== "all" ? 1 : 0) +
    Object.values(quickFilters).filter(Boolean).length;

  const clearAllFilters = () => {
    setFilterPrice("all");
    setFilterDuration("all");
    setFilterBooking("all");
    setQuickFilters({
      nearest: false,
      openNow: false,
      verified: false,
      rating45: false,
    });
  };

  const toggleQuickFilter = (key) => {
    setQuickFilters((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const quickFilterItems = [
    { key: "nearest", label: "Sort: Nearest", Icon: ArrowUpDown },
    { key: "openNow", label: "Open now", Icon: Clock3 },
    { key: "verified", label: "Verified", Icon: BadgeCheck },
    { key: "rating45", label: "4.5+", Icon: Star },
  ];

  const clickedSellers = useRef(new Set());

  const [radiusKm, setRadiusKm] = useState(5);

  const [locationNotFoundMsg, setLocationNotFoundMsg] = useState("");

  const deductedSellers = useRef(new Set());

  const handlePremiumSellerClick = (seller) => {
    const sId = seller?.id || seller?.sellerId;
    if (sId) setSelectedSellerId(sId);
  };

  const viewedContacts = useRef(new Set());
  const [revealedContacts, setRevealedContacts] = useState(() => new Set());

  const navigateToSeller = (seller) => {
    const sId = seller?.id || seller?.sellerId;
    window.location.href = `/seller/${sId}`;
  };

  const handleViewDetailsClick = (seller, e) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    const sId = seller?.id || seller?.sellerId;
    if (sId) {
      setSelectedSellerId(sId);
    }
    navigateToSeller(seller);
  };

  const gpsPosRef = useRef(null);
  const locationSearchRef = useRef(null);
  const portalDropdownRef = useRef(null);
  const searchCache = useRef({});
  const suppressNextLocationSearchRef = useRef(false);

  const nominatimSearch = async (q) => {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
        q,
      )}&format=json&limit=5&countrycodes=in&email=support@quickseva.com`,
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
    if (trimmed.length < 3) return [];

    const cacheKey = trimmed.toLowerCase();
    if (searchCache.current[cacheKey]) {
      return searchCache.current[cacheKey];
    }

    const results = await nominatimSearch(trimmed);
    searchCache.current[cacheKey] = results;
    return results;
  };

  const searchLocation = async (query) => {
    const trimmed = query.trim();
    if (trimmed.length < 3) {
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
      setLocationNotFoundMsg("");
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
    const handleMouseDown = (e) => {
      if (!locationSearchRef.current) return;
      // Ignore clicks inside the search form
      if (locationSearchRef.current.contains(e.target)) return;
      // Ignore clicks inside the portal dropdown (it lives outside the form in the DOM)
      if (
        portalDropdownRef.current &&
        portalDropdownRef.current.contains(e.target)
      )
        return;
      setLocationResults([]);
    };

    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, []);

  // Position the portal dropdown and close it when user scrolls
  useEffect(() => {
    if (locationResults.length === 0) {
      setDropdownStyle(null);
      return;
    }

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
        zIndex: 1000,
      });
    };

    // Close dropdown when page scrolls — prevents floating above navbar
    const closeOnScroll = () => setLocationResults([]);

    updatePos();
    window.addEventListener("resize", updatePos);
    window.addEventListener("scroll", closeOnScroll, {
      passive: true,
      capture: true,
    });

    return () => {
      window.removeEventListener("resize", updatePos);
      window.removeEventListener("scroll", closeOnScroll, { capture: true });
    };
  }, [locationResults.length]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (locationMode !== "area") return;
      if (suppressNextLocationSearchRef.current) {
        suppressNextLocationSearchRef.current = false;
        return;
      }
      if (locationQuery.trim().length >= 3) {
        searchLocation(locationQuery);
      } else {
        setLocationResults([]);
        setLocationNotFoundMsg("");
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [locationQuery, locationMode]);

  useEffect(() => {
    if (!selectedSellerId) return;
    const el = document.getElementById(`seller-card-${selectedSellerId}`);
    el?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [selectedSellerId]);

  const [sellers, setSellers] = useState([]);
  const [apiLoading, setApiLoading] = useState(false);
  const [apiError, setApiError] = useState("");

  useEffect(() => {
    try {
      localStorage.removeItem("sellers");
    } catch (e) { }
  }, []);

  // QuickSeva - Map Performance Feature
  const fetchSellersInView = useCallback(async (map) => {
    setApiLoading(true);
    setApiError("");
    try {
      const bounds = map.getBounds();
      const minLat = bounds.getSouthWest().lat;
      const maxLat = bounds.getNorthEast().lat;
      const minLng = bounds.getSouthWest().lng;
      const maxLng = bounds.getNorthEast().lng;

      const res = await fetch(
        `${API_BASE_URL}/sellers/in-view?minLat=${minLat}&maxLat=${maxLat}&minLng=${minLng}&maxLng=${maxLng}`
      );
      if (!res.ok) throw new Error("Failed to fetch sellers in view");
      const data = await res.json();
      setSellers(data);
    } catch (err) {
      console.error("fetchSellersInView error:", err);
      setApiError("Unable to load services in view. Please try again later.");
    } finally {
      setApiLoading(false);
    }
  }, []);

  const onMapReady = useCallback(async (map) => {
    setMapInitialized(true);
    setGeoLoading(true);
    try {
      const loc = await getUserLocation();
      setBuyerPos({ lat: loc.lat, lng: loc.lng });

      let zoom = 11;
      if (loc.source === "gps") zoom = 14;
      else if (loc.source === "ip") zoom = 12;

      map.setView([loc.lat, loc.lng], zoom);

      if (loc.source === "ip" || loc.source === "default") {
        toast.info("📍 Approximate location used");
      }

      await fetchSellersInView(map);
    } catch (err) {
      console.error("Map initialization failed", err);
    } finally {
      setGeoLoading(false);
    }
  }, [fetchSellersInView, toast]);

  const selectedCategory = useMemo(() => {
    const query = search.trim();
    if (!query) return "";
    const exact = ALL_SERVICE_SUGGESTIONS.find(
      (item) => normalizeServiceName(item) === normalizeServiceName(query),
    );
    return exact || query;
  }, [search]);

  const targetPincode = useMemo(() => {
    if (pincode.trim()) return pincode.trim();
    const match = locationQuery.match(/\b\d{6}\b/);
    return match?.[0] || "";
  }, [locationQuery, pincode]);

  const clusterGroupRef = useRef(null);

  useEffect(() => {
    if (!mapRef.current || !sellers) return;

    if (clusterGroupRef.current) {
      mapRef.current.removeLayer(clusterGroupRef.current);
    }

    const markerClusterGroup = L.markerClusterGroup();
    const markerSellers = selectedCategory
      ? sellers.filter((seller) => sellerMatchesCategory(seller, selectedCategory))
      : sellers;

    markerSellers.forEach((seller) => {
      const lat = parseFloat(seller.lat);
      const lng = parseFloat(seller.lng);
      if (isNaN(lat) || isNaN(lng)) return;

      const sId = seller.id || seller.sellerId;

      const popupHtml = `
        <div style="font-family: sans-serif; padding: 4px; min-width: 180px;">
          <h4 style="margin: 0 0 4px 0; font-size: 14px; font-weight: bold; color: #1e1b4b;">
            ${seller.business_name || seller.name || ""}
          </h4>
          <p style="margin: 0 0 8px 0; font-size: 12px; font-weight: 600; color: #1565C0;">
            ${seller.category || seller.service || ""}
          </p>
          <div style="margin-bottom: 8px; font-size: 11px; color: #64748b;">
            ⭐ ${Number(seller.avg_rating || seller.rating || 0).toFixed(1)} (${seller.reviews || 0} reviews)
          </div>
          <a href="/seller/${sId}" 
             style="display: block; text-align: center; font-size: 11px; font-weight: bold; text-decoration: none; color: #fff; background: #1565C0; padding: 6px 12px; border-radius: 6px; transition: background 0.2s;"
          >
            View Profile / प्रोफ़ाइल देखें →
          </a>
        </div>
      `;

      const marker = L.marker([lat, lng])
        .bindPopup(popupHtml)
        .on("click", () => {
          setSelectedSellerId(sId);
        });
      markerClusterGroup.addLayer(marker);
    });

    clusterGroupRef.current = markerClusterGroup;
    mapRef.current.addLayer(markerClusterGroup);
  }, [sellers, mapInitialized, selectedCategory]);

  const nearby = useMemo(() => {
    if (!buyerPos) return [];

    const filteredByDistance = sellers.filter((s) => {
      const lat = parseFloat(s?.lat);
      const lng = parseFloat(s?.lng);
      if (isNaN(lat) || isNaN(lng)) return false;
      return (
        getDistanceKm(buyerPos.lat, buyerPos.lng, lat, lng) <= radiusKm
      );
    });

    const withDistance = filteredByDistance.map((s) => {
      const lat = parseFloat(s.lat);
      const lng = parseFloat(s.lng);
      return {
        ...s,
        lat,
        lng,
        distanceKm: getDistanceKm(buyerPos.lat, buyerPos.lng, lat, lng),
      };
    });

    const filteredBySearch = selectedCategory
      ? withDistance.filter((seller) =>
        sellerMatchesCategory(seller, selectedCategory),
      )
      : withDistance;

    const filteredByServiceMode =
      filterServiceMode === "All"
        ? filteredBySearch
        : filteredBySearch.filter((s) => {
          const mode = s?.serviceMode;
          if (!mode) return false;
          if (filterServiceMode === "Online")
            return mode === "online" || mode === "both";
          if (filterServiceMode === "Offline")
            return mode === "offline" || mode === "both";
          if (filterServiceMode === "Both") return mode === "both";
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
          if (filterRating === "4") return r >= 4;
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
            if (filterPrice === "under500") return p > 0 && p < 500;
            if (filterPrice === "500-1000") return p >= 500 && p <= 1000;
            if (filterPrice === "1000-2000") return p > 1000 && p <= 2000;
            if (filterPrice === "2000+") return p > 2000;
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
            if (svcs.length > 0)
              return svcs.some((svc) => Boolean(svc?.is_instant));
            return sellerInstant;
          }
          if (filterBooking === "scheduled") {
            if (svcs.length > 0) return svcs.every((svc) => !svc?.is_instant);
            return !sellerInstant;
          }
          return true;
        });

    const filteredByQuick = filteredByBooking.filter((s) => {
      const rating = Number(s?.rating || s?.avg_rating || 0);
      const isOpen =
        Boolean(s?.is_available) ||
        Boolean(s?.isAvailable) ||
        Boolean(s?.instantService);
      const isVerified =
        Boolean(s?.is_verified) ||
        Boolean(s?.isVerified) ||
        Boolean(s?.verified);

      if (quickFilters.openNow && !isOpen) return false;
      if (quickFilters.verified && !isVerified) return false;
      if (quickFilters.rating45 && rating < 4.5) return false;
      return true;
    });

    return filteredByQuick.sort((a, b) => {
      if (quickFilters.nearest) return a.distanceKm - b.distanceKm;
      const rankA = getSellerPackageRank(a);
      const rankB = getSellerPackageRank(b);
      if (rankA !== rankB) return rankB - rankA;
      return a.distanceKm - b.distanceKm;
    });
  }, [
    buyerPos,
    sellers,
    search,
    selectedCategory,
    radiusKm,
    filterServiceMode,
    filterAvailability,
    filterRating,
    filterPrice,
    filterDuration,
    filterBooking,
    quickFilters,
  ]);

  const handleLocationSearchSubmit = async (e) => {
    e.preventDefault();
    const val = locationQuery.trim();
    if (!val) return;
    if (/^\d{6}$/.test(val)) {
      suppressNextLocationSearchRef.current = true;
      setPincode(val);
      setPincodeLoading(true);
      setPincodeError("");
      setLocationNotFoundMsg("");
      try {
        const results = await nominatimSearch(`${val}, India`);
        if (results.length > 0) {
          const r = results[0];
          setBuyerPos({ lat: parseFloat(r.lat), lng: parseFloat(r.lon) });
          setMapFlyTrigger((prev) => prev + 1);
          suppressNextLocationSearchRef.current = true;
          setLocationQuery(r.display_name.split(",")[0] + " - " + val);
          setLocationResults([]);
          setLocationNotFoundMsg("");
          setGeoError("");
        } else {
          suppressNextLocationSearchRef.current = false;
          setPincodeError("Pincode not found. Try a nearby pincode.");
        }
      } catch {
        suppressNextLocationSearchRef.current = false;
        setPincodeError("Search failed. Try again.");
      } finally {
        setPincodeLoading(false);
      }
    } else {
      searchLocation(val);
    }
  };

  const handleResultClick = (result) => {
    suppressNextLocationSearchRef.current = true;
    setBuyerPos({
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
    });
    setMapFlyTrigger((prev) => prev + 1);
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
    suppressNextLocationSearchRef.current = true;
    setPincodeLoading(true);
    setPincodeError("");
    setLocationNotFoundMsg("");
    try {
      const results = await nominatimSearch(`${trimmed}, India`);
      if (results.length > 0) {
        const r = results[0];
        setBuyerPos({ lat: parseFloat(r.lat), lng: parseFloat(r.lon) });
        setMapFlyTrigger((prev) => prev + 1);
        suppressNextLocationSearchRef.current = true;
        setLocationQuery(r.display_name.split(",")[0] + " - " + trimmed);
        setLocationResults([]);
        setLocationNotFoundMsg("");
        setGeoError("");
      } else {
        suppressNextLocationSearchRef.current = false;
        setPincodeError("Pincode not found. Try a nearby pincode.");
      }
    } catch {
      suppressNextLocationSearchRef.current = false;
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
    setMapFlyTrigger((prev) => prev + 1);
    setLocationResults([]);
    setLocationNotFoundMsg("");
    setPincodeResults([]);
    setPincodeError("");
    setGeoError("");
  };

  const handleMapAreaChanged = useCallback((nextCenter) => {
    if (!nextCenter) return;
    setBuyerPos((prev) => {
      if (
        prev &&
        Math.abs(prev.lat - nextCenter.lat) < 0.00001 &&
        Math.abs(prev.lng - nextCenter.lng) < 0.00001
      ) {
        return prev;
      }
      return nextCenter;
    });
    setLocationResults([]);
    setLocationNotFoundMsg("");
    setGeoError("");
  }, []);

  const handleUseMyLocation = () => {
    if (gpsPosRef.current) {
      setBuyerPos(gpsPosRef.current);
      setMapFlyTrigger((prev) => prev + 1);
      setLocationResults([]);
      setLocationNotFoundMsg("");
      setPincodeResults([]);
      setPincode("");
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
        setMapFlyTrigger((prev) => prev + 1);
        setLocationResults([]);
        setLocationNotFoundMsg("");
        setPincodeResults([]);
        setPincode("");
        setPincodeError("");
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

  const handleMapToggle = useCallback(() => {
    if (mapToggleLocked) return;
    setMapToggleLocked(true);
    setShowMap((prev) => !prev);
    window.setTimeout(() => setMapToggleLocked(false), 300);
  }, [mapToggleLocked]);

  useEffect(() => {
    if (!showMap || !mapRef.current) return;
    const timer = window.setTimeout(() => {
      mapRef.current?.invalidateSize?.();
    }, 60);
    return () => window.clearTimeout(timer);
  }, [showMap]);

  const clearLocationInput = () => {
    suppressNextLocationSearchRef.current = true;
    setLocationQuery("");
    setLocationResults([]);
    setLocationNotFoundMsg("");
    setGeoError("");
    setDropdownStyle(null);
  };

  const clearPincodeInput = () => {
    setPincode("");
    setPincodeResults([]);
    setPincodeError("");
    setLocationNotFoundMsg("");
    setGeoError("");
  };

  const showLocationDropdown =
    locationMode === "area" &&
    dropdownStyle &&
    locationResults.length > 0;

  // =================== STEP-BY-STEP SEARCH & FINDER PANEL ===================
  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* QuickSeva - Map Performance Feature: Floating Toast Message */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-[9999] flex items-center gap-2 rounded-xl bg-indigo-900/90 border border-indigo-500/50 px-4 py-3 text-sm font-semibold text-white shadow-[0_0_20px_rgba(99,102,241,0.5)] backdrop-blur-md">
          <span>{toastMessage}</span>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="ml-2 text-indigo-300 hover:text-white font-bold text-lg leading-none cursor-pointer"
          >
            &times;
          </button>
        </div>
      )}

      {showLocationDropdown &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={portalDropdownRef}
            style={dropdownStyle}
            className="max-h-72 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-1.5 text-slate-800 shadow-2xl scrollbar-none"
          >
            {locationResults.map((result) => (
              <button
                key={`${result.place_id}-${result.lat}-${result.lon}`}
                type="button"
                onClick={() => handleResultClick(result)}
                className="block w-full rounded-xl px-4 py-3 text-left text-sm transition-colors hover:bg-indigo-50 hover:text-indigo-700"
              >
                <span className="block font-semibold text-slate-900">
                  {(result.display_name || "").split(",")[0]}
                </span>
                <span className="mt-0.5 block text-xs leading-snug text-slate-500">
                  {result.display_name}
                </span>
              </button>
            ))}

          </div>,
          document.body,
        )}

      <div className="relative p-0">
        <div className="relative z-10 flex flex-col gap-5">
          {/* STEP 1: Service search (What service do you need?) */}
          <div className="relative" ref={serviceDropRef}>
            <label className="mb-1.5 flex items-center gap-2 text-xs font-semibold tracking-wider text-indigo-200">
              Service / सेवा
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-indigo-300/70">
                🔍
              </span>
              <input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setShowServiceDrop(true);
                }}
                onFocus={() => setShowServiceDrop(true)}
                placeholder="Search services (e.g. Plumber, AC Repair, Cleaning...)"
                className="w-full rounded-full border border-indigo-500/30 bg-transparent py-3 pl-10 pr-10 text-sm font-medium text-white placeholder-indigo-300/50 transition-all duration-300 focus:border-indigo-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-indigo-300 hover:text-white cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Service Dropdown Suggestions */}
            {showServiceDrop && filteredServiceSuggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full z-[1000] mt-2 max-h-[220px] overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl p-1.5 scrollbar-none">
                {filteredServiceSuggestions.map((item) => {
                  const IconComponent = getServiceIcon(item);
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => handleServiceSelect(item)}
                      className="w-full rounded-xl px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-100 hover:text-indigo-600 transition-colors duration-200 cursor-pointer flex items-center gap-2.5"
                    >
                      <IconComponent className="h-4 w-4 text-indigo-500 shrink-0" />
                      <span>{item}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* STEP 2: Location selection & Pincode */}
          <form
            ref={locationSearchRef}
            onSubmit={handleLocationSearchSubmit}
            className="relative isolate z-[70]"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Location Input */}
              <div className="relative z-[2]">
                <label className="relative z-[2] mb-1.5 block text-xs font-semibold tracking-wider text-indigo-200">
                  Location (Area / Landmark) / जगह
                </label>
                <div className="relative z-[2]">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-indigo-300/70">
                    📍
                  </span>
                  <input
                    value={locationQuery}
                    onChange={(e) => setLocationQuery(e.target.value)}
                    onFocus={() => {
                      if (locationQuery.trim().length >= 3) {
                        searchLocation(locationQuery);
                      }
                    }}
                    autoComplete="off"
                    className="w-full rounded-full border border-indigo-500/30 bg-transparent py-3 pl-10 pr-32 text-sm font-medium text-white placeholder-indigo-300/50 transition-all duration-300 focus:border-indigo-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10"
                    placeholder="Search Area or Landmark (e.g. Nikol)"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                    {locationQuery && (
                      <button
                        type="button"
                        onClick={clearLocationInput}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-full text-indigo-300 transition hover:bg-white/10 hover:text-white"
                        aria-label="Clear location"
                        title="Clear location"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleUseMyLocation}
                      className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-[0px] text-emerald-300 transition hover:bg-emerald-400/10 hover:text-emerald-100 cursor-pointer ${geoLoading ? "qs-pulse" : ""}`}
                      aria-label="Use current location"
                      title="Use current location"
                    >
                      <Crosshair className="h-4 w-4" />
                      🎯
                    </button>
                    <button
                      type="submit"
                      className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-full px-3 py-1 text-xs font-bold transition cursor-pointer"
                    >
                      {locationLoading ? "..." : "Search"}
                    </button>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleUseMyLocation}
                  className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-300 transition hover:text-emerald-100"
                >
                  <Crosshair className="h-3.5 w-3.5" />
                  Use Current Location
                </button>
              </div>

              {/* Pincode Input */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold tracking-wider text-indigo-200">
                  Pincode / पिनकोड
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-indigo-300/70">
                    📮
                  </span>
                  <input
                    value={pincode}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "").slice(0, 6);
                      setPincode(val);
                      setPincodeError("");
                      setLocationNotFoundMsg("");
                    }}
                    onKeyDown={(e) => e.key === "Enter" && handlePincodeSearch()}
                    className="w-full rounded-full border border-indigo-500/30 bg-transparent py-3 pl-10 pr-24 text-sm font-medium text-white placeholder-indigo-300/50 transition-all duration-300 focus:border-indigo-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10"
                    placeholder="Enter 6-digit Pincode (e.g. 382350)"
                    maxLength={6}
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                    {pincode && (
                      <button
                        type="button"
                        onClick={clearPincodeInput}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-full text-indigo-300 transition hover:bg-white/10 hover:text-white"
                        aria-label="Clear pincode"
                        title="Clear pincode"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handlePincodeSearch}
                      disabled={pincode.length !== 6 || pincodeLoading}
                      className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-full px-3 py-1 text-xs font-bold transition cursor-pointer"
                    >
                      {pincodeLoading ? "..." : "Go"}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {locationNotFoundMsg && (
              <div className="mt-3 rounded-xl border border-amber-400/25 bg-amber-500/10 px-3 py-2 text-sm font-medium text-amber-100">
                ⚠ {locationNotFoundMsg}
              </div>
            )}

            {pincodeError && (
              <div className="mt-3 rounded-xl border border-red-400/25 bg-red-500/10 px-3 py-2 text-sm font-medium text-red-200">
                ⚠ {pincodeError}
              </div>
            )}
          </form>

          {/* STEP 3: Range Slider and Filters */}
          <div className="flex flex-row flex-wrap items-center justify-between gap-4 rounded-2xl border border-indigo-500/10 bg-[#110e30]/40 p-4">
            {/* Range Slider */}
            <div className="min-w-[240px] flex-1 max-w-md">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-indigo-200 uppercase tracking-wider">
                  Distance Range
                </span>
                <span className="text-xs font-bold bg-indigo-500/20 px-2 py-0.5 rounded text-indigo-200">{radiusKm} km</span>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={1}
                  max={20}
                  step={1}
                  value={radiusKm}
                  onChange={(e) => setRadiusKm(parseInt(e.target.value || "5", 10))}
                  className="qs-range flex-1"
                  style={{
                    background: `linear-gradient(to right, #818cf8 0%, #6366f1 ${((radiusKm - 1) / 19) * 100}%, rgba(99,102,241,0.18) ${((radiusKm - 1) / 19) * 100}%, rgba(99,102,241,0.18) 100%)`,
                  }}
                />
                <span className="text-[10px] text-indigo-300 font-medium whitespace-nowrap">
                  ({getRadiusVisualGuide(radiusKm).icon} {radiusKm <= 5 ? "Nearby" : "Far"})
                </span>
              </div>
            </div>

            {/* Quick Filters */}
            <div className="order-3 flex w-full flex-wrap items-center justify-start gap-2 md:order-none md:w-auto md:flex-1 md:justify-center">
              {quickFilterItems.map(({ key, label, Icon }) => {
                const active = quickFilters[key];
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => toggleQuickFilter(key)}
                    aria-pressed={active}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-2 text-xs font-semibold transition-all ${active
                        ? "border-indigo-300/60 bg-indigo-500/30 text-white shadow-[0_0_18px_rgba(99,102,241,0.22)]"
                        : "border-slate-700/50 bg-white/10 text-slate-200 hover:border-indigo-400/40 hover:bg-white/15 hover:text-white"
                      }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span className="whitespace-nowrap">{label}</span>
                  </button>
                );
              })}
            </div>

            {/* Refine Filters Toggle Button */}
            <div className="ml-auto flex min-w-[150px] flex-col gap-1 sm:w-auto">
              <span className="text-[10px] font-semibold text-indigo-300/80 mb-0.5">
                Filters / फ़िल्टर:
              </span>
              <button
                type="button"
                onClick={() => setFiltersOpen((prev) => !prev)}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-indigo-400/25 bg-[#1b1850]/40 px-4 py-2 text-sm font-semibold text-indigo-200 transition-all hover:border-indigo-400/50 hover:bg-[#1b1850]/80 cursor-pointer"
              >
                <span>⚙️</span>
                Refine Results
                {activeFilterCount > 0 && (
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-indigo-500 text-[11px] font-bold text-white">
                    {activeFilterCount}
                  </span>
                )}
                <span>▼</span>
              </button>
            </div>
          </div>

          {/* Collapsible Refine Results filter options */}
          {filtersOpen && (
            <div className="rounded-xl border border-indigo-400/20 bg-indigo-950/30 p-4 space-y-4">
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
                      className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${filterPrice === opt.value
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
                      className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${filterDuration === opt.value
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
                      className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${filterBooking === opt.value
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
                    className="text-xs font-semibold text-red-300 hover:text-red-200 transition-colors cursor-pointer"
                  >
                    ✕ Clear All Filters
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {geoError && (
          <p className="relative z-10 mt-3 rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            ⚠ {geoError}
          </p>
        )}
      </div>

      {/* Results Header: Stats and Map Option Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-indigo-500/10 pt-4 mt-2">
        <div className="flex flex-wrap items-center gap-2 text-xs">
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

        {/* Map Option Toggle Button on the Top Side */}
        <button
          type="button"
          onClick={handleMapToggle}
          disabled={mapToggleLocked}
          className={`inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-full border transition-all ${mapToggleLocked ? "cursor-wait opacity-70" : "cursor-pointer"} ${showMap
            ? "bg-[#6366f1] border-[#6366f1] text-white shadow-lg shadow-indigo-600/20"
            : "bg-indigo-950/40 border-indigo-500/20 text-indigo-200 hover:border-indigo-500/50"
            }`}
        >
          <span>🗺️</span>
          <span>{showMap ? "Hide Map / नक्शा छुपाएं" : "Show Map / नक्शा दिखाएं"}</span>
        </button>
      </div>

      {/* =================== MAP + PROVIDER LIST =================== */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start mt-2">
        {/* ============ MAP ============ */}
        <div
          className={`w-full lg:w-[58%] ${showMap ? "block" : "hidden"}`}
          aria-hidden={!showMap}
        >
          <MapErrorBoundary>
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
                <MapEventTracker
                  mapRef={mapRef}
                  onMapReady={onMapReady}
                  fetchSellersInView={fetchSellersInView}
                  onMapAreaChanged={handleMapAreaChanged}
                />
                <MapController
                  center={buyerPos ? [buyerPos.lat, buyerPos.lng] : null}
                  flyTrigger={mapFlyTrigger}
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
                      icon={USER_ICON}
                    />
                  </>
                )}
              </MapContainer>
            </div>
          </MapErrorBoundary>
        </div>

        {/* ============ PROVIDER LIST ============ */}
        <div className={`w-full ${showMap ? "lg:w-[42%]" : "lg:w-full"}`}>
          <div className={`qs-list pb-2 pr-1 ${showMap
            ? "flex gap-3 overflow-x-auto snap-x snap-mandatory lg:block lg:h-[520px] lg:space-y-3 lg:overflow-y-auto lg:overflow-x-hidden lg:pb-0 lg:snap-none"
            : "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:max-h-[520px] lg:overflow-y-auto"
            }`}>
            {apiError && (
              <div className="qs-glass-panel w-full py-8 px-4 text-center text-red-300 border border-red-500/30">
                {apiError}
              </div>
            )}

            {apiLoading && sellers.length === 0 && (
              <div className="qs-glass-panel w-full py-14 text-center text-indigo-300">
                <span className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-indigo-400 border-t-white" />
                <p className="mt-2 text-sm font-semibold">Loading local service partners…</p>
              </div>
            )}

            {!apiLoading && !buyerPos && sellers.length === 0 && (
              <div className="qs-glass-panel w-full py-14 text-center text-indigo-300">
                <p className="text-sm font-semibold">No service providers registered on map yet.</p>
                <p className="text-xs text-indigo-300/60 mt-1">
                  Be the first to register as a service partner!
                </p>
              </div>
            )}

            {!apiLoading && buyerPos && nearby.length === 0 && (
              <div className="w-full">
                <NoProvidersLeadForm
                  category={selectedCategory || search.trim()}
                  pincode={targetPincode}
                  radiusKm={radiusKm}
                  buyerPos={buyerPos}
                />
                {activeFilterCount > 0 && (
                  <button
                    type="button"
                    onClick={clearAllFilters}
                    className="mt-3 rounded-xl border border-indigo-400/30 bg-indigo-500/15 px-5 py-2 text-sm font-semibold text-indigo-200 transition hover:bg-indigo-500/25"
                  >
                    ✕ Clear All Filters
                  </button>
                )}
              </div>
            )}

            {nearby.map((seller, idx) => {
              const packageRank = getSellerPackageRank(seller);

              const sId = seller.id || seller.sellerId;
              const isSelected = selectedSellerId === sId;
              const distanceLabel = Number(seller.distanceKm || 0).toFixed(1);
              const isAvailable = seller.isAvailable !== undefined ? Boolean(seller.isAvailable) : (seller.is_available !== undefined ? Boolean(seller.is_available) : true);

              return (
                <div
                  key={sId}
                  id={`seller-card-${sId}`}
                  onClick={() => handlePremiumSellerClick(seller)}
                  style={{ animationDelay: `${Math.min(idx * 50, 400)}ms` }}
                  className={`qs-card group cursor-pointer snap-start ${showMap ? "w-[290px] flex-shrink-0 lg:w-auto" : "w-full"
                    } ${isSelected ? "qs-card-active" : ""}`}
                >
                  {/* Header: avatar + name + distance */}
                  <div className="flex items-center gap-3">
                    <div className="relative h-10 w-10 flex-shrink-0">
                      {(seller.profilePhotoUrl || seller.profile_pic) ? (
                        <img
                          src={getImageUrl(seller.profilePhotoUrl || seller.profile_pic)}
                          alt={seller.name}
                          className="h-10 w-10 rounded-full object-cover border border-slate-200"
                        />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1565C0] font-bold text-white text-sm">
                          {seller.name?.[0]?.toUpperCase() || "?"}
                        </div>
                      )}
                      {/* Availability status dot badge */}
                      <span
                        className={`absolute -bottom-0.5 -right-0.5 block h-3 w-3 rounded-full border-2 border-white shadow-[0_1px_3.5px_rgba(0,0,0,0.15)] ${
                          isAvailable ? "bg-[#1E8E5A]" : "bg-[#e53935]"
                        }`}
                        title={isAvailable ? "Available" : "Unavailable"}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <h4 className="truncate text-sm font-bold text-slate-800">
                          {seller.name}
                        </h4>
                      </div>
                      <div className="truncate text-xs font-medium text-slate-500">
                        {seller.service}
                      </div>
                    </div>
                    <div className="qs-distance-badge">
                      <span className="text-[10px] opacity-80">📍</span>
                      <span>{`${distanceLabel}km away`}</span>
                    </div>
                  </div>

                  {/* Address */}
                  <div className="mt-2.5 flex items-start gap-1.5 text-xs text-slate-600">
                    <span className="mt-0.5">📌</span>
                    <span className="truncate">{seller.address}</span>
                  </div>

                  {/* Badge row */}
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {/* Service Mode badges */}
                    {seller?.serviceMode === "online" && (
                      <span className="qs-tag qs-tag-indigo">
                        🌐 Online Service
                      </span>
                    )}
                    {seller?.serviceMode === "offline" && (
                      <span className="qs-tag qs-tag-emerald">
                        📍 Offline Service
                      </span>
                    )}
                    {seller?.serviceMode === "both" && (
                      <span className="qs-tag qs-tag-amber">
                        🔄 Online + Offline
                      </span>
                    )}

                    {/* Instant Service */}
                    {seller?.instantService && (
                      <span
                        className="qs-instant-badge"
                        title="⚡ Instant Service"
                      >
                        <span className="qs-instant-badge-dot" />⚡ Instant
                        Service
                      </span>
                    )}

                    {/* Rating badge */}
                    <span className="qs-tag qs-tag-indigo">
                      ⭐ {Number(seller?.rating || 0).toFixed(1)}
                      <span className="opacity-80">
                        {" "}
                        ({Number(seller?.reviews || 0)} Reviews)
                      </span>
                    </span>

                    {/* Top Rated */}
                    {seller?.isTopRated && (
                      <span className="qs-tag qs-tag-gold">⭐ Top Rated</span>
                    )}

                    {/* Verification-related UI temporarily hidden */}
                    {packageRank >= 2 && (
                      <span className="qs-tag qs-tag-amber">
                        ⚡ Fast Response
                      </span>
                    )}
                  </div>

                  {/* CTA */}
                  <a
                    href={`/seller/${sId}`}
                    onClick={(e) => handleViewDetailsClick(seller, e)}
                    className="qs-cta mt-3 block w-full rounded-xl py-2.5 text-center text-xs font-bold text-white"
                  >
                    View Profile / प्रोफ़ाइल देखें →
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
