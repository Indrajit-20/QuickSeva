import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import apiClient from "../api/axiosConfig";
import axios from "axios";
import { getSystemSettings } from "../api/policyService";
import DatePicker from "react-multi-date-picker";
const DatePickerComponent = DatePicker.default || DatePicker;
import { scrollToFirstError } from "../utils/scrollUtils";
import { MapPin, Star, AlertTriangle } from "lucide-react";
import { loadRazorpayScript } from "../utils/razorpayLoader";
import { createPaymentOrderApi } from "../api/walletApi";

const TIME_SLOTS = [
  "8:00 AM",
  "10:00 AM",
  "12:00 PM",
  "2:00 PM",
  "4:00 PM",
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

function isSlotInPast(date, slot) {
  if (!date || !slot) return false;

  const parts = date.split("-");
  if (parts.length !== 3) return false;

  let day, month, year;
  if (parts[0].length === 2) {
    day = parseInt(parts[0], 10);
    month = parseInt(parts[1], 10) - 1; // 0-indexed month
    year = parseInt(parts[2], 10);
  } else {
    year = parseInt(parts[0], 10);
    month = parseInt(parts[1], 10) - 1;
    day = parseInt(parts[2], 10);
  }

  const timeParts = slot.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!timeParts) return false;

  let hours = parseInt(timeParts[1], 10);
  const minutes = parseInt(timeParts[2], 10);
  const ampm = timeParts[3].toUpperCase();

  if (ampm === "PM" && hours !== 12) hours += 12;
  if (ampm === "AM" && hours === 12) hours = 0;

  const slotDate = new Date(year, month, day, hours, minutes, 0, 0);
  const now = new Date();

  return slotDate < now;
}

export default function BookingPage() {
  const { sellerId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const selectedService = location.state?.selectedService || null;

  const [seller, setSeller] = useState(null);
  const [sellerLoading, setSellerLoading] = useState(true);
  const [platformSettings, setPlatformSettings] = useState({
    platform_fee_model: "seller",
    platform_fee_percentage: "5.00"
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await getSystemSettings();
        if (res?.data) {
          setPlatformSettings(res.data);
        }
      } catch (err) {
        console.error("Failed to load platform settings:", err);
      }
    };
    fetchSettings();
  }, []);
  const [sellerServices, setSellerServices] = useState([]);
  const [selectedServiceState, setSelectedServiceState] = useState(selectedService ? { ...selectedService, price_type: "negotiable" } : null);
  const [confirmedBooking, setConfirmedBooking] = useState(null);
  const [errors, setErrors] = useState({});
  const [bookedSlots, setBookedSlots] = useState([]);

  const isSlotBooked = (date, slot) => {
    if (!date || !slot || !bookedSlots.length) return false;
    const candidateTimeStr = buildScheduledAt(date, slot);
    if (!candidateTimeStr) return false;
    const candidateTime = new Date(candidateTimeStr).getTime();

    return bookedSlots.some((bookedTimeStr) => {
      const bookedTime = new Date(bookedTimeStr).getTime();
      return Math.abs(candidateTime - bookedTime) < 7200000;
    });
  };
  const [bookingLoading, setBookingLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("online");

  // Custom Invoice Modal state
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

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
    const controller = new AbortController();

    (async () => {
      try {
        setSellerLoading(true);
        const [sellerRes, servicesRes] = await Promise.all([
          apiClient.get(`/sellers/${sellerId}`, { signal: controller.signal }),
          apiClient.get(`/services/seller/${sellerId}`, { signal: controller.signal }).catch((err) => {
            if (axios.isCancel(err)) throw err;
            return { data: [] };
          })
        ]);
        const s = sellerRes?.data?.data?.seller || sellerRes?.data?.seller || null;
        const svcsRaw = servicesRes?.data?.data || servicesRes?.data || [];
        const svcs = Array.isArray(svcsRaw) ? svcsRaw.map(svc => ({
          ...svc,
          price_type: 'negotiable'
        })) : [];
        if (!cancelled) {
          setSeller(s);
          setBookedSlots(s?.booked_slots || []);
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
        if (axios.isCancel(err)) return;
        console.error("Error loading seller details:", err);
        if (!cancelled) setSeller(null);
      } finally {
        if (!cancelled) setSellerLoading(false);
      }
    })();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [sellerId, selectedService]);

  const selectedServicePrice = useMemo(() => {
    const rawPrice = selectedServiceState?.price;
    if (typeof rawPrice === "number") return rawPrice;
    const numeric = Number(String(rawPrice || "").replace(/[^\d.]/g, ""));
    return Number.isFinite(numeric) ? numeric : 0;
  }, [selectedServiceState?.price]);

  const visitingCharge = useMemo(() => {
    const raw = Number(selectedServiceState?.visiting_charge || 0);
    return raw < 100 ? 100 : raw;
  }, [selectedServiceState?.visiting_charge]);

  const calculatedFee = useMemo(() => {
    if (visitingCharge <= 0) return 0;
    const pct = parseFloat(platformSettings.platform_fee_percentage || "5.00");
    const fee = visitingCharge * (pct / 100);
    return Math.min(100.00, parseFloat(fee.toFixed(2)));
  }, [visitingCharge, platformSettings.platform_fee_percentage]);

  const totalPayable = useMemo(() => {
    if (platformSettings.platform_fee_model === "seller") {
      return visitingCharge;
    }
    return visitingCharge + calculatedFee;
  }, [visitingCharge, calculatedFee, platformSettings.platform_fee_model]);

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
    if (!formData.timeSlot) {
      nextErrors.timeSlot = "Select a time slot";
    } else if (isSlotInPast(formData.date, formData.timeSlot)) {
      nextErrors.timeSlot = "Selected time slot is in the past";
    }
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

  const handleCreateBookingDirectly = async () => {
    setBookingLoading(true);
    setSubmitError("");
    try {
      const payload = {
        seller_id: seller.id,
        service_id: selectedServiceState?.id || null,
        total_amount: visitingCharge,
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
    } catch (err) {
      console.error(err);
      setSubmitError(err?.response?.data?.message || "Failed to confirm booking.");
    } finally {
      setBookingLoading(false);
    }
  };

  const handleRazorpayBookingPayment = async () => {
    setBookingLoading(true);
    setSubmitError("");
    try {
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        setSubmitError("Razorpay SDK failed to load. Please check your internet connection.");
        setBookingLoading(false);
        return;
      }

      const orderRes = await createPaymentOrderApi(totalPayable, "booking_payment");
      if (!orderRes || !orderRes.success) {
        setSubmitError(orderRes?.message || "Failed to initiate payment.");
        setBookingLoading(false);
        return;
      }

      const orderData = orderRes.data;
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "QuickSeva",
        description: `Visiting Fee for ${formData.service}`,
        order_id: orderData.id,
        handler: async function (response) {
          try {
            setBookingLoading(true);
            const payload = {
              seller_id: seller.id,
              service_id: selectedServiceState?.id || null,
              payment_method: paymentMethod,
              address: formData.address,
              lat: seller.latitude || seller.lat || null,
              lng: seller.longitude || seller.lng || null,
              scheduled_at: buildScheduledAt(formData.date, formData.timeSlot),
              notes: formData.instructions || "",
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
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
            console.error("Order placement error:", err);
            setSubmitError(err?.response?.data?.message || "Failed to confirm booking after payment.");
          } finally {
            setBookingLoading(false);
          }
        },
        prefill: {
          name: user?.name || "",
          email: user?.email || "",
          contact: formData.mobile || "",
        },
        theme: {
          color: "#2563EB",
        },
        modal: {
          ondismiss: function () {
            setBookingLoading(false);
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error("Razorpay loading error:", err);
      setSubmitError("Failed to open payment gateway.");
      setBookingLoading(false);
    }
  };

  if (sellerLoading) {
    return (
      <main className="min-h-screen bg-slate-50 text-slate-800 px-4 py-12 flex items-center justify-center relative overflow-hidden">
        <div className="mx-auto w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm relative z-10">
          <h1 className="text-xl font-bold text-slate-700">
            <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent mr-3 align-middle" />
            Loading provider details…
          </h1>
        </div>
      </main>
    );
  }

  if (!seller) {
    return (
      <main className="min-h-screen bg-slate-50 text-slate-800 px-4 py-12 flex items-center justify-center relative overflow-hidden">
        <div className="mx-auto w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm relative z-10">
          <h1 className="text-2xl font-bold text-slate-800">
            Provider not found
          </h1>
          <button
            type="button"
            onClick={() => navigate("/services")}
            className="mt-6 rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-sm hover:bg-blue-700 transition"
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
              <span className="font-bold text-slate-800">{confirmedBooking.sellerName}</span>
            </p>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <Link
              to="/my-bookings"
              className="rounded-xl bg-blue-600 hover:bg-blue-700 px-5 py-3 text-xs font-bold text-white force-text-white text-center shadow-sm transition active:scale-95 cursor-pointer"
              style={{ color: "#ffffff" }}
            >
              View My Bookings
            </Link>
            <Link
              to="/"
              className="rounded-xl border border-slate-300 bg-white hover:bg-slate-50 px-5 py-3 text-xs font-bold text-slate-700 text-center active:scale-95 transition cursor-pointer"
              style={{ color: "#334155" }}
            >
              Go Home
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-xl space-y-6">

        {/* ── 1. Provider Profile Card (Mehta home painters...) ── */}
        <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm relative overflow-hidden transition hover:shadow-md">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 font-extrabold text-xl shadow-[inset_0_2px_4px_rgba(59,130,246,0.06)] border border-blue-100">
              {avatarLetter}
            </div>
            <div className="flex-1 space-y-1.5 text-left">
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-[10px] font-semibold text-blue-600">
                ⚡ Professional partner
              </span>
              <h1 className="text-xl font-bold text-slate-800 tracking-tight leading-snug">
                {seller.business_name || seller.name}
              </h1>
              <div className="text-xs text-slate-500 flex flex-wrap items-center gap-1.5 font-medium mt-1">
                <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span>{seller.address || "Service Location"}</span>
                {seller.avg_rating && (
                  <>
                    <span className="text-slate-300">•</span>
                    <span className="text-amber-600 font-bold flex items-center gap-0.5">
                      <Star className="h-3.5 w-3.5 text-amber-500 fill-current shrink-0" />
                      {seller.avg_rating} rating
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ── 2. Selected Service Card ── */}
        {selectedServiceState && (
          <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-800 tracking-tight">
                {selectedServiceState.name || selectedServiceState.title}
              </h2>
              <span className="px-2.5 py-0.5 text-[10.5px] font-semibold text-emerald-700 bg-emerald-50 rounded-full border border-emerald-100">
                Selected
              </span>
            </div>

            <div className="border-t border-slate-100 pt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-left">
              <div className="text-xs text-slate-500">
                {selectedServiceState?.price_type === "negotiable" ? (
                  <>Work price <span className="mx-1">•</span> quoted onsite / ऑन-साइट तय होगा</>
                ) : (
                  <>Work price <span className="mx-1">•</span> due after service completion / काम के बाद देय</>
                )}
              </div>
              <div className="text-lg font-bold text-blue-600">
                {selectedServiceState?.price_type === "negotiable" ? (
                  <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                    Starts from ₹{selectedServicePrice} / से शुरू (Final quote onsite)
                  </span>
                ) : selectedServiceState?.price_type === "hourly" ? (
                  `₹${selectedServicePrice} / hr (Hourly / प्रति घंटा)`
                ) : (
                  `₹${selectedServicePrice} (Fixed Price / पक्का रेट)`
                )}
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
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
            <div className="text-left">
              <h2 className="text-base font-bold text-slate-800 tracking-tight">Configure your schedule</h2>
              <p className="text-xs font-medium text-slate-500 mt-1">Choose a convenient date and time slot.</p>
            </div>

            {/* Date Picker (Added back as requested) */}
            <div className="space-y-1.5 text-left">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Select Date / तारीख चुनें
              </label>
              <DatePickerComponent
                value={formData.date}
                onChange={(dateObj) => {
                  const val = dateObj ? dateObj.format("DD-MM-YYYY") : "";
                  updateField("date", val);
                  if (formData.timeSlot && isSlotInPast(val, formData.timeSlot)) {
                    updateField("timeSlot", "");
                  }
                }}
                minDate={getMinDate()}
                maxDate={getMaxDate()}
                format="DD-MM-YYYY"
                portal
                inputClass="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition cursor-pointer"
                containerClassName="qs-date-picker__container"
                placeholder="Select a date / तारीख चुनें"
              />
              {errors.date && (
                <p className="text-xs font-semibold text-red-600 flex items-center gap-1 mt-1">
                  <span>⚠</span> {errors.date}
                </p>
              )}
            </div>

            {/* Time Slot Picker */}
            <div className="space-y-2 text-left">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Select Time Slot / समय चुनें
              </label>
              <div className="flex flex-wrap gap-1.5">
                {TIME_SLOTS.map((slot) => {
                  const active = formData.timeSlot === slot;
                  const disabled = isSlotInPast(formData.date, slot) || isSlotBooked(formData.date, slot);
                  return (
                    <button
                      key={slot}
                      type="button"
                      disabled={disabled}
                      onClick={() => updateField("timeSlot", slot)}
                      className={`rounded-lg border px-2.5 py-1.5 text-xs font-bold transition-all duration-200 text-center ${disabled
                          ? "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed line-through opacity-50"
                          : active
                            ? "bg-blue-600 border-blue-600 text-white shadow-sm cursor-pointer active:scale-95"
                            : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer active:scale-95"
                        }`}
                    >
                      {slot}
                    </button>
                  );
                })}
              </div>
              {errors.timeSlot && (
                <p className="text-xs font-semibold text-red-600 flex items-center gap-1 mt-1">
                  <span>⚠</span> {errors.timeSlot}
                </p>
              )}
            </div>
          </div>

          {/* Card: Arrival Details & Contact */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="text-left">
              <h2 className="text-base font-bold text-slate-800 tracking-tight">Where should we deliver?</h2>
              <p className="text-xs font-medium text-slate-500 mt-1">Address & contact details for the booking.</p>
            </div>

            {/* Address field */}
            <div className="space-y-1.5 text-left">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Delivery Address / आपका पता
              </label>
              <textarea
                value={formData.address}
                onChange={(e) => updateField("address", e.target.value)}
                placeholder="Enter your full address with house number, street and landmark"
                rows={3}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition"
              />
              {errors.address && (
                <p className="text-xs font-semibold text-red-600 flex items-center gap-1 mt-1">
                  <span>⚠</span> {errors.address}
                </p>
              )}
            </div>

            {/* Mobile Number */}
            <div className="space-y-1.5 text-left">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Mobile Number / मोबाइल नंबर
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600 font-bold text-sm pointer-events-none select-none z-10">
                  +91
                </span>
                <input
                  type="tel"
                  value={formData.mobile}
                  onChange={(e) =>
                    updateField(
                      "mobile",
                      e.target.value.replace(/\D/g, "").slice(0, 10),
                    )
                  }
                  placeholder="98765 43210"
                  maxLength={10}
                  style={{ paddingLeft: "3.25rem" }}
                  className="w-full pr-3 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition"
                />
              </div>
              {errors.mobile && (
                <p className="text-xs font-semibold text-red-600 flex items-center gap-1 mt-1">
                  <span>⚠</span> {errors.mobile}
                </p>
              )}
            </div>

            {/* Instructions */}
            <div className="space-y-1.5 text-left">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Special Instructions (Optional)
              </label>
              <textarea
                value={formData.instructions}
                onChange={(e) => updateField("instructions", e.target.value)}
                placeholder="Any special requests, gate codes, or instructions..."
                rows={2}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition"
              />
            </div>
          </div>

          {/* ── 4. How this booking works ── */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-slate-800 tracking-tight text-left">How this booking works</h2>

            <div className="space-y-4 text-left">
              <div className="flex gap-3">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white mt-0.5">
                  1
                </span>
                <div className="space-y-0.5">
                  <h3 className="text-sm font-semibold text-slate-800">Pay the visiting fee now</h3>
                  <p className="text-xs text-slate-500 leading-relaxed font-medium">
                    Confirms your slot and covers the partner's travel and inspection.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white mt-0.5">
                  2
                </span>
                <div className="space-y-0.5">
                  <h3 className="text-sm font-semibold text-slate-800">Partner inspects and quotes the final price</h3>
                  <p className="text-xs text-slate-500 leading-relaxed font-medium">
                    Visiting charge is settled once the inspection is done.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white mt-0.5">
                  3
                </span>
                <div className="space-y-0.5">
                  <h3 className="text-sm font-semibold text-slate-800">You approve and pay for the work</h3>
                  <p className="text-xs text-slate-500 leading-relaxed font-medium">
                    Work only starts after your approval of the final quote.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ── 5. Note / Warning banner (Notice) ── */}
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-xs leading-relaxed text-amber-800 space-y-1.5 shadow-2xs text-left">
            <p className="font-semibold flex items-center gap-1.5 text-amber-900 text-sm">
              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" /> Note / महत्वपूर्ण निर्देश:
            </p>
            <p className="pl-5 text-[11px] leading-relaxed text-amber-800 font-medium">
              <strong>English:</strong> The Visiting Charge covers the seller's travel & inspection, and must be paid online to confirm this booking. The final service price will be provided after onsite inspection and requires your approval.
            </p>
            <p className="pl-5 text-[11px] leading-relaxed text-amber-800 font-semibold border-t border-amber-200/30 pt-1.5 mt-1.5">
              <strong>Hindi:</strong> विजिटिंग चार्ज सेलर के आने-जाने और जांच का शुल्क है, बुकिंग कन्फर्म करने के लिए इसका भुगतान ऑनलाइन करना होगा। काम का पक्का बिल (फाइनल रेट) सेलर द्वारा जांच के बाद दिया जाएगा और आपकी मंजूरी के बाद ही काम शुरू होगा।
            </p>
          </div>

          {/* ── 6. Payment Method selection ── */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="text-left">
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Payment Method for Final Work</h2>
              <p className="text-xs font-semibold text-slate-400 mt-1">Choose how you pay the remaining balance once work is complete.</p>
            </div>

            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {[
                {
                  value: "online",
                  icon: "📱",
                  title: "Pay Online (UPI / Card)",
                  titleHi: "ऑनलाइन भुगतान",
                  desc: "Pay directly online via secure gateway after service."
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
                    className={`rounded-xl border p-3 text-left transition duration-200 active:scale-98 flex items-start gap-2.5 cursor-pointer hover:shadow-xs ${active
                        ? "bg-blue-50 border-blue-400 shadow-xs text-blue-700"
                        : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                  >
                    <span className="text-lg">{pm.icon}</span>
                    <div className="flex-1 space-y-0.5">
                      <span className="block text-xs font-bold text-slate-800">
                        {pm.title}
                      </span>
                      <span className="block text-[10px] text-slate-500 leading-normal font-semibold">{pm.desc}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Clarification note explaining the distinction to avoid user confusion */}
            <div className="rounded-xl bg-blue-50 border border-blue-200 p-3.5 text-xs text-blue-950 space-y-1 text-left">
              <p className="font-bold flex items-center gap-1.5 text-blue-900">
                <span>ℹ️</span> Clarification / स्पष्टीकरण:
              </p>
              <p className="pl-5 text-[11px] text-blue-800 leading-relaxed font-semibold">
                <strong>English:</strong> The payment method selected here is only for paying the final bill after the service is completed. The visiting charge (if any) is a separate fee paid online now to secure your booking.
              </p>
              <p className="pl-5 text-[11px] text-blue-800 leading-relaxed font-semibold border-t border-blue-200/30 pt-1.5 mt-1.5">
                <strong>Hindi:</strong> यहाँ चुना गया विकल्प केवल काम पूरा होने के बाद का भुगतान करने के लिए है। विजिटिंग चार्ज (यदि कोई हो) बुकिंग पक्की करने के लिए अभी ऑनलाइन जमा करना होगा।
              </p>
            </div>
          </div>

          {/* ── 7. Visiting Fee Summary Card (Green Tint) ── */}
          <div className="bg-emerald-50 border border-emerald-200 px-4 py-3.5 rounded-xl flex justify-between items-center shadow-2xs text-left">
            <div>
              <div className="flex items-center gap-2">
                <span className="block text-xs font-bold text-emerald-700 uppercase tracking-wider">Visiting fee</span>
                {visitingCharge === 0 && (
                  <span className="px-1.5 py-0.5 text-[10px] font-black text-emerald-700 bg-emerald-100 rounded-md border border-emerald-250">
                    FREE / मुफ्त
                  </span>
                )}
              </div>
              <span className="text-[11px] text-slate-500 font-semibold">
                {visitingCharge === 0 ? "No advance payment required" : "Payable now to confirm booking"}
              </span>
            </div>
            <span className="text-xl font-bold text-emerald-700 font-mono">
              {visitingCharge === 0 ? "₹0" : `₹${visitingCharge}`}
            </span>
          </div>

          {submitError && (
            <p className="text-xs font-semibold text-red-650 flex items-center gap-1 mt-1">
              <span>⚠</span> {submitError}
            </p>
          )}

          {/* Submit Action Button */}
          <button
            type="submit"
            disabled={bookingLoading}
            className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 px-5 py-3.5 text-sm font-bold text-white shadow-sm transition disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white border border-slate-200 p-5 shadow-2xl space-y-4 text-slate-800 relative">
            <div className="border-b border-slate-100 pb-3 flex justify-between items-center text-left">
              <h2 className="text-lg font-bold text-slate-800">
                Invoice Preview / पक्का बिल (रसीद)
              </h2>
              <button
                onClick={() => setShowInvoiceModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Bill details */}
            <div className="space-y-3.5 text-left">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <div className="flex justify-between text-xs font-semibold text-slate-600">
                  <span>Service / सेवा:</span>
                  <span className="text-slate-800 text-right">{formData.service}</span>
                </div>
                <div className="flex justify-between text-xs font-semibold text-slate-600">
                  <span>Date & Slot / तिथि व समय:</span>
                  <span className="text-slate-800">{formData.date} | {formData.timeSlot}</span>
                </div>
                <div className="flex justify-between text-xs font-semibold text-slate-600">
                  <span>Provider / सेलर:</span>
                  <span className="text-slate-800">{seller.business_name || seller.name}</span>
                </div>
              </div>

              <div className="space-y-2.5 px-1.5">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pricing Summary / बिल विवरण</h3>
                <div className="flex justify-between text-sm text-slate-600 font-semibold">
                  <span>Visiting Charge / विजिटिंग चार्ज:</span>
                  <span className="text-slate-800 font-mono">₹{visitingCharge}</span>
                </div>
                {platformSettings.platform_fee_model === "buyer" && visitingCharge > 0 && (
                  <div className="flex justify-between text-sm text-slate-600 font-semibold">
                    <span>Platform Security Fee / सुरक्षा शुल्क ({platformSettings.platform_fee_percentage}%):</span>
                    <span className="text-slate-800 font-mono">+₹{calculatedFee}</span>
                  </div>
                )}
                {platformSettings.platform_fee_model === "seller" && visitingCharge > 0 && (
                  <div className="flex justify-between text-sm text-slate-550">
                    <span className="italic">Platform Security Fee:</span>
                    <span className="text-emerald-700 text-xs font-semibold">₹0 (Paid by Provider)</span>
                  </div>
                )}
                <div className="h-px bg-slate-200 my-1" />
                <div className="flex justify-between text-base font-bold text-slate-800">
                  <span>Amount Payable Now / कुल भुगतान (Stage 1):</span>
                  <span className="text-emerald-600 font-mono">
                    ₹{totalPayable}
                  </span>
                </div>
              </div>

              {/* Ultra Compact Warning Box */}
              <div className="rounded-xl bg-amber-50 border border-amber-200 p-2.5 text-[10px] leading-normal text-amber-900 font-semibold text-left space-y-1">
                <p className="flex items-center gap-1 font-bold text-amber-955 uppercase tracking-wider">
                  <span>⚠️</span> Service Notice / महत्वपूर्ण सूचना:
                </p>
                <p className="leading-relaxed">
                  <strong>EN:</strong> Paid amount covers travel & inspection only. Actual repair cost is quoted onsite.
                </p>
                <p className="leading-relaxed border-t border-amber-200/60 pt-1">
                  <strong>HI:</strong> भुगतान केवल यात्रा और जांच शुल्क है। काम का फाइनल रेट सेलर ऑन-साइट जांच के बाद बताएगा।
                </p>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowInvoiceModal(false)}
                className="flex-1 rounded-xl border border-slate-250 bg-slate-50 py-3 text-xs font-bold text-slate-700 hover:bg-slate-100 transition active:scale-95 cursor-pointer"
              >
                Back / वापस जाएं
              </button>
              <button
                type="button"
                disabled={bookingLoading}
                onClick={() => {
                  setShowInvoiceModal(false);
                  if (visitingCharge === 0 || paymentMethod === "cash") {
                    handleCreateBookingDirectly();
                  } else {
                    handleRazorpayBookingPayment();
                  }
                }}
                className="flex-1 rounded-xl bg-blue-600 hover:bg-blue-700 py-3 text-xs font-bold text-white shadow-sm transition active:scale-[0.99] cursor-pointer disabled:opacity-50"
              >
                {bookingLoading && (
                  <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent mr-2 align-middle" />
                )}
                {(visitingCharge === 0 || paymentMethod === "cash") ? "Confirm Booking / बुकिंग पक्की करें" : "Proceed to Pay / भुगतान करें"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
