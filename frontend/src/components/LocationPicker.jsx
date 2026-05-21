import React, { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMap,
  useMapEvents,
} from "react-leaflet";

// Fix Leaflet marker icon URLs (must be top of every map component file)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const INDIA_DEFAULT = { lat: 20.5937, lng: 78.9629, zoom: 5 };

// Keep reverse-geocoding request from firing too frequently on drag
const REVERSE_GEOCODE_DEBOUNCE_MS = 600;

function MapController({ center, zoom }) {
  const map = useMap();
  const prevCenter = useRef(null);
  useEffect(() => {
    if (!center) return;
    const key = `${center[0]},${center[1]}`;
    if (prevCenter.current === key) return;
    prevCenter.current = key;
    map.flyTo(center, zoom || map.getZoom(), { animate: true, duration: 1.0 });
  }, [center, zoom, map]);
  return null;
}

function LocationClickAndDragHandler({ onUpdate }) {
  // This component only listens to map interactions, marker itself is managed in parent
  useMapEvents({
    click: (e) => {
      onUpdate(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

/**
 * Props:
 * - onChange({ lat, lng, address })
 */
export default function LocationPicker({ onChange }) {
  const [position, setPosition] = useState({
    lat: INDIA_DEFAULT.lat,
    lng: INDIA_DEFAULT.lng,
  });
  const [zoom, setZoom] = useState(INDIA_DEFAULT.zoom);
  const [address, setAddress] = useState("");
  const [geoLoading, setGeoLoading] = useState(false);
  const [locationQuery, setLocationQuery] = useState("");
  const [locationResults, setLocationResults] = useState([]);
  const [locationNotFoundMsg, setLocationNotFoundMsg] = useState("");
  const [flyTarget, setFlyTarget] = useState(null);

  const lastGeocodeTimerRef = useRef(null);
  const abortCtrlRef = useRef(null);
  const locationSearchRef = useRef(null);
  const suppressNextSearchRef = useRef(false);

  const center = useMemo(
    () => [position.lat, position.lng],
    [position.lat, position.lng],
  );

  const reverseGeocode = async (lat, lng) => {
    // Free reverse geocoding via Nominatim (no API key)
    // NOTE: Nominatim usage requires User-Agent in production; add backend/proxy if needed.
    try {
      if (abortCtrlRef.current) abortCtrlRef.current.abort();
      const ctrl = new AbortController();
      abortCtrlRef.current = ctrl;

      const url = `https://nominatim.openstreetmap.org/reverse?lat=${encodeURIComponent(
        lat,
      )}&lon=${encodeURIComponent(lng)}&format=json`;

      const res = await fetch(url, {
        signal: ctrl.signal,
        headers: { Accept: "application/json" },
      });
      if (!res.ok) throw new Error(`Reverse geocode failed: ${res.status}`);
      const data = await res.json();

      const a = data?.address || {};

      // Build a detailed readable address
      const parts = [
        // House/building number
        a.house_number,
        // Street/road name
        a.road || a.pedestrian || a.footway || a.path,
        // Local area
        a.neighbourhood || a.quarter || a.hamlet,
        // Suburb/area
        a.suburb || a.residential,
        // Village/town/city
        a.village || a.town || a.city || a.municipality,
        // District
        a.county || a.state_district,
        // State
        a.state,
        // Pincode
        a.postcode,
      ].filter(Boolean);

      // If Nominatim gave us good parts use them
      // Otherwise fall back to first 5 segments of display_name
      const shortAddress =
        parts.length >= 2
          ? parts.join(", ")
          : (data?.display_name || "").split(",").slice(0, 5).join(",").trim();

      setAddress(shortAddress);

      onChange?.({ lat, lng, address: shortAddress });
    } catch (e) {
      // If request aborted, ignore. Otherwise keep empty address.
      if (e?.name === "AbortError") return;
      setAddress("");
      onChange?.({ lat, lng, address: "" });
    }
  };

  const updateLocation = (lat, lng, shouldZoom = false) => {
    const next = { lat, lng };
    setPosition(next);
    onChange?.({ lat, lng, address });

    if (shouldZoom) setZoom(15);

    // Debounced reverse geocode after every marker placement/drag update
    if (lastGeocodeTimerRef.current) clearTimeout(lastGeocodeTimerRef.current);
    lastGeocodeTimerRef.current = setTimeout(() => {
      reverseGeocode(lat, lng);
    }, REVERSE_GEOCODE_DEBOUNCE_MS);
  };

  async function nominatimSearch(q) {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=5&countrycodes=in`,
      {
        headers: {
          Accept: "application/json",
          "User-Agent": "QuickSeva/1.0",
        },
      },
    );
    return res.json();
  }

  const searchLocation = async (query) => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setLocationResults([]);
      setLocationNotFoundMsg("");
      return;
    }

    try {
      const results = await nominatimSearch(trimmed);
      if (!Array.isArray(results) || results.length === 0) {
        setLocationResults([]);
        setLocationNotFoundMsg("No results found. Try clicking the map directly.");
        return;
      }
      setLocationResults(results);
      setLocationNotFoundMsg("");
    } catch {
      setLocationResults([]);
      setLocationNotFoundMsg("No results found. Try clicking the map directly.");
    }
  };

  useEffect(() => {
    // Initial reverse geocode once on mount (so address input isn't empty)
    reverseGeocode(position.lat, position.lng);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      if (suppressNextSearchRef.current) {
        suppressNextSearchRef.current = false;
        return;
      }
      searchLocation(locationQuery);
    }, 400);
    return () => clearTimeout(timer);
  }, [locationQuery]);

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) return;

    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        updateLocation(lat, lng, true);
        setFlyTarget({ center: [lat, lng], zoom: 15 });
        setGeoLoading(false);
      },
      () => {
        setGeoLoading(false);
        // Keep current position if GPS fails
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const handleLocationResultClick = (result) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    if (Number.isNaN(lat) || Number.isNaN(lng)) return;

    suppressNextSearchRef.current = true;
    setLocationQuery(result.display_name || "");
    setLocationResults([]);
    setLocationNotFoundMsg("");
    setPosition({ lat, lng });
    setZoom(16);
    setFlyTarget({ center: [lat, lng], zoom: 16 });
    onChange?.({ lat, lng, address });

    if (lastGeocodeTimerRef.current) clearTimeout(lastGeocodeTimerRef.current);
    reverseGeocode(lat, lng);
  };

  return (
    <div className="space-y-3">
      <div ref={locationSearchRef} className="relative">
        <input
          type="text"
          value={locationQuery}
          onChange={(e) => setLocationQuery(e.target.value)}
          placeholder="Search your area, street or landmark..."
          className="w-full px-3 py-2 rounded-lg text-sm font-medium bg-indigo-950/40 border border-indigo-500/30 text-white focus:outline-none"
        />

        {(locationResults.length > 0 || locationNotFoundMsg) && (
          <div
            className="absolute left-0 right-0 top-full z-[1100] mt-2 max-h-64 overflow-y-auto rounded-lg"
            style={{
              background: "rgba(15,14,26,0.98)",
              border: "1px solid rgba(99,102,241,0.3)",
            }}
          >
            {locationResults.map((result) => (
              <button
                key={`${result.place_id}-${result.lat}-${result.lon}`}
                type="button"
                onClick={() => handleLocationResultClick(result)}
                className="block w-full text-left text-sm text-indigo-100 px-3 py-2 hover:bg-indigo-900/60"
              >
                {result.display_name}
              </button>
            ))}

            {locationNotFoundMsg && locationResults.length === 0 && (
              <div className="text-sm text-indigo-100 px-3 py-2">
                {locationNotFoundMsg}
              </div>
            )}
          </div>
        )}
      </div>

      <div
        style={{
          height: 350,
          width: "100%",
          borderRadius: 12,
          overflow: "hidden",
        }}
      >
        <MapContainer
          center={center}
          zoom={zoom}
          scrollWheelZoom
          style={{ height: "100%", width: "100%" }}
        >
          <MapController center={flyTarget?.center} zoom={flyTarget?.zoom} />

          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <LocationClickAndDragHandler
            onUpdate={(lat, lng) => updateLocation(lat, lng, false)}
          />

          <Marker
            position={center}
            draggable
            eventHandlers={{
              dragend: (e) => {
                const ll = e.target.getLatLng();
                updateLocation(ll.lat, ll.lng, false);
              },
            }}
          />
        </MapContainer>
      </div>

      <button
        type="button"
        onClick={handleUseMyLocation}
        disabled={geoLoading}
        className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-bold text-white border border-indigo-500/30 bg-indigo-950/40 hover:bg-indigo-900/60 transition disabled:opacity-50"
      >
        📍 {geoLoading ? "Detecting location..." : "Use My Current Location"}
      </button>

      <div>
        <label className="text-xs font-semibold text-indigo-300 mb-1 block">
          📍 Detected Address
        </label>
        <textarea
          readOnly
          value={address}
          placeholder="Your full address will appear here after pinning location"
          rows={2}
          className="w-full px-3 py-2 rounded-lg text-sm bg-indigo-950/40 border border-indigo-500/30 text-white focus:outline-none cursor-default resize-none"
        />
      </div>

      <p className="text-sm text-indigo-200">
        Click the map or drag the marker to set your service location
      </p>
    </div>
  );
}
