import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import apiClient from "../api/axiosConfig";
import DatePicker from "react-multi-date-picker";
import { scrollToFirstError } from "../utils/scrollUtils";

const TIME_SLOTS = [
  "8:00 AM",
  "9:00 AM",
  "10:00 AM",
  "11:00 AM",
  "12:00 PM",
  "2:00 PM",
  "3:00 PM",
  "4:00 PM",
  "5:00 PM",
  "6:00 PM",
];

const tomorrow = () =>
  new Date(Date.now() + 86400000).toISOString().split("T")[0];
const thirtyDaysFromNow = () =>
  new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0];

const formatDate = (value) =>
  new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(value));

// Convert "10:00 AM" + "YYYY-MM-DD" → MySQL DATETIME string
function buildScheduledAt(date, slot) {
  if (!date || !slot) return null;
  const m = slot.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!m) return `${date} 10:00:00`;
  let h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  const ampm = m[3].toUpperCase();
  if (ampm === "PM" && h !== 12) h += 12;
  if (ampm === "AM" && h === 12) h = 0;
  return `${date} ${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}:00`;
}

export default function BookingPage() {
  const { sellerId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const selectedService = location.state?.selectedService || null;

  const [seller, setSeller] = useState(null);
  const [sellerLoading, setSellerLoading] = useState(true);
  const [sellerServices, setSellerServices] = useState([]);
  const [selectedServiceState, setSelectedServiceState] = useState(selectedService);
  const [confirmedBooking, setConfirmedBooking] = useState(null);
  const [errors, setErrors] = useState({});
  const [bookingLoading, setBookingLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const [formData, setFormData] = useState({
    service: selectedService?.name || selectedService?.title || "",
    date: "",
    timeSlot: "",
    address: "",
    mobile: user?.phone || "",
    instructions: "",
  });

  // Load seller and services from backend
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setSellerLoading(true);
        const [sellerRes, servicesRes] = await Promise.all([
          apiClient.get(`/sellers/${sellerId}`),
          apiClient.get(`/services/seller/${sellerId}`).catch(() => ({ data: [] }))
        ]);
        const s = sellerRes?.data?.data?.seller || sellerRes?.data?.seller || null;
        const svcs = servicesRes?.data?.data || servicesRes?.data || [];
        if (!cancelled) {
          setSeller(s);
          const serviceList = Array.isArray(svcs) ? svcs : [];
          setSellerServices(serviceList);

          // Match selected service from location state to the loaded service list to sync all properties
          if (selectedService) {
            const found = serviceList.find(item => item.id === selectedService.id);
            if (found) {
              setSelectedServiceState(found);
            }
          }
        }
      } catch (err) {
        console.error("Error loading seller details:", err);
        if (!cancelled) setSeller(null);
      } finally {
        if (!cancelled) setSellerLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [sellerId, selectedService]);

  const selectedServicePrice = useMemo(() => {
    const rawPrice = selectedServiceState?.price;
    if (typeof rawPrice === "number") return rawPrice;
    const numeric = Number(String(rawPrice || "").replace(/[^\d.]/g, ""));
    return Number.isFinite(numeric) ? numeric : 0;
  }, [selectedServiceState?.price]);

  const avatarLetter =
    (seller?.business_name || seller?.name || "?")
      .trim()[0]
      ?.toUpperCase() || "?";

  const updateField = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleServiceChange = (serviceId) => {
    const sId = Number(serviceId);
    const chosen = sellerServices.find((s) => s.id === sId);
    if (chosen) {
      setSelectedServiceState(chosen);
      updateField("service", chosen.title || chosen.name);
    } else {
      setSelectedServiceState(null);
      updateField("service", "");
    }
  };

  const validate = (shouldScroll = false) => {
    const nextErrors = {};
    const mobileDigits = formData.mobile.replace(/\D/g, "");

    if (!formData.service) nextErrors.service = "Select a service";
    if (!formData.date) nextErrors.date = "Select a date";
    if (!formData.timeSlot) nextErrors.timeSlot = "Select a time slot";
    if (!formData.address.trim()) nextErrors.address = "Enter your address";
    if (!formData.mobile.trim()) nextErrors.mobile = "Enter your mobile number";
    else if (mobileDigits.length !== 10)
      nextErrors.mobile = "Mobile number must be 10 digits";

    setErrors(nextErrors);
    const isValid = Object.keys(nextErrors).length === 0;
    if (!isValid && shouldScroll) {
      scrollToFirstError(nextErrors);
    }
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError("");
    if (!seller || !validate(true)) return;

    setBookingLoading(true);
    try {
      const payload = {
        seller_id: seller.id,
        service_id: selectedServiceState?.id || null,
        total_amount: selectedServicePrice || 0,
        payment_method: "cash",
        address: formData.address,
        lat: seller.latitude || seller.lat || null,
        lng: seller.longitude || seller.lng || null,
        scheduled_at: buildScheduledAt(formData.date, formData.timeSlot),
        notes: formData.instructions || "",
      };

      const res = await apiClient.post("/orders", payload);
      const order = res?.data?.data?.order || res?.data?.order || null;

      setConfirmedBooking({
        id: order?.order_number || order?.id || `BK${Date.now()}`,
        service: formData.service,
        date: formData.date,
        timeSlot: formData.timeSlot,
        sellerName: seller.business_name || seller.name,
      });
    } catch (err) {
      setSubmitError(
        err?.response?.data?.message || "Failed to place booking. Try again.",
      );
    } finally {
      setBookingLoading(false);
    }
  };

  if (sellerLoading) {
    return (
      <main className="min-h-screen bg-[#0b0a17] text-white px-4 py-12 flex items-center justify-center relative overflow-hidden">
        <div className="absolute -top-40 -left-40 h-[600px] w-[600px] rounded-full bg-indigo-600/10 blur-[150px]" />
        <div className="mx-auto w-full max-w-xl qs-glass-panel p-8 text-center shadow-2xl relative z-10">
          <h1 className="text-xl font-black text-indigo-200">
            <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-indigo-400 border-t-white mr-3 align-middle" />
            Loading provider details…
          </h1>
        </div>
      </main>
    );
  }

  if (!seller) {
    return (
      <main className="min-h-screen bg-[#0b0a17] text-white px-4 py-12 flex items-center justify-center relative overflow-hidden">
        <div className="absolute -top-40 -left-40 h-[600px] w-[600px] rounded-full bg-indigo-600/10 blur-[150px]" />
        <div className="mx-auto w-full max-w-xl qs-glass-panel p-8 text-center shadow-2xl relative z-10">
          <h1 className="text-2xl font-black text-white">
            Provider not found
          </h1>
          <button
            type="button"
            onClick={() => navigate("/services")}
            className="mt-6 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-500/25 hover:scale-[1.01] transition duration-300"
          >
            Find Services
          </button>
        </div>
      </main>
    );
  }

  if (confirmedBooking) {
    return (
      <main className="min-h-screen bg-[#0b0a17] text-white px-4 py-12 relative overflow-hidden flex items-center justify-center">
        {/* Glow Blobs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -left-40 h-[600px] w-[600px] rounded-full bg-indigo-600/10 blur-[150px]" />
          <div className="absolute -bottom-40 -right-40 h-[600px] w-[600px] rounded-full bg-fuchsia-600/10 blur-[150px]" />
        </div>
        <div className="mx-auto w-full max-w-xl qs-glass-panel p-8 text-center shadow-2xl relative z-10">
          <div className="text-6xl animate-bounce">🎉</div>
          <h1 className="mt-4 text-3xl font-black text-white gradient-text-purple">
            Booking Confirmed!
          </h1>
          <p className="mt-2 text-indigo-200/80 text-sm">Your service request has been sent to the partner.</p>
          <div className="mt-6 space-y-3.5 rounded-xl border border-indigo-400/20 bg-indigo-950/40 p-5 text-left text-sm text-indigo-100">
            <p className="flex justify-between border-b border-indigo-500/10 pb-2">
              <span className="font-semibold text-indigo-300">Booking ID:</span>
              <span className="font-mono text-white">{confirmedBooking.id}</span>
            </p>
            <p className="flex justify-between border-b border-indigo-500/10 pb-2">
              <span className="font-semibold text-indigo-300">Service:</span>
              <span className="font-bold text-white">{confirmedBooking.service}</span>
            </p>
            <p className="flex justify-between border-b border-indigo-500/10 pb-2">
              <span className="font-semibold text-indigo-300">Date:</span>
              <span className="text-white">{formatDate(confirmedBooking.date)}</span>
            </p>
            <p className="flex justify-between border-b border-indigo-500/10 pb-2">
              <span className="font-semibold text-indigo-300">Time:</span>
              <span className="text-white">{confirmedBooking.timeSlot}</span>
            </p>
            <p className="flex justify-between pt-1">
              <span className="font-semibold text-indigo-300">Provider:</span>
              <span className="font-extrabold text-white">{confirmedBooking.sellerName}</span>
            </p>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <Link
              to="/my-bookings"
              className="rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-500/20 hover:scale-[1.01] hover:shadow-indigo-500/30 transition-all duration-300"
            >
              View My Bookings
            </Link>
            <Link
              to="/"
              className="rounded-xl border border-indigo-400/30 bg-indigo-950/40 px-5 py-3.5 text-sm font-bold text-indigo-200 hover:bg-indigo-900/40 hover:text-white transition-all duration-300"
            >
              Go Home
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0b0a17] text-white px-4 py-10 relative overflow-hidden">
      {/* Decorative Glow Blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 h-[600px] w-[600px] rounded-full bg-indigo-600/10 blur-[150px]" />
        <div className="absolute top-[40%] -right-40 h-[600px] w-[600px] rounded-full bg-fuchsia-600/10 blur-[150px]" />
      </div>

      <div className="mx-auto max-w-[600px] space-y-6 relative z-10">
        {/* Provider Profile Glass Card */}
        <section className="qs-glass-panel p-6 shadow-2xl transition-all duration-300 hover:border-indigo-400/30">
          <div className="flex flex-col sm:flex-row items-center gap-5">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-indigo-500 to-violet-600 text-3xl font-extrabold text-white shadow-[0_0_20px_rgba(99,102,241,0.4)]">
              {avatarLetter}
            </div>
            <div className="text-center sm:text-left">
              <h1 className="text-3xl font-black tracking-tight text-white">
                {seller.business_name || seller.name}
              </h1>
              <p className="mt-1 text-sm font-semibold text-indigo-200/80 flex items-center justify-center sm:justify-start gap-1">
                <span>📍</span> {seller.address || "Service Location"}
              </p>
              <div className="mt-2.5 inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-3.5 py-1 text-sm font-extrabold text-amber-300">
                <span>⭐</span> {seller.avg_rating || "—"}
              </div>
            </div>
          </div>
        </section>

        {/* Selected Service Info Box */}
        {selectedServiceState && (
          <section className="qs-glass-panel border-indigo-500/30 bg-indigo-950/25 p-6 shadow-2xl relative overflow-hidden">
            <div className="absolute right-0 top-0 h-24 w-24 translate-x-8 -translate-y-8 rounded-full bg-indigo-500/10 blur-xl" />
            <p className="text-xs font-bold uppercase tracking-wider text-indigo-300">Selected service</p>
            <h2 className="mt-1.5 text-2xl font-black text-white flex flex-wrap items-center gap-2">
              <span>{selectedServiceState.name || selectedServiceState.title}</span>
              {selectedServicePrice > 0 && (
                <span className="rounded-lg bg-indigo-500/20 border border-indigo-400/30 px-3 py-0.5 text-base font-extrabold text-indigo-300">
                  ₹{selectedServicePrice}
                </span>
              )}
            </h2>
            {selectedServiceState.description && (
              <p className="mt-3 text-sm leading-relaxed text-indigo-200/70 border-t border-indigo-500/10 pt-3">
                {selectedServiceState.description}
              </p>
            )}
          </section>
        )}

        {/* Redesigned Glass Form */}
        <form
          onSubmit={handleSubmit}
          className="qs-glass-panel p-6 sm:p-8 shadow-2xl space-y-6"
        >
          <div className="border-b border-indigo-500/10 pb-4">
            <h2 className="text-2xl font-black text-white">Book Service</h2>
            <p className="mt-1 text-sm text-indigo-200/60">Fill in the schedule and contact info below</p>
          </div>

          <div className="space-y-5">
            {/* Service Dropdown Selector */}
            <div>
              <label className="form-label dark">Service to Book / सेवा का चयन करें</label>
              <div className="relative">
                <select
                  value={selectedServiceState?.id || ""}
                  onChange={(e) => handleServiceChange(e.target.value)}
                  className="form-input dark pr-10 appearance-none cursor-pointer focus:ring-indigo-500/40"
                >
                  <option value="" className="bg-[#0f0e1a]">Select a service</option>
                  {sellerServices.map((svc) => (
                    <option key={svc.id} value={svc.id} className="bg-[#0f0e1a]">
                      {svc.title || svc.name} ({svc.price ? `₹${svc.price}` : "Price on request"})
                    </option>
                  ))}
                </select>
                <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-indigo-300">
                  ▼
                </span>
              </div>
              {errors.service && (
                <p className="mt-1.5 text-xs font-semibold text-red-400">⚠ {errors.service}</p>
              )}
            </div>

            {/* Date Selection */}
            <div>
              <label className="form-label dark">Select Date / तारीख चुनें</label>
              <DatePicker
                value={formData.date}
                onChange={(dateObj) => {
                  const val = dateObj ? dateObj.format("YYYY-MM-DD") : "";
                  updateField("date", val);
                }}
                minDate={new Date(tomorrow())}
                maxDate={new Date(thirtyDaysFromNow())}
                format="YYYY-MM-DD"
                portal
                inputClass="form-input dark focus:ring-indigo-500/40 cursor-pointer w-full text-white"
                containerClassName="qs-date-picker__container"
                placeholder="Select a date / तारीख चुनें"
              />
              {errors.date && (
                <p className="mt-1.5 text-xs font-semibold text-red-400">⚠ {errors.date}</p>
              )}
            </div>

            {/* Time Slot Selector */}
            <div>
              <label className="form-label dark">Select Time Slot / समय चुनें</label>
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                {TIME_SLOTS.map((slot) => {
                  const active = formData.timeSlot === slot;
                  return (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => updateField("timeSlot", slot)}
                      className={`rounded-xl border px-3 py-2.5 text-sm font-bold transition-all duration-300 ${active
                          ? "bg-gradient-to-r from-indigo-500 to-fuchsia-600 border-indigo-400 text-white shadow-[0_0_15px_rgba(99,102,241,0.4)] scale-[1.02]"
                          : "border-indigo-500/20 bg-indigo-950/40 text-indigo-200 hover:border-indigo-400/40 hover:bg-indigo-950/60"
                        }`}
                    >
                      {slot}
                    </button>
                  );
                })}
              </div>
              {errors.timeSlot && (
                <p className="mt-1.5 text-xs font-semibold text-red-400">⚠ {errors.timeSlot}</p>
              )}
            </div>

            {/* Address input */}
            <div>
              <label className="form-label dark">Your Address / आपका पता</label>
              <textarea
                value={formData.address}
                onChange={(e) => updateField("address", e.target.value)}
                placeholder="Enter your full address for service delivery"
                rows={3}
                className="form-input dark focus:ring-indigo-500/40"
              />
              {errors.address && (
                <p className="mt-1.5 text-xs font-semibold text-red-400">⚠ {errors.address}</p>
              )}
            </div>

            {/* Mobile number */}
            <div>
              <label className="form-label dark">Mobile Number / मोबाइल नंबर</label>
              <input
                value={formData.mobile}
                onChange={(e) =>
                  updateField(
                    "mobile",
                    e.target.value.replace(/\D/g, "").slice(0, 10),
                  )
                }
                placeholder="9876543210"
                className="form-input dark focus:ring-indigo-500/40"
              />
              {errors.mobile && (
                <p className="mt-1.5 text-xs font-semibold text-red-400">⚠ {errors.mobile}</p>
              )}
            </div>

            {/* Instructions */}
            <div>
              <label className="form-label dark">Special Instructions / विशेष निर्देश (Optional)</label>
              <textarea
                value={formData.instructions}
                onChange={(e) => updateField("instructions", e.target.value)}
                placeholder="Any specific requirements, landmark or entry instructions"
                rows={3}
                className="form-input dark focus:ring-indigo-500/40"
              />
            </div>
          </div>

          {submitError && (
            <p className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm font-semibold text-red-300">
              ⚠ {submitError}
            </p>
          )}

          <button
            type="submit"
            disabled={bookingLoading}
            className="mt-6 w-full rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 px-5 py-4 text-base font-extrabold text-white shadow-lg shadow-indigo-500/20 hover:scale-[1.01] hover:shadow-indigo-500/30 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {bookingLoading ? (
              <>
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white mr-2 align-middle" />
                Placing Booking...
              </>
            ) : (
              "Confirm Booking / बुकिंग करें"
            )}
          </button>
        </form>
      </div>
    </main>
  );
}
