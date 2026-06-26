import React, { useEffect, useMemo, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapContainer, Marker, TileLayer } from "react-leaflet";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  CalendarDays,
  Clock,
  IndianRupee,
  MapPin,
  MessageCircle,
  Navigation,
  Phone,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
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

function formatPrice(price) {
  if (typeof price === "number") {
    return `Rs ${price.toLocaleString("en-IN")} onwards`;
  }
  return price || "Price on request";
}

function normalizePhone(phone) {
  return String(phone || "").replace(/\D/g, "");
}

function MiniMap({ lat, lng }) {
  if (typeof lat !== "number" || typeof lng !== "number") return null;

  return (
    <div className="h-56 overflow-hidden rounded-xl border border-indigo-500/20">
      <MapContainer
        center={[lat, lng]}
        zoom={14}
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
      id: "standard",
      name: base,
      description: `Professional ${base.toLowerCase()} service at your doorstep.`,
      price: 299,
      duration: "1-2 hours",
      availability: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    },
    {
      id: "deep",
      name: `${base} Deep Service`,
      description: "Detailed service with inspection, cleanup, and support.",
      price: 599,
      duration: "2-3 hours",
      availability: ["Mon", "Wed", "Fri", "Sun"],
    },
    {
      id: "emergency",
      name: `Emergency ${base}`,
      description: "Fast-response visit for urgent service requirements.",
      price: 799,
      duration: "On demand",
      availability: ["All days"],
    },
  ];
}

export default function SellerPublicProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [selectedService, setSelectedService] = useState(null);
  const [bookingError, setBookingError] = useState("");
  const [distanceLabel, setDistanceLabel] = useState("");

  const [showContact, setShowContact] = useState(false);
  const [contactLoading, setContactLoading] = useState(false);
  const [contactError, setContactError] = useState("");

  // Load seller + services from backend (no localStorage for business data).
  const [seller, setSeller] = useState(null);
  const [sellerLoading, setSellerLoading] = useState(true);
  const [savedServices, setSavedServices] = useState([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setSellerLoading(true);
        const apiClient = (await import("../api/axiosConfig.js")).default;
        const [sellerRes, servicesRes] = await Promise.all([
          apiClient.get(`/sellers/${id}`),
          apiClient.get(`/services/seller/${id}`).catch(() => ({ data: {} })),
        ]);
        const rawSeller =
          sellerRes?.data?.data?.seller ||
          sellerRes?.data?.seller ||
          null;
        // Normalize backend shape → legacy keys used by existing JSX.
        const s = rawSeller
          ? {
            ...rawSeller,
            name: rawSeller.business_name || rawSeller.name || "Seller",
            service:
              rawSeller.category_name ||
              rawSeller.service ||
              "Service Provider",
            address: rawSeller.address || rawSeller.city || "",
            lat: rawSeller.lat != null ? Number(rawSeller.lat) : undefined,
            lng: rawSeller.lng != null ? Number(rawSeller.lng) : undefined,
            hasSufficientBalance: rawSeller.hasSufficientBalance,
          }
          : null;
        const svc =
          servicesRes?.data?.data?.services ||
          servicesRes?.data?.services ||
          [];
        if (!cancelled) {
          setSeller(s);
          setSavedServices(Array.isArray(svc) ? svc : []);
        }
      } catch {
        if (!cancelled) {
          setSeller(null);
          setSavedServices([]);
        }
      } finally {
        if (!cancelled) setSellerLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const services = useMemo(() => {
    const source =
      savedServices.length > 0
        ? savedServices
        : defaultServicesForSeller(seller);

    return source.map((service, index) => ({
      id: service.id || `${service.title || service.name}-${index}`,
      name: service.title || service.name || seller?.business_name || "Service",
      description:
        service.description || "Professional service from a verified provider.",
      price: service.price ?? "Price on request",
      duration: service.duration_hrs
        ? `${service.duration_hrs} hrs`
        : service.duration || "1-2 hours",
      availability: Array.isArray(service.availability)
        ? service.availability
        : ["Mon-Sun"],
      sub_service_name: service.sub_service_name || null,
    }));
  }, [savedServices, seller]);

  useEffect(() => {
    // Online service providers shouldn't show distance.
    const serviceMode = seller?.serviceMode;
    const isOnlineCapable = serviceMode === "online" || serviceMode === "both";

    if (isOnlineCapable) {
      setDistanceLabel("🌐 Works Across India");
      return undefined;
    }

    if (
      !seller ||
      typeof seller.lat !== "number" ||
      typeof seller.lng !== "number" ||
      !navigator.geolocation
    ) {
      return undefined;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const km = getDistanceKm(
          pos.coords.latitude,
          pos.coords.longitude,
          seller.lat,
          seller.lng,
        );
        setDistanceLabel(`${km.toFixed(1)} km away`);
      },
      () => { },
      { enableHighAccuracy: true, timeout: 10000 },
    );

    return undefined;
  }, [seller]);

  // Check if lead has already been charged whenever selectedService, seller or auth status changes.
  // This ensures that refreshing the page retains access if already paid.
  useEffect(() => {
    if (!selectedService || !seller?.id || !isAuthenticated) {
      setShowContact(false);
      return;
    }

    let active = true;
    (async () => {
      try {
        const apiClient = (await import("../api/axiosConfig.js")).default;
        const res = await apiClient.get(`/leads/check`, {
          params: {
            sellerId: seller.id,
            serviceId: selectedService.id,
          },
        });
        if (active) {
          if (res?.data?.data?.exists || res?.data?.exists) {
            setShowContact(true);
            setContactError("");
          } else {
            setShowContact(false);
          }
        }
      } catch (err) {
        if (active) {
          setShowContact(false);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [selectedService, seller, isAuthenticated]);

  if (sellerLoading) {
    return (
      <main className="min-h-screen bg-[#0d0d1a] px-4 py-10 text-white">
        <div className="mx-auto max-w-xl rounded-2xl border border-indigo-500/20 bg-[#1a1a2e] p-6 text-center">
          <h1 className="text-xl font-black">Loading seller…</h1>
        </div>
      </main>
    );
  }

  if (!seller) {
    return (
      <main className="min-h-screen bg-[#0d0d1a] px-4 py-10 text-white">
        <div className="mx-auto max-w-xl rounded-2xl border border-indigo-500/20 bg-[#1a1a2e] p-6">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="mb-5 inline-flex items-center gap-2 rounded-lg border border-indigo-400/30 px-4 py-2 text-sm font-bold text-indigo-100 hover:bg-indigo-500/10"
          >
            <ArrowLeft size={16} />
            Back
          </button>
          <h1 className="text-xl font-black">Seller not found</h1>
        </div>
      </main>
    );
  }

  const avatarLetter = seller.name?.trim()?.[0]?.toUpperCase() || "?";
  const phoneDigits = normalizePhone(seller.phone);
  const whatsappHref = phoneDigits
    ? `https://wa.me/${phoneDigits.length === 10 ? `91${phoneDigits}` : phoneDigits}`
    : "#";
  const directionsHref =
    typeof seller.lat === "number" && typeof seller.lng === "number"
      ? `https://www.google.com/maps/dir/?api=1&destination=${seller.lat},${seller.lng}`
      : "#";

  const handleSelectService = (service) => {
    setSelectedService(service);
    setBookingError("");
  };

  const handleBook = () => {
    if (!selectedService) {
      setBookingError("Please select a service to continue");
      return;
    }

    navigate(`/book/${seller.id}`, { state: { selectedService } });
  };

  const chargeAndRevealContact = async () => {
    if (!isAuthenticated) {
      setContactError("Login is required to view contact details.");
      return;
    }
    if (!selectedService) {
      setContactError("Select a service first.");
      return;
    }
    if (!seller?.id) {
      setContactError("Seller not found.");
      return;
    }

    setContactLoading(true);
    setContactError("");

    try {
      // Use same axios config style as other API files
      const apiClient = (await import("../api/axiosConfig.js")).default;

      const res = await apiClient.post("/leads/charge", {
        sellerId: seller.id,
        serviceId: selectedService.id,
        source: "contact_view",
      });

      if (res?.data?.charged) {
        setShowContact(true);
      } else {
        // Already charged for this buyer->seller->service; still reveal
        setShowContact(true);
      }
    } catch (err) {
      setContactError(
        err?.response?.data?.message || "Failed to reveal contact.",
      );
    } finally {
      setContactLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#0d0d1a] px-4 py-8 text-white">
      <div className="mx-auto max-w-6xl space-y-5">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 rounded-lg border border-indigo-400/30 bg-[#1a1a2e] px-4 py-2 text-sm font-bold text-indigo-100 hover:bg-indigo-500/10"
        >
          <ArrowLeft size={16} />
          Back
        </button>

        <section className="grid gap-5 lg:grid-cols-[1fr_380px]">
          <div className="rounded-2xl border border-indigo-500/20 bg-[#1a1a2e] p-5 shadow-2xl shadow-black/20">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 text-3xl font-black">
                {avatarLetter}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="truncate text-3xl font-black text-white">
                    {seller.name}
                  </h1>
                  <span className="rounded-full border border-purple-400/30 bg-purple-500/10 px-3 py-1 text-xs font-black text-purple-200">
                    {seller.service || "Service Provider"}
                  </span>
                </div>
                <p className="mt-2 text-sm font-semibold text-indigo-200">
                  {distanceLabel ||
                    "Distance will appear after location access"}
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="flex items-start gap-3 rounded-xl border border-indigo-500/20 bg-[#0f1024] p-4">
                <MapPin size={18} className="mt-0.5 text-purple-300" />
                <span className="text-sm font-semibold text-slate-200">
                  {seller.address || "Address not available"}
                </span>
              </div>
              <div className="flex items-start gap-3 rounded-xl border border-indigo-500/20 bg-[#0f1024] p-4">
                <Phone size={18} className="mt-0.5 text-purple-300" />
                <span className="text-sm font-semibold text-slate-200">
                  {showContact ? seller.phone || "Phone not available" : "**********"}
                </span>
              </div>
            </div>

            {/* <div className="mt-5">
              <MiniMap lat={seller.lat} lng={seller.lng} />
              <a
                href={directionsHref}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-black text-white hover:bg-indigo-700"
              >
                <Navigation size={17} />
                Get Directions
              </a>
            </div> */}
          </div>

          <aside className="rounded-2xl border border-indigo-500/20 bg-[#1a1a2e] p-5 shadow-2xl shadow-black/20">
            <h2 className="text-xl font-black text-white">Contact / Action</h2>
            <div className="mt-4 space-y-3">
              <button
                type="button"
                onClick={handleBook}
                className="w-full rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-3 text-base font-black text-white shadow-lg shadow-purple-950/40 hover:from-purple-500 hover:to-indigo-500"
              >
                Book This Service
              </button>
              {bookingError && (
                <p className="rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm font-bold text-red-200">
                  {bookingError}
                </p>
              )}

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                {showContact ? (
                  <>
                    <a
                      href={`tel:${seller.phone || ""}`}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 font-black text-emerald-200 hover:bg-emerald-500/20"
                    >
                      <Phone size={17} />
                      Call Now
                    </a>
                    <a
                      href={whatsappHref}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-green-400/30 bg-green-500/10 px-4 py-3 font-black text-green-200 hover:bg-green-500/20"
                    >
                      <MessageCircle size={17} />
                      WhatsApp
                    </a>
                  </>
                ) : seller?.hasSufficientBalance === false ? (
                  <div className="w-full text-center rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 font-bold text-red-200 text-sm">
                    Contact details unavailable (Seller is inactive/offline)
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      const ok = window.confirm(
                        "Interested in this service?\n\nWould you like to connect with this service provider?",
                      );
                      if (!ok) return;
                      chargeAndRevealContact();
                    }}
                    disabled={contactLoading}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-indigo-400/30 bg-indigo-500/10 px-4 py-3 font-black text-indigo-200 hover:bg-indigo-500/20 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {contactLoading ? "Connecting…" : "View Contact"}
                  </button>
                )}
              </div>

              {contactError && (
                <p className="mt-3 rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm font-bold text-red-200">
                  {contactError}
                </p>
              )}
            </div>
          </aside>
        </section>

        <section className="rounded-2xl border border-indigo-500/20 bg-[#1a1a2e] p-5 shadow-2xl shadow-black/20">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-2xl font-black text-white">Services Offered</h2>
            {selectedService && (
              <span className="rounded-full border border-purple-400/30 bg-purple-500/10 px-3 py-1 text-xs font-black text-purple-200">
                Selected: {selectedService.name}
              </span>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {services.map((service) => {
              const active = selectedService?.id === service.id;
              return (
                <button
                  key={service.id}
                  type="button"
                  onClick={() => handleSelectService(service)}
                  className={`rounded-2xl border p-4 text-left transition ${active
                      ? "border-purple-400 bg-purple-500/10 shadow-[0_0_0_3px_rgba(168,85,247,0.18)]"
                      : "border-indigo-500/20 bg-[#0f1024] hover:border-indigo-400/50"
                    }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-black text-white">
                        {service.name}
                      </h3>
                      {service.sub_service_name && (
                        <span className="text-[10px] bg-purple-500/10 border border-purple-500/25 text-purple-300 font-bold px-2 py-0.5 rounded-full inline-block mt-1">
                          🎯 {service.sub_service_name}
                        </span>
                      )}
                      <p className="mt-2 text-sm font-medium text-slate-300">
                        {service.description}
                      </p>
                    </div>
                    <span
                      className={`mt-1 h-4 w-4 rounded-full border ${active
                          ? "border-purple-300 bg-purple-400"
                          : "border-slate-500"
                        }`}
                    />
                  </div>

                  <div className="mt-4 grid gap-2 text-sm font-bold text-indigo-100 sm:grid-cols-3">
                    <span className="inline-flex items-center gap-1 text-amber-300">
                      <IndianRupee size={15} />
                      {formatPrice(service.price).replace(/^Rs\s?/, "")}
                    </span>
                    <span className="inline-flex items-center gap-1 text-slate-300">
                      <Clock size={15} />
                      {service.duration}
                    </span>
                    <span className="inline-flex items-center gap-1 text-slate-300">
                      <CalendarDays size={15} />
                      {service.availability.join(", ")}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}
