import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import apiClient from "../api/axiosConfig";
import DatePicker from "react-multi-date-picker";
const DatePickerComponent = DatePicker.default || DatePicker;
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

const today = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const date = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${date}`;
};
const fifteenDaysFromNow = () => {
  const d = new Date(Date.now() + 15 * 86400000);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const date = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${date}`;
};

const todayDDMMYYYY = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const date = String(d.getDate()).padStart(2, "0");
  return `${date}-${m}-${y}`;
};

const getMinDate = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

const getMaxDate = () => {
  const d = new Date();
  d.setDate(d.getDate() + 15);
  d.setHours(23, 59, 59, 999);
  return d;
};

const formatDate = (value) => {
  if (!value) return "";
  let d;
  if (typeof value === "string" && value.includes("-")) {
    const parts = value.split("-");
    if (parts[0].length === 2) {
      // DD-MM-YYYY
      d = new Date(`${parts[2]}-${parts[1]}-${parts[0]}T00:00:00`);
    } else {
      // YYYY-MM-DD
      d = new Date(`${value}T00:00:00`);
    }
  } else {
    d = new Date(value);
  }
  if (isNaN(d.getTime())) return String(value);
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
};

// Convert "10:00 AM" + "DD-MM-YYYY" (or YYYY-MM-DD) → MySQL DATETIME string
function buildScheduledAt(date, slot) {
  if (!date || !slot) return null;
  let yyyymmdd = date;
  if (date.includes("-")) {
    const parts = date.split("-");
    if (parts[0].length === 2) {
      // DD-MM-YYYY -> YYYY-MM-DD
      yyyymmdd = `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
  }
  const m = slot.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!m) return `${yyyymmdd} 10:00:00`;
  let h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  const ampm = m[3].toUpperCase();
  if (ampm === "PM" && h !== 12) h += 12;
  if (ampm === "AM" && h === 12) h = 0;
  return `${yyyymmdd} ${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}:00`;
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
  const [paymentMethod, setPaymentMethod] = useState("wallet");
  
  // Custom Invoice & Fake Payment Gateway Modal states
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showPaymentGateway, setShowPaymentGateway] = useState(false);
  const [paymentGatewayStatus, setPaymentGatewayStatus] = useState("idle"); // "idle", "processing", "success", "failed"
  const [gatewayError, setGatewayError] = useState("");

  const [formData, setFormData] = useState({
    service: selectedService?.name || selectedService?.title || "",
    date: todayDDMMYYYY(),
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
          // Match selected service or fallback to first service in list
          let chosenService = null;
          if (selectedService) {
            chosenService = serviceList.find(item => item.id === selectedService.id);
          }
          if (!chosenService && serviceList.length > 0) {
            chosenService = serviceList[0];
          }
          if (chosenService) {
            setSelectedServiceState(chosenService);
            setFormData((prev) => ({
              ...prev,
              service: chosenService.title || chosenService.name || "",
            }));
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

  const visitingCharge = useMemo(() => {
    return Number(selectedServiceState?.visiting_charge || 0);
  }, [selectedServiceState?.visiting_charge]);

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

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitError("");
    if (!seller || !validate(true)) return;

    // Trigger Invoice breakdown modal instead of submitting directly!
    setShowInvoiceModal(true);
  };

  const handleSimulatedPayment = async (isSuccess) => {
    if (!isSuccess) {
      setPaymentGatewayStatus("processing");
      setTimeout(() => {
        setPaymentGatewayStatus("failed");
        setGatewayError("Simulated payment failure: Transaction was cancelled or rejected by user bank.");
      }, 1500);
      return;
    }

    setPaymentGatewayStatus("processing");
    try {
      // Simulate API latency
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const payload = {
        seller_id: seller.id,
        service_id: selectedServiceState?.id || null,
        total_amount: visitingCharge, // Frontend estimates Stage 1 visiting charge
        payment_method: paymentMethod,
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

      setShowPaymentGateway(false);
    } catch (err) {
      console.error(err);
      setPaymentGatewayStatus("failed");
      setGatewayError(
        err?.response?.data?.message || "Failed to confirm booking. Wallet might have insufficient funds."
      );
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
      <main className="min-h-screen bg-slate-50 py-12 px-4 flex items-center justify-center">
        <div className="mx-auto w-full max-w-md bg-white rounded-3xl border border-slate-200 p-8 text-center shadow-md relative overflow-hidden">
          <div className="text-6xl animate-bounce">🎉</div>
          <h1 className="mt-4 text-2xl font-black text-slate-900">
            Booking Confirmed!
          </h1>
          <p className="mt-2 text-slate-500 text-sm">Your service request has been sent to the partner.</p>
          
          <div className="mt-6 space-y-3.5 rounded-2xl border border-slate-100 bg-slate-50 p-5 text-left text-sm text-slate-700">
            <p className="flex justify-between border-b border-slate-200/60 pb-2">
              <span className="font-semibold text-slate-500">Booking ID:</span>
              <span className="font-mono font-bold text-slate-800">{confirmedBooking.id}</span>
            </p>
            <p className="flex justify-between border-b border-slate-200/60 pb-2">
              <span className="font-semibold text-slate-500">Service:</span>
              <span className="font-bold text-slate-800">{confirmedBooking.service}</span>
            </p>
            <p className="flex justify-between border-b border-slate-200/60 pb-2">
              <span className="font-semibold text-slate-500">Date:</span>
              <span className="font-bold text-slate-800">{formatDate(confirmedBooking.date)}</span>
            </p>
            <p className="flex justify-between border-b border-slate-200/60 pb-2">
              <span className="font-semibold text-slate-500">Time Slot:</span>
              <span className="font-bold text-slate-800">{confirmedBooking.timeSlot}</span>
            </p>
            <p className="flex justify-between pt-1">
              <span className="font-semibold text-slate-500">Provider:</span>
              <span className="font-bold text-slate-850">{confirmedBooking.sellerName}</span>
            </p>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <Link
              to="/my-bookings"
              className="rounded-xl bg-sky-600 hover:bg-sky-700 px-5 py-3 text-xs font-bold text-white text-center shadow-lg shadow-sky-600/20 active:scale-95 transition cursor-pointer"
            >
              View My Bookings
            </Link>
            <Link
              to="/"
              className="rounded-xl border border-slate-300 bg-white hover:bg-slate-50 px-5 py-3 text-xs font-bold text-slate-700 text-center active:scale-95 transition cursor-pointer"
            >
              Go Home
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--qs-bg)] py-10 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-xl space-y-6">
        
        {/* ── 1. Provider Profile Card (Mehta home painters...) ── */}
        <section className="bg-white rounded-2xl border border-[var(--qs-border)] p-5 shadow-sm relative overflow-hidden transition hover:shadow-md">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[var(--qs-primary-light)]/10 text-lg font-black text-[var(--qs-primary)] shadow-sm">
              {avatarLetter}
            </div>
            <div className="flex-1 space-y-1">
              <span className="inline-flex items-center gap-1 rounded-full bg-[var(--qs-primary-light)]/10 px-2 py-0.5 text-[10px] font-bold text-[var(--qs-primary)]">
                ⚡ Professional partner
              </span>
              <h1 className="text-lg font-extrabold text-[var(--qs-text)] leading-tight">
                {seller.business_name || seller.name}
              </h1>
              <p className="text-xs text-[var(--qs-muted)] flex flex-wrap items-center gap-1.5">
                <span>📍</span> {seller.address || "Service Location"}
                {seller.avg_rating && (
                  <>
                    <span className="text-[var(--qs-muted-light)]">•</span>
                    <span className="text-amber-500 font-bold">★ {seller.avg_rating} rating</span>
                  </>
                )}
              </p>
            </div>
          </div>
        </section>

        {/* ── 2. Selected Service Card ── */}
        {selectedServiceState && (
          <section className="bg-white rounded-2xl border border-[var(--qs-border)] p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-extrabold text-[var(--qs-text)]">
                {selectedServiceState.name || selectedServiceState.title}
              </h2>
              <span className="px-2.5 py-0.5 text-[10.5px] font-bold text-[var(--qs-secondary)] bg-[var(--qs-secondary)]/10 rounded-full border border-[var(--qs-secondary)]/20">
                Selected
              </span>
            </div>
            
            <div className="border-t border-[var(--qs-border-light)] pt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="text-xs text-[var(--qs-muted)]">
                Work price <span className="mx-1">•</span> due after inspection
              </div>
              <div className="text-lg font-black text-[var(--qs-primary)]">
                Starts from ₹{selectedServicePrice}
              </div>
            </div>
          </section>
        )}

        {/* ── 3. Configure Schedule & Details Form ── */}
        <form
          onSubmit={handleSubmit}
          className="space-y-6"
        >
          {/* Card: Configure Schedule */}
          <div className="bg-white rounded-2xl border border-[var(--qs-border)] p-5 shadow-sm space-y-5">
            <div>
              <h2 className="text-base font-black text-[var(--qs-text)]">Configure your schedule</h2>
              <p className="text-xs text-[var(--qs-muted)]">Choose a convenient date and time slot.</p>
            </div>

            {/* Date Picker (Added back as requested) */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[var(--qs-text-2)] uppercase tracking-wider">
                Select Date / तारीख चुनें
              </label>
              <DatePickerComponent
                value={formData.date}
                onChange={(dateObj) => {
                  const val = dateObj ? dateObj.format("DD-MM-YYYY") : "";
                  updateField("date", val);
                }}
                minDate={getMinDate()}
                maxDate={getMaxDate()}
                format="DD-MM-YYYY"
                portal
                inputClass="w-full px-3 py-2.5 rounded-xl border border-[var(--qs-border)] bg-white text-[var(--qs-text)] text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[var(--qs-primary)]/10 focus:border-[var(--qs-primary)] transition cursor-pointer"
                containerClassName="qs-date-picker__container"
                placeholder="Select a date / तारीख चुनें"
              />
              {errors.date && (
                <p className="text-xs font-semibold text-[var(--qs-danger)] flex items-center gap-1 mt-1">
                  <span>⚠</span> {errors.date}
                </p>
              )}
            </div>

            {/* Time Slot Picker */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-[var(--qs-text-2)] uppercase tracking-wider">
                Select Time Slot / समय चुनें
              </label>
              <div className="flex flex-wrap gap-1.5">
                {TIME_SLOTS.map((slot) => {
                  const active = formData.timeSlot === slot;
                  return (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => updateField("timeSlot", slot)}
                      className={`rounded-lg border px-2.5 py-1.5 text-xs font-bold transition-all duration-200 cursor-pointer active:scale-95 text-center ${
                        active
                          ? "bg-[var(--qs-primary)] border-[var(--qs-primary)] text-white shadow-sm"
                          : "bg-white border-[var(--qs-border)] text-[var(--qs-text-2)] hover:bg-[var(--qs-surface-2)]"
                      }`}
                    >
                      {slot}
                    </button>
                  );
                })}
              </div>
              {errors.timeSlot && (
                <p className="text-xs font-semibold text-[var(--qs-danger)] flex items-center gap-1 mt-1">
                  <span>⚠</span> {errors.timeSlot}
                </p>
              )}
            </div>
          </div>

          {/* Card: Arrival Details & Contact */}
          <div className="bg-white rounded-2xl border border-[var(--qs-border)] p-5 shadow-sm space-y-4">
            <div>
              <h2 className="text-base font-black text-[var(--qs-text)]">Where should we deliver?</h2>
              <p className="text-xs text-[var(--qs-muted)]">Address & contact details for the booking.</p>
            </div>

            {/* Address field */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[var(--qs-text-2)] uppercase tracking-wider">
                Delivery Address / आपका पता
              </label>
              <textarea
                value={formData.address}
                onChange={(e) => updateField("address", e.target.value)}
                placeholder="Enter your full address with house number, street and landmark"
                rows={3}
                className="w-full px-3 py-2.5 rounded-xl border border-[var(--qs-border)] bg-white text-[var(--qs-text)] text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[var(--qs-primary)]/10 focus:border-[var(--qs-primary)] transition"
              />
              {errors.address && (
                <p className="text-xs font-semibold text-[var(--qs-danger)] flex items-center gap-1 mt-1">
                  <span>⚠</span> {errors.address}
                </p>
              )}
            </div>

            {/* Mobile Number */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[var(--qs-text-2)] uppercase tracking-wider">
                Mobile Number / मोबाइल नंबर
              </label>
              <input
                value={formData.mobile}
                onChange={(e) =>
                  updateField(
                    "mobile",
                    e.target.value.replace(/\D/g, "").slice(0, 10),
                  )
                }
                placeholder="E.g., 9876543210"
                className="w-full px-3 py-2.5 rounded-xl border border-[var(--qs-border)] bg-white text-[var(--qs-text)] text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[var(--qs-primary)]/10 focus:border-[var(--qs-primary)] transition"
              />
              {errors.mobile && (
                <p className="text-xs font-semibold text-[var(--qs-danger)] flex items-center gap-1 mt-1">
                  <span>⚠</span> {errors.mobile}
                </p>
              )}
            </div>

            {/* Instructions */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[var(--qs-text-2)] uppercase tracking-wider">
                Special Instructions (Optional)
              </label>
              <textarea
                value={formData.instructions}
                onChange={(e) => updateField("instructions", e.target.value)}
                placeholder="Any special requests, gate codes, or instructions..."
                rows={2}
                className="w-full px-3 py-2.5 rounded-xl border border-[var(--qs-border)] bg-white text-[var(--qs-text)] text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[var(--qs-primary)]/10 focus:border-[var(--qs-primary)] transition"
              />
            </div>
          </div>

          {/* ── 4. How this booking works ── */}
          <div className="bg-white rounded-2xl border border-[var(--qs-border)] p-5 shadow-sm space-y-4">
            <h2 className="text-base font-black text-[var(--qs-text)]">How this booking works</h2>
            
            <div className="space-y-4">
              <div className="flex gap-3">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--qs-primary)] text-[10px] font-black text-white mt-0.5">
                  1
                </span>
                <div className="space-y-0.5">
                  <h3 className="text-xs font-bold text-[var(--qs-text)]">Pay the visiting fee now</h3>
                  <p className="text-xs text-[var(--qs-muted)] leading-relaxed">
                    Confirms your slot and covers the partner's travel and inspection.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--qs-primary)] text-[10px] font-black text-white mt-0.5">
                  2
                </span>
                <div className="space-y-0.5">
                  <h3 className="text-xs font-bold text-[var(--qs-text)]">Partner inspects and quotes the final price</h3>
                  <p className="text-xs text-[var(--qs-muted)] leading-relaxed">
                    Visiting charge is settled once the inspection is done.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--qs-primary)] text-[10px] font-black text-white mt-0.5">
                  3
                </span>
                <div className="space-y-0.5">
                  <h3 className="text-xs font-bold text-[var(--qs-text)]">You approve and pay for the work</h3>
                  <p className="text-xs text-[var(--qs-muted)] leading-relaxed">
                    Work only starts after your approval of the final quote.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ── 5. Note / Warning banner (Notice) ── */}
          <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 text-xs leading-relaxed text-amber-900 space-y-1 shadow-2xs">
            <p className="font-bold flex items-center gap-1.5 text-amber-950">
              <span>⚠️</span> Note / महत्वपूर्ण निर्देश:
            </p>
            <p className="pl-5 text-[11px] leading-relaxed text-amber-850">
              <strong>English:</strong> The Visiting Charge covers the seller's travel & inspection, and must be paid online to confirm this booking. The final service price will be provided after onsite inspection and requires your approval.
            </p>
            <p className="pl-5 text-[11px] leading-relaxed text-amber-850 border-t border-amber-200/30 pt-1.5 mt-1.5">
              <strong>Hindi:</strong> विजिटिंग चार्ज सेलर के आने-जाने और जांच का शुल्क है, बुकिंग कन्फर्म करने के लिए इसका भुगतान ऑनलाइन करना होगा। काम का पक्का बिल (फाइनल रेट) सेलर द्वारा जांच के बाद दिया जाएगा और आपकी मंजूरी के बाद ही काम शुरू होगा।
            </p>
          </div>

          {/* ── 6. Payment Method selection ── */}
          <div className="bg-white rounded-2xl border border-[var(--qs-border)] p-5 shadow-sm space-y-4">
            <div>
              <h2 className="text-base font-black text-[var(--qs-text)]">Payment Method for Final Work</h2>
              <p className="text-xs text-[var(--qs-muted)]">Choose how you pay the remaining balance once work is complete.</p>
            </div>

            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {[
                {
                  value: "wallet",
                  icon: "🌐",
                  title: "Pay Online (Wallet)",
                  titleHi: "ऑनलाइन वॉलेट",
                  desc: "Deduct from wallet later after work approval."
                },
                {
                  value: "cash",
                  icon: "💵",
                  title: "Cash on Delivery (COD)",
                  titleHi: "नकद भुगतान",
                  desc: "Pay the technician directly in cash after service."
                }
              ].map((pm) => {
                const active = paymentMethod === pm.value;
                return (
                  <button
                    key={pm.value}
                    type="button"
                    onClick={() => setPaymentMethod(pm.value)}
                    className={`rounded-xl border p-3 text-left transition duration-200 active:scale-98 flex items-start gap-2.5 cursor-pointer hover:shadow-xs ${
                      active
                        ? "bg-[var(--qs-primary-light)]/5 border-[var(--qs-primary)] shadow-xs"
                        : "border-[var(--qs-border)] bg-white hover:border-[var(--qs-muted-light)]"
                    }`}
                  >
                    <span className="text-lg">{pm.icon}</span>
                    <div className="flex-1 space-y-0.5">
                      <span className="block text-xs font-bold text-[var(--qs-text)]">
                        {pm.title}
                      </span>
                      <span className="block text-[10px] text-[var(--qs-muted)] leading-normal">{pm.desc}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Clarification note explaining the distinction to avoid user confusion */}
            <div className="rounded-xl bg-sky-50 border border-sky-200/60 p-3.5 text-xs text-sky-950 space-y-1">
              <p className="font-bold flex items-center gap-1.5 text-sky-900" style={{ color: '#0369a1' }}>
                <span>ℹ️</span> Clarification / स्पष्टीकरण:
              </p>
              <p className="pl-5 text-[11px] text-sky-800 leading-relaxed">
                <strong>English:</strong> The payment method selected here is only for paying the final bill after the service is completed. The visiting charge (if any) is a separate fee paid online now to secure your booking.
              </p>
              <p className="pl-5 text-[11px] text-sky-800 leading-relaxed border-t border-sky-200/30 pt-1.5 mt-1.5">
                <strong>Hindi:</strong> यहाँ चुना गया विकल्प केवल काम पूरा होने के बाद का भुगतान करने के लिए है। विजिटिंग चार्ज (यदि कोई हो) बुकिंग पक्की करने के लिए अभी ऑनलाइन जमा करना होगा।
              </p>
            </div>
          </div>

          {/* ── 7. Visiting Fee Summary Card (Green Tint) ── */}
          <div className="bg-[var(--qs-secondary)]/5 border border-[var(--qs-secondary)]/20 px-4 py-3.5 rounded-xl flex justify-between items-center shadow-2xs">
            <div>
              <div className="flex items-center gap-2">
                <span className="block text-xs font-bold text-[var(--qs-secondary-dark)] uppercase tracking-wider">Visiting fee</span>
                {visitingCharge === 0 && (
                  <span className="px-1.5 py-0.5 text-[10px] font-black text-emerald-700 bg-emerald-100 rounded-md border border-emerald-200" style={{ color: '#0f6e56' }}>
                    FREE / मुफ्त
                  </span>
                )}
              </div>
              <span className="text-[11px] text-[var(--qs-muted)]">
                {visitingCharge === 0 ? "No advance payment required" : "Payable now to confirm booking"}
              </span>
            </div>
            <span className="text-xl font-black text-[var(--qs-secondary)]">
              {visitingCharge === 0 ? "₹0" : `₹${visitingCharge}`}
            </span>
          </div>

          {submitError && (
            <p className="text-xs font-semibold text-[var(--qs-danger)] flex items-center gap-1 mt-1">
              <span>⚠</span> {submitError}
            </p>
          )}

          {/* Submit Action Button */}
          <button
            type="submit"
            disabled={bookingLoading}
            className="w-full rounded-xl bg-[var(--qs-primary)] hover:bg-[var(--qs-primary)]/90 px-5 py-3.5 text-sm font-extrabold text-white force-text-white shadow-md shadow-[var(--qs-primary)]/20 hover:scale-[1.01] hover:shadow-lg transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            style={{ color: '#ffffff' }}
          >
            {bookingLoading ? (
              <>
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white mr-2 align-middle" />
                Placing Booking...
              </>
            ) : (
              visitingCharge === 0
                ? "Confirm Booking (Free)"
                : "Pay visiting fee and confirm booking"
            )}
          </button>
        </form>
      </div>


      {/* Invoice Type Breakdown Modal */}
      {showInvoiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white border border-slate-200 p-6 shadow-2xl space-y-5 text-slate-800 relative force-text-dark">
            <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
              <h2 className="text-lg font-extrabold text-slate-900">
                Invoice Preview / पक्का बिल (रसीद)
              </h2>
              <button 
                onClick={() => setShowInvoiceModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {/* Bill details */}
            <div className="space-y-3.5 text-left">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-slate-500">Service / सेवा:</span>
                  <span className="font-bold text-slate-800 text-right">{formData.service}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-slate-500">Date & Slot / तिथि व समय:</span>
                  <span className="font-bold text-slate-800">{formData.date} | {formData.timeSlot}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-slate-500">Provider / सेलर:</span>
                  <span className="font-bold text-slate-800">{seller.business_name || seller.name}</span>
                </div>
              </div>

              <div className="space-y-2.5 px-1.5">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pricing Summary / बिल विवरण</h3>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Visiting Charge / विजिटिंग चार्ज:</span>
                  <span className="font-bold text-slate-900">₹{visitingCharge}</span>
                </div>
                {visitingCharge > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Platform Security Fee / सुरक्षा शुल्क (5%):</span>
                    <span className="font-bold text-slate-900">+₹{Math.round(visitingCharge * 0.05 * 100) / 100}</span>
                  </div>
                )}
                <div className="h-px bg-slate-100 my-1" />
                <div className="flex justify-between text-base font-black">
                  <span className="text-slate-900">Amount Payable Now / कुल भुगतान (Stage 1):</span>
                  <span className="text-emerald-600" style={{ color: '#059669' }}>
                    ₹{visitingCharge + (visitingCharge > 0 ? Math.round(visitingCharge * 0.05 * 100) / 100 : 0)}
                  </span>
                </div>
              </div>

              {/* Note in English & Hindi */}
              <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-[11px] leading-relaxed text-amber-900">
                <p className="font-bold">⚠️ Note / महत्वपूर्ण सूचना:</p>
                {visitingCharge === 0 ? (
                  <>
                    <p className="mt-1">
                      <strong>EN:</strong> There is no visiting charge. Booking will be confirmed directly.
                    </p>
                    <p className="mt-1.5 border-t border-amber-200/50 pt-1.5">
                      <strong>HI:</strong> कोई विजिटिंग चार्ज नहीं है। बुकिंग सीधे कन्फर्म कर दी जाएगी।
                    </p>
                  </>
                ) : (
                  <>
                    <p className="mt-1">
                      <strong>EN:</strong> This amount pays only for the travel & onsite inspection. The final work price will be quoted after the seller inspects the work.
                    </p>
                    <p className="mt-1.5 border-t border-amber-200/50 pt-1.5">
                      <strong>HI:</strong> यह राशि केवल सेलर के आने-जाने और जांच के लिए है। काम का फाइनल रेट सेलर द्वारा जांच के बाद तय किया जाएगा।
                    </p>
                  </>
                )}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowInvoiceModal(false)}
                className="flex-1 rounded-xl border border-slate-300 py-3 text-xs font-bold text-slate-700 hover:bg-slate-50 transition active:scale-95 cursor-pointer"
              >
                Back / वापस जाएं
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowInvoiceModal(false);
                  if (visitingCharge === 0) {
                    setShowPaymentGateway(true);
                    setPaymentGatewayStatus("processing");
                    handleSimulatedPayment(true);
                  } else {
                    setShowPaymentGateway(true);
                    setPaymentGatewayStatus("idle");
                    setGatewayError("");
                  }
                }}
                className="flex-1 rounded-xl bg-sky-600 hover:bg-sky-700 py-3 text-xs font-bold text-white force-text-white shadow-lg shadow-sky-600/20 hover:scale-[1.01] hover:shadow-sky-600/35 transition active:scale-[0.99] cursor-pointer"
                style={{ color: '#ffffff' }}
              >
                {visitingCharge === 0 ? "Confirm Booking / बुकिंग पक्की करें" : "Proceed to Pay / भुगतान करें"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fake Razorpay/PhonePe Payment Gateway Modal */}
      {showPaymentGateway && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-fade-in">
          <div className="w-full max-w-sm rounded-2xl bg-[#0f111a] border border-slate-800 shadow-2xl overflow-hidden text-white relative flex flex-col force-text-white">
            {/* Gateway Header */}
            <div className="bg-[#0b0c13] p-4 border-b border-slate-800 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="text-xl">💳</span>
                <div className="text-left">
                  <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">QuickSeva Secure Pay</h2>
                  <p className="text-[10px] text-slate-500">Razorpay / PhonePe Emulator</p>
                </div>
              </div>
              <button 
                onClick={() => setShowPaymentGateway(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            {paymentGatewayStatus === "idle" && (
              <div className="p-6 space-y-6 flex-1">
                {/* Total box */}
                <div className="bg-[#0b0c13] p-4 rounded-xl border border-slate-800/80 text-center">
                  <span className="block text-[10px] text-slate-500 uppercase font-semibold">Payable Amount / भुगतान राशि</span>
                  <span className="text-3xl font-black text-emerald-400 mt-1 block" style={{ color: '#34d399' }}>
                    ₹{visitingCharge + (visitingCharge > 0 ? Math.round(visitingCharge * 0.05 * 100) / 100 : 0)}
                  </span>
                </div>

                {/* Simulated payment options */}
                <div className="space-y-2.5 text-left">
                  <span className="block text-[10px] text-slate-500 uppercase font-bold tracking-wider">Select Payment Mode</span>
                  
                  {[
                    { id: "upi", icon: "📱", name: "UPI (GPay / PhonePe / Paytm)" },
                    { id: "card", icon: "💳", name: "Debit / Credit Card (Visa, RuPay)" },
                    { id: "wallet", icon: "💼", name: "Wallet Balance (Auto-Debit)" }
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleSimulatedPayment(true)}
                      className="w-full text-left p-3.5 rounded-xl border border-slate-800 bg-[#08090e] hover:bg-slate-900 hover:border-slate-700 transition flex items-center gap-3 cursor-pointer group active:scale-[0.99]"
                    >
                      <span className="text-xl bg-slate-800 p-1.5 rounded-lg group-hover:bg-slate-750">{opt.icon}</span>
                      <span className="text-xs font-bold text-slate-200 group-hover:text-slate-100 flex-1">{opt.name}</span>
                      <span className="text-slate-500 text-xs">➔</span>
                    </button>
                  ))}
                </div>

                <div className="flex gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => handleSimulatedPayment(false)}
                    className="flex-1 py-3 text-xs font-bold text-red-400 bg-red-950/20 border border-red-900/40 rounded-xl hover:bg-red-950/40 active:scale-95 transition cursor-pointer"
                  >
                    Simulate Failure ❌
                  </button>
                </div>
              </div>
            )}

            {paymentGatewayStatus === "processing" && (
              <div className="p-8 text-center space-y-4 flex flex-col items-center justify-center flex-1 min-h-[300px]">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-800 border-t-sky-500" />
                <h3 className="text-sm font-extrabold text-white text-left">Processing Transaction...</h3>
                <p className="text-xs text-slate-400 text-left">Verifying secure wallet signatures and banking gateway protocols. Do not refresh or press back.</p>
              </div>
            )}

            {paymentGatewayStatus === "failed" && (
              <div className="p-6 text-center space-y-5 flex flex-col items-center justify-center flex-1">
                <span className="text-5xl text-red-500">❌</span>
                <h3 className="text-base font-extrabold text-red-400">Payment Failed / भुगतान असफल</h3>
                <p className="text-xs text-slate-400">
                  {gatewayError || "Insufficient wallet balance or transaction rejected by server."}
                </p>
                <div className="flex gap-2 w-full pt-3">
                  <button
                    type="button"
                    onClick={() => setPaymentGatewayStatus("idle")}
                    className="flex-1 py-2.5 text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white rounded-lg active:scale-95 transition cursor-pointer"
                  >
                    Try Again / पुनः प्रयास
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowPaymentGateway(false)}
                    className="flex-1 py-2.5 text-xs font-bold bg-transparent text-slate-400 border border-slate-800 hover:bg-white/5 rounded-lg active:scale-95 transition cursor-pointer"
                  >
                    Cancel / रद्द करें
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
