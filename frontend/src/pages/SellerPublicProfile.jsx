import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
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
  X,
  Eye,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import apiClient from "../api/axiosConfig";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { getUserLocation } from "../utils/getLocation";
import SellerProfileSkeleton from "../components/SellerProfileSkeleton";

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

function maskPhone(phone) {
  if (!phone) return "710*****166";
  const str = String(phone).trim();
  if (str.includes("*")) return str;
  const digits = str.replace(/\D/g, "");
  if (digits.length >= 10) {
    return `${digits.slice(0, 3)}*****${digits.slice(-2)}`;
  }
  return "710*****166";
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
  const { user, isAuthenticated } = useAuth();
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
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [lightboxImages, setLightboxImages] = useState([]);

  const handlePrevImage = (e) => {
    e.stopPropagation();
    setLightboxIndex((prev) => (prev > 0 ? prev - 1 : lightboxImages.length - 1));
  };

  const handleNextImage = (e) => {
    e.stopPropagation();
    setLightboxIndex((prev) => (prev < lightboxImages.length - 1 ? prev + 1 : 0));
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (lightboxIndex === null) return;
      if (e.key === "ArrowLeft") {
        setLightboxIndex((prev) => (prev > 0 ? prev - 1 : lightboxImages.length - 1));
      } else if (e.key === "ArrowRight") {
        setLightboxIndex((prev) => (prev < lightboxImages.length - 1 ? prev + 1 : 0));
      } else if (e.key === "Escape") {
        setLightboxIndex(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxIndex, lightboxImages]);

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
      visiting_charge: Math.max(100, Number(service.visiting_charge || 100)),
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
      return;
    }

    if (
      !seller ||
      typeof seller.lat !== "number" ||
      typeof seller.lng !== "number"
    ) {
      return;
    }

    getUserLocation()
      .then((loc) => {
        if (loc && typeof loc.lat === "number" && typeof loc.lng === "number") {
          const km = getDistanceKm(
            loc.lat,
            loc.lng,
            seller.lat,
            seller.lng,
          );
          setDistanceLabel(`${km.toFixed(1)} km away`);
        }
      })
      .catch(() => {});
  }, [seller?.lat, seller?.lng, seller?.serviceMode]);

  // Check if lead has already been charged whenever selectedService, seller or auth status changes.
  // This ensures that refreshing the page retains access if already paid.
  const firstServiceId = services[0]?.id;
  const selectedServiceId = selectedService?.id;

  useEffect(() => {
    if (!seller?.id || !isAuthenticated) {
      setShowContact(false);
      return;
    }

    let active = true;
    (async () => {
      try {
        const targetServiceId = selectedServiceId || firstServiceId;
        if (!targetServiceId) return;

        const res = await apiClient.get(`/leads/check`, {
          params: {
            sellerId: seller.id,
            serviceId: targetServiceId,
          },
        });
        if (active) {
          if (res?.data?.data?.exists || res?.data?.exists) {
            setShowContact(true);
            setContactError("");
            const unmaskedPhone = res?.data?.data?.phone || res?.data?.phone;
            if (unmaskedPhone) {
              setSeller((prev) => (prev?.phone === unmaskedPhone ? prev : { ...prev, phone: unmaskedPhone }));
            }
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
  }, [selectedServiceId, seller?.id, isAuthenticated, firstServiceId]);

  if (sellerLoading) {
    return <SellerProfileSkeleton />;
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
    if (user && seller && Number(user.id) === Number(seller.user_id)) {
      setBookingError("This is your own profile. You cannot book your own service. / यह आपका अपना प्रोफ़ाइल है। आप अपनी सेवा बुक नहीं कर सकते।");
      return;
    }
    if (seller && (seller.is_available === 0 || seller.is_available === false)) {
      setBookingError("This provider is currently offline and not accepting new bookings. Please try again when they come online.");
      return;
    }
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
    const targetService = selectedService || services[0];
    if (!targetService) {
      setContactError("No service available for this seller.");
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
        serviceId: targetService.id,
        source: "contact_view",
      });

      const unmaskedPhone = res?.data?.data?.phone || res?.data?.phone;
      if (unmaskedPhone) {
        setSeller((prev) => ({ ...prev, phone: unmaskedPhone }));
      } else {
        const sellerRes = await apiClient.get(`/sellers/${seller.id}`);
        const rawSeller = sellerRes?.data?.data?.seller || sellerRes?.data?.seller;
        if (rawSeller?.phone) {
          setSeller((prev) => ({ ...prev, phone: rawSeller.phone }));
        }
      }
      if (!selectedService) {
        setSelectedService(targetService);
      }
      setShowContact(true);
    } catch (err) {
      setContactError(
        err?.response?.data?.message || "Failed to reveal contact.",
      );
    } finally {
      setContactLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 px-3 py-4 sm:px-4 sm:py-8 text-slate-800">
      <div className="mx-auto max-w-6xl space-y-4">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-sm"
        >
          <ArrowLeft size={14} />
          Back
        </button>

        {/* ── COMPACT MOBILE PROFILE HEADER ── */}
        <section className="grid gap-4 lg:grid-cols-[1fr_360px]">
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            {/* Horizontal avatar + info strip */}
            <div className="flex items-center gap-3 p-4 border-b border-slate-100">
              {/* Avatar */}
              <div className="shrink-0">
                {seller.profile_picture_url || seller.profile_pic ? (
                  <img
                    src={getImageUrl(seller.profile_picture_url || seller.profile_pic)}
                    alt="Profile"
                    className="h-16 w-16 rounded-xl border-2 border-indigo-500/10 object-cover shadow-md cursor-pointer hover:scale-105 transition duration-200"
                    onClick={() => {
                      const pic = seller.profile_picture_url || seller.profile_pic;
                      if (pic) { setLightboxImages([pic]); setLightboxIndex(0); }
                    }}
                  />
                ) : (
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 text-2xl font-bold text-white force-text-white shadow-md">
                    {avatarLetter}
                  </div>
                )}
              </div>

              {/* Name + status + service side-by-side */}
              <div className="flex-1 min-w-0">
                <h1 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 leading-tight">
                  {seller.name}
                </h1>
                <div className="mt-1 flex flex-wrap gap-1.5 items-center">
                  {seller.is_available === 0 || seller.is_available === false ? (
                    <span className="rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-xs font-bold text-amber-800 flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                      Offline
                    </span>
                  ) : (
                    <span className="rounded-full border border-emerald-300 bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-800 flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Live &amp; Available
                    </span>
                  )}
                  <span className="rounded-full border border-purple-200 bg-purple-50 px-2 py-0.5 text-xs font-semibold text-purple-700">
                    {seller.service || "Service Provider"}
                  </span>
                  {seller.experience_yrs !== undefined && (
                    <span className="rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                      {seller.experience_yrs} yrs exp
                    </span>
                  )}
                  {seller.seller_type && (
                    <span className="rounded-full border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-700 capitalize">
                      {seller.seller_type === "agency" ? "Agency" : seller.seller_type}
                    </span>
                  )}
                </div>
                {distanceLabel && (
                  <p className="mt-1 text-xs font-semibold text-indigo-500">{distanceLabel}</p>
                )}
              </div>
            </div>

            {/* Slim address + phone info strip */}
            <div className="grid grid-cols-2 divide-x divide-slate-100 border-b border-slate-100">
              <div className="flex items-center gap-2 px-3 py-2.5">
                <MapPin size={14} className="text-sky-500 shrink-0" />
                <span className="text-xs font-semibold text-slate-600 line-clamp-2 leading-tight">
                  {seller.address || "Address N/A"}
                </span>
              </div>
              <div className="flex items-center gap-2 px-3 py-2.5">
                <Phone size={14} className="text-sky-500 shrink-0" />
                <span className="text-[11px] font-semibold text-slate-600 truncate">
                  {showContact ? (seller.phone || "N/A") : maskPhone(seller.phone)}
                </span>
              </div>
            </div>

            {/* About Me Section */}
            {seller.bio && (
              <div className="px-4 py-2.5 border-t border-slate-100">
                <h3 className="text-[11px] sm:text-xs font-bold text-slate-900 uppercase tracking-wide mb-1">About Me</h3>
                <p className="text-slate-600 text-xs leading-relaxed whitespace-pre-wrap">
                  {seller.bio}
                </p>
              </div>
            )}
          </div>

          {/* ── CONTACT / ACTION CARD ── */}
          <aside className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm h-fit">
            <h2 className="text-[11px] sm:text-xs font-bold text-slate-900 uppercase tracking-wide mb-2.5">Contact / Action</h2>
            <div className="space-y-2.5">
              <button
                type="button"
                onClick={handleBook}
                disabled={Boolean(seller && (seller.is_available === 0 || seller.is_available === false))}
                className={`w-full rounded-xl px-4 py-2.5 text-sm font-bold transition duration-150 border-0 ${
                  seller && (seller.is_available === 0 || seller.is_available === false)
                    ? "bg-slate-200 text-slate-500 cursor-not-allowed border border-slate-300 shadow-none opacity-85"
                    : "bg-indigo-600 hover:bg-indigo-700 text-white force-text-white shadow-md active:scale-[0.98] cursor-pointer"
                }`}
              >
                {seller && (seller.is_available === 0 || seller.is_available === false)
                  ? "🚫 Partner Offline"
                  : "Book This Service"}
              </button>
              {bookingError && (
                <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700">
                  {bookingError}
                </p>
              )}

              <div className="grid grid-cols-2 gap-2 lg:grid-cols-1">
                {showContact ? (
                  <>
                    <a
                      href={`tel:${seller.phone || ""}`}
                      className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100/50 transition cursor-pointer shadow-sm active:scale-[0.98]"
                    >
                      <Phone size={15} />
                      Call Now
                    </a>
                    <a
                      href={whatsappHref}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-green-200 bg-green-50 px-3 py-2.5 text-xs font-semibold text-green-700 hover:bg-green-100/50 transition cursor-pointer shadow-sm active:scale-[0.98]"
                    >
                      <MessageCircle size={15} />
                      WhatsApp
                    </a>
                  </>
                ) : seller?.hasSufficientBalance === false ? (
                  <div className="col-span-2 w-full text-center rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 font-bold text-slate-600 text-xs">
                    Contact visible after booking.
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
                    className="col-span-2 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white force-text-white px-4 py-2.5 text-sm font-extrabold shadow-md transition disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer active:scale-[0.98]"
                    style={{ color: '#ffffff', backgroundColor: '#059669' }}
                  >
                    <Phone size={16} className="text-white" />
                    {contactLoading ? "Connecting…" : "View Contact"}
                  </button>
                )}
              </div>

              {contactError && (
                <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700">
                  {contactError}
                </p>
              )}
            </div>
          </aside>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-2.5 flex items-center justify-between gap-2">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wide">Services Offered</h2>
            {selectedService && (
              <span className="rounded-full border border-purple-200 bg-purple-50 px-2.5 py-0.5 text-xs font-semibold text-purple-700 truncate max-w-[160px]">
                ✓ {selectedService.name}
              </span>
            )}
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {services.map((service) => {
              const active = selectedService?.id === service.id;
              return (
                <button
                  key={service.id}
                  type="button"
                  onClick={() => handleSelectService(service)}
                  className={`rounded-xl border-2 p-3 text-left transition duration-200 ${active
                    ? "qs-selected-active shadow-md"
                    : "border-slate-200 bg-white hover:border-[var(--qs-primary)]/30 shadow-sm"
                    }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-bold text-slate-800 truncate">
                        {service.name}
                      </h3>
                      <div className="flex flex-wrap gap-1 mt-1">
                        <span className="text-xs font-bold text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded border border-sky-200">
                          From ₹{Number(service.price || 0).toLocaleString("en-IN")}
                        </span>
                        <span className="text-xs font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200/50">
                          Onsite Quote
                        </span>
                        {service.sub_service_name && (
                          <span className="text-xs bg-purple-50 border border-purple-200 text-purple-700 font-bold px-1.5 py-0.5 rounded-full">
                            🎯 {service.sub_service_name}
                          </span>
                        )}
                      </div>
                      <p className="mt-1.5 text-xs font-medium text-slate-500 line-clamp-2">
                        {service.description}
                      </p>
                    </div>
                    <div
                      className={`mt-0.5 h-4 w-4 rounded-full border-2 flex items-center justify-center shrink-0 transition duration-150 ${active
                        ? "qs-selected-dot border-[#0284c7]"
                        : "border-slate-300 bg-white"
                        }`}
                    >
                      {active && (
                        <div className="h-1.5 w-1.5 rounded-full bg-white force-text-white" />
                      )}
                    </div>
                  </div>

                  <div className="mt-2.5 flex flex-wrap gap-x-3 gap-y-1 text-xs font-semibold text-slate-500">
                    <span className="inline-flex items-center gap-1 text-emerald-600">
                      <IndianRupee size={12} />
                      Visit: ₹{Math.max(100, Number(service.visiting_charge || 100)).toLocaleString("en-IN")}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Clock size={12} />
                      {service.duration}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <CalendarDays size={12} />
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
            <h2 className="text-xl font-bold text-slate-800">Work Portfolio / Portfolio / काम की तस्वीरें</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {seller.work_images.map((img, idx) => (
                <div
                  key={img.id}
                  className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 cursor-pointer group shadow-sm hover:shadow-md transition duration-200"
                  onClick={() => {
                    setLightboxImages(seller.work_images.map((w) => w.image_url));
                    setLightboxIndex(idx);
                  }}
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
      {lightboxIndex !== null && lightboxImages.length > 0 && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-100/90 backdrop-blur-xl p-4 animate-fade-in select-none"
          onClick={() => setLightboxIndex(null)}
        >
          {/* Close button */}
          <button
            type="button"
            className="absolute top-4 right-4 z-50 p-2.5 rounded-full bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 hover:text-slate-900 shadow-sm backdrop-blur-sm transition-all focus:outline-none hover:scale-105 active:scale-95"
            onClick={() => setLightboxIndex(null)}
            title="Close / बंद करें"
          >
            <X size={24} />
          </button>

          {/* Prev button (only show if multiple images) */}
          {lightboxImages.length > 1 && (
            <button
              type="button"
              className="absolute left-4 top-1/2 -translate-y-1/2 z-50 p-3 rounded-full bg-white/80 hover:bg-white border border-slate-200 text-slate-700 hover:text-blue-600 shadow-md backdrop-blur-sm transition-all focus:outline-none hover:scale-105 active:scale-95"
              onClick={handlePrevImage}
              title="Previous / पिछला"
            >
              <ChevronLeft size={28} />
            </button>
          )}

          {/* Next button (only show if multiple images) */}
          {lightboxImages.length > 1 && (
            <button
              type="button"
              className="absolute right-4 top-1/2 -translate-y-1/2 z-50 p-3 rounded-full bg-white/80 hover:bg-white border border-slate-200 text-slate-700 hover:text-blue-600 shadow-md backdrop-blur-sm transition-all focus:outline-none hover:scale-105 active:scale-95"
              onClick={handleNextImage}
              title="Next / अगला"
            >
              <ChevronRight size={28} />
            </button>
          )}

          {/* Counter (only show if multiple images) */}
          {lightboxImages.length > 1 && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-1.5 rounded-full bg-white/90 border border-slate-200 text-slate-800 text-xs font-bold shadow-sm">
              {lightboxIndex + 1} / {lightboxImages.length}
            </div>
          )}

          {/* Image container with clean white frame and beautiful shadow */}
          <div
            className="relative max-w-full max-h-[75vh] flex items-center justify-center bg-white p-2.5 sm:p-3.5 rounded-2xl border border-slate-200/80 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.15)]"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={getImageUrl(lightboxImages[lightboxIndex])}
              alt={`Portfolio Image ${lightboxIndex + 1}`}
              className="max-w-full max-h-[70vh] object-contain rounded-xl transition-all duration-300 ease-out animate-scale-in"
            />
          </div>

          {/* Thumbnail list (only show if multiple images) */}
          {lightboxImages.length > 1 && (
            <div
              className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 overflow-x-auto max-w-[90vw] p-2 bg-white/95 rounded-2xl border border-slate-200 shadow-xl backdrop-blur-sm scrollbar-none"
              onClick={(e) => e.stopPropagation()}
            >
              {lightboxImages.map((imgUrl, idx) => (
                <img
                  key={idx}
                  src={getImageUrl(imgUrl)}
                  alt={`Thumbnail ${idx + 1}`}
                  className={`w-12 h-12 rounded-lg object-cover cursor-pointer border-2 transition-all duration-200 ${idx === lightboxIndex
                      ? "border-blue-500 scale-110 shadow-md opacity-100"
                      : "border-slate-200 opacity-60 hover:opacity-100"
                    }`}
                  onClick={() => setLightboxIndex(idx)}
                />
              ))}
            </div>
          )}
        </div>,
        document.body
      )}
    </main>
  );
}
