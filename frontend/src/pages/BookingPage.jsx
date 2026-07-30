import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import apiClient from "../api/axiosConfig";
import axios from "axios";
import { getSystemSettings } from "../api/policyService";
import DatePicker from "react-multi-date-picker";
const DatePickerComponent = DatePicker.default || DatePicker;
import { MapPin, Star, AlertTriangle, X } from "lucide-react";
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
    const raw = Number(selectedServiceState?.visiting_charge || 100);
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

  const addressRef = useRef(null);
  const mobileRef = useRef(null);
  const dateRef = useRef(null);

  const scrollToFirstError = (nextErrors) => {
    if (nextErrors.address && addressRef.current) {
      addressRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
      addressRef.current.focus();
    } else if (nextErrors.mobile && mobileRef.current) {
      mobileRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
      mobileRef.current.focus();
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
    if (!formData.address.trim()) nextErrors.address = "Enter your delivery address";
    if (!formData.mobile.trim()) nextErrors.mobile = "Enter your 10-digit mobile number";
    else if (mobileDigits.length !== 10)
      nextErrors.mobile = "Mobile number must be 10 digits";

    setErrors(nextErrors);
    const isValid = Object.keys(nextErrors).length === 0;
    if (!isValid && shouldScroll) {
      scrollToFirstError(nextErrors);
    }
    return isValid;
  };

  // Auto-select first available slot when date changes or page loads if no valid slot selected
  useEffect(() => {
    if (!formData.date) return;
    if (formData.timeSlot && !isSlotInPast(formData.date, formData.timeSlot) && !isSlotBooked(formData.date, formData.timeSlot)) {
      return;
    }
    const firstAvailable = TIME_SLOTS.find(
      (slot) => !isSlotInPast(formData.date, slot) && !isSlotBooked(formData.date, slot)
    );
    if (firstAvailable) {
      setFormData((prev) => ({ ...prev, timeSlot: firstAvailable }));
      setErrors((prev) => ({ ...prev, timeSlot: "" }));
    }
  }, [formData.date, bookedSlots]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitError("");
    if (!seller || !validate(true)) {
      setSubmitError("Please fill in your delivery address and select an available time slot.");
      return;
    }

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
      rzp.on("payment.failed", function (response) {
        console.error("Razorpay Payment Failed:", response.error);
        setSubmitError(response?.error?.description || "Payment failed or gateway connection error. Please check internet/DNS.");
        setBookingLoading(false);
      });
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
    <main className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-slate-200/90 shadow-md p-6 sm:p-8 space-y-6 text-left relative">

          {/* ── 1. Provider & Service Summary Top Header ── */}
          <div className="bg-slate-50/80 rounded-2xl border border-slate-200/80 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700 font-extrabold text-base border border-blue-200">
                {avatarLetter}
              </div>
              <div className="space-y-0.5 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-blue-100/80 px-2 py-0.5 text-[9.5px] font-bold text-blue-800">
                    ⚡ Verified Partner
                  </span>
                  {seller.avg_rating && (
                    <span className="text-amber-700 font-bold text-[11px] flex items-center gap-0.5">
                      <Star className="h-3 w-3 text-amber-500 fill-current shrink-0" />
                      {seller.avg_rating}
                    </span>
                  )}
                </div>
                <h1 className="text-base font-bold text-slate-800 tracking-tight truncate">
                  {seller.business_name || seller.name}
                </h1>
                <p className="text-[11px] text-slate-500 flex items-center gap-1 font-medium truncate">
                  <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
                  <span className="truncate">{seller.address || "Service Location"}</span>
                </p>
              </div>
            </div>

            {selectedServiceState && (
              <div className="sm:text-right shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-200">
                <span className="block text-xs font-semibold text-slate-700">
                  {selectedServiceState.name || selectedServiceState.title}
                </span>
                <span className="inline-block mt-0.5 text-[11px] font-bold text-blue-700 bg-blue-100/80 px-2 py-0.5 rounded-md border border-blue-200">
                  {selectedServiceState?.price_type === "negotiable"
                    ? `Starts ₹${selectedServicePrice}`
                    : `₹${selectedServicePrice}`}
                </span>
              </div>
            )}
          </div>

          {/* ── 2. Booking Inputs Grid (Date, Time, Mobile, Address) ── */}
          <div className="space-y-3.5">
            <h2 className="text-sm font-bold text-slate-800 tracking-tight border-b border-slate-100 pb-2 flex items-center gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700 text-[11px] font-bold">1</span>
              Schedule &amp; Location Details
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Date Selection */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Date
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
                  inputClass="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 text-[13px] font-normal focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition cursor-pointer"
                  containerClassName="qs-date-picker__container"
                  placeholder="Select Date"
                />
                {errors.date && (
                  <p className="text-[11px] font-medium text-red-600 flex items-center gap-1 mt-0.5">
                    <span>⚠</span> {errors.date}
                  </p>
                )}
              </div>

              {/* Mobile Number */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Mobile Number
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-[13px] pointer-events-none select-none z-10">
                    +91
                  </span>
                  <input
                    ref={mobileRef}
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
                    style={{ paddingLeft: "3rem" }}
                    className={`w-full pr-3 py-2 rounded-xl border text-[13px] font-normal focus:outline-none transition ${
                      errors.mobile
                        ? "border-red-400 bg-red-50/50 text-red-900 ring-2 ring-red-100"
                        : "border-slate-200 bg-white text-slate-800 focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                    }`}
                  />
                </div>
                {errors.mobile && (
                  <p className="text-xs font-bold text-red-600 flex items-center gap-1.5 mt-1 bg-red-50 border border-red-200 px-2.5 py-1 rounded-lg">
                    <span>⚠</span> {errors.mobile}
                  </p>
                )}
              </div>
            </div>

            {/* Time Slots Grid */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">
                Time Slot
              </label>
              <div className={`grid grid-cols-3 sm:grid-cols-6 gap-2 rounded-xl transition ${errors.timeSlot ? "p-1.5 border border-red-300 bg-red-50/40" : ""}`}>
                {TIME_SLOTS.map((slot) => {
                  const active = formData.timeSlot === slot;
                  const disabled = isSlotInPast(formData.date, slot) || isSlotBooked(formData.date, slot);
                  return (
                    <button
                      key={slot}
                      type="button"
                      disabled={disabled}
                      onClick={() => updateField("timeSlot", slot)}
                      className={`rounded-lg border py-1.5 text-xs font-medium transition-all text-center ${
                        disabled
                          ? "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed line-through opacity-50"
                          : active
                          ? "bg-blue-600 border-blue-600 text-white shadow-xs cursor-pointer active:scale-95 font-semibold"
                          : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer active:scale-95"
                      }`}
                    >
                      {slot}
                    </button>
                  );
                })}
              </div>
              {errors.timeSlot && (
                <p className="text-xs font-bold text-red-600 flex items-center gap-1.5 mt-1 bg-red-50 border border-red-200 px-2.5 py-1 rounded-lg">
                  <span>⚠</span> {errors.timeSlot}
                </p>
              )}
            </div>

            {/* Address & Instructions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Delivery Address
                </label>
                <textarea
                  ref={addressRef}
                  value={formData.address}
                  onChange={(e) => updateField("address", e.target.value)}
                  placeholder="House/flat number, street and landmark..."
                  rows={2}
                  className={`w-full px-3 py-2 rounded-xl border text-[13px] font-normal focus:outline-none transition ${
                    errors.address
                      ? "border-red-400 bg-red-50/50 text-red-900 ring-2 ring-red-100"
                      : "border-slate-200 bg-white text-slate-800 focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                  }`}
                />
                {errors.address && (
                  <p className="text-xs font-bold text-red-600 flex items-center gap-1.5 mt-1 bg-red-50 border border-red-200 px-2.5 py-1 rounded-lg">
                    <span>⚠</span> {errors.address}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Special Instructions (Optional)
                </label>
                <textarea
                  value={formData.instructions}
                  onChange={(e) => updateField("instructions", e.target.value)}
                  placeholder="Gate code, landmark notes, etc."
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 text-[13px] font-normal focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition"
                />
              </div>
            </div>
          </div>

          {/* ── 3. Payment Method & Visiting Fee Summary ── */}
          <div className="space-y-3 pt-1">
            <h2 className="text-sm font-bold text-slate-800 tracking-tight border-b border-slate-100 pb-2 flex items-center gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700 text-[11px] font-bold">2</span>
              Payment &amp; Confirmation
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Visiting Fee Card */}
              <div className="bg-emerald-50/70 border border-emerald-200/80 p-3 rounded-xl flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="block text-xs font-bold text-emerald-800">Visiting Fee</span>
                    {visitingCharge === 0 && (
                      <span className="px-1.5 py-0.5 text-[9px] font-bold text-emerald-800 bg-emerald-100 rounded-md border border-emerald-300">
                        FREE
                      </span>
                    )}
                  </div>
                  <span className="text-[10.5px] text-emerald-700 font-medium mt-0.5 block">
                    {visitingCharge === 0 ? "No advance required" : "Payable now online to lock slot"}
                  </span>
                </div>
                <span className="text-base font-bold text-emerald-800 font-mono">
                  {visitingCharge === 0 ? "₹0" : `₹${visitingCharge}`}
                </span>
              </div>

              {/* Payment Method Selector */}
              <div className="space-y-1">
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Payment Method for Final Work
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: "online", icon: "📱", title: "Online", desc: "Pay visiting fee online now; pay final quote online after work" },
                    { value: "cash", icon: "💵", title: "Cash (COD)", desc: "Pay visiting fee online now; pay final quote in cash after work" }
                  ].map((pm) => {
                    const active = paymentMethod === pm.value;
                    return (
                      <button
                        key={pm.value}
                        type="button"
                        onClick={() => setPaymentMethod(pm.value)}
                        className={`rounded-xl border p-2 text-left transition active:scale-95 cursor-pointer ${
                          active
                            ? "bg-blue-50 border-blue-500 text-blue-800 shadow-2xs font-semibold"
                            : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs">{pm.icon}</span>
                          <span className="text-xs font-semibold">{pm.title}</span>
                        </div>
                        <span className="block text-[9px] text-slate-500 font-medium mt-0.5">{pm.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* ── 4. Compact Policy Alert ── */}
          <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-xs text-amber-950 flex items-start gap-2">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-left leading-relaxed text-[11px] font-medium text-amber-900">
              <strong>Notice:</strong> Visiting fee covers technician travel &amp; inspection. Final service quote will be provided onsite before starting work.
            </div>
          </div>

          {submitError && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-2.5 text-xs font-medium text-red-700 flex items-center gap-2">
              <span>⚠</span> {submitError}
            </div>
          )}

          {/* ── 5. Submit Button ── */}
          <button
            type="submit"
            disabled={bookingLoading}
            className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 py-3 px-5 text-sm font-semibold text-white shadow-sm transition active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer border-0"
          >
            {bookingLoading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                Placing Booking...
              </span>
            ) : (
              visitingCharge === 0
                ? "Confirm Booking (Free)"
                : `Pay ₹${visitingCharge} & Confirm Slot`
            )}
          </button>
        </form>
      </div>

      {/* Invoice / Confirmation Modal */}
      {showInvoiceModal && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white border border-slate-200 p-6 shadow-2xl space-y-5 text-slate-800 relative">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 tracking-tight">Booking Summary</h2>
                <p className="text-xs font-medium text-slate-500 mt-0.5">Please review your booking details before payment.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowInvoiceModal(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition cursor-pointer"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Provider & Service Info */}
            <div className="bg-slate-50/80 rounded-xl border border-slate-200/70 p-3.5 space-y-2.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-500">Service</span>
                <span className="font-bold text-slate-800 text-right max-w-[60%] truncate">{formData.service}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-500">Date &amp; Slot</span>
                <span className="font-bold text-slate-800">{formData.date} · {formData.timeSlot}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-500">Provider</span>
                <span className="font-bold text-slate-800 text-right max-w-[60%] truncate">{seller.business_name || seller.name}</span>
              </div>
            </div>

            {/* Price breakdown */}
            <div className="space-y-2 px-0.5">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Payment Breakdown</span>
              <div className="flex justify-between items-center text-xs text-slate-600 font-medium">
                <span>Visiting Charge</span>
                <span className="font-semibold text-slate-800">₹{visitingCharge}</span>
              </div>
              {platformSettings.platform_fee_model === "buyer" && visitingCharge > 0 && (
                <div className="flex justify-between items-center text-xs text-slate-600 font-medium">
                  <span>Platform Fee ({platformSettings.platform_fee_percentage}%)</span>
                  <span className="font-semibold text-slate-800">+₹{calculatedFee}</span>
                </div>
              )}
              {platformSettings.platform_fee_model === "seller" && visitingCharge > 0 && (
                <div className="flex justify-between items-center text-xs text-slate-500 font-medium">
                  <span>Platform Fee</span>
                  <span className="text-emerald-700 font-semibold text-[11px]">Included (₹0)</span>
                </div>
              )}
              <div className="border-t border-slate-100 pt-2 flex justify-between items-center">
                <span className="text-xs font-bold text-slate-800">Amount Payable Now</span>
                <span className="text-base font-extrabold text-blue-600">₹{totalPayable}</span>
              </div>
            </div>

            {/* Warning / Notice Box */}
            <div className="rounded-xl bg-amber-50/80 border border-amber-200/80 p-3.5 flex items-start gap-2.5">
              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-amber-900">Visiting Fee Notice</p>
                <p className="text-[11.5px] font-medium text-amber-800/90 leading-relaxed">
                  This fee covers the technician's visit &amp; inspection. The final repair estimate will be provided on-site before starting work.
                </p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => setShowInvoiceModal(false)}
                className="flex-1 rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition active:scale-95 cursor-pointer"
              >
                Back
              </button>
              <button
                type="button"
                disabled={bookingLoading}
                onClick={() => {
                  setShowInvoiceModal(false);
                  if (visitingCharge === 0) {
                    handleCreateBookingDirectly();
                  } else {
                    handleRazorpayBookingPayment();
                  }
                }}
                className="flex-1 rounded-xl bg-blue-600 hover:bg-blue-700 py-2.5 text-xs font-bold text-white shadow-sm transition active:scale-95 cursor-pointer disabled:opacity-50"
              >
                {bookingLoading && (
                  <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent mr-1.5 align-middle" />
                )}
                {visitingCharge === 0 ? "Confirm Booking" : `Pay ₹${totalPayable} Online & Confirm`}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
