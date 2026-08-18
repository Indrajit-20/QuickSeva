// QuickSeva - Map Performance Feature
import React, { Component, useEffect, useMemo, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { API_BASE_URL } from "../config/api";
import { useNearbyLocation } from "../hooks/useNearbyLocation";
import { useSocket } from "../context/SocketContext";

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
  Globe,
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
  Search,
  Hash,
  SlidersHorizontal,
  ChevronDown,
  ChevronRight,
  Map,
  Lock,
  Unlock,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { useSearchParams } from "react-router-dom";

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

function MapRadiusController({ radiusKm, center }) {
  const map = useMap();
  const prevRadiusRef = useRef(radiusKm);
  const prevCenterRef = useRef(center);

  useEffect(() => {
    if (!map || !center || center.lat === undefined || center.lng === undefined) return;

    const radiusChanged = prevRadiusRef.current !== radiusKm;
    const centerChanged =
      !prevCenterRef.current ||
      Math.abs(prevCenterRef.current.lat - center.lat) > 0.0001 ||
      Math.abs(prevCenterRef.current.lng - center.lng) > 0.0001;

    if (radiusChanged || centerChanged) {
      prevRadiusRef.current = radiusKm;
      prevCenterRef.current = center;

      const bounds = L.latLng(center.lat, center.lng).toBounds(radiusKm * 1000);
      map.fitBounds(bounds, { animate: true, duration: 0.8, maxZoom: 16 });
    }
  }, [radiusKm, center, map]);

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

// Sub-component to dynamically adjust map interaction on mobile devices
function MapInteractionController({ isMobile, isMapUnlocked }) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;
    if (isMobile) {
      if (isMapUnlocked) {
        map.dragging.enable();
        map.touchZoom.enable();
        map.doubleClickZoom.enable();
        if (map.tap) map.tap.enable();
      } else {
        map.dragging.disable();
        map.touchZoom.disable();
        map.doubleClickZoom.disable();
        if (map.tap) map.tap.disable();
      }
    } else {
      map.dragging.enable();
      map.touchZoom.enable();
      map.doubleClickZoom.enable();
      if (map.tap) map.tap.enable();
    }
  }, [map, isMobile, isMapUnlocked]);

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


const getSavedSearchState = () => {
  try {
    const raw = sessionStorage.getItem("qs_nearby_search_cache");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export default function NearbyServices({
  initialSearch = "",
  centerLat = null,
  centerLon = null,
  locationFilter = "",
  lockScrollOnMobile = false,
}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const savedSearchState = useMemo(() => getSavedSearchState(), []);

  // buyerPos = user's actual GPS/set location (for the "You are here" marker & radius)
  // searchCenter = the map view center (changes on map pan, does NOT move the user marker)
  const [buyerPos, setBuyerPos] = useState(() => {
    const lat = searchParams.get("lat");
    const lng = searchParams.get("lng");
    if (lat && lng) return { lat: Number(lat), lng: Number(lng) };
    return savedSearchState?.buyerPos || null;
  });
  const [searchCenter, setSearchCenter] = useState(() => {
    const lat = searchParams.get("lat");
    const lng = searchParams.get("lng");
    if (lat && lng) return { lat: Number(lat), lng: Number(lng) };
    return savedSearchState?.searchCenter || null;
  });
  const [mapFlyTrigger, setMapFlyTrigger] = useState(0);
  const [geoError, setGeoError] = useState("");
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showMap, setShowMap] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isMapUnlocked, setIsMapUnlocked] = useState(false);
  const [isMapFullScreen, setIsMapFullScreen] = useState(false);

  const [showLocationDrawer, setShowLocationDrawer] = useState(false);
  const [filtersDrawerOpen, setFiltersDrawerOpen] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const isMobileSize = window.innerWidth < 1024;
      const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      setIsMobile(isMobileSize || isMobileUA);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    if (isMobile && lockScrollOnMobile) {
      document.body.classList.add("mobile-map-active");
      return () => {
        document.body.classList.remove("mobile-map-active");
      };
    }
  }, [isMobile, lockScrollOnMobile]);

  useEffect(() => {
    if (isMobile && (showLocationDrawer || filtersDrawerOpen || isMapFullScreen)) {
      document.body.style.overflow = "hidden";
      document.body.style.position = "fixed";
      document.body.style.width = "100%";
      document.body.style.height = "100%";
    } else {
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.width = "";
      document.body.style.height = "";
    }
    return () => {
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.width = "";
      document.body.style.height = "";
    };
  }, [isMobile, showLocationDrawer, filtersDrawerOpen, isMapFullScreen]);

  const [search, setSearch] = useState(() => {
    const urlVal = searchParams.get("q");
    if (urlVal !== null) return urlVal;
    return savedSearchState?.search !== undefined ? savedSearchState.search : initialSearch;
  });
  const [locationQuery, setLocationQuery] = useState(() => {
    const urlVal = searchParams.get("location");
    if (urlVal !== null) return urlVal;
    return savedSearchState?.locationQuery || "";
  });
  const [showServiceDrop, setShowServiceDrop] = useState(false);
  const desktopServiceDropRef = useRef(null);
  const mobileServiceDropRef = useRef(null);
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
    setTimeout(scrollToResults, 100);
  };

  useEffect(() => {
    const handleMouseDown = (e) => {
      const inDesktop = desktopServiceDropRef.current && desktopServiceDropRef.current.contains(e.target);
      const inMobile = mobileServiceDropRef.current && mobileServiceDropRef.current.contains(e.target);
      if (!inDesktop && !inMobile) {
        setShowServiceDrop(false);
      }
    };
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, []);

  const { address: detectedAddress } = useNearbyLocation();

  useEffect(() => {
    if (detectedAddress && !locationQuery && !savedSearchState?.locationQuery) {
      setLocationQuery(detectedAddress);
    }
  }, [detectedAddress, locationQuery, savedSearchState]);

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

  const [locationMode, setLocationMode] = useState(() => {
    const urlVal = searchParams.get("pincode") ? "pincode" : null;
    if (urlVal) return urlVal;
    return savedSearchState?.locationMode || "area";
  }); // "area" | "pincode"
  const [pincode, setPincode] = useState(() => {
    const urlVal = searchParams.get("pincode");
    if (urlVal !== null) return urlVal;
    return savedSearchState?.pincode || "";
  });
  const [pincodeLoading, setPincodeLoading] = useState(false);
  const [pincodeError, setPincodeError] = useState("");
  const [pincodeResults, setPincodeResults] = useState([]);

  const [selectedSellerId, setSelectedSellerId] = useState(() => {
    const urlVal = searchParams.get("selectedSellerId");
    if (urlVal !== null) return Number(urlVal);
    return savedSearchState?.selectedSellerId || null;
  });

  useEffect(() => {
    if (selectedSellerId) {
      const el = document.getElementById(`seller-card-${selectedSellerId}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    }
  }, [selectedSellerId]);

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

  const [radiusKm, setRadiusKm] = useState(() => {
    const urlVal = searchParams.get("radius");
    if (urlVal !== null) return Number(urlVal);
    return savedSearchState?.radiusKm !== undefined ? Number(savedSearchState.radiusKm) : 5;
  });

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


  // Restore scroll position when returning from seller profile
  useEffect(() => {
    try {
      const scrollKey = `qs_nearby_scroll_pos_${window.location.pathname}${window.location.search}`;
      const savedPos = sessionStorage.getItem(scrollKey);
      if (savedPos && !isNaN(Number(savedPos))) {
        setTimeout(() => {
          window.scrollTo({ top: Number(savedPos), behavior: "smooth" });
          sessionStorage.removeItem(scrollKey);
        }, 400);
      }
    } catch { }
  }, [searchParams]);

  const navigateToSeller = (seller) => {
    const sId = seller?.id || seller?.sellerId;
    if (!sId) return;
    try {
      const scrollKey = `qs_nearby_scroll_pos_${window.location.pathname}${window.location.search}`;
      sessionStorage.setItem(scrollKey, window.scrollY.toString());
      sessionStorage.setItem(
        "qs_nearby_search_cache",
        JSON.stringify({
          locationQuery,
          buyerPos,
          searchCenter,
          search,
          radiusKm,
          pincode,
          locationMode,
          selectedSellerId: sId,
          sellers,
        })
      );
    } catch { }
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
  const suppressNextLocationSearchRef = useRef(Boolean(savedSearchState));
  const lastWrittenParamsRef = useRef(searchParams ? searchParams.toString() : "");
  const debounceTimerRef = useRef(null);
  const lastFetchedBoundsRef = useRef(null);
  const pendingBoundsRef = useRef(null);

  const nominatimSearch = async (q) => {
    const trimmed = String(q || "").trim();
    let queryParam = trimmed;
    if (/^\d{6}$/.test(trimmed)) {
      queryParam = `${trimmed}, India`;
    }

    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
        queryParam,
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

    // If query is a 6-digit pincode, handle as postal code directly without area error
    if (/^\d{6}$/.test(trimmed)) {
      setLocationNotFoundMsg("");
      return;
    }

    setLocationLoading(true);
    try {
      const results = await smartSearch(trimmed);
      if (!results || results.length === 0) {
        setLocationResults([]);
        return;
      }
      setLocationResults(results);
      setLocationNotFoundMsg("");
    } catch {
      setLocationResults([]);
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
    }, 300);
    return () => clearTimeout(timer);
  }, [locationQuery, locationMode]);

  useEffect(() => {
    if (!selectedSellerId) return;
    const el = document.getElementById(`seller-card-${selectedSellerId}`);
    el?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [selectedSellerId]);

  const [sellers, setSellers] = useState(() => savedSearchState?.sellers || []);
  const [apiLoading, setApiLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);

  const selectedSeller = useMemo(() => {
    return sellers.find((s) => (s.id || s.sellerId) === selectedSellerId);
  }, [sellers, selectedSellerId]);

  // Save search state cache on every state change
  useEffect(() => {
    try {
      sessionStorage.setItem(
        "qs_nearby_search_cache",
        JSON.stringify({
          locationQuery,
          buyerPos,
          searchCenter,
          search,
          radiusKm,
          pincode,
          locationMode,
          selectedSellerId,
          sellers,
        })
      );
    } catch { }
  }, [locationQuery, buyerPos, searchCenter, search, radiusKm, pincode, locationMode, selectedSellerId, sellers]);

  // Synchronize state changes to URL search parameters (debounced by 400ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        let changed = false;

        // Sync category search
        if (search) {
          if (next.get("q") !== search) {
            next.set("q", search);
            changed = true;
          }
        } else if (next.has("q")) {
          next.delete("q");
          changed = true;
        }

        // Sync location text query
        if (locationQuery) {
          if (next.get("location") !== locationQuery) {
            next.set("location", locationQuery);
            changed = true;
          }
        } else if (next.has("location")) {
          next.delete("location");
          changed = true;
        }

        // Sync pincode
        if (pincode) {
          if (next.get("pincode") !== pincode) {
            next.set("pincode", pincode);
            changed = true;
          }
        } else if (next.has("pincode")) {
          next.delete("pincode");
          changed = true;
        }

        // Sync radius
        const radStr = String(radiusKm);
        if (next.get("radius") !== radStr) {
          next.set("radius", radStr);
          changed = true;
        }

        // Sync selected seller if present
        if (selectedSellerId) {
          const sellerIdStr = String(selectedSellerId);
          if (next.get("selectedSellerId") !== sellerIdStr) {
            next.set("selectedSellerId", sellerIdStr);
            changed = true;
          }
        } else if (next.has("selectedSellerId")) {
          next.delete("selectedSellerId");
          changed = true;
        }

        // Sync coordinates (lat/lng)
        if (searchCenter?.lat && searchCenter?.lng) {
          const latStr = String(searchCenter.lat);
          const lngStr = String(searchCenter.lng);
          if (next.get("lat") !== latStr || next.get("lng") !== lngStr) {
            next.set("lat", latStr);
            next.set("lng", lngStr);
            changed = true;
          }
        }

        if (changed) {
          lastWrittenParamsRef.current = next.toString();
          return next;
        }
        return prev;
      }, { replace: true });
    }, 400);

    return () => clearTimeout(timer);
  }, [search, locationQuery, pincode, radiusKm, selectedSellerId, searchCenter, setSearchParams]);

  // Sync changes from URL parameters back to React state (e.g. on Back/Forward button click)
  useEffect(() => {
    const currentParamsStr = searchParams.toString();
    if (currentParamsStr === lastWrittenParamsRef.current) {
      return;
    }
    lastWrittenParamsRef.current = currentParamsStr;

    const q = searchParams.get("q") || "";
    const loc = searchParams.get("location") || "";
    const pin = searchParams.get("pincode") || "";
    const rad = Number(searchParams.get("radius") || 5);
    const selId = searchParams.get("selectedSellerId") ? Number(searchParams.get("selectedSellerId")) : null;
    const lat = searchParams.get("lat") ? Number(searchParams.get("lat")) : null;
    const lng = searchParams.get("lng") ? Number(searchParams.get("lng")) : null;

    if (q !== search) setSearch(q);
    if (loc !== locationQuery) setLocationQuery(loc);
    if (pin !== pincode) setPincode(pin);
    if (rad !== radiusKm) setRadiusKm(rad);
    if (selId !== selectedSellerId) setSelectedSellerId(selId);

    if (lat && lng && (lat !== buyerPos?.lat || lng !== buyerPos?.lng)) {
      const nextPos = { lat, lng };
      setBuyerPos(nextPos);
      setSearchCenter(nextPos);
    }
  }, [searchParams]);

  useEffect(() => {
    try {
      localStorage.removeItem("sellers");
    } catch (e) { }
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // QuickSeva - Map Performance Feature
  const fetchSellersInView = useCallback(async (map) => {
    if (!map) return;
    try {
      const bounds = map.getBounds();
      const minLat = bounds.getSouthWest().lat;
      const maxLat = bounds.getNorthEast().lat;
      const minLng = bounds.getSouthWest().lng;
      const maxLng = bounds.getNorthEast().lng;

      const currentBoundsStr = `${minLat.toFixed(6)},${maxLat.toFixed(6)},${minLng.toFixed(6)},${maxLng.toFixed(6)}`;
      if (lastFetchedBoundsRef.current === currentBoundsStr) {
        return; // Skip if identical bounds were already fetched
      }
      if (pendingBoundsRef.current === currentBoundsStr) {
        return; // Skip if we already scheduled a fetch for this exact viewpoint
      }

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      pendingBoundsRef.current = currentBoundsStr;

      debounceTimerRef.current = setTimeout(async () => {
        setApiLoading(true);
        setApiError("");
        try {
          const res = await fetch(
            `${API_BASE_URL}/sellers/in-view?minLat=${minLat}&maxLat=${maxLat}&minLng=${minLng}&maxLng=${maxLng}`
          );
          if (!res.ok) throw new Error("Failed to fetch sellers in view");
          const data = await res.json();
          // Deduplicate incoming sellers by ID
          const seenSellerIds = new Set();
          const uniqueSellersList = [];
          (data || []).forEach((item) => {
            const sId = item.id || item.sellerId;
            if (sId && !seenSellerIds.has(sId)) {
              seenSellerIds.add(sId);
              uniqueSellersList.push(item);
            }
          });
          if (uniqueSellersList.length > 0) {
            setSellers(uniqueSellersList);
          } else {
            setSellers((prev) => (prev && prev.length > 0 ? prev : []));
          }
          lastFetchedBoundsRef.current = currentBoundsStr;
        } catch (err) {
          console.error("fetchSellersInView error:", err);
          setApiError("Unable to load services in view. Please try again later.");
        } finally {
          setApiLoading(false);
          pendingBoundsRef.current = null;
        }
      }, 400);
    } catch (err) {
      console.error("fetchSellersInView setup error:", err);
    }
  }, []);

  const { socket } = useSocket();

  useEffect(() => {
    if (!socket) return;
    const handleAvailabilityChanged = (data) => {
      if (data && (data.seller_id || data.user_id)) {
        setSellers((prevSellers) =>
          prevSellers.map((s) => {
            const sid = s.id || s.sellerId || s.seller_id;
            const uid = s.user_id || s.userId;
            if (String(sid) === String(data.seller_id) || (uid && String(uid) === String(data.user_id))) {
              return { ...s, is_available: data.is_available ? 1 : 0, isAvailable: data.is_available };
            }
            return s;
          })
        );
      }
    };
    socket.on("seller_availability_changed", handleAvailabilityChanged);
    return () => {
      socket.off("seller_availability_changed", handleAvailabilityChanged);
    };
  }, [socket]);

  // Auto-zoom map camera when search radius expands so sellers in expanded area are fetched & displayed
  useEffect(() => {
    if (mapRef.current && buyerPos) {
      let targetZoom = 13;
      if (radiusKm >= 50) targetZoom = 8;
      else if (radiusKm >= 35) targetZoom = 9;
      else if (radiusKm >= 20) targetZoom = 11;
      else if (radiusKm >= 10) targetZoom = 12;

      try {
        mapRef.current.setView([buyerPos.lat, buyerPos.lng], targetZoom, { animate: true });
      } catch (e) {
        console.warn("Map view auto-zoom warning:", e);
      }
    }
  }, [radiusKm, buyerPos]);

  const onMapReady = useCallback(async (map) => {
    setMapInitialized(true);
    setGeoLoading(true);
    try {
      // 1. Prioritize URL coordinates first
      const urlLat = searchParams.get("lat") ? Number(searchParams.get("lat")) : null;
      const urlLng = searchParams.get("lng") ? Number(searchParams.get("lng")) : null;

      if (urlLat && urlLng) {
        const pos = { lat: urlLat, lng: urlLng };
        setBuyerPos(pos);
        setSearchCenter(pos);
        map.setView([urlLat, urlLng], 13);
        await fetchSellersInView(map);
        return;
      }

      // 2. Check saved session state next
      const savedState = getSavedSearchState();
      if (savedState?.buyerPos && savedState?.searchCenter) {
        setBuyerPos(savedState.buyerPos);
        setSearchCenter(savedState.searchCenter);
        map.setView([savedState.searchCenter.lat, savedState.searchCenter.lng], 13);
        await fetchSellersInView(map);
        return;
      }

      // 3. Fallback to GPS / IP location
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
  }, [fetchSellersInView, searchParams, toast]);

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
        .on("popupclose", () => {
          setSelectedSellerId(null);
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
          if (svcs.length > 0) {
            return svcs.some((svc) => {
              const p = Number(svc?.price || 0);
              if (filterPrice === "under500") return p > 0 && p < 500;
              if (filterPrice === "500-1000") return p >= 500 && p <= 1000;
              if (filterPrice === "1000-2000") return p > 1000 && p <= 2000;
              if (filterPrice === "2000+") return p > 2000;
              return true;
            });
          }
          // Fallback to seller direct prices (min_price, starting_price, price, visiting_charge)
          const p = Number(s?.price || s?.min_price || s?.starting_price || s?.visiting_charge || s?.visiting_charge_amount || 0);
          if (p <= 0) return true; // Keep partner if no price metadata is attached
          if (filterPrice === "under500") return p < 500;
          if (filterPrice === "500-1000") return p >= 500 && p <= 1000;
          if (filterPrice === "1000-2000") return p >= 1000 && p <= 2000;
          if (filterPrice === "2000+") return p > 2000;
          return true;
        });

    // ── NEW: duration bucket filter ──────────────────────────────────────
    const filteredByDuration =
      filterDuration === "all"
        ? filteredByPrice
        : filteredByPrice.filter((s) => {
          const svcs = Array.isArray(s?.services) ? s.services : [];
          if (!svcs.length) return true;
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

    const sortedList = filteredByQuick.sort((a, b) => {
      if (quickFilters.nearest) return a.distanceKm - b.distanceKm;
      const rankA = getSellerPackageRank(a);
      const rankB = getSellerPackageRank(b);
      if (rankA !== rankB) return rankB - rankA;
      return a.distanceKm - b.distanceKm;
    });

    const seenNearbyIds = new Set();
    const uniqueNearbyList = [];
    sortedList.forEach((item) => {
      const sId = item.id || item.sellerId;
      if (sId && !seenNearbyIds.has(sId)) {
        seenNearbyIds.add(sId);
        uniqueNearbyList.push(item);
      }
    });
    return uniqueNearbyList;
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
    if (e?.preventDefault) e.preventDefault();
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
          const cleanLocTitle = r.display_name.split(",").slice(0, 2).join(", ");
          setLocationQuery(cleanLocTitle.includes(val) ? cleanLocTitle : `${cleanLocTitle} (${val})`);
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

  const handlePincodeSearch = async (targetPin) => {
    const pinToUse = typeof targetPin === "string" ? targetPin : pincode;
    const trimmed = pinToUse.trim();
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
        const cleanLocTitle = r.display_name.split(",").slice(0, 2).join(", ");
        setLocationQuery(cleanLocTitle.includes(trimmed) ? cleanLocTitle : `${cleanLocTitle} (${trimmed})`);
        setLocationResults([]);
        setLocationNotFoundMsg("");
        setGeoError("");
        if (typeof document !== "undefined" && document.activeElement && typeof document.activeElement.blur === "function") {
          document.activeElement.blur();
        }
        setShowLocationDrawer(false);
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

  const handleUnifiedSearchSubmit = async (e) => {
    if (e) e.preventDefault();
    if (pincode.trim().length === 6) {
      await handlePincodeSearch();
    } else {
      await handleLocationSearchSubmit(e);
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
    setShowMap((prev) => {
      const nextVal = !prev;
      if (!nextVal) {
        setIsMapUnlocked(false);
        setIsMapFullScreen(false);
      }
      return nextVal;
    });
    window.setTimeout(() => setMapToggleLocked(false), 300);
  }, [mapToggleLocked]);

  const handleCloseMap = useCallback(() => {
    if (isMapFullScreen) {
      setIsMapFullScreen(false);
      if (isMobile) {
        setIsMapUnlocked(false);
      }
    } else {
      handleMapToggle();
    }
  }, [isMapFullScreen, isMobile, handleMapToggle]);

  useEffect(() => {
    if (!showMap || !mapRef.current) return;
    const timer = window.setTimeout(() => {
      mapRef.current?.invalidateSize?.();
    }, 100);
    return () => window.clearTimeout(timer);
  }, [showMap, isMapFullScreen]);

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
    <div className={`qs-main-grid-layout ${showMap ? "" : "map-hidden"} ${isMapFullScreen ? "" : "animate-fade-in"}`}>
      {/* QuickSeva - Map Performance Feature: Floating Toast Message */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-[9999] flex items-center gap-2 rounded-xl bg-blue-600 border border-blue-400/30 px-4 py-3 text-sm font-semibold text-white shadow-lg backdrop-blur-md">
          <span>{toastMessage}</span>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="ml-2 text-blue-200 hover:text-white font-bold text-lg leading-none cursor-pointer"
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

      <div className={`qs-grid-area-search ${isMapFullScreen ? "hidden" : "block"}`}>
        <div className="qs-search-panel-card">
          <div className="relative z-10 flex flex-col gap-4">
            {/* Title & Subtitle */}
            <div className="mb-1 hidden lg:block">
              <h3 className="text-base font-semibold text-slate-800 tracking-tight flex items-center gap-2">
                Services Near You
                <span className="text-slate-400 font-normal text-[13px]">/</span>
                <span className="text-slate-600 font-medium text-[13px]">आपके आस-पास सेवाएँ</span>
              </h3>
              <p className="text-xs text-slate-400 font-normal mt-0.5">
                Find trusted local experts for all your home needs.
              </p>
            </div>

            {/* Desktop Unified Search Capsule Form */}
            <form onSubmit={handleUnifiedSearchSubmit} className="hidden lg:block relative z-[70] w-full">
              <div className="flex flex-col lg:flex-row items-stretch gap-2.5 bg-slate-50/50 p-2.5 rounded-2xl border border-slate-200/80">
                {/* Input 1: Service search */}
                <div className="relative flex-[2.5] min-w-0" ref={desktopServiceDropRef}>
                  <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-455 h-4.5 w-4.5" />
                  <input
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setShowServiceDrop(true);
                    }}
                    onFocus={() => setShowServiceDrop(true)}
                    placeholder="Search services (e.g. Plumber, AC Repair, Cleaning...)"
                    className="w-full rounded-xl bg-white border border-slate-200 py-3 pl-11 pr-8 text-[13px] font-normal text-slate-700 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
                    style={{ paddingLeft: "2.75rem", paddingRight: "2.5rem" }}
                  />
                  {search && (
                    <button
                      type="button"
                      onClick={() => setSearch("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center p-1 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition cursor-pointer"
                      aria-label="Clear search"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                  {showServiceDrop && filteredServiceSuggestions.length > 0 && (
                    <div className="absolute left-0 right-0 top-full z-[100] mt-2 max-h-[220px] overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-2xl p-1.5 scrollbar-none">
                      {filteredServiceSuggestions.map((item) => {
                        const IconComponent = getServiceIcon(item);
                        return (
                          <button
                            key={item}
                            type="button"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleServiceSelect(item);
                            }}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleServiceSelect(item);
                            }}
                            className="w-full rounded-lg px-3.5 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors duration-150 cursor-pointer flex items-center gap-2"
                          >
                            <IconComponent className="h-4 w-4 text-blue-500 shrink-0" />
                            <span>{item}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Collapsible/Desktop inputs */}
                <div className="flex flex-col lg:flex-row flex-1 lg:flex-[2.8] items-stretch gap-2.5">
                  {/* Input 2: Location */}
                  <div ref={locationSearchRef} className="relative flex-[1.8] min-w-0">
                    <MapPin className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-rose-500 h-4.5 w-4.5" />
                    <input
                      value={locationQuery}
                      onChange={(e) => {
                        suppressNextLocationSearchRef.current = false;
                        setLocationQuery(e.target.value);
                      }}
                      onFocus={() => {
                        suppressNextLocationSearchRef.current = false;
                        if (locationQuery.trim().length >= 3) {
                          searchLocation(locationQuery);
                        }
                      }}
                      autoComplete="off"
                      className="w-full rounded-xl bg-white border border-slate-200 py-3 pl-11 pr-8 text-sm font-semibold text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
                      placeholder="Area or Landmark"
                      style={{ paddingLeft: "2.75rem", paddingRight: "2.5rem" }}
                    />
                    {locationQuery && (
                      <button
                        type="button"
                        onClick={clearLocationInput}
                        className="absolute right-3 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center p-1 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition cursor-pointer"
                        aria-label="Clear location"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  {/* Input 3: Pincode */}
                  <div className="relative flex-[1] min-w-0">
                    <Hash className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-455 h-4.5 w-4.5" />
                    <input
                      value={pincode}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, "").slice(0, 6);
                        setPincode(val);
                        setPincodeError("");
                        setLocationNotFoundMsg("");
                      }}
                      className="w-full rounded-xl bg-white border border-slate-200 py-3 pl-11 pr-8 text-sm font-semibold text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
                      placeholder="Pincode"
                      maxLength={6}
                      style={{ paddingLeft: "2.75rem", paddingRight: "2.5rem" }}
                    />
                    {pincode && (
                      <button
                        type="button"
                        onClick={clearPincodeInput}
                        className="absolute right-3 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center p-1 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition cursor-pointer"
                        aria-label="Clear pincode"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Search Button */}
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-5 py-3 text-sm font-bold transition shadow-md shadow-blue-600/15 cursor-pointer flex items-center justify-center gap-2 self-stretch lg:self-auto min-h-[44px]"
                  disabled={locationLoading || pincodeLoading}
                >
                  {locationLoading || pincodeLoading ? (
                    <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Search className="h-4.5 w-4.5 shrink-0" />
                      <span>Search</span>
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Mobile-only Unified Search Layout */}
            <div className="lg:hidden relative w-full">
              <form onSubmit={handleUnifiedSearchSubmit} className="relative z-[70] w-full">
                <div className="flex items-stretch gap-2 w-full">
                  <div className="relative flex-1 min-w-0" ref={mobileServiceDropRef}>
                    <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                    <input
                      value={search}
                      onChange={(e) => {
                        setSearch(e.target.value);
                        setShowServiceDrop(true);
                      }}
                      onFocus={() => setShowServiceDrop(true)}
                      placeholder="Search services (e.g. Plumber, AC Repair...)"
                      className="w-full rounded-xl bg-slate-50 border border-slate-200/80 py-2.5 pl-9 pr-8 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:bg-white focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
                      style={{ paddingLeft: "2.25rem" }}
                    />
                    {search && (
                      <button
                        type="button"
                        onClick={() => setSearch("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-455 hover:text-slate-655 cursor-pointer"
                      >
                        ✕
                      </button>
                    )}
                    {showServiceDrop && filteredServiceSuggestions.length > 0 && (
                      <div className="absolute left-0 right-0 top-full z-[100] mt-1 max-h-[180px] overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-2xl p-1.5 scrollbar-none">
                        {filteredServiceSuggestions.map((item) => {
                          const IconComponent = getServiceIcon(item);
                          return (
                            <button
                              key={item}
                              type="button"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleServiceSelect(item);
                              }}
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleServiceSelect(item);
                              }}
                              className="w-full rounded-lg px-3 py-1.5 text-left text-xs text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors duration-150 cursor-pointer flex items-center gap-2"
                            >
                              <IconComponent className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                              <span>{item}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-4 py-2.5 text-xs font-bold transition shadow-md shadow-blue-600/15 cursor-pointer flex items-center justify-center min-h-[38px] shrink-0"
                  >
                    <Search className="h-4 w-4" />
                  </button>
                </div>
              </form>

              {/* Compact horizontal pills for Location & Filters */}
              <div className="flex overflow-x-auto flex-nowrap items-center gap-1.5 mt-2.5 pt-2.5 border-t border-slate-100 no-scrollbar w-full">
                <button
                  type="button"
                  onClick={() => setShowLocationDrawer(true)}
                  className="flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200/60 rounded-full px-3 py-1.5 text-[11px] font-bold text-slate-700 transition"
                >
                  <MapPin className="h-3.5 w-3.5 text-rose-500 shrink-0" />
                  <span className="truncate max-w-[150px]">
                    {locationQuery || pincode ? `Near: ${locationQuery || pincode}` : "Area / Pincode / GPS"}
                  </span>
                  <span className="text-slate-350 font-normal">|</span>
                  <span className="whitespace-nowrap">{radiusKm} km</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFiltersDrawerOpen(true)}
                  className={`flex items-center gap-1.5 border rounded-full px-3 py-1.5 text-[11px] font-bold transition-all ${activeFilterCount > 0
                    ? "bg-indigo-50 border-indigo-200 text-indigo-700 font-extrabold"
                    : "bg-slate-50 border-slate-200/60 text-slate-700"
                    }`}
                >
                  <SlidersHorizontal className="h-3.5 w-3.5 text-indigo-550 shrink-0" />
                  <span>Filters</span>
                  {activeFilterCount > 0 && (
                    <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-indigo-650 text-[9px] font-black text-white ml-0.5">
                      {activeFilterCount}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleMapToggle}
                  disabled={mapToggleLocked}
                  className={`flex items-center gap-1.5 border rounded-full px-3 py-1.5 text-[11px] font-bold transition-all shrink-0 whitespace-nowrap cursor-pointer ${showMap
                    ? "bg-indigo-50 border-indigo-200 text-indigo-700 font-extrabold shadow-sm"
                    : "bg-slate-50 border-slate-200/80 text-slate-700 hover:bg-slate-100"
                    }`}
                >
                  <Map className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
                  <span>{showMap ? "Hide Map" : "Show Map"}</span>
                </button>
              </div>
            </div>

            {/* Desktop bottom section (filters, range, links, alerts) */}
            <div className="hidden lg:block space-y-4">
              {/* USE CURRENT LOCATION Link & Validation Errors */}
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={handleUseMyLocation}
                  className="inline-flex items-center gap-1.5 text-[10px] font-bold text-blue-600 uppercase tracking-wider hover:underline self-start cursor-pointer"
                >
                  <Crosshair className="h-3 w-3 text-blue-600" />
                  USE CURRENT LOCATION
                </button>

                {locationNotFoundMsg && (
                  <div className="rounded-xl border border-amber-450/20 bg-amber-50 px-3.5 py-2 text-xs font-semibold text-amber-700">
                    ⚠ {locationNotFoundMsg}
                  </div>
                )}

                {pincodeError && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2 text-xs font-semibold text-red-600">
                    ⚠ {pincodeError}
                  </div>
                )}
              </div>

              {/* STEP 3: Streamlined Range Slider and Filters Panel */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pt-3 border-t border-slate-100 mt-3">
                {/* Range Slider */}
                <div className="flex items-center gap-3 min-w-[260px] flex-1 max-w-sm">
                  <span className="text-[11px] font-bold text-slate-500 whitespace-nowrap flex items-center gap-1">
                    📍 {radiusKm} km
                  </span>
                  <input
                    type="range"
                    min={1}
                    max={50}
                    step={1}
                    value={radiusKm}
                    onChange={(e) => setRadiusKm(parseInt(e.target.value || "5", 10))}
                    className="qs-range flex-1"
                    style={{
                      background: `linear-gradient(to right, var(--qs-primary, #2563eb) 0%, var(--qs-primary, #2563eb) ${((radiusKm - 1) / 49) * 100}%, #e2e8f0 ${((radiusKm - 1) / 49) * 100}%, #e2e8f0 100%)`,
                    }}
                  />
                  <span className="text-[10px] font-bold text-slate-500 bg-slate-100 rounded-full px-2 py-0.5 border border-slate-200/50">
                    {radiusKm <= 5 ? "Nearby" : radiusKm <= 20 ? "Moderate" : "Far"}
                  </span>
                </div>

                {/* Desktop Vertical Divider */}
                <div className="hidden lg:block h-5 w-px bg-slate-200 self-center mx-2" />

                {/* Quick Filters & Refine button group */}
                <div className="flex flex-wrap items-center gap-2 lg:ml-auto">
                  <span className="text-[11px] font-black text-slate-455 uppercase tracking-wider flex items-center gap-1">
                    ⚡ Filters:
                  </span>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {quickFilterItems.map(({ key, label, Icon }) => {
                      const active = quickFilters[key];
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => toggleQuickFilter(key)}
                          aria-pressed={active}
                          className={`qs-quick-filter-btn inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-bold transition-all ${active ? "active" : ""
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
                      className={`qs-refine-toggle-btn inline-flex items-center justify-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-black cursor-pointer whitespace-nowrap ml-1 ${filtersOpen ? "active" : ""
                        }`}
                    >
                      <SlidersHorizontal className="h-3.5 w-3.5 shrink-0" />
                      <span>Refine</span>
                      {activeFilterCount > 0 && (
                        <span className="qs-filter-badge">
                          {activeFilterCount}
                        </span>
                      )}
                      <ChevronDown
                        className="h-3 w-3 shrink-0 transition-transform duration-200"
                        style={{ transform: filtersOpen ? "rotate(180deg)" : "none" }}
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* Collapsible Refine Results filter options */}
              {filtersOpen && (
                <div className="qs-refine-panel rounded-xl border p-4 mt-3 space-y-4">
                  {/* Price Range */}
                  <div>
                    <p className="mb-2 text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <span className="text-sm">💰</span> Price Range
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
                    <p className="mb-2 text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <span className="text-sm">⏱</span> Time to Complete
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
                    <p className="mb-2 text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <span className="text-sm">📅</span> Booking Type
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
                    <div className="border-t border-slate-200 pt-3">
                      <button
                        type="button"
                        onClick={clearAllFilters}
                        className="text-xs font-bold text-rose-600 hover:text-rose-700 transition-colors cursor-pointer flex items-center gap-1"
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
      <div className={`qs-grid-area-header ${isMapFullScreen ? "hidden" : "block"}`}>
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
            className={`qs-map-toggle-btn inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-full border transition-all shrink-0 whitespace-nowrap ${mapToggleLocked ? "cursor-wait opacity-70" : "cursor-pointer"
              } ${showMap ? "active bg-indigo-50 border-indigo-200 text-indigo-700 font-extrabold" : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"}`}
          >
            <Map className="h-4 w-4 shrink-0 text-indigo-600" />
            <span>{showMap ? "Hide Map" : "Show Map"}</span>
          </button>
        </div>
      </div>

      {/* ============ MAP ============ */}
      <div
        className={`qs-grid-area-map w-full ${showMap ? (isMapFullScreen ? "block qs-map-fullscreen" : "block animate-fade-in") : "hidden"}`}
        aria-hidden={!showMap}
      >
        <MapErrorBoundary>
          <div
            className={`qs-map-frame overflow-hidden ${isMapFullScreen
              ? "fixed inset-0 z-[2000] w-screen h-screen rounded-none qs-map-frame-fullscreen"
              : "relative isolate rounded-2xl sm:rounded-3xl h-[200px] sm:h-[300px] lg:h-[500px] w-full shadow-xl border border-slate-200/90 bg-slate-100"
              }`}
          >

            {/* Top-right: live radius badge (Visible on Mobile & Desktop) */}
            <div className={`pointer-events-none absolute top-2.5 sm:top-3 z-[600] ${isMapFullScreen ? "right-52" : "right-2.5 sm:right-3"}`}>
              <div className="flex items-center gap-1.5 bg-slate-900/85 backdrop-blur-md border border-white/15 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full text-white shadow-md">
                <Radar className="h-3.5 w-3.5 text-emerald-400 animate-pulse shrink-0" />
                <div className="flex items-center gap-1 text-[11px] sm:text-xs font-semibold text-white">
                  <span>{radiusKm} km</span>
                  <span className="text-slate-300/80 text-[10px] uppercase hidden xs:inline">radius</span>
                </div>
              </div>
            </div>

            {/* Bottom-left: Providers Count Badge */}
            <div className="pointer-events-none absolute bottom-2.5 left-2.5 sm:bottom-3 sm:left-3 z-[600]">
              <div className="flex items-center gap-1.5 bg-slate-900/85 backdrop-blur-md border border-white/15 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full text-white shadow-md">
                <Users className="h-3.5 w-3.5 text-sky-400 shrink-0" />
                <div className="flex items-center gap-1 text-[10px] sm:text-xs font-semibold text-white">
                  <span className="font-extrabold text-white">{nearby.length}</span>
                  <span className="text-slate-300">Provider{nearby.length !== 1 ? "s" : ""}</span>
                </div>
              </div>
            </div>

            {/* Floating Bottom-Right: Map Controls (Locate Me & Expand Map) */}
            {!isMapFullScreen && (
              <div className="absolute bottom-2.5 right-2.5 sm:bottom-3 sm:right-3 z-[600] flex items-center gap-2">
                {/* Locate Me button */}
                <button
                  type="button"
                  onClick={handleUseMyLocation}
                  disabled={geoLoading}
                  className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 cursor-pointer shrink-0 border border-blue-400/30"
                  title="Locate Me / मेरी स्थिति"
                >
                  {geoLoading ? (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    <Crosshair className="h-4 w-4 text-white" />
                  )}
                </button>

                {/* Expand Map button */}
                <button
                  type="button"
                  onClick={() => {
                    setIsMapFullScreen(true);
                    setIsMapUnlocked(true);
                  }}
                  className="flex items-center gap-1.5 h-8 sm:h-9 px-3 rounded-full bg-white/95 backdrop-blur-md border border-slate-200 text-[#0284c7] shadow-lg text-[10px] sm:text-xs font-black uppercase tracking-wider hover:bg-white transition active:scale-95 cursor-pointer shrink-0"
                >
                  <Map className="h-3.5 w-3.5 text-[#0284c7]" />
                  <span>Expand</span>
                </button>
              </div>
            )}

            {/* Locate Me Button when Full Screen */}
            {isMapFullScreen && (
              <div className="absolute bottom-3 right-3 z-[600]">
                <button
                  type="button"
                  onClick={handleUseMyLocation}
                  disabled={geoLoading}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
                  title="Locate Me / मेरी स्थिति"
                >
                  {geoLoading ? (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    <Crosshair className="h-4.5 w-4.5 text-white" />
                  )}
                </button>
              </div>
            )}

            {/* Selected Seller Floating Card Overlay (Map Context) */}
            {selectedSeller && (
              <div
                style={{ zIndex: 1000 }}
                className="absolute bottom-3 left-3 right-15 md:right-auto md:max-w-[320px] bg-white rounded-2xl border border-slate-200 shadow-2xl p-3.5 animate-fade-in-up"
              >
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedSellerId(null);
                    if (mapRef.current) {
                      mapRef.current.closePopup();
                    }
                  }}
                  className="absolute top-2 right-2 flex h-5.5 w-5.5 items-center justify-center rounded-full bg-slate-100 hover:bg-red-500 hover:text-white text-slate-500 transition-all border border-slate-200/60 cursor-pointer"
                  title="Clear selection / बंद करें"
                >
                  <X className="h-3 w-3" />
                </button>

                <div className="flex items-center gap-3 pr-6">
                  {(() => {
                    const selName = selectedSeller.business_name || selectedSeller.businessName || selectedSeller.name || selectedSeller.ownerName || "Service Partner";
                    return (
                      <>
                        <div className="relative h-9 w-9 flex-shrink-0">
                          {(selectedSeller.profilePhotoUrl || selectedSeller.profile_pic) ? (
                            <img
                              src={getImageUrl(selectedSeller.profilePhotoUrl || selectedSeller.profile_pic)}
                              alt={selName}
                              className="h-9 w-9 rounded-full object-cover border border-slate-200"
                            />
                          ) : (
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1565C0] font-bold text-white text-xs">
                              {selName?.[0]?.toUpperCase() || "?"}
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="truncate text-xs font-bold text-slate-800">
                            {selName}
                          </h4>
                          <p className="truncate text-[10px] font-semibold text-[#0284c7] mt-0.5">
                            {selectedSeller.service}
                          </p>
                        </div>
                      </>
                    );
                  })()}
                </div>

                <div className="mt-2.5 flex items-center justify-between text-[11px] border-t border-slate-100 pt-2.5">
                  <span className="font-bold text-slate-600">
                    ⭐ {Number(selectedSeller.rating || 0).toFixed(1)} ({selectedSeller.reviews || 0} reviews)
                  </span>
                  <a
                    href={`/seller/${selectedSeller.id || selectedSeller.sellerId}`}
                    onClick={(e) => handleViewDetailsClick(selectedSeller, e)}
                    className="bg-blue-600 text-white px-3 py-1.5 rounded-lg font-bold text-[10px] hover:bg-blue-700 transition-all text-center force-text-white"
                  >
                    View Profile →
                  </a>
                </div>
              </div>
            )}

            {/* Loading overlay */}
            {!buyerPos && (
              <div className="absolute inset-0 z-[500] flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm">
                <div className="relative h-12 w-12">
                  <div className="absolute inset-0 animate-ping rounded-full bg-blue-500/40" />
                  <div className="absolute inset-2 rounded-full bg-blue-600 shadow-[0_0_30px_rgba(37,99,235,0.4)]" />
                </div>
                <p className="mt-4 text-sm font-bold text-slate-700">
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
              scrollWheelZoom={!isMobile}
              dragging={!isMobile || isMapUnlocked || lockScrollOnMobile}
              touchZoom={!isMobile || isMapUnlocked || lockScrollOnMobile}
              doubleClickZoom={!isMobile || isMapUnlocked || lockScrollOnMobile}
            >
              <MapInteractionController
                isMobile={isMobile}
                isMapUnlocked={isMapUnlocked}
              />
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
              <MapRadiusController
                radiusKm={radiusKm}
                center={searchCenter || buyerPos}
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

            {/* Mobile Interaction Overlay */}
            {!isMapUnlocked && isMobile && !lockScrollOnMobile && (
              <div
                onClick={() => setIsMapUnlocked(true)}
                className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer transition-all bg-slate-900/60 backdrop-blur-xs z-[2400]"
              >
                <div className="flex flex-col items-center gap-1 text-white bg-slate-900/95 border border-slate-700/50 rounded-xl px-4 py-2 text-center shadow-lg max-w-[85%]">
                  <div className="flex items-center gap-1.5">
                    <Lock className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                    <span className="text-[11px] font-black tracking-wider uppercase">Tap to interact</span>
                  </div>
                  <span className="text-[9px] text-slate-355 font-semibold">नक्शा उपयोग करने के लिए टैप करें</span>
                </div>
              </div>
            )}

            {/* Mobile Re-lock Button */}
            {isMapUnlocked && !isMapFullScreen && isMobile && !lockScrollOnMobile && (
              <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[2500]">
                <button
                  type="button"
                  onClick={() => setIsMapUnlocked(false)}
                  style={{
                    backgroundColor: "#1e293b",
                    border: "1px solid rgba(99, 102, 241, 0.5)",
                    color: "#ffffff"
                  }}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-full font-bold text-[9px] uppercase tracking-wider shadow-2xl hover:scale-105 active:scale-95 transition-all cursor-pointer"
                >
                  <Lock className="h-3 w-3 text-indigo-400" />
                  <span style={{ color: "#ffffff" }}>Lock / लॉक</span>
                </button>
              </div>
            )}

            {/* Close button is portaled to document.body — see below */}
          </div>
        </MapErrorBoundary>
      </div>

      {/* Full-screen close button — portaled to document.body so it's always on top */}
      {isMapFullScreen &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed top-4 right-4 z-[99999]"
            style={{ pointerEvents: "auto" }}
          >
            <button
              type="button"
              onClick={handleCloseMap}
              style={{
                backgroundColor: "#ffffff",
                border: "2px solid #ef4444",
                boxShadow:
                  "0 4px 24px rgba(0,0,0,0.3), 0 0 0 4px rgba(239,68,68,0.2)",
              }}
              className="flex items-center gap-2.5 pl-3 pr-5 py-2.5 rounded-full hover:scale-[1.03] active:scale-95 transition-all cursor-pointer"
              title="Close Full Screen / बंद करें"
            >
              <span
                style={{ backgroundColor: "#ef4444" }}
                className="flex h-7 w-7 items-center justify-center rounded-full shadow-md"
              >
                <X className="h-4 w-4 text-white" strokeWidth={3} />
              </span>
              <span className="text-sm font-extrabold tracking-wide text-slate-800">
                Close Map
              </span>
            </button>
          </div>,
          document.body,
        )}

      {/* ============ PROVIDER LIST ============ */}
      <div className={`qs-grid-area-list w-full ${isMapFullScreen ? "hidden" : "block"}`}>
        <div
          key={`${searchCenter?.lat}-${searchCenter?.lng}-${search}-${nearby.length}`}
          className={`qs-list pb-2 pr-3 ${showMap
            ? "space-y-4 mt-4 lg:mt-0 lg:block lg:h-[520px] lg:space-y-5 lg:overflow-y-auto lg:overflow-x-hidden lg:pb-0 lg:snap-none"
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

          {!apiLoading && nearby.length === 0 && (
            <div className="w-full bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden col-span-full">
              <NoProvidersLeadForm
                category={selectedCategory || search || ""}
                pincode={pincode || ""}
                radiusKm={radiusKm}
                buyerPos={buyerPos}
              />
            </div>
          )}

          {nearby.slice(0, visibleCount).map((seller, idx) => {
            const packageRank = getSellerPackageRank(seller);
            const isPremium = packageRank >= 2;

            const sId = seller.id || seller.sellerId;
            const isSelected = selectedSellerId === sId;
            const distanceLabel = Number(seller.distanceKm || 0).toFixed(1);
            const isAvailable = seller.isAvailable !== undefined ? Boolean(seller.isAvailable) : (seller.is_available !== undefined ? Boolean(seller.is_available) : true);

            const sellerDisplayName = seller.business_name || seller.businessName || seller.name || seller.ownerName || "Service Partner";

            const serviceModeLabel =
              seller.serviceMode === "online"
                ? "Online"
                : seller.serviceMode === "offline"
                  ? "On-site"
                  : seller.serviceMode === "both"
                    ? "Online/On-site"
                    : "";

            const showAdInline = (idx + 1) % 3 === 0;

            return (
              <React.Fragment key={`seller-wrapper-${sId}`}>
                <div
                  id={`seller-card-${sId}`}
                  onClick={() => handlePremiumSellerClick(seller)}
                  style={{ padding: "0.75rem 0.875rem", animationDelay: `${Math.min(idx * 50, 400)}ms` }}
                  className={`qs-card group cursor-pointer w-full relative flex items-center justify-between gap-3 rounded-xl border transition hover:shadow-md ${isSelected ? "qs-card-active shadow-md border-blue-500/30" : "bg-white border-slate-100"
                    }`}
                >
                  {/* Close Button if Selected */}
                  {isSelected && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedSellerId(null);
                        if (mapRef.current) {
                          mapRef.current.closePopup();
                        }
                      }}
                      className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 hover:bg-red-500 hover:text-white text-slate-500 transition shadow-sm border border-slate-200"
                      title="Deselect"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}

                  {/* Left Side: Avatar & Info Column (Clicking here view details) */}
                  <div
                    onClick={(e) => handleViewDetailsClick(seller, e)}
                    className="flex items-center gap-3.5 min-w-0 flex-1 hover:opacity-90 transition-opacity"
                  >
                    {/* Rounded-Square Avatar */}
                    <div className="relative h-12 w-12 flex-shrink-0">
                      {(seller.profilePhotoUrl || seller.profile_pic) ? (
                        <img
                          src={getImageUrl(seller.profilePhotoUrl || seller.profile_pic)}
                          alt={sellerDisplayName}
                          className="h-12 w-12 rounded-xl object-cover border border-slate-100 shadow-2xs"
                        />
                      ) : (
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl font-extrabold text-lg bg-blue-50 text-blue-600 border border-blue-100/50 shadow-2xs">
                          {sellerDisplayName?.[0]?.toUpperCase() || "?"}
                        </div>
                      )}
                      {/* Availability Dot */}
                      <span
                        className={`absolute -bottom-0.5 -right-0.5 block h-3 w-3 rounded-full border-2 border-white shadow-xs ${isAvailable ? "bg-[#1E8E5A]" : "bg-[#e53935]"
                          }`}
                        title={isAvailable ? "Available" : "Unavailable"}
                      />
                    </div>

                    {/* Text Details Column */}
                    <div className="min-w-0 flex-1 flex flex-col gap-0.5 sm:gap-1">
                      {/* Name & Verified Badge in ONE single line */}
                      <div className="flex items-center gap-1.5 min-w-0 w-full">
                        <h4 className="text-[13.5px] sm:text-sm font-extrabold text-slate-800 tracking-tight leading-snug truncate min-w-0 flex-1">
                          {sellerDisplayName}
                        </h4>
                        {isPremium && (
                          <BadgeCheck className="h-4 w-4 text-amber-500 fill-amber-500/10 shrink-0" title="Premium Partner" />
                        )}
                      </div>

                      {/* Subtitle / Service & Mode */}
                      <div className="text-[11px] sm:text-xs font-medium text-slate-500 flex items-center gap-1.5 min-w-0 truncate">
                        <span className="font-semibold text-slate-700 truncate min-w-0">{seller.service}</span>
                        {serviceModeLabel && (
                          <>
                            <span className="text-slate-300 font-normal shrink-0">•</span>
                            <span className="text-slate-500 truncate shrink-0">{serviceModeLabel}</span>
                          </>
                        )}
                      </div>

                      {/* Badges & Distance Pill Row */}
                      <div className="flex items-center gap-1.5 flex-wrap mt-0.5 text-[10px] sm:text-[11px]">
                        {/* Rating */}
                        <span className="inline-flex items-center gap-0.5 font-black text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-200/60">
                          <Star className="h-3 w-3 fill-emerald-600 text-emerald-600 shrink-0" />
                          <span>{Number(seller?.rating || 0).toFixed(1)}</span>
                        </span>

                        {/* Distance Pill */}
                        <span className="inline-flex items-center gap-0.5 font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded-md border border-blue-200/60">
                          <MapPin className="h-3 w-3 text-blue-600 shrink-0" />
                          <span>{distanceLabel} km</span>
                        </span>

                        {/* Fast Response */}
                        {packageRank >= 2 && (
                          <span className="inline-flex items-center gap-0.5 font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-md border border-amber-200/60">
                            <Zap className="h-3 w-3 text-amber-500 fill-amber-500 shrink-0" />
                            <span className="hidden xs:inline">Fast Response</span>
                          </span>
                        )}

                        {/* Instant Service */}
                        {seller?.instantService && (
                          <span className="inline-flex items-center gap-0.5 font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-200/60">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse mr-0.5" />
                            <span>Instant</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Side: Chevron click to view profile */}
                  <button
                    type="button"
                    onClick={(e) => handleViewDetailsClick(seller, e)}
                    className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-slate-50 text-slate-400 hover:text-slate-650 transition-colors shrink-0 cursor-pointer"
                    title="View Details"
                  >
                    <ChevronRight className="h-5 w-5 shrink-0" />
                  </button>
                </div>

                {/* Inline Sponsored Ad Card */}
                {showAdInline && (
                  <div key={`inline-ad-${idx}`} className="my-1.5 w-full col-span-full">
                    <div className="bg-gradient-to-r from-amber-50/90 via-amber-100/40 to-slate-50 border border-amber-200/80 rounded-xl p-3.5 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-all hover:border-amber-300">
                      <div className="flex items-start gap-3 text-left">
                        <div className="h-9 w-9 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 font-bold shrink-0 mt-0.5 text-base">
                          📣
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="inline-block px-2 py-0.5 rounded bg-amber-500 text-white text-[9px] font-black uppercase tracking-wider">
                              Sponsored Slot
                            </span>
                            <span className="text-[10px] font-bold text-amber-700 bg-amber-100/60 px-1.5 py-0.2 rounded">
                              Coming Soon
                            </span>
                          </div>
                          <h5 className="text-[13.5px] sm:text-sm font-extrabold text-slate-800 mt-1 leading-snug">
                            Want to grow your local service business?
                          </h5>
                          <p className="text-[11px] sm:text-xs text-slate-600 mt-0.5 leading-normal">
                            Advertise your services here and get up to 5x more customer bookings in your area.
                          </p>
                        </div>
                      </div>
                      <a
                        href="/advertise"
                        onClick={(e) => { e.preventDefault(); alert("Advertise features coming soon!"); }}
                        className="px-4 py-2 text-xs font-bold rounded-xl bg-slate-900 hover:bg-amber-600 text-white transition-all whitespace-nowrap cursor-pointer shrink-0 self-stretch sm:self-auto text-center shadow-2xs"
                      >
                        Advertise with Us
                      </a>
                    </div>
                  </div>
                )}
              </React.Fragment>
            );
          })}

          {/* Show More Trigger */}
          {nearby.length > 0 && nearby.length > visibleCount && (
            <div className="mt-4 w-full flex justify-center col-span-full">
              <button
                type="button"
                onClick={() => setVisibleCount((prev) => prev + 5)}
                className="btn qs-seller-card-btn w-full py-3 text-xs font-bold rounded-xl text-center cursor-pointer"
              >
                Show More Services / और दिखाएं ↓
              </button>
            </div>
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

      {/* ============ MOBILE LOCATION & RANGE DRAWER ============ */}
      {showLocationDrawer && isMobile && createPortal(
        <div className="fixed inset-0 z-[999999] flex items-end justify-center">
          {/* Backdrop */}
          <div
            onClick={() => setShowLocationDrawer(false)}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs"
          />
          {/* Drawer Body */}
          <div className="relative w-full max-h-[85vh] bg-white rounded-t-3xl p-5 shadow-2xl z-[999999] flex flex-col gap-4 animate-slide-up overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-rose-500 shrink-0" />
                Location & Radius
              </h4>
              <button
                type="button"
                onClick={() => setShowLocationDrawer(false)}
                className="h-6 w-6 flex items-center justify-center rounded-full bg-slate-100 hover:bg-red-500 hover:text-white text-slate-500 transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200/80">
              <button
                type="button"
                onClick={() => {
                  setLocationMode("area");
                  setPincodeError("");
                }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${locationMode === "area"
                  ? "bg-white text-blue-600 shadow-sm font-extrabold"
                  : "text-slate-500 hover:text-slate-700"
                  }`}
              >
                <MapPin className="h-3.5 w-3.5 text-rose-500" />
                <span>Area / Landmark</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setLocationMode("pincode");
                  setLocationNotFoundMsg("");
                }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${locationMode === "pincode"
                  ? "bg-white text-blue-600 shadow-sm font-extrabold"
                  : "text-slate-500 hover:text-slate-700"
                  }`}
              >
                <Hash className="h-3.5 w-3.5 text-indigo-500" />
                <span>Pincode</span>
              </button>
            </div>

            {/* Mode 1: Area / Landmark Search */}
            {locationMode === "area" ? (
              <>
                {/* GPS Button */}
                <button
                  type="button"
                  onClick={() => {
                    handleUseMyLocation();
                    setShowLocationDrawer(false);
                  }}
                  disabled={geoLoading}
                  className="w-full flex items-center justify-center gap-2 bg-blue-50 border border-blue-200 text-blue-600 rounded-xl py-3 text-xs font-bold hover:bg-blue-100 transition disabled:opacity-50 cursor-pointer"
                >
                  {geoLoading ? (
                    <span className="h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Crosshair className="h-4 w-4 text-blue-600" />
                  )}
                  <span>USE CURRENT GPS LOCATION</span>
                </button>

                {/* Area Search Input */}
                <div ref={locationSearchRef} className="relative w-full">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Search Area/Landmark
                  </label>
                  <div className="relative">
                    <MapPin className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-rose-500 h-4 w-4" />
                    <input
                      value={locationQuery}
                      onChange={(e) => {
                        suppressNextLocationSearchRef.current = false;
                        setLocationQuery(e.target.value);
                      }}
                      onFocus={() => {
                        suppressNextLocationSearchRef.current = false;
                        if (locationQuery.trim().length >= 3) {
                          searchLocation(locationQuery);
                        }
                      }}
                      autoComplete="off"
                      className="w-full rounded-xl bg-slate-50 border border-slate-200 py-2.5 pl-10 pr-8 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:bg-white focus:border-blue-500 focus:outline-none"
                      style={{ paddingLeft: "2.5rem" }}
                      placeholder="Search landmark, street, city..."
                    />
                    {locationQuery && (
                      <button
                        type="button"
                        onClick={clearLocationInput}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                  {/* Autocomplete Results for Drawer */}
                  {locationResults.length > 0 && (
                    <div className="mt-2 border border-slate-100 rounded-xl bg-white shadow-lg max-h-48 overflow-y-auto">
                      {locationResults.map((result) => (
                        <button
                          key={`${result.place_id}-${result.lat}-${result.lon}`}
                          type="button"
                          onClick={() => {
                            handleResultClick(result);
                            setShowLocationDrawer(false);
                          }}
                          className="block w-full text-left px-3 py-2.5 text-xs hover:bg-slate-50 border-b border-slate-50 last:border-0"
                        >
                          <span className="block font-bold text-slate-800">
                            {(result.display_name || "").split(",")[0]}
                          </span>
                          <span className="block text-[10px] text-slate-450 truncate mt-0.5">
                            {result.display_name}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                  {locationNotFoundMsg && (
                    <p className="mt-1.5 text-xs font-medium text-amber-600 bg-amber-50 rounded-lg p-2 border border-amber-200">
                      {locationNotFoundMsg}
                    </p>
                  )}
                </div>
              </>
            ) : (
              /* Mode 2: Pincode Search */
              <div className="w-full">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Enter 6-Digit Pincode
                </label>
                <div className="relative">
                  <Hash className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-indigo-500 h-4 w-4" />
                  <input
                    value={pincode}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "").slice(0, 6);
                      setPincode(val);
                      setPincodeError("");
                      if (val.length === 6) {
                        e.target.blur();
                        handlePincodeSearch(val);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && pincode.trim().length === 6) {
                        e.target.blur();
                        handlePincodeSearch(pincode);
                        setShowLocationDrawer(false);
                      }
                    }}
                    autoFocus
                    className="w-full rounded-xl bg-slate-50 border border-slate-200 py-2.5 pl-10 pr-8 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:bg-white focus:border-indigo-500 focus:outline-none"
                    style={{ paddingLeft: "2.5rem" }}
                    placeholder="e.g. 382430"
                    maxLength={6}
                  />
                  {pincode && (
                    <button
                      type="button"
                      onClick={clearPincodeInput}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      ✕
                    </button>
                  )}
                </div>
                {pincodeLoading && (
                  <p className="mt-2 text-xs font-semibold text-blue-600 flex items-center gap-1.5">
                    <span className="h-3 w-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    Finding pincode location...
                  </p>
                )}
                {pincodeError && (
                  <p className="mt-2 text-xs font-semibold text-red-600 bg-red-50 p-2.5 rounded-xl border border-red-200">
                    ⚠️ {pincodeError}
                  </p>
                )}
              </div>
            )}

            {/* Range / Radius Slider */}
            <div className="w-full mt-1">
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">Search Radius</label>
                <span className="text-[11px] font-bold text-blue-650 bg-blue-50 rounded-full px-2.5 py-0.5 border border-blue-100 flex items-center gap-1">
                  <MapPin className="h-3 w-3 text-rose-500 shrink-0" />
                  {radiusKm} km
                </span>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={1}
                  max={50}
                  step={1}
                  value={radiusKm}
                  onChange={(e) => setRadiusKm(parseInt(e.target.value || "5", 10))}
                  onMouseUp={() => setShowLocationDrawer(false)}
                  onTouchEnd={() => setShowLocationDrawer(false)}
                  className="qs-range flex-1"
                  style={{
                    background: `linear-gradient(to right, var(--qs-primary, #2563eb) 0%, var(--qs-primary, #2563eb) ${((radiusKm - 1) / 49) * 100}%, #e2e8f0 ${((radiusKm - 1) / 49) * 100}%, #e2e8f0 100%)`,
                  }}
                />
              </div>
            </div>

            <button
              type="button"
              onClick={async () => {
                if (locationMode === "pincode" || (pincode.trim().length === 6 && !locationQuery.trim())) {
                  if (pincode.trim().length === 6) {
                    await handlePincodeSearch(pincode);
                  } else if (pincode.trim().length > 0) {
                    setPincodeError("Please enter a valid 6-digit pincode");
                    return;
                  }
                } else if (locationQuery.trim().length >= 3) {
                  await handleLocationSearchSubmit();
                }
                setShowLocationDrawer(false);
              }}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-3 text-xs font-extrabold transition shadow-md shadow-blue-600/15 cursor-pointer text-center mt-2 flex items-center justify-center gap-2"
            >
              {pincodeLoading || locationLoading ? (
                <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : null}
              <span>APPLY SETTINGS</span>
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* ============ MOBILE FILTERS DRAWER ============ */}
      {filtersDrawerOpen && isMobile && createPortal(
        <div className="fixed inset-0 z-[999999] flex items-end justify-center">
          {/* Backdrop */}
          <div
            onClick={() => setFiltersDrawerOpen(false)}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs"
          />
          {/* Drawer Body */}
          <div className="relative w-full max-h-[85vh] bg-white rounded-t-3xl p-5 shadow-2xl z-[999999] flex flex-col gap-4 animate-slide-up overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                ⚡ Refine Results
              </h4>
              <button
                type="button"
                onClick={() => setFiltersDrawerOpen(false)}
                className="h-8 w-8 flex items-center justify-center rounded-full bg-slate-100 border border-slate-200 hover:bg-red-500 hover:text-white text-slate-700 transition cursor-pointer shadow-xs"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Quick Filters */}
            <div>
              <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">Quick Sorting & Badges</p>
              <div className="grid grid-cols-2 gap-2">
                {quickFilterItems.map(({ key, label, Icon }) => {
                  const active = quickFilters[key];
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => toggleQuickFilter(key)}
                      className={`inline-flex items-center justify-center gap-1.5 rounded-xl border p-2.5 text-xs font-bold transition-all ${active
                        ? "bg-blue-600 border-blue-600 text-white font-extrabold shadow-sm"
                        : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                        }`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      <span>{label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Price Range */}
            <div>
              <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">💰 Price Range</p>
              <div className="flex flex-wrap gap-1.5">
                {PRICE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setFilterPrice(opt.value)}
                    className={`rounded-xl px-3.5 py-2 text-xs font-bold transition-all cursor-pointer ${filterPrice === opt.value
                      ? "bg-blue-600 border border-blue-600 text-white font-extrabold shadow-sm"
                      : "bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100"
                      }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Duration */}
            <div>
              <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">⏱ Time to Complete</p>
              <div className="flex flex-wrap gap-1.5">
                {DURATION_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setFilterDuration(opt.value)}
                    className={`rounded-xl px-3.5 py-2 text-xs font-bold transition-all cursor-pointer ${filterDuration === opt.value
                      ? "bg-blue-600 border border-blue-600 text-white font-extrabold shadow-sm"
                      : "bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100"
                      }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Booking Type */}
            <div>
              <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">📅 Booking Type</p>
              <div className="flex flex-wrap gap-1.5">
                {BOOKING_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setFilterBooking(opt.value)}
                    className={`rounded-xl px-3.5 py-2 text-xs font-bold transition-all cursor-pointer ${filterBooking === opt.value
                      ? "bg-blue-600 border border-blue-600 text-white font-extrabold shadow-sm"
                      : "bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100"
                      }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 mt-2 border-t border-slate-100 pt-4">
              {activeFilterCount > 0 && (
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="flex-1 border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-600 py-3 text-xs font-bold rounded-xl transition cursor-pointer text-center"
                >
                  ✕ Clear All
                </button>
              )}
              <button
                type="button"
                onClick={() => setFiltersDrawerOpen(false)}
                className="flex-[2] bg-blue-600 hover:bg-blue-700 text-white py-3 text-xs font-extrabold rounded-xl transition shadow-md shadow-blue-600/15 cursor-pointer text-center"
              >
                APPLY FILTERS
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
