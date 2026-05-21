import React, { useEffect, useMemo, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import { useNavigate, useParams } from "react-router-dom";

// Fix Leaflet marker icon URLs in this map component
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

function MiniMap({ lat, lng }) {
  if (typeof lat !== "number" || typeof lng !== "number") return null;

  return (
    <div
      style={{
        height: 200,
        width: "100%",
        borderRadius: 12,
        overflow: "hidden",
      }}
    >
      <MapContainer
        center={[lat, lng]}
        zoom={13}
        dragging={false}
        zoomControl={false}
        scrollWheelZoom={false}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[lat, lng]} />
      </MapContainer>
    </div>
  );
}

function defaultServicesForSeller(seller) {
  const base = seller?.service ? String(seller.service) : "Service";
  return [
    {
      name: base,
      description: `Professional ${base} at your doorstep`,
      price: "₹299 onwards",
      duration: "1-2 hours",
      days: "Mon-Sun",
    },
    {
      name: `${base} - Premium`,
      description: "Full service with warranty",
      price: "₹599 onwards",
      duration: "2-3 hours",
      days: "Mon-Sun",
    },
    {
      name: `Emergency ${base}`,
      description: "24/7 emergency service",
      price: "₹799 onwards",
      duration: "On demand",
      days: "Anytime",
    },
  ];
}

export default function SellerPublicProfile() {
  const { id } = useParams();
  const navigate = useNavigate();

  const sellers = useMemo(() => {
    try {
      const raw = localStorage.getItem("sellers");
      const arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    } catch {
      return [];
    }
  }, []);

  const seller = useMemo(() => {
    return sellers.find((s) => String(s?.id) === String(id));
  }, [sellers, id]);

  const services = useMemo(() => {
    try {
      const raw = localStorage.getItem("sellerServices");
      const arr = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(arr)) return [];
      return arr.filter((sv) => String(sv?.sellerId) === String(seller?.id));
    } catch {
      return [];
    }
  }, [seller?.id]);

  const effectiveServices =
    services.length > 0 ? services : defaultServicesForSeller(seller);

  const avatarLetter = useMemo(() => {
    const name = seller?.name ? String(seller.name).trim() : "";
    return name ? name[0].toUpperCase() : "?";
  }, [seller?.name]);

  const [distanceLabel, setDistanceLabel] = useState("");

  useEffect(() => {
    // Optional: compute approximate distance from current GPS to show label
    const compute = async () => {
      if (
        !seller ||
        typeof seller.lat !== "number" ||
        typeof seller.lng !== "number"
      )
        return;
      if (!navigator.geolocation) return;

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat2 = pos.coords.latitude;
          const lng2 = pos.coords.longitude;
          const R = 6371;
          const dLat = ((seller.lat - lat2) * Math.PI) / 180;
          const dLng = ((seller.lng - lng2) * Math.PI) / 180;
          const a =
            Math.sin(dLat / 2) ** 2 +
            Math.cos(lat2 * (Math.PI / 180)) *
              Math.cos(seller.lat * (Math.PI / 180)) *
              Math.sin(dLng / 2) ** 2;
          const km = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          setDistanceLabel(`${km.toFixed(1)} km from your location`);
        },
        () => {},
        { enableHighAccuracy: true, timeout: 10000 },
      );
    };
    compute();
  }, [seller]);

  if (!seller) {
    return (
      <div className="min-h-screen bg-[#0f0e1a] text-white p-4">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mb-4 rounded-lg border border-indigo-500/30 bg-indigo-950/40 px-4 py-2 text-sm font-bold text-indigo-100 hover:bg-indigo-900/60"
        >
          ← Back
        </button>
        <div className="max-w-xl mx-auto rounded-xl border border-indigo-500/20 bg-indigo-950/30 p-5">
          <div className="text-lg font-bold">Seller not found</div>
        </div>
      </div>
    );
  }

  const callHref = `tel:${seller.phone || ""}`;
  const whatsappPhone = String(seller.phone || "").replace(/^0+/, "");
  const whatsappHref = whatsappPhone ? `https://wa.me/91${whatsappPhone}` : "#";
  const directionsHref =
    typeof seller.lat === "number" && typeof seller.lng === "number"
      ? `https://www.google.com/maps/dir/?api=1&destination=${seller.lat},${seller.lng}`
      : "#";

  return (
    <div className="min-h-screen bg-[#0f0e1a] text-white p-4">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="mb-4 rounded-lg border border-indigo-500/30 bg-indigo-950/40 px-4 py-2 text-sm font-bold text-indigo-100 hover:bg-indigo-900/60"
      >
        ← Back
      </button>

      <div className="max-w-3xl mx-auto space-y-4">
        <div className="rounded-2xl border border-indigo-500/20 bg-indigo-950/30 p-5">
          <div className="flex gap-4 items-center">
            <div
              className="h-16 w-16 rounded-full flex items-center justify-center text-white font-extrabold text-2xl"
              style={{
                background: "linear-gradient(135deg, #6366f1, #4f46e5)",
              }}
            >
              {avatarLetter}
            </div>
            <div className="min-w-0">
              <div className="text-2xl font-extrabold text-white truncate">
                {seller.name}
              </div>
              <div className="mt-1">
                <span className="inline-flex items-center rounded-full bg-green-500/15 text-green-300 px-3 py-1 text-xs font-bold">
                  {seller.service}
                </span>
              </div>
              {distanceLabel ? (
                <div className="mt-2 text-sm text-indigo-200">
                  📏 {distanceLabel}
                </div>
              ) : null}
            </div>
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <div className="text-sm text-indigo-200 flex items-center gap-2">
              📍 <span className="text-white/90">{seller.address}</span>
            </div>
            <div className="text-sm text-indigo-200 flex items-center gap-2">
              📞 <span className="text-white/90">{seller.phone}</span>
            </div>
          </div>

          <div className="mt-4">
            <MiniMap lat={seller.lat} lng={seller.lng} />
            <div className="mt-3 flex flex-col sm:flex-row gap-2">
              <a
                href={directionsHref}
                target="_blank"
                rel="noreferrer"
                className="w-full sm:w-auto rounded-lg bg-indigo-600 px-4 py-2 text-sm font-bold text-white hover:bg-indigo-700 text-center"
              >
                Get Directions
              </a>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-indigo-500/20 bg-indigo-950/30 p-5">
          <div className="text-lg font-extrabold mb-3">Services Offered</div>

          <div className="grid gap-3 md:grid-cols-2">
            {effectiveServices.map((sv, idx) => (
              <div
                key={`${sv.name}-${idx}`}
                className="rounded-xl border border-indigo-500/20 bg-[#0b0a14] p-4"
              >
                <div className="font-bold text-white">{sv.name}</div>
                <div className="mt-1 text-sm text-indigo-200">
                  {sv.description}
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                  <div className="text-indigo-200">💰 {sv.price}</div>
                  <div className="text-indigo-200">⏱ {sv.duration}</div>
                </div>
                {sv.days ? (
                  <div className="mt-2 text-sm text-indigo-200">
                    📅 {sv.days}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-indigo-500/20 bg-indigo-950/30 p-5">
          <div className="text-lg font-extrabold mb-3">Contact</div>

          <div className="grid gap-2 sm:grid-cols-2">
            <a
              href={callHref}
              className="rounded-lg bg-green-600 hover:bg-green-700 px-4 py-3 text-center font-extrabold"
            >
              📞 Call Now
            </a>
            <a
              href={whatsappHref}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg bg-[#22c55e] hover:bg-[#1f9a4e] px-4 py-3 text-center font-extrabold"
            >
              💬 WhatsApp
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
