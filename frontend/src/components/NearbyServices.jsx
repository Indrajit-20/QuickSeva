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

export default function NearbyServices() {
  const [buyerPos, setBuyerPos] = useState(null);
  const [geoError, setGeoError] = useState("");
  const [search, setSearch] = useState("");
  const [locationQuery, setLocationQuery] = useState("");
  const [locationResults, setLocationResults] = useState([]);
  const [locationLoading, setLocationLoading] = useState(false);

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
    if (!normalizedSearch) return withDistance;

    return withDistance.filter((s) => {
      const serviceStr = (s?.service || "").toLowerCase();
      return serviceStr.includes(normalizedSearch);
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
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const nextPos = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
        gpsPosRef.current = nextPos;
        setBuyerPos(nextPos);
        setGeoError("");
      },
      () => setGeoError("Please allow location access to find nearby services"),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  return (
    <div className="space-y-3">
      <div className="grid gap-3 lg:grid-cols-[1.35fr_1fr]">
        <form
          ref={locationSearchRef}
          onSubmit={handleLocationSubmit}
          className="relative"
        >
          <label className="mb-1 block text-xs font-semibold text-indigo-200">
            📍 Search location
          </label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              value={locationQuery}
              onChange={(e) => setLocationQuery(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-sm font-medium bg-indigo-950/40 border border-indigo-500/30 text-white focus:outline-none"
              placeholder="Search area (e.g., Bopal, SG Highway, your office)"
            />
            <button
              type="submit"
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-bold text-white hover:bg-indigo-700"
            >
              {locationLoading ? "Searching..." : "Search"}
            </button>
            <button
              type="button"
              onClick={handleUseMyLocation}
              className="rounded-lg border border-indigo-500/30 bg-indigo-950/40 px-4 py-2 text-sm font-bold text-indigo-100 hover:bg-indigo-900/60"
            >
              📍 Use My Location
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

        <div>
          <label className="mb-1 block text-xs font-semibold text-indigo-200">
            Search service
          </label>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3 py-2 rounded-lg text-sm font-medium bg-indigo-950/40 border border-indigo-500/30 text-white focus:outline-none"
            placeholder={`Search service within ${radiusKm}km (e.g., Cleaning)`}
          />
        </div>
      </div>

      {buyerPos && (
        <p className="text-sm text-indigo-200">
          Showing {nearby.length} provider{nearby.length !== 1 ? "s" : ""}{" "}
          within {radiusKm}km
        </p>
      )}

      {geoError && <p className="text-sm text-red-300">⚠ {geoError}</p>}

      <div className="px-2 pt-2">
        <label className="text-xs font-semibold text-indigo-200">
          Search radius: {radiusKm} km
        </label>
        <input
          type="range"
          min={1}
          max={20}
          step={1}
          value={radiusKm}
          onChange={(e) => setRadiusKm(parseInt(e.target.value || "5", 10))}
          className="w-full mt-1 accent-indigo-600"
        />
      </div>

      <div
        style={{
          height: 450,
          width: "100%",
          borderRadius: 12,
          overflow: "hidden",
        }}
      >
        <MapContainer
          center={buyerPos ? [buyerPos.lat, buyerPos.lng] : [20.5937, 78.9629]}
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
                  icon={GREEN_ICON}
                >
                  <Popup minWidth={220}>
                    <div style={{ fontSize: 13, lineHeight: 1.35, padding: 4 }}>
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
                        📏 {Number(seller.distanceKm || 0).toFixed(1)} km away
                      </div>

                      <div
                        style={{
                          fontSize: 12,
                          color: "#4b5563",
                          marginBottom: 8,
                        }}
                      >
                        📞 {seller.phone}
                      </div>

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

      {buyerPos && nearby.length === 0 && !geoError && (
        <div className="text-sm text-indigo-200">
          No service providers found within {radiusKm}km
        </div>
      )}
    </div>
  );
}
