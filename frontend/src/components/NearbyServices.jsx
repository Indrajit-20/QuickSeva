import React, { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
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
  const [address, setAddress] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!navigator.geolocation) return;

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const nextAddress = await reverseGeocode(
            pos.coords.latitude,
            pos.coords.longitude,
          );
          setAddress(nextAddress || null);
        } catch {
          setAddress(null);
        } finally {
          setLoading(false);
        }
      },
      () => {
        setAddress(null);
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }, []);

  return { address, loading };
}

export default function NearbyServices({ initialSearch = "" }) {
  const [buyerPos, setBuyerPos] = useState(null);
  const [geoError, setGeoError] = useState("");
  const [search, setSearch] = useState(initialSearch);
  const [locationQuery, setLocationQuery] = useState("");
  const [locationResults, setLocationResults] = useState([]);
  const [locationLoading, setLocationLoading] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const [selectedSellerId, setSelectedSellerId] = useState(null);

  const [radiusKm, setRadiusKm] = useState(5);
  const [locationNotFoundMsg, setLocationNotFoundMsg] = useState("");

  const gpsPosRef = useRef(null);
  const locationSearchRef = useRef(null);

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
      if (locationSearchRef.current.contains(e.target)) return;
      setLocationResults([]);
    };

    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (locationQuery.trim().length >= 2) {
        searchLocation(locationQuery);
      } else {
        setLocationResults([]);
        setLocationNotFoundMsg("");
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [locationQuery]);

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
      if (typeof s?.lat !== "number" || typeof s?.lng !== "number")
        return false;
      const d = getDistanceKm(buyerPos.lat, buyerPos.lng, s.lat, s.lng);
      return d <= radiusKm;
    });

    const withDistance = filteredByDistance.map((s) => ({
      ...s,
      distanceKm: getDistanceKm(buyerPos.lat, buyerPos.lng, s.lat, s.lng),
    }));

    const normalizedSearch = search.trim().toLowerCase();
    const filteredBySearch = normalizedSearch
      ? withDistance.filter((s) => {
          const serviceStr = (s?.service || "").toLowerCase();
          return serviceStr.includes(normalizedSearch);
        })
      : withDistance;

    return filteredBySearch.sort((a, b) => {
      if (a.isPremium && !b.isPremium) return -1;
      if (!a.isPremium && b.isPremium) return 1;
      return a.distanceKm - b.distanceKm;
    });
  }, [buyerPos, sellers, search, radiusKm]);

  const handleLocationSubmit = (e) => {
    e.preventDefault();
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
    setGeoError("");
  };

  const handleMapClick = (latlng) => {
    if (!latlng) return;
    const nextPos = { lat: latlng.lat, lng: latlng.lng };
    gpsPosRef.current = nextPos;
    setBuyerPos(nextPos);
    setLocationResults([]);
    setLocationNotFoundMsg("");
    setGeoError("");
  };

  const handleUseMyLocation = () => {
    if (gpsPosRef.current) {
      setBuyerPos(gpsPosRef.current);
      setLocationResults([]);
      setLocationNotFoundMsg("");
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

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl border border-indigo-500/20 bg-indigo-950/20 p-4 shadow-xl">
        <form
          ref={locationSearchRef}
          onSubmit={handleLocationSubmit}
          className="relative"
        >
          <label className="mb-2 block text-xs font-semibold text-indigo-200">
            🔍 Search location
          </label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              value={locationQuery}
              onChange={(e) => setLocationQuery(e.target.value)}
              className="min-w-0 flex-1 rounded-xl border border-indigo-500/30 bg-indigo-950/40 px-3 py-2.5 text-sm font-medium text-white focus:outline-none"
              placeholder="Search area (e.g., Bopal, SG Highway, your office)"
            />
            <button
              type="submit"
              className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-indigo-700"
            >
              {locationLoading ? "Searching..." : "Search"}
            </button>
            <button
              type="button"
              onClick={handleUseMyLocation}
              className="flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 font-bold text-white transition-all duration-200"
              style={{
                background: "linear-gradient(135deg, #22a06b, #126e47)",
                boxShadow: "0 4px 15px rgba(34,160,107,0.35)",
                border: "1px solid rgba(34,160,107,0.4)",
                animation: geoLoading
                  ? "pulse 1.5s ease-in-out infinite"
                  : "none",
              }}
            >
              <span style={{ fontSize: 18 }}>📍</span>
              <span className="hidden sm:inline">Use My Location</span>
              <span className="sm:hidden">My Location</span>
            </button>
          </div>

          {locationResults.length > 0 && (
            <div className="absolute left-0 right-0 top-full z-[1100] mt-2 max-h-64 overflow-y-auto rounded-lg border border-indigo-500/30 bg-indigo-950 shadow-2xl">
              {locationResults.map((result) => (
                <button
                  key={`${result.place_id}-${result.lat}-${result.lon}`}
                  type="button"
                  onClick={() => handleResultClick(result)}
                  className="block w-full border-b border-indigo-500/10 px-3 py-2 text-left text-sm text-indigo-100 hover:bg-indigo-900"
                >
                  {result.display_name}
                </button>
              ))}
            </div>
          )}

          {locationNotFoundMsg && (
            <p className="mt-2 text-sm text-indigo-200">
              {locationNotFoundMsg}
            </p>
          )}
        </form>

        <div className="mt-4 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
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
                className="flex-shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-all"
                style={{
                  background: active
                    ? "linear-gradient(135deg, #6366f1, #4f46e5)"
                    : "rgba(99,102,241,0.1)",
                  color: active ? "#fff" : "#a5b4fc",
                  border: "1px solid rgba(99,102,241,0.3)",
                }}
              >
                {serviceFilter}
              </button>
            );
          })}
        </div>

        <div className="mt-4 flex items-center gap-3 px-1">
          <span className="whitespace-nowrap text-xs font-semibold text-indigo-300">
            📏 Radius
          </span>
          <input
            type="range"
            min={1}
            max={20}
            step={1}
            value={radiusKm}
            onChange={(e) => setRadiusKm(parseInt(e.target.value || "5", 10))}
            className="flex-1 accent-indigo-500"
            style={{ height: 4 }}
          />
          <span className="min-w-[40px] rounded-full bg-indigo-600 px-2 py-0.5 text-center text-xs font-bold text-white">
            {radiusKm}km
          </span>
        </div>

        {buyerPos && (
          <div className="mt-4 flex items-center gap-2 text-xs text-indigo-300">
            <span className="inline-block h-2 w-2 rounded-full bg-green-400 animate-pulse" />
            Showing {nearby.length} provider{nearby.length !== 1 ? "s" : ""}{" "}
            within {radiusKm}km
            {search && <span className="text-indigo-400">for "{search}"</span>}
          </div>
        )}

        {geoError && <p className="mt-3 text-sm text-red-300">⚠ {geoError}</p>}
      </div>

      <div className="flex flex-col gap-4 lg:flex-row">
        <div className="lg:w-[58%]">
          <div
            className="overflow-hidden rounded-2xl border border-indigo-500/20 shadow-2xl"
            style={{ height: 480 }}
          >
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
                      color: "#a7f3d0",
                      fillColor: "#bbf7d0",
                      fillOpacity: 0.2,
                    }}
                  />

                  <Marker
                    position={[buyerPos.lat, buyerPos.lng]}
                    icon={L.divIcon({
                      className: "blue-buyer-icon",
                      html:
                        "<svg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24' fill='none'>" +
                        "<path d='M12 21s7-5.3 7-12a7 7 0 1 0-14 0c0 6.7 7 12 7 12z' fill='#3b82f6' stroke='#1d4ed8' stroke-width='1.5'/>" +
                        "<circle cx='12' cy='9' r='3.2' fill='#60a5fa' stroke='#1d4ed8' stroke-width='1.2'/>" +
                        "</svg>",
                      iconSize: [20, 20],
                      iconAnchor: [10, 20],
                    })}
                  />
                </>
              )}

              {buyerPos && nearby.length > 0 && (
                <MarkerClusterGroup chunkedLoading>
                  {nearby.map((seller) => (
                    <Marker
                      key={seller.id}
                      position={[seller.lat, seller.lng]}
                      icon={seller.isPremium ? PREMIUM_ICON : GREEN_ICON}
                      eventHandlers={{
                        click: () => setSelectedSellerId(seller.id),
                      }}
                    >
                      <Popup minWidth={220}>
                        <div
                          style={{ fontSize: 13, lineHeight: 1.35, padding: 4 }}
                        >
                          <div
                            style={{
                              fontWeight: 800,
                              fontSize: 14,
                              marginBottom: 4,
                            }}
                          >
                            🔧 {seller.name}
                          </div>
                          <div
                            style={{
                              fontSize: 12,
                              color: "#4b5563",
                              marginBottom: 2,
                            }}
                          >
                            🛠 {seller.service}
                          </div>
                          <div
                            style={{
                              fontSize: 12,
                              color: "#4b5563",
                              marginBottom: 2,
                            }}
                          >
                            📍 {seller.address}
                          </div>
                          <div
                            style={{
                              fontSize: 12,
                              color: "#16a34a",
                              fontWeight: 700,
                              marginBottom: 8,
                            }}
                          >
                            📏 {Number(seller.distanceKm || 0).toFixed(1)} km
                            away
                          </div>

                          {seller.isPremium ? (
                            <div
                              style={{
                                fontSize: 12,
                                color: "#16a34a",
                                marginBottom: 6,
                              }}
                            >
                              📞 {seller.phone}
                            </div>
                          ) : (
                            <div
                              style={{
                                fontSize: 11,
                                color: "#9ca3af",
                                marginBottom: 6,
                                fontStyle: "italic",
                              }}
                            >
                              📞 Contact available on booking
                            </div>
                          )}

                          <a
                            href={`/seller/${seller.id}`}
                            style={{
                              display: "block",
                              width: "100%",
                              padding: "6px 0",
                              borderRadius: 6,
                              background:
                                "linear-gradient(135deg, #6366f1, #4f46e5)",
                              color: "#fff",
                              fontWeight: 700,
                              fontSize: 12,
                              border: "none",
                              cursor: "pointer",
                              textAlign: "center",
                              textDecoration: "none",
                            }}
                          >
                            View Profile &amp; Services →
                          </a>
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                </MarkerClusterGroup>
              )}
            </MapContainer>
          </div>
        </div>

        <div className="lg:w-[42%]">
          <div
            className="flex gap-3 overflow-x-auto pb-2 pr-1 lg:block lg:h-[480px] lg:space-y-3 lg:overflow-y-auto lg:pb-0"
            style={{ scrollbarWidth: "thin" }}
          >
            {nearby.length === 0 && buyerPos && (
              <div className="w-full rounded-2xl border border-indigo-500/20 bg-indigo-950/20 py-12 text-center text-indigo-300">
                <div style={{ fontSize: 40 }}>🔍</div>
                <p className="mt-2 font-semibold">No providers found</p>
                <p className="mt-1 text-xs">
                  Try increasing radius or changing service
                </p>
              </div>
            )}

            {nearby.map((seller) => (
              <div
                key={seller.id}
                id={`seller-card-${seller.id}`}
                onClick={() => setSelectedSellerId(seller.id)}
                className="w-[280px] flex-shrink-0 cursor-pointer rounded-xl p-3 transition-all duration-200 lg:w-auto"
                style={{
                  background:
                    selectedSellerId === seller.id
                      ? "rgba(99,102,241,0.2)"
                      : "rgba(99,102,241,0.07)",
                  border:
                    selectedSellerId === seller.id
                      ? "1.5px solid #6366f1"
                      : "1px solid rgba(99,102,241,0.2)",
                  boxShadow:
                    selectedSellerId === seller.id
                      ? "0 0 0 2px rgba(99,102,241,0.25)"
                      : "none",
                }}
              >
                <div className="mb-2 flex items-center gap-2">
                  <div
                    className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                    style={{
                      background: "linear-gradient(135deg, #6366f1, #4f46e5)",
                    }}
                  >
                    {seller.name?.[0]?.toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-bold text-white">
                      {seller.name}
                    </div>
                    <div className="text-xs text-indigo-300">
                      {seller.service}
                    </div>
                  </div>
                  <div className="ml-auto whitespace-nowrap text-xs font-bold text-green-400">
                    {Number(seller.distanceKm || 0).toFixed(1)}km
                  </div>
                </div>

                <div className="mb-2 truncate text-xs text-indigo-400">
                  📍 {seller.address}
                </div>

                {seller.isPremium ? (
                  <div className="mb-2 text-xs text-green-400">
                    📞 {seller.phone}
                  </div>
                ) : (
                  <div className="mb-2 text-xs text-indigo-400">
                    📞 Contact available on booking
                  </div>
                )}

                <a
                  href={`/book/${seller.id}`}
                  onClick={(e) => e.stopPropagation()}
                  className="block w-full rounded-lg py-1.5 text-center text-xs font-bold text-white transition-all"
                  style={{
                    background: "linear-gradient(135deg, #6366f1, #4f46e5)",
                  }}
                >
                  Book Now →
                </a>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
