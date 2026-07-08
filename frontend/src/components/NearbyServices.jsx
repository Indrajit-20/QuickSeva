// QuickSeva - Map Performance Feature
import { Component, useEffect, useMemo, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { API_BASE_URL } from "../config/api";
import { useNearbyLocation } from "../hooks/useNearbyLocation";

import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/leaflet.markercluster";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import { getUserLocation, getIpFallback } from "../utils/getLocation";
import LocationErrorModal from "./LocationErrorModal";
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
  Footprints,
  Bike,
  Car,
  Radar,
  Users,
  MapPin,
  SlidersHorizontal,
  ChevronDown,
  Map,
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

// ── Stable wrapper: filter on the outer div so the SVG has no inline filter.
// This avoids the SVG filter causing GPU layer promotion on every hover/click.
const makePinHTML = (svgInner, size) =>
  `<div style="width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center;filter:drop-shadow(0 4px 6px rgba(0,0,0,0.15));">${svgInner}</div>`;

const GREEN_SVG =
  "<svg xmlns='http://www.w3.org/2000/svg' width='30' height='30' viewBox='0 0 24 24' fill='none'>" +
  "<path d='M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z' fill='#10b981' stroke='#047857' stroke-width='1.5'/>" +
  "<circle cx='12' cy='9' r='3' fill='#ffffff'/>" +
  "</svg>";

const GREEN_ICON = L.divIcon({
  className: "service-pin-green",
  html: makePinHTML(GREEN_SVG, 30),
  iconSize: [30, 30],
  iconAnchor: [15, 30],
  popupAnchor: [0, -32],
  tooltipAnchor: [0, -32],
});

const PREMIUM_SVG =
  "<svg xmlns='http://www.w3.org/2000/svg' width='34' height='34' viewBox='0 0 24 24' fill='none'>" +
  "<path d='M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z' fill='#6366f1' stroke='#4338ca' stroke-width='1.5'/>" +
  "<polygon points='12,6 13.5,9 16.5,9.5 14,11.5 15,14.5 12,13 9,14.5 10,11.5 7.5,9.5 10.5,9' fill='#ffffff'/>" +
  "</svg>";

const PREMIUM_ICON = L.divIcon({
  className: "service-pin-premium",
  html: makePinHTML(PREMIUM_SVG, 34),
  iconSize: [34, 34],
  iconAnchor: [17, 34],
  popupAnchor: [0, -36],
  tooltipAnchor: [0, -36],
});

const GOLD_SVG =
  "<svg xmlns='http://www.w3.org/2000/svg' width='38' height='38' viewBox='0 0 24 24' fill='none'>" +
  "<path d='M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z' fill='#f59e0b' stroke='#b45309' stroke-width='1.5'/>" +
  "<polygon points='12,5.5 13.8,9.2 17.8,9.8 14.8,12.6 15.5,16.6 12,14.7 8.5,16.6 9.2,12.6 6.2,9.8 10.2,9.2' fill='#ffffff'/>" +
  "</svg>";

const GOLD_ICON = L.divIcon({
  className: "service-pin-gold",
  html: makePinHTML(GOLD_SVG, 38),
  iconSize: [38, 38],
  iconAnchor: [19, 38],
  popupAnchor: [0, -40],
  tooltipAnchor: [0, -40],
});

const USER_PIN_HTML =
  "<div class='relative flex items-center justify-center' style='pointer-events:none;'>" +
  "<span class='absolute inline-flex h-6 w-6 animate-ping rounded-full bg-indigo-400 opacity-75'></span>" +
  "<div class='relative flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 border-2 border-white shadow-[0_0_10px_rgba(99,102,241,0.8)]'>" +
  "<div class='h-1.5 w-1.5 rounded-full bg-white'></div>" +
  "</div>" +
  "</div>";

const USER_ICON = L.divIcon({
  className: "user-location-pin",
  html: USER_PIN_HTML,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
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

function getRadiusIcon(radius) {
  if (radius <= 2) return <Footprints className="h-4 w-4 text-emerald-500 shrink-0" />;
  if (radius <= 5) return <Bike className="h-4 w-4 text-indigo-500 shrink-0" />;
  if (radius <= 10) return <Car className="h-4 w-4 text-amber-500 shrink-0" />;
  return <MapPin className="h-4 w-4 text-red-500 shrink-0" />;
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
    click: (e) => {
      // Only fire if click target is the map canvas itself (not a marker/popup)
      const originalTarget = e.originalEvent?.target;
      if (!originalTarget) return;
      // Leaflet marker/popup elements have these class prefixes - skip them
      const cls = originalTarget.className || "";
      const clsStr = typeof cls === "string" ? cls : (cls.baseVal || "");
      if (
        clsStr.includes("leaflet-marker") ||
        clsStr.includes("leaflet-popup") ||
        clsStr.includes("leaflet-cluster") ||
        clsStr.includes("service-pin") ||
        clsStr.includes("user-location-pin") ||
        originalTarget.closest?.(".leaflet-popup") ||
        originalTarget.closest?.(".leaflet-marker-icon") ||
        originalTarget.closest?.(".leaflet-marker-pane")
      ) {
        return;
      }
      onMapClick?.(e.latlng);
    },
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


export default function NearbyServices({
  initialSearch = "",
  centerLat = null,
  centerLon = null,
  locationFilter = "",
}) {
  // buyerPos = user's actual GPS/set location (for the "You are here" marker & radius)
  // searchCenter = the map view center (changes on map pan, does NOT move the user marker)
  const [buyerPos, setBuyerPos] = useState(null);
  const [searchCenter, setSearchCenter] = useState(null);
  const [mapFlyTrigger, setMapFlyTrigger] = useState(0);
  const [geoError, setGeoError] = useState("");
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showMap, setShowMap] = useState(true);
  const [search, setSearch] = useState(initialSearch);
  const [locationQuery, setLocationQuery] = useState("");
  const [showServiceDrop, setShowServiceDrop] = useState(false);
  const serviceDropRef = useRef(null);
  const resultsHeaderRef = useRef(null);

  const scrollToResults = () => {
    if (resultsHeaderRef.current) {
      const rect = resultsHeaderRef.current.getBoundingClientRect();
      const isBelowFold = rect.top > window.innerHeight * 0.7 || rect.top < 0;
      if (isBelowFold) {
        resultsHeaderRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  };


  const [visibleCount, setVisibleCount] = useState(5);

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
    setTimeout(scrollToResults, 100);
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

  // Reset pagination when search query, selected category, radius, or filters change
  useEffect(() => {
    setVisibleCount(5);
  }, [
    search,
    radiusKm,
    filterServiceMode,
    filterAvailability,
    filterRating,
    filterPrice,
    filterDuration,
    filterBooking,
    quickFilters
  ]);

  const isInitialMount = useRef(true);
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    setTimeout(scrollToResults, 100);
  }, [
    filterPrice,
    filterDuration,
    filterBooking,
    filterServiceMode,
    quickFilters,
  ]);


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
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);

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
      setSearchCenter({ lat: loc.lat, lng: loc.lng });

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

    const markerClusterGroup = L.markerClusterGroup({
      // showCoverageOnHover:true (default) draws a coverage polygon on hover
      // which triggers a full map repaint — this is what causes the cluster icon to jump.
      showCoverageOnHover: false,
      // Disable cluster animation to prevent the expand/collapse jump
      animate: false,
      spiderfyOnMaxZoom: true,
      maxClusterRadius: 60,
      // Custom cluster icon with stable, explicit sizing to prevent hover layout shifts
      iconCreateFunction: (cluster) => {
        const count = cluster.getChildCount();
        const size = count < 10 ? 36 : count < 100 ? 44 : 52;
        const bg = count < 10 ? "#1565C0" : count < 100 ? "#6d28d9" : "#b45309";
        return L.divIcon({
          html: `<div style="
            width:${size}px;height:${size}px;
            background:${bg};
            border:3px solid rgba(255,255,255,0.85);
            border-radius:50%;
            display:flex;align-items:center;justify-content:center;
            box-shadow:0 2px 8px rgba(0,0,0,0.22);
            box-sizing:border-box;
            font-size:${count < 10 ? 13 : 12}px;
            font-weight:700;
            color:#fff;
            font-family:'Inter',sans-serif;
            pointer-events:none;
            user-select:none;
          ">${count}</div>`,
          className: "qs-cluster-icon",
          iconSize: L.point(size, size),
          iconAnchor: L.point(size / 2, size / 2),
        });
      },
    });
    const markerSellers = selectedCategory
      ? sellers.filter((seller) => sellerMatchesCategory(seller, selectedCategory))
      : sellers;

    markerSellers.forEach((seller) => {
      const lat = parseFloat(seller.lat);
      const lng = parseFloat(seller.lng);
      if (isNaN(lat) || isNaN(lng)) return;

      const sId = seller.id || seller.sellerId || seller.seller_id;
      const name = seller.business_name || seller.name || "";
      const category = seller.category || seller.service || "";
      const rating = Number(seller.avg_rating || seller.rating || 0).toFixed(1);
      const reviews = seller.reviews || 0;

      const popupHtml = `
        <div style="font-family: 'Inter', sans-serif; padding: 6px 4px; min-width: 190px;">
          <h4 style="margin: 0 0 4px 0; font-size: 14px; font-weight: 700; color: #1e1b4b;">
            ${name}
          </h4>
          <p style="margin: 0 0 8px 0; font-size: 12px; font-weight: 600; color: #1565C0;">
            ${category}
          </p>
          <div style="margin-bottom: 10px; font-size: 11px; color: #64748b;">
            ⭐ ${rating} (${reviews} reviews)
          </div>
          <button
            data-seller-id="${sId}"
            style="display: block; width: 100%; text-align: center; font-size: 11px; font-weight: bold; border: none; cursor: pointer; color: #fff; background: #1565C0; padding: 7px 12px; border-radius: 6px; transition: background 0.2s;"
            onmouseover="this.style.background='#1976D2'"
            onmouseout="this.style.background='#1565C0'"
          >
            View Profile / प्रोफ़ाइल देखें →
          </button>
        </div>
      `;

      const marker = L.marker([lat, lng], {
        icon: getSellerPinIcon(seller),
        keyboard: false,   // prevents Leaflet adding tabindex → no focus-outline jump on click
        riseOnHover: false, // prevents z-index reorder jump on hover
      })
        .bindPopup(popupHtml, {
          maxWidth: 240,
          className: "qs-seller-popup",
          autoPan: false,   // prevents map panning (and scroll-jump) when popup opens
        })
        .on("popupopen", () => {
          setSelectedSellerId(sId);
        })
        .on("click", (ev) => {
          // Stop map click handler from firing when a marker is clicked
          L.DomEvent.stopPropagation(ev);
        });
      markerClusterGroup.addLayer(marker);
    });

    // Delegate popup button clicks to navigate to seller profile
    const handlePopupClick = (e) => {
      const btn = e.target.closest?.("[data-seller-id]");
      if (btn) {
        const id = btn.getAttribute("data-seller-id");
        if (id) window.location.href = `/seller/${id}`;
      }
    };
    document.addEventListener("click", handlePopupClick);
    // Store cleanup for this effect cycle
    clusterGroupRef._popupClickCleanup?.();
    clusterGroupRef._popupClickCleanup = () => document.removeEventListener("click", handlePopupClick);

    clusterGroupRef.current = markerClusterGroup;
    mapRef.current.addLayer(markerClusterGroup);

    return () => {
      clusterGroupRef._popupClickCleanup?.();
      delete clusterGroupRef._popupClickCleanup;
    };
  }, [sellers, mapInitialized, selectedCategory]);

  const nearby = useMemo(() => {
    // Use searchCenter if set, otherwise fall back to buyerPos
    const center = searchCenter || buyerPos;
    if (!center) return [];

    const filteredByDistance = sellers.filter((s) => {
      const lat = parseFloat(s?.lat);
      const lng = parseFloat(s?.lng);
      if (isNaN(lat) || isNaN(lng)) return false;
      return (
        getDistanceKm(center.lat, center.lng, lat, lng) <= radiusKm
      );
    });

    const withDistance = filteredByDistance.map((s) => {
      const lat = parseFloat(s.lat);
      const lng = parseFloat(s.lng);
      return {
        ...s,
        lat,
        lng,
        distanceKm: getDistanceKm(center.lat, center.lng, lat, lng),
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
    searchCenter,
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
          const newPos = { lat: parseFloat(r.lat), lng: parseFloat(r.lon) };
          setBuyerPos(newPos);
          setSearchCenter(newPos);
          setMapFlyTrigger((prev) => prev + 1);
          suppressNextLocationSearchRef.current = true;
          setLocationQuery(r.display_name.split(",")[0] + " - " + val);
          setLocationResults([]);
          setLocationNotFoundMsg("");
          setGeoError("");
          setTimeout(scrollToResults, 100);
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
      setLocationLoading(true);
      setLocationNotFoundMsg("");
      try {
        const results = await smartSearch(val);
        if (results.length > 0) {
          const r = results[0];
          const newPos = { lat: parseFloat(r.lat), lng: parseFloat(r.lon) };
          setBuyerPos(newPos);
          setSearchCenter(newPos);
          setMapFlyTrigger((prev) => prev + 1);
          suppressNextLocationSearchRef.current = true;
          setLocationQuery(r.display_name.split(",")[0]);
          setLocationResults([]);
          setLocationNotFoundMsg("");
          setGeoError("");
          setTimeout(scrollToResults, 100);
        } else {
          setLocationNotFoundMsg("Area not found. Try a nearby landmark.");
        }
      } catch {
        setLocationNotFoundMsg("Search failed. Try again.");
      } finally {
        setLocationLoading(false);
      }
    }
  };

  const handleResultClick = (result) => {
    suppressNextLocationSearchRef.current = true;
    const newPos = {
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
    };
    // Location search moves both the user marker and flies the map
    setBuyerPos(newPos);
    setSearchCenter(newPos);
    setMapFlyTrigger((prev) => prev + 1);
    setLocationQuery(result.display_name || "");
    setLocationResults([]);
    setLocationNotFoundMsg("");
    setPincodeResults([]);
    setPincodeError("");
    setGeoError("");
    setTimeout(scrollToResults, 100);
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
        const newPos = { lat: parseFloat(r.lat), lng: parseFloat(r.lon) };
        setBuyerPos(newPos);
        setSearchCenter(newPos);
        setMapFlyTrigger((prev) => prev + 1);
        suppressNextLocationSearchRef.current = true;
        setLocationQuery(r.display_name.split(",")[0] + " - " + trimmed);
        setLocationResults([]);
        setLocationNotFoundMsg("");
        setGeoError("");
        setTimeout(scrollToResults, 100);
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

  const handleMapClick = async (latlng) => {
    if (!latlng) return;
    // Map click: only move the SEARCH CENTER (radius circle & seller search area).
    // Do NOT update buyerPos — the "You are here" GPS dot must stay fixed.
    const nextPos = { lat: latlng.lat, lng: latlng.lng };
    setSearchCenter(nextPos);
    // Do NOT call setMapFlyTrigger here — prevents jump/teleport on click
    // Do NOT call setBuyerPos here — prevents the user icon from moving
    setLocationResults([]);
    setLocationNotFoundMsg("");
    setPincodeResults([]);
    setPincodeError("");
    setGeoError("");

    try {
      suppressNextLocationSearchRef.current = true;
      const nextAddress = await reverseGeocode(nextPos.lat, nextPos.lng);
      setLocationQuery(nextAddress || `${nextPos.lat.toFixed(4)}, ${nextPos.lng.toFixed(4)}`);
    } catch {
      setLocationQuery(`${nextPos.lat.toFixed(4)}, ${nextPos.lng.toFixed(4)}`);
    }
  };

  const handleMapAreaChanged = useCallback((nextCenter) => {
    // Keep user location marker stable in place instead of moving to the center
    setLocationResults([]);
    setLocationNotFoundMsg("");
    setGeoError("");
  }, []);

  const handleUseMyLocation = async () => {
    const updateLocationFromCoords = async (lat, lng) => {
      suppressNextLocationSearchRef.current = true;
      setGeoLoading(true);
      try {
        const nextAddress = await reverseGeocode(lat, lng);
        setLocationQuery(nextAddress || `${lat.toFixed(4)}, ${lng.toFixed(4)}`);
        setGeoError("");
      } catch {
        setLocationQuery(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
      } finally {
        setGeoLoading(false);
      }
    };

    if (gpsPosRef.current) {
      const { lat, lng } = gpsPosRef.current;
      setBuyerPos(gpsPosRef.current);
      setSearchCenter(gpsPosRef.current);
      setMapFlyTrigger((prev) => prev + 1);
      setLocationResults([]);
      setLocationNotFoundMsg("");
      setPincodeResults([]);
      setPincode("");
      setPincodeError("");
      setGeoError("");
      updateLocationFromCoords(lat, lng);
      setTimeout(scrollToResults, 100);
      return;
    }

    setGeoLoading(true);
    setGeoError("");

    const tryIpFallback = async () => {
      try {
        const fallback = await getIpFallback();
        if (fallback && fallback.source === "ip") {
          const nextPos = { lat: fallback.lat, lng: fallback.lng };
          setBuyerPos(nextPos);
          setSearchCenter(nextPos);
          setMapFlyTrigger((prev) => prev + 1);
          setLocationResults([]);
          setLocationNotFoundMsg("");
          setPincodeResults([]);
          setPincode("");
          setPincodeError("");
          setGeoError("");
          updateLocationFromCoords(nextPos.lat, nextPos.lng);
          toast.info("📍 Precision GPS unavailable. Using approximate IP-based location.");
          setTimeout(scrollToResults, 100);
          setGeoLoading(false);
          return true;
        }
      } catch (err) {
        console.error("IP fallback failed inside handler:", err);
      }
      return false;
    };

    if (!navigator.geolocation) {
      const ok = await tryIpFallback();
      if (!ok) {
        setShowLocationModal(true);
        setGeoLoading(false);
      }
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
        setSearchCenter(nextPos);
        setMapFlyTrigger((prev) => prev + 1);
        setLocationResults([]);
        setLocationNotFoundMsg("");
        setPincodeResults([]);
        setPincode("");
        setPincodeError("");
        setGeoError("");
        updateLocationFromCoords(nextPos.lat, nextPos.lng);
        setTimeout(scrollToResults, 100);
        setGeoLoading(false);
      },
      async (err) => {
        console.warn("GPS failed, trying IP fallback...", err);
        const ok = await tryIpFallback();
        if (!ok) {
          setShowLocationModal(true);
          setGeoError("Please turn on location and allow permissions to search automatically.");
          setGeoLoading(false);
        }
      },
      { enableHighAccuracy: true, timeout: 5000 },
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
    <div className={`qs-main-grid-layout ${showMap ? "" : "map-hidden"} animate-fade-in`}>
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
            className="qs-location-dropdown max-h-72 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-1.5 text-slate-800 shadow-2xl scrollbar-none"
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

      <div className="qs-grid-area-search">
        <div className="qs-search-panel-card">
          <div className="relative z-10 flex flex-col gap-5">
            {/* STEP 1: Service search (What service do you need?) */}
            <div className="relative" ref={serviceDropRef}>
              <label className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700">
                Service / सेवा
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
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
                  className="w-full rounded-xl bg-[#f8fafc] border border-slate-100 py-3.5 pl-11 pr-10 text-sm font-semibold text-slate-800 placeholder-slate-400 focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
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

            {/* Toggle for Advanced Filters & Location on Mobile */}
            <div className="lg:hidden flex items-center justify-between border-t border-slate-100 pt-3">
              <button
                type="button"
                onClick={() => setIsSearchExpanded((prev) => !prev)}
                className="flex items-center gap-1.5 text-xs font-black text-indigo-600 uppercase tracking-wider hover:underline cursor-pointer focus:outline-none"
              >
                <span>📍 Filters & Location {isSearchExpanded ? "▲" : "▼"}</span>
                <span className="text-[10px] text-slate-400 font-semibold lowercase">
                  ({locationQuery || "Current Loc"}, {radiusKm}km)
                </span>
              </button>
            </div>

            <div className={`${isSearchExpanded ? "block animate-fade-in-down animate-duration-150" : "hidden lg:block"} space-y-5`}>
              {/* STEP 2: Location selection & Pincode */}
              <form
                onSubmit={handleLocationSearchSubmit}
                className="relative isolate z-[70]"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-1">
                  {/* Location Input */}
                  <div ref={locationSearchRef} className="relative z-[2]">
                    <label className="relative z-[2] mb-2 block text-xs font-bold uppercase tracking-wider text-slate-700">
                      Location (Area / Landmark) / जगह
                    </label>
                    <div className="flex gap-2 items-center">
                      <div className="relative flex-1">
                        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-rose-500 text-sm">
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
                          className="w-full rounded-xl bg-[#f8fafc] border border-slate-100 py-3 pl-11 pr-10 text-sm font-semibold text-slate-800 placeholder-slate-400 focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10"
                          placeholder="Search Area or Landmark (e.g. Nikol)"
                        />
                        {locationQuery && (
                          <button
                            type="button"
                            onClick={clearLocationInput}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                            aria-label="Clear location"
                            title="Clear location"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                      <button
                        type="submit"
                        className="h-12 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl px-6 text-sm font-bold transition shadow-md shadow-indigo-600/10 cursor-pointer whitespace-nowrap"
                      >
                        {locationLoading ? "..." : "Search"}
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={handleUseMyLocation}
                      className="mt-2.5 inline-flex items-center gap-1.5 text-[10px] font-bold text-indigo-600 uppercase tracking-wider hover:underline"
                    >
                      <Crosshair className="h-3 w-3" />
                      USE CURRENT LOCATION
                    </button>
                  </div>

                  {/* Pincode Input */}
                  <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-700">
                      Pincode / पिनकोड
                    </label>
                    <div className="flex gap-2 items-center">
                      <div className="relative flex-1">
                        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                          📋
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
                          className="w-full rounded-xl bg-[#f8fafc] border border-slate-100 py-3 pl-11 pr-10 text-sm font-semibold text-slate-800 placeholder-slate-400 focus:border-indigo-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10"
                          placeholder="Enter 6-digit Pincode (e.g. 382350)"
                          maxLength={6}
                        />
                        {pincode && (
                          <button
                            type="button"
                            onClick={clearPincodeInput}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                            aria-label="Clear pincode"
                            title="Clear pincode"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={handlePincodeSearch}
                        disabled={pincode.length !== 6 || pincodeLoading}
                        className="h-12 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed text-slate-600 rounded-xl px-6 text-sm font-bold transition cursor-pointer"
                      >
                        {pincodeLoading ? "..." : "Go"}
                      </button>
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

              {/* Divider Line */}
              <div className="border-t border-slate-100 my-4" />

              {/* STEP 3: Range Slider and Filters */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                {/* Range Slider */}
                <div className="min-w-[240px] flex-1 max-w-xs">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Distance Range
                    </span>
                    <span className="text-[10px] font-bold bg-[#0284c7] px-2 py-0.5 rounded-md text-white">{radiusKm} km</span>
                  </div>
                  <div className="flex flex-col">
                    <input
                      type="range"
                      min={1}
                      max={20}
                      step={1}
                      value={radiusKm}
                      onChange={(e) => setRadiusKm(parseInt(e.target.value || "5", 10))}
                      className="qs-range w-full"
                      style={{
                        background: `linear-gradient(to right, #0284c7 0%, #0284c7 ${((radiusKm - 1) / 19) * 100}%, rgba(24,95,165,0.08) ${((radiusKm - 1) / 19) * 100}%, rgba(24,95,165,0.08) 100%)`,
                      }}
                    />
                    <span className="text-[9px] text-slate-400 mt-1 font-semibold">
                      → {radiusKm <= 5 ? "Nearby" : "Far"}
                    </span>
                  </div>
                </div>

                {/* Quick Filters & Refine button group */}
                <div className="flex flex-wrap items-center gap-4 lg:ml-auto">
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                      Filters / फ़िल्टर:
                    </span>
                    <div className="flex flex-wrap items-center gap-2">
                      {quickFilterItems.map(({ key, label, Icon }) => {
                        const active = quickFilters[key];
                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() => toggleQuickFilter(key)}
                            aria-pressed={active}
                            className={`qs-quick-filter-btn inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-xs font-semibold transition-all ${active ? "active" : ""
                              }`}
                          >
                            <Icon className="h-3.5 w-3.5" />
                            <span className="whitespace-nowrap">{label}</span>
                          </button>
                        );
                      })}

                      <button
                        type="button"
                        onClick={() => setFiltersOpen((prev) => !prev)}
                        className="qs-refine-toggle-btn inline-flex items-center justify-center gap-2 rounded-full px-5 py-2 text-xs font-bold cursor-pointer whitespace-nowrap ml-1"
                      >
                        <SlidersHorizontal className="h-3.5 w-3.5 shrink-0" />
                        <span>Refine Results</span>
                        {activeFilterCount > 0 && (
                          <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-white text-[10px] font-extrabold text-[#0f172a]">
                            {activeFilterCount}
                          </span>
                        )}
                        <ChevronDown className="h-3.5 w-3.5 shrink-0 transition-transform duration-200" style={{ transform: filtersOpen ? "rotate(180deg)" : "none" }} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Collapsible Refine Results filter options */}
              {filtersOpen && (
                <div className="qs-refine-panel rounded-xl border p-4 space-y-4">
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
                          className={`qs-refine-option-btn rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${filterPrice === opt.value ? "active" : ""
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
                          className={`qs-refine-option-btn rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${filterDuration === opt.value ? "active" : ""
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
                          className={`qs-refine-option-btn rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${filterBooking === opt.value ? "active" : ""
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
          </div>

          {geoError && (
            <p className="relative z-10 mt-3 rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
              ⚠ {geoError}
            </p>
          )}
        </div>
      </div>

      {/* Results Header: Stats and Map Option Toggle */}
      <div className="qs-grid-area-header">
        <div
          ref={resultsHeaderRef}
          style={{ scrollMarginTop: "90px" }}
          className="flex flex-wrap items-center justify-between gap-4 mt-6"
        >
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <div className="inline-flex items-center gap-1.5 bg-[#0f766e] text-white text-[11px] font-bold px-3 py-1 rounded-full">
              <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
              <span>Live</span>
            </div>
            <span className="text-sm font-bold text-slate-700">
              {nearby.length} provider{nearby.length !== 1 ? "s" : ""} within {radiusKm}km
            </span>
            {search && (
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 font-bold text-slate-600 text-[10px] uppercase tracking-wider">
                for "{search}"
              </span>
            )}
            {activeFilterCount > 0 && (
              <span className="rounded-full bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 font-bold text-indigo-600 text-[10px] uppercase tracking-wider">
                {activeFilterCount} filter{activeFilterCount > 1 ? "s" : ""} active
              </span>
            )}
          </div>

          {/* Map Option Toggle Button on the Top Side */}
          <button
            type="button"
            onClick={handleMapToggle}
            disabled={mapToggleLocked}
            className={`qs-map-toggle-btn inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold rounded-full border transition-all ${mapToggleLocked ? "cursor-wait opacity-70" : "cursor-pointer"
              } ${showMap ? "active" : ""}`}
          >
            <Map className="h-4 w-4 shrink-0" />
            <span>{showMap ? "Hide Map / नक्शा छुपाएं" : "Show Map / नक्शा दिखाएं"}</span>
          </button>
        </div>
      </div>

      {/* ============ MAP ============ */}
      <div
        className={`qs-grid-area-map w-full ${showMap ? "block animate-fade-in" : "hidden"}`}
        aria-hidden={!showMap}
      >
        <MapErrorBoundary>
          <div
            className="qs-map-frame relative isolate overflow-hidden rounded-3xl h-[300px] sm:h-[350px] lg:h-[520px]"
          >
            {/* Top-left: providers count */}
            <div className="pointer-events-none absolute left-3 top-3 z-[600]">
              <div className="qs-map-pill flex items-center gap-2">
                <Users className="h-4 w-4 text-[#0284c7] shrink-0" />
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
                <Radar className="h-4 w-4 text-emerald-500 animate-pulse shrink-0" />
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
                  <MapPin className="h-4 w-4 text-rose-500 shrink-0" />
                  <span className="text-xs font-semibold text-indigo-100">
                    You are here
                  </span>
                  <span className="text-[10px] text-indigo-300/80">
                    {buyerPos.lat.toFixed(3)}, {buyerPos.lng.toFixed(3)}
                  </span>
                </div>
              </div>
            )}

            {/* Search center badge (when map was clicked to different area) */}
            {searchCenter && buyerPos &&
              (Math.abs(searchCenter.lat - buyerPos.lat) > 0.0001 ||
                Math.abs(searchCenter.lng - buyerPos.lng) > 0.0001) && (
                <div className="pointer-events-none absolute bottom-14 left-1/2 z-[600] -translate-x-1/2">
                  <div className="qs-map-pill flex items-center gap-2 bg-indigo-900/80 border-indigo-400/40">
                    <Crosshair className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                    <span className="text-xs font-semibold text-emerald-300">
                      Searching here
                    </span>
                  </div>
                </div>
              )}

            {/* Floating Bottom-Right: Locate Me Button */}
            <div className="absolute bottom-3 right-3 z-[600]">
              <button
                type="button"
                onClick={handleUseMyLocation}
                disabled={geoLoading}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0284c7] text-white shadow-lg hover:bg-[#0284c7]/95 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
                title="Locate Me / मेरी स्थिति"
              >
                {geoLoading ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <Crosshair className="h-5 w-5 text-white" />
                )}
              </button>
            </div>

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
                searchCenter
                  ? [searchCenter.lat, searchCenter.lng]
                  : buyerPos
                    ? [buyerPos.lat, buyerPos.lng]
                    : [20.5937, 78.9629]
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
                center={
                  searchCenter
                    ? [searchCenter.lat, searchCenter.lng]
                    : buyerPos
                      ? [buyerPos.lat, buyerPos.lng]
                      : null
                }
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
                    center={[
                      searchCenter ? searchCenter.lat : buyerPos.lat,
                      searchCenter ? searchCenter.lng : buyerPos.lng,
                    ]}
                    radius={radiusKm * 1000}
                    pathOptions={{
                      color: "#818cf8",
                      weight: 2,
                      fillColor: "#6366f1",
                      fillOpacity: 0.12,
                    }}
                  />

                  {/* User GPS dot — always stays at buyerPos, never moves on map click */}
                  <Marker
                    position={[buyerPos.lat, buyerPos.lng]}
                    icon={USER_ICON}
                  />

                  {/* Show a crosshair marker at searchCenter when it differs from buyerPos */}
                  {searchCenter &&
                    (Math.abs(searchCenter.lat - buyerPos.lat) > 0.0001 ||
                      Math.abs(searchCenter.lng - buyerPos.lng) > 0.0001) && (
                      <Marker
                        position={[searchCenter.lat, searchCenter.lng]}
                        icon={L.divIcon({
                          className: "search-center-pin",
                          html: `<div style="width:18px;height:18px;border:3px solid #10b981;border-radius:50%;background:rgba(16,185,129,0.2);box-shadow:0 0 8px rgba(16,185,129,0.5);"></div>`,
                          iconSize: [18, 18],
                          iconAnchor: [9, 9],
                        })}
                      />
                    )}
                </>
              )}
            </MapContainer>
          </div>
        </MapErrorBoundary>
      </div>

      {/* ============ PROVIDER LIST ============ */}
      <div className="qs-grid-area-list w-full">
        <div
          key={`${searchCenter?.lat}-${searchCenter?.lng}-${search}-${nearby.length}`}
          className={`qs-list pb-2 pr-3 ${showMap
            ? "space-y-4 max-h-[300px] sm:max-h-[350px] overflow-y-auto mt-4 lg:mt-0 lg:block lg:h-[520px] lg:max-h-none lg:space-y-5 lg:overflow-y-auto lg:overflow-x-hidden lg:pb-0 lg:snap-none"
            : "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-5 lg:max-h-[520px] lg:overflow-y-auto"
            }`}
        >
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

          {nearby.slice(0, visibleCount).map((seller, idx) => {
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
                className={`qs-card group cursor-pointer w-full lg:w-auto ${isSelected ? "qs-card-active" : ""
                  }`}
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
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1565C0] font-bold text-white text-sm qs-avatar-default">
                        {seller.name?.[0]?.toUpperCase() || "?"}
                      </div>
                    )}
                    {/* Availability status dot badge */}
                    <span
                      className={`absolute -bottom-0.5 -right-0.5 block h-3 w-3 rounded-full border-2 border-white shadow-[0_1px_3.5px_rgba(0,0,0,0.15)] ${isAvailable ? "bg-[#1E8E5A] qs-status-available" : "bg-[#e53935] qs-status-unavailable"
                        }`}
                      title={isAvailable ? "Available" : "Unavailable"}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <h4 className="truncate text-[15px] font-bold text-slate-800">
                        {seller.name}
                      </h4>
                    </div>
                    <div className="truncate text-xs font-medium text-slate-500 mt-0.5">
                      {seller.service}
                    </div>
                  </div>
                  <div className="qs-custom-distance-badge">
                    <span className="text-[10px] opacity-80">📍</span>
                    <span>{`${distanceLabel}km away`}</span>
                  </div>
                </div>

                {/* Address */}
                <div className="mt-3.5 flex items-start gap-1.5 text-xs text-slate-500">
                  <span className="mt-0.5 opacity-70">📍</span>
                  <span className="truncate">{seller.address}</span>
                </div>

                {/* Badge row */}
                <div className="mt-3.5 flex flex-wrap gap-2">
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
                      className="qs-custom-instant-badge"
                      title="⚡ Instant Service"
                    >
                      <span className="qs-custom-instant-badge-dot" />
                      <span>⚡ Instant Service</span>
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
                  className="btn qs-seller-card-btn mt-5 block w-full rounded-xl py-2.5 text-center text-xs font-bold"
                >
                  View Profile / प्रोफ़ाइल देखें →
                </a>
              </div>
            );
          })}

          {/* Show More Trigger & Seller Ads Placeholder */}
          {nearby.length > 0 && (
            <>
              {/* Show More Trigger */}
              {nearby.length > visibleCount && (
                <>
                  {/* Mobile horizontal scroll Card (only when map is showing) */}
                  {showMap ? (
                    <div className="rounded-2xl border border-dashed border-slate-200 flex flex-col items-center justify-center p-6 text-center bg-white lg:hidden w-full qs-card">
                      <span className="text-2xl mb-2">⚡</span>
                      <h5 className="text-sm font-bold text-slate-800 mb-1">More Partners Found</h5>
                      <p className="text-xs text-slate-400 mb-4">View more local service providers near you</p>
                      <button
                        onClick={() => setVisibleCount((prev) => prev + 5)}
                        className="btn qs-seller-card-btn px-5 py-2 text-xs font-bold rounded-xl cursor-pointer"
                      >
                        Show More
                      </button>
                    </div>
                  ) : null}

                  {/* Desktop button or grid full-width button */}
                  <div className={`mt-4 ${showMap
                    ? "hidden lg:block w-full"
                    : "w-full col-span-full flex justify-center mt-6"
                    }`}>
                    <button
                      type="button"
                      onClick={() => setVisibleCount((prev) => prev + 5)}
                      className="btn qs-seller-card-btn w-full py-3 text-xs font-bold rounded-xl text-center"
                    >
                      Show More Services / और दिखाएं ↓
                    </button>
                  </div>
                </>
              )}

              {/* Seller Advertisement container */}
              {showMap ? (
                /* Mobile vertical scroll ad card */
                <div className="qs-featured-ad-card w-full text-center flex flex-col justify-between lg:hidden">
                  <div>
                    <span className="qs-tag qs-tag-amber text-[9px] uppercase tracking-wider mb-2 font-bold">Sponsored Slot</span>
                    <h5 className="text-[15px] font-bold text-slate-800 mt-2.5">Advertise Here</h5>
                    <p className="text-[12px] text-slate-500 mt-2 leading-relaxed">
                      Boost your visibility and reach thousands of customers in your local area.
                    </p>
                  </div>
                  <a
                    href="/advertise"
                    onClick={(e) => { e.preventDefault(); alert("Advertise features coming soon!"); }}
                    className="btn qs-seller-card-btn py-2 text-xs font-bold rounded-xl mt-4 block"
                  >
                    Join as Partner
                  </a>
                </div>
              ) : null}

              {/* Desktop list ad banner or Grid layout ad banner */}
              <div className={`mt-8 ${showMap
                ? "hidden lg:block w-full mt-7"
                : "w-full col-span-full mt-10"
                }`}>
                <div className="qs-featured-ad-banner text-center flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-left">
                    <span className="qs-tag qs-tag-amber text-[9px] uppercase tracking-wider font-bold">Featured Slot</span>
                    <h5 className="text-base font-bold text-slate-800 mt-1.5">Want to grow your local service business?</h5>
                    <p className="text-[13px] text-slate-500 mt-1">
                      Advertise your services here and get up to 5x more customer bookings.
                    </p>
                  </div>
                  <a
                    href="/advertise"
                    onClick={(e) => { e.preventDefault(); alert("Advertise features coming soon!"); }}
                    className="btn qs-seller-card-btn px-6 py-2.5 text-xs font-bold rounded-xl whitespace-nowrap"
                  >
                    Advertise with Us
                  </a>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      <LocationErrorModal
        isOpen={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        onRetry={async () => {
          setShowLocationModal(false);
          await handleUseMyLocation();
        }}
      />
    </div>
  );
}
