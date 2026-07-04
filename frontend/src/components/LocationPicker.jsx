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
export default function LocationPicker({ onChange, initialLocation, hideMap = false }) {
  const [position, setPosition] = useState({
    lat: initialLocation?.lat ? Number(initialLocation.lat) : INDIA_DEFAULT.lat,
    lng: initialLocation?.lng ? Number(initialLocation.lng) : INDIA_DEFAULT.lng,
  });
  const [zoom, setZoom] = useState(initialLocation?.lat ? 15 : INDIA_DEFAULT.zoom);
  const [address, setAddress] = useState(initialLocation?.address || "");
  const [pincode, setPincode] = useState(initialLocation?.pincode || "");
  const [geoLoading, setGeoLoading] = useState(false);
  const [locationQuery, setLocationQuery] = useState("");
  const [locationResults, setLocationResults] = useState([]);
  const [locationNotFoundMsg, setLocationNotFoundMsg] = useState("");
  const [flyTarget, setFlyTarget] = useState(null);

  const lastGeocodeTimerRef = useRef(null);
  const abortCtrlRef = useRef(null);
  const locationSearchRef = useRef(null);
  const suppressNextSearchRef = useRef(false);
  const searchCache = useRef({});

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
      )}&lon=${encodeURIComponent(lng)}&format=json&addressdetails=1&email=support@quickseva.com`;

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

      const pinVal = a.postcode || "";
      setPincode(pinVal);

      onChange?.({ lat, lng, address: shortAddress, pincode: pinVal });
    } catch (e) {
      // If request aborted, ignore. Otherwise keep empty address.
      if (e?.name === "AbortError") return;
      setAddress("");
      onChange?.({ lat, lng, address: "", pincode: "" });
    }
  };

  const updateLocation = (lat, lng, shouldZoom = false) => {
    const next = { lat, lng };
    setPosition(next);
    onChange?.({ lat, lng, address, pincode });

    if (shouldZoom) setZoom(15);

    // Debounced reverse geocode after every marker placement/drag update
    if (lastGeocodeTimerRef.current) clearTimeout(lastGeocodeTimerRef.current);
    lastGeocodeTimerRef.current = setTimeout(() => {
      reverseGeocode(lat, lng);
    }, REVERSE_GEOCODE_DEBOUNCE_MS);
  };

  async function nominatimSearch(q) {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=5&countrycodes=in&addressdetails=1&email=support@quickseva.com`,
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
    if (trimmed.length < 3) {
      setLocationResults([]);
      setLocationNotFoundMsg("");
      return;
    }

    const cacheKey = trimmed.toLowerCase();
    if (searchCache.current[cacheKey]) {
      setLocationResults(searchCache.current[cacheKey]);
      setLocationNotFoundMsg(
        searchCache.current[cacheKey].length === 0
          ? "No results found. Try search again."
          : "",
      );
      return;
    }

    try {
      const results = await nominatimSearch(trimmed);
      const data = Array.isArray(results) ? results : [];
      searchCache.current[cacheKey] = data;
      if (data.length === 0) {
        setLocationResults([]);
        setLocationNotFoundMsg("No results found. Try search again.");
        return;
      }
      setLocationResults(data);
      setLocationNotFoundMsg("");
    } catch {
      setLocationResults([]);
      setLocationNotFoundMsg("No results found. Try search again.");
    }
  };

  useEffect(() => {
    if (initialLocation?.lat && initialLocation?.lng) {
      const lat = Number(initialLocation.lat);
      const lng = Number(initialLocation.lng);
      setPosition({ lat, lng });
      setZoom(15);
      setFlyTarget({ center: [lat, lng], zoom: 15 });
      if (initialLocation.address) {
        setAddress(initialLocation.address);
        suppressNextSearchRef.current = true;
        setLocationQuery(initialLocation.address);
      } else {
        reverseGeocode(lat, lng);
      }
      if (initialLocation.pincode) {
        setPincode(initialLocation.pincode);
      }
    } else if (!hideMap) {
      reverseGeocode(position.lat, position.lng);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialLocation?.lat, initialLocation?.lng]);

  useEffect(() => {
    if (initialLocation?.pincode) {
      setPincode(initialLocation.pincode);
    }
  }, [initialLocation?.pincode]);

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
      if (locationQuery.trim().length >= 3) {
        searchLocation(locationQuery);
      } else {
        setLocationResults([]);
        setLocationNotFoundMsg("");
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [locationQuery]);

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }

    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        updateLocation(lat, lng, true);
        setFlyTarget({ center: [lat, lng], zoom: 15 });
        setGeoLoading(false);
      },
      (error) => {
        setGeoLoading(false);
        console.error("Geolocation error:", error);
        let errorMsg = "Could not detect location. Please check your browser permissions or search manually.";
        if (error.code === 1) {
          errorMsg = "Location permission denied. Please allow location access in your browser or search manually.";
        } else if (error.code === 2) {
          errorMsg = "Location unavailable. Please search manually.";
        } else if (error.code === 3) {
          errorMsg = "Location detection timed-out. Please try again or search manually.";
        }
        alert(errorMsg);
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

    // Extract postcode/pincode from search result's address object if available
    const pinVal = result.address?.postcode || "";
    setPincode(pinVal);

    onChange?.({ lat, lng, address: result.display_name || "", pincode: pinVal });

    if (lastGeocodeTimerRef.current) clearTimeout(lastGeocodeTimerRef.current);
    reverseGeocode(lat, lng);
  };

  const handleAddressChange = (e) => {
    const val = e.target.value;
    setAddress(val);
    onChange?.({ lat: position.lat, lng: position.lng, address: val, pincode });
  };

  const handlePincodeChange = (e) => {
    const val = e.target.value.replace(/\D/g, "").slice(0, 6);
    setPincode(val);
    onChange?.({ lat: position.lat, lng: position.lng, address, pincode: val });
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
            className="absolute left-0 right-0 top-full z-[1100] mt-2 max-h-64 overflow-y-auto rounded-lg shadow-lg border border-slate-200 bg-white"
          >
            {locationResults.map((result) => (
              <button
                key={`${result.place_id}-${result.lat}-${result.lon}`}
                type="button"
                onClick={() => handleLocationResultClick(result)}
                className="block w-full text-left text-sm text-slate-800 px-3 py-2 hover:bg-slate-100 transition-colors"
              >
                {result.display_name}
              </button>
            ))}

            {locationNotFoundMsg && locationResults.length === 0 && (
              <div className="text-sm text-slate-500 px-3 py-2">
                {locationNotFoundMsg}
              </div>
            )}
          </div>
        )}
      </div>

      {!hideMap && (
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
      )}

      <button
        type="button"
        onClick={handleUseMyLocation}
        disabled={geoLoading}
        className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-bold text-white bg-indigo-600 force-text-white hover:bg-indigo-700 transition disabled:opacity-50"
      >
        📍 {geoLoading ? "Detecting location..." : "Use My Current Location"}
      </button>

      <div className="grid grid-cols-1 gap-3">
        <div>
          <label className="text-xs font-semibold text-indigo-300 mb-1 block">
            📍 Service Address
          </label>
          <textarea
            value={address}
            onChange={handleAddressChange}
            placeholder={hideMap ? "Enter your service address..." : "Your full address will appear here after pinning location"}
            rows={2}
            className="w-full px-3 py-2 rounded-lg text-sm bg-indigo-950/40 border border-indigo-500/30 text-white focus:outline-none resize-none"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-indigo-300 mb-1 block">
            📮 Pincode
          </label>
          <input
            type="text"
            value={pincode}
            onChange={handlePincodeChange}
            placeholder="6-digit pincode"
            maxLength={6}
            className="w-full px-3 py-2 rounded-lg text-sm bg-indigo-950/40 border border-indigo-500/30 text-white focus:outline-none"
          />
        </div>
      </div>

      {!hideMap && (
        <p className="text-sm text-indigo-200">
          Click the map or drag the marker to set your service location
        </p>
      )}
    </div>
  );
}
