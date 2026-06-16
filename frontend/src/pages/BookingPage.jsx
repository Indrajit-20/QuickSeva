import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import apiClient from "../api/axiosConfig";

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

  // Load seller from backend
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setSellerLoading(true);
        const res = await apiClient.get(`/sellers/${sellerId}`);
        const s = res?.data?.data?.seller || res?.data?.seller || null;
        if (!cancelled) setSeller(s);
      } catch {
        if (!cancelled) setSeller(null);
      } finally {
        if (!cancelled) setSellerLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [sellerId]);

  const serviceOptions = useMemo(() => {
    const values = [
      selectedService?.name || selectedService?.title,
      seller?.business_name,
    ].filter(Boolean);
    return Array.from(new Set(values));
  }, [selectedService, seller]);

  const selectedServicePrice = useMemo(() => {
    const rawPrice = selectedService?.price;
    if (typeof rawPrice === "number") return rawPrice;
    const numeric = Number(String(rawPrice || "").replace(/[^\d.]/g, ""));
    return Number.isFinite(numeric) ? numeric : 0;
  }, [selectedService?.price]);

  const avatarLetter =
    (seller?.business_name || seller?.name || "?")
      .trim()[0]
      ?.toUpperCase() || "?";

  const updateField = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validate = () => {
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
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError("");
    if (!seller || !validate()) return;

    const ok = window.confirm(
      "Confirm Service Booking\n\nAre you interested in booking this service?",
    );
    if (!ok) return;

    setBookingLoading(true);
    try {
      const payload = {
        seller_id: seller.id,
        service_id: selectedService?.id || null,
        total_amount: selectedServicePrice || 0,
        payment_method: "cash",
        address: formData.address,
        lat: seller.lat ?? null,
        lng: seller.lng ?? null,
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
      <main className="min-h-screen bg-brand-bg px-4 py-12">
        <div className="mx-auto max-w-xl rounded-2xl bg-white p-8 text-center shadow-sm">
          <h1 className="text-xl font-black text-slate-900">
            Loading provider…
          </h1>
        </div>
      </main>
    );
  }

  if (!seller) {
    return (
      <main className="min-h-screen bg-brand-bg px-4 py-12">
        <div className="mx-auto max-w-xl rounded-2xl bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-black text-slate-900">
            Provider not found
          </h1>
          <button
            type="button"
            onClick={() => navigate("/services")}
            className="mt-5 rounded-lg bg-indigo-600 px-5 py-2 text-sm font-bold text-white hover:bg-indigo-700"
          >
            Find Services
          </button>
        </div>
      </main>
    );
  }

  if (confirmedBooking) {
    return (
      <main className="min-h-screen bg-brand-bg px-4 py-12">
        <div className="mx-auto max-w-xl rounded-2xl bg-white p-8 text-center shadow-sm">
          <div className="text-5xl">✅</div>
          <h1 className="mt-4 text-3xl font-black text-slate-900">
            Booking Confirmed!
          </h1>
          <div className="mt-6 space-y-2 rounded-xl bg-indigo-50 p-5 text-left text-sm text-slate-700">
            <p>
              <span className="font-bold">Booking ID:</span>{" "}
              {confirmedBooking.id}
            </p>
            <p>
              <span className="font-bold">Service:</span>{" "}
              {confirmedBooking.service}
            </p>
            <p>
              <span className="font-bold">Date:</span>{" "}
              {formatDate(confirmedBooking.date)}
            </p>
            <p>
              <span className="font-bold">Time:</span>{" "}
              {confirmedBooking.timeSlot}
            </p>
            <p>
              <span className="font-bold">Provider:</span>{" "}
              {confirmedBooking.sellerName}
            </p>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <Link
              to="/my-bookings"
              className="rounded-lg bg-indigo-600 px-4 py-3 text-sm font-bold text-white hover:bg-indigo-700"
            >
              View My Bookings
            </Link>
            <Link
              to="/"
              className="rounded-lg border border-indigo-300 bg-white px-4 py-3 text-sm font-bold text-indigo-700 hover:bg-indigo-50"
            >
              Go Home
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-brand-bg px-4 py-10">
      <div className="mx-auto max-w-[600px] space-y-5">
        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-600 text-2xl font-black text-white">
              {avatarLetter}
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900">
                {seller.business_name || seller.name}
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                {seller.address || ""}
              </p>
              <p className="mt-2 text-sm text-amber-500">⭐ {seller.avg_rating || "—"}</p>
            </div>
          </div>
        </section>

        {selectedService && (
          <section className="rounded-2xl border border-indigo-200 bg-indigo-50 p-5 shadow-sm">
            <p className="text-sm font-bold text-indigo-700">Selected service</p>
            <h2 className="mt-1 text-xl font-black text-slate-900">
              You are booking:{" "}
              {selectedService.name || selectedService.title}
              {selectedServicePrice ? ` - ₹${selectedServicePrice}` : ""}
            </h2>
            {selectedService.description && (
              <p className="mt-2 text-sm font-semibold text-slate-600">
                {selectedService.description}
              </p>
            )}
          </section>
        )}

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl bg-white p-6 shadow-sm"
        >
          <h2 className="text-xl font-black text-slate-900">Book Service</h2>

          <div className="mt-5 space-y-5">
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">
                Service
              </label>
              <input
                value={formData.service}
                onChange={(e) => updateField("service", e.target.value)}
                placeholder="Service name"
                className="w-full rounded-lg border border-indigo-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                list="service-options"
              />
              <datalist id="service-options">
                {serviceOptions.map((s) => (
                  <option key={s} value={s} />
                ))}
              </datalist>
              {errors.service && (
                <p className="mt-1 text-xs text-red-600">{errors.service}</p>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">
                Select Date
              </label>
              <input
                type="date"
                value={formData.date}
                min={tomorrow()}
                max={thirtyDaysFromNow()}
                onChange={(e) => updateField("date", e.target.value)}
                className="w-full rounded-lg border border-indigo-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              />
              {errors.date && (
                <p className="mt-1 text-xs text-red-600">{errors.date}</p>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">
                Select Time Slot
              </label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {TIME_SLOTS.map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => updateField("timeSlot", slot)}
                    className={`rounded-full border px-3 py-2 text-sm font-bold transition ${
                      formData.timeSlot === slot
                        ? "border-indigo-600 bg-indigo-600 text-white"
                        : "border-indigo-300 bg-white text-indigo-700 hover:bg-indigo-50"
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
              {errors.timeSlot && (
                <p className="mt-1 text-xs text-red-600">{errors.timeSlot}</p>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">
                Your Address
              </label>
              <textarea
                value={formData.address}
                onChange={(e) => updateField("address", e.target.value)}
                placeholder="Enter your full address for service"
                rows={3}
                className="w-full resize-none rounded-lg border border-indigo-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              />
              {errors.address && (
                <p className="mt-1 text-xs text-red-600">{errors.address}</p>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">
                Mobile Number
              </label>
              <input
                value={formData.mobile}
                onChange={(e) =>
                  updateField(
                    "mobile",
                    e.target.value.replace(/\D/g, "").slice(0, 10),
                  )
                }
                placeholder="9876543210"
                className="w-full rounded-lg border border-indigo-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              />
              {errors.mobile && (
                <p className="mt-1 text-xs text-red-600">{errors.mobile}</p>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">
                Special Instructions
              </label>
              <textarea
                value={formData.instructions}
                onChange={(e) => updateField("instructions", e.target.value)}
                placeholder="Any specific requirements or notes"
                rows={3}
                className="w-full resize-none rounded-lg border border-indigo-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          {submitError && (
            <p className="mt-4 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm font-bold text-red-700">
              {submitError}
            </p>
          )}

          <button
            type="submit"
            disabled={bookingLoading}
            className="mt-6 w-full rounded-xl bg-indigo-600 px-4 py-3 text-base font-black text-white shadow-sm hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {bookingLoading ? "Placing booking…" : "Confirm Booking"}
          </button>
        </form>
      </div>
    </main>
  );
}
