import React, { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";

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

  const lastGeocodeTimerRef = useRef(null);
  const abortCtrlRef = useRef(null);

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

      const parts = [
        data?.address?.road,
        data?.address?.suburb || data?.address?.neighbourhood,
        data?.address?.city || data?.address?.town,
        data?.address?.state,
      ].filter(Boolean);

      const shortAddress = parts.join(", ") || "";

      const addr = shortAddress;

      setAddress(addr);

      onChange?.({ lat, lng, address: addr });
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

  useEffect(() => {
    // Initial reverse geocode once on mount (so address input isn't empty)
    reverseGeocode(position.lat, position.lng);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) return;

    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        updateLocation(lat, lng, true);
        setGeoLoading(false);
      },
      () => {
        setGeoLoading(false);
        // Keep current position if GPS fails
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  return (
    <div className="space-y-3">
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

        {/* GPS overlay top-right */}
        <div style={{ position: "absolute", top: 12, right: 12, zIndex: 1000 }}>
          <button
            type="button"
            onClick={handleUseMyLocation}
            disabled={geoLoading}
            style={{
              background: "#22a06b",
              color: "white",
              fontWeight: 700,
              padding: "10px 12px",
              borderRadius: 10,
              border: "none",
              cursor: geoLoading ? "not-allowed" : "pointer",
              boxShadow: "0 8px 18px rgba(0,0,0,0.18)",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
            aria-label="Use My Current Location"
          >
            {geoLoading ? "Locating..." : "Use My Current Location"}
          </button>
        </div>
      </div>

      <input
        type="text"
        readOnly
        value={address}
        placeholder="Detected Address"
        className="w-full px-3 py-2 rounded-lg text-sm font-medium bg-indigo-950/40 border border-indigo-500/30 text-white focus:outline-none"
      />

      <p className="text-sm text-indigo-200">
        Click the map or drag the marker to set your service location
      </p>
    </div>
  );
}
