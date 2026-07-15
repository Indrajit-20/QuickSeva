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
  Eye,
  X,
} from "lucide-react";
import apiClient from "../api/axiosConfig";
import axios from "axios";
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

function formatPrice(price, priceType) {
  if (priceType === "negotiable" || price === 0 || price === "0") {
    return "Onsite Quote (जांच के बाद)";
  }
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

  // Lightbox & image helper
  const [lightboxImage, setLightboxImage] = useState(null);
  const getImageUrl = (url) => {
    if (!url) return "";
    if (url.startsWith("http")) return url;
    const base = apiClient.defaults.baseURL ? apiClient.defaults.baseURL.replace("/api", "") : "http://localhost:5000";
    return `${base}${url}`;
  };

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    (async () => {
      try {
        setSellerLoading(true);
        const [sellerRes, servicesRes] = await Promise.all([
          apiClient.get(`/sellers/${id}`, { signal: controller.signal }),
          apiClient.get(`/services/seller/${id}`, { signal: controller.signal }).catch((err) => {
            if (axios.isCancel(err)) throw err;
            return { data: {} };
          }),
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
      } catch (err) {
        if (axios.isCancel(err)) return;
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
      controller.abort();
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
      price_type: "negotiable",
      visiting_charge: service.visiting_charge ?? 100,
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
      <main className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-800 px-4 py-10">
        <div className="mx-auto max-w-sm w-full rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-xl flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-100 border-t-indigo-600" />
          <h1 className="text-sm font-bold text-slate-600">Loading seller profile…</h1>
        </div>
      </main>
    );
  }

  if (!seller) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-800 px-4 py-10">
        <div className="mx-auto max-w-md w-full rounded-2xl border border-slate-200 bg-white p-8 shadow-xl">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="mb-6 inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-100 hover:scale-[1.02] active:scale-[0.98] transition shadow-sm"
          >
            <ArrowLeft size={16} />
            Back
          </button>
          <h1 className="text-xl font-black text-slate-800 mb-2">Seller not found</h1>
          <p className="text-sm text-slate-500">The profile you are looking for might have been removed or is temporarily unavailable.</p>
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
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-800">
      <div className="mx-auto max-w-6xl space-y-5">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 transition shadow-sm"
        >
          <ArrowLeft size={16} />
          Back
        </button>

        <section className="grid gap-5 lg:grid-cols-[1fr_380px]">
          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm text-center flex flex-col items-center">
            {/* Centered Profile Avatar */}
            {seller.profile_picture_url || seller.profile_pic ? (
              <img
                src={getImageUrl(seller.profile_picture_url || seller.profile_pic)}
                alt="Profile"
                className="h-24 w-24 rounded-full border-4 border-indigo-500/10 object-cover shadow-xl cursor-pointer hover:scale-105 transition duration-200"
                onClick={() => setLightboxImage(seller.profile_picture_url || seller.profile_pic)}
              />
            ) : (
              <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 text-3xl font-black text-white force-text-white shadow-xl">
                {avatarLetter}
              </div>
            )}

            {/* Center-aligned Name and Category */}
            <h1 className="mt-4 text-3xl font-black text-slate-800 flex items-center gap-2 justify-center">
              {seller.name}
            </h1>

            <div className="mt-2 flex flex-wrap gap-2 justify-center items-center">
              <span className="rounded-full border border-purple-200 bg-purple-50 px-3 py-1 text-xs font-black text-purple-700">
                {seller.service || "Service Provider"}
              </span>
              {seller.experience_yrs !== undefined && (
                <span className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                  {seller.experience_yrs} Years Experience
                </span>
              )}
              {seller.seller_type && (
                <span className="rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-black text-indigo-700 capitalize">
                  {seller.seller_type === "agency" ? "Contractor / Agency" : seller.seller_type}
                </span>
              )}
            </div>

            <p className="mt-3 text-sm font-semibold text-indigo-600">
              {distanceLabel || "Distance will appear after location access"}
            </p>

            {/* Address and Phone Grid */}
            <div className="mt-6 w-full grid gap-3 sm:grid-cols-2 text-left">
              <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
                <MapPin size={18} className="mt-0.5 text-[#0284c7] shrink-0" />
                <span className="text-sm font-semibold text-slate-700">
                  {seller.address || "Address not available"}
                </span>
              </div>
              <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
                <Phone size={18} className="mt-0.5 text-[#0284c7] shrink-0" />
                <span className="text-sm font-semibold text-slate-700">
                  {showContact ? seller.phone || "Phone not available" : "**********"}
                </span>
              </div>
            </div>

            {/* About Me Section */}
            {seller.bio && (
              <div className="mt-6 w-full text-left border-t border-slate-100 pt-6">
                <h3 className="text-lg font-bold text-slate-800 mb-2">About Me</h3>
                <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">
                  {seller.bio}
                </p>
              </div>
            )}
          </div>

          <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm h-fit">
            <h2 className="text-xl font-black text-slate-800">Contact / Action</h2>
            <div className="mt-4 space-y-3">
              <button
                type="button"
                onClick={handleBook}
                className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-700 px-4 py-3 text-base font-bold text-white force-text-white shadow-lg shadow-indigo-100/20 transition duration-150 active:scale-[0.98]"
              >
                Book This Service
              </button>
              {bookingError && (
                <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-bold text-red-700">
                  {bookingError}
                </p>
              )}

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                {showContact ? (
                  <>
                    <a
                      href={`tel:${seller.phone || ""}`}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 font-black text-emerald-700 hover:bg-emerald-100/50 transition"
                    >
                      <Phone size={17} />
                      Call Now
                    </a>
                    <a
                      href={whatsappHref}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 font-black text-green-700 hover:bg-green-100/50 transition"
                    >
                      <MessageCircle size={17} />
                      WhatsApp
                    </a>
                  </>
                ) : seller?.hasSufficientBalance === false ? (
                  <div className="w-full text-center rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-bold text-slate-600 text-sm">
                    Contact details will be visible after booking.
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
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-black text-slate-700 hover:bg-slate-100 transition disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {contactLoading ? "Connecting…" : "View Contact"}
                  </button>
                )}
              </div>

              {contactError && (
                <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-bold text-red-700">
                  {contactError}
                </p>
              )}
            </div>
          </aside>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-2xl font-black text-slate-800">Services Offered</h2>
            {selectedService && (
              <span className="rounded-full border border-purple-200 bg-purple-50 px-3 py-1 text-xs font-black text-purple-700">
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
                  className={`rounded-2xl border-2 p-4 text-left transition duration-200 ${active
                    ? "qs-selected-active shadow-md"
                    : "border-slate-200 bg-white hover:border-[var(--qs-primary)]/30 shadow-sm"
                    }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-black text-slate-800">
                        {service.name}
                      </h3>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        <span className="text-[10px] font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                          Starts from / शुरुआत: ₹{Number(service.price || 0).toLocaleString("en-IN")}
                        </span>
                        <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200/50">
                          Onsite Quote / जांच के बाद
                        </span>
                        {service.sub_service_name && (
                          <span className="text-[10px] bg-purple-50 border border-purple-200 text-purple-700 font-bold px-2 py-0.5 rounded-full">
                            🎯 {service.sub_service_name}
                          </span>
                        )}
                      </div>
                      <p className="mt-2 text-sm font-medium text-slate-600">
                        {service.description}
                      </p>
                    </div>
                    <div
                      className={`mt-1 h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 transition duration-150 ${active
                        ? "qs-selected-dot border-[#0284c7]"
                        : "border-slate-300 bg-white"
                        }`}
                    >
                      {active && (
                        <div className="h-2 w-2 rounded-full bg-white force-text-white" />
                      )}
                    </div>
                  </div>

                  <div className="mt-4 grid gap-2 text-sm font-bold text-slate-600 sm:grid-cols-3">
                    <span className="inline-flex items-center gap-1 text-emerald-600">
                      <IndianRupee size={15} />
                      <span>Visit Fee: ₹{Number(service.visiting_charge || 0).toLocaleString("en-IN")}</span>
                    </span>
                    <span className="inline-flex items-center gap-1 text-slate-500">
                      <Clock size={15} />
                      {service.duration}
                    </span>
                    <span className="inline-flex items-center gap-1 text-slate-500">
                      <CalendarDays size={15} />
                      {service.availability.join(", ")}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {seller.work_images && seller.work_images.length > 0 && (
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
            <h2 className="text-2xl font-black text-slate-800">Work Portfolio / Portfolio / काम की तस्वीरें</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {seller.work_images.map((img) => (
                <div
                  key={img.id}
                  className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 cursor-pointer group shadow-sm hover:shadow-md transition duration-200"
                  onClick={() => setLightboxImage(img.image_url)}
                >
                  <img
                    src={getImageUrl(img.image_url)}
                    alt="Portfolio item"
                    className="w-full h-full object-cover transition duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 flex items-center justify-center transition duration-200">
                    <span className="text-white text-xs font-bold bg-black/60 px-3 py-1.5 rounded-full flex items-center gap-1.5">
                      <Eye size={14} />
                      <span>Zoom / बड़ा करें</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Lightbox Modal */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setLightboxImage(null)}
        >
          <button
            className="absolute top-4 right-4 text-white hover:text-slate-300"
            onClick={() => setLightboxImage(null)}
          >
            <X size={28} />
          </button>
          <img
            src={getImageUrl(lightboxImage)}
            alt="Portfolio Lightbox"
            className="max-w-full max-h-[90vh] object-contain rounded shadow-2xl"
          />
        </div>
      )}
    </main>
  );
}
