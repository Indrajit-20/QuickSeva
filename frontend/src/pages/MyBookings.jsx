import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { buyerOrdersApi } from "../api/orderApi";
import apiClient from "../api/axiosConfig";
import { useAuth } from "../context/AuthContext";
import { loadRazorpayScript } from "../utils/razorpayLoader";
import { createPaymentOrderApi } from "../api/walletApi";

const getImageUrl = (url) => {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  const base = apiClient.defaults.baseURL ? apiClient.defaults.baseURL.replace("/api", "") : "http://localhost:5000";
  return `${base}${url}`;
};

const statusClasses = {
  pending:     "border-amber-200  bg-amber-50  text-amber-700",
  accepted:    "border-blue-200   bg-blue-50   text-blue-700",
  quoted:      "border-purple-200 bg-purple-50 text-purple-700",
  in_progress: "border-indigo-200 bg-indigo-50 text-indigo-700",
  completed:   "border-emerald-200 bg-emerald-50 text-emerald-700",
  cancelled:   "border-red-200    bg-red-50    text-red-700",
  disputed:    "border-orange-200 bg-orange-50 text-orange-700",
};

const formatDate = (value) => {
  if (!value) return "";
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
};

export default function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const [activeBookingForPayment, setActiveBookingForPayment] = useState(null);

  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [disputeBookingItem, setDisputeBookingItem] = useState(null);
  const [disputeReasonText, setDisputeReasonText] = useState("");

  const { user } = useAuth();

  const refresh = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await buyerOrdersApi.list();
      const list = res?.data?.orders || res?.orders || [];
      setBookings(Array.isArray(list) ? list : []);
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to load bookings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const sortedBookings = useMemo(
    () =>
      [...bookings].sort(
        (a, b) =>
          new Date(b.created_at || 0) - new Date(a.created_at || 0),
      ),
    [bookings],
  );

  const cancelBooking = async (bookingOrId) => {
    const id = typeof bookingOrId === "object" ? bookingOrId.id : bookingOrId;
    let confirmMsg = "Are you sure you want to cancel this booking? / क्या आप वाकई इस बुकिंग को रद्द करना चाहते हैं?";

    if (typeof bookingOrId === "object") {
      if (["pending", "accepted"].includes(bookingOrId.status)) {
        if (bookingOrId.scheduled_at) {
          const scheduledTime = new Date(bookingOrId.scheduled_at).getTime();
          const currentTime = Date.now();
          const isWithin2Hours = (scheduledTime - currentTime) < 2 * 60 * 60 * 1000;
          if (isWithin2Hours) {
            confirmMsg = `Warning: This booking is scheduled to start in less than 2 hours. If you cancel now, your visiting charge of ₹${parseFloat(bookingOrId.visiting_charge_amount || 0)} will NOT be refunded. Are you sure you want to cancel? / चेतावनी: यह बुकिंग 2 घंटे से कम समय में शुरू होने वाली है। यदि आप अभी रद्द करते हैं, तो आपका विजिटिंग चार्ज ₹${parseFloat(bookingOrId.visiting_charge_amount || 0)} वापस नहीं किया जाएगा। क्या आप वाकई रद्द करना चाहते हैं?`;
          }
        }
      } else if (["in_progress", "quoted"].includes(bookingOrId.status)) {
        confirmMsg = `Warning: The provider has already visited and performed inspections. If you reject/cancel now, your visiting charge of ₹${parseFloat(bookingOrId.visiting_charge_amount || 0)} will NOT be refunded and this order will be cancelled. Are you sure you want to proceed? / चेतावनी: प्रदाता पहले ही दौरा कर चुके हैं और निरीक्षण कर चुके हैं। यदि आप अभी अस्वीकार/रद्द करते हैं, तो आपका विजिटिंग चार्ज ₹${parseFloat(bookingOrId.visiting_charge_amount || 0)} वापस नहीं किया जाएगा और यह बुकिंग रद्द कर दी जाएगी। क्या आप आगे बढ़ना चाहते हैं?`;
      }
    }

    if (!window.confirm(confirmMsg)) return;
    setBusyId(id);
    try {
      await buyerOrdersApi.cancel(id, { reason: "Cancelled by buyer" });
      await refresh();
    } catch (e) {
      alert(e?.response?.data?.message || "Failed to cancel");
    } finally {
      setBusyId(null);
    }
  };

  const openDisputeModal = (booking) => {
    setDisputeBookingItem(booking);
    setDisputeReasonText("");
    setShowDisputeModal(true);
  };

  const submitDispute = async () => {
    if (!disputeReasonText.trim()) {
      alert("A reason is required to dispute this booking. / बुकिंग पर विवाद दर्ज करने के लिए कारण आवश्यक है।");
      return;
    }

    const bookingId = disputeBookingItem.id;
    setBusyId(bookingId);
    setShowDisputeModal(false);
    try {
      await buyerOrdersApi.dispute(bookingId, { reason: disputeReasonText });
      await refresh();
    } catch (e) {
      alert(e?.response?.data?.message || "Failed to submit dispute");
    } finally {
      setBusyId(null);
      setDisputeBookingItem(null);
    }
  };

  const triggerApproveQuotation = async (booking) => {
    setActiveBookingForPayment(booking);
    const finalTotal = parseFloat(booking.service_charge_amount || 0) + parseFloat(booking.parts_cost_amount || 0) - parseFloat(booking.discount_amount || 0);

    if (booking.payment_method === "cash") {
      if (!window.confirm("Are you sure you want to approve this quotation? / क्या आप कोटेशन मंजूर करना चाहते हैं?")) return;
      executeApproveQuotation(booking.id);
    } else {
      setBusyId(booking.id);
      try {
        const isLoaded = await loadRazorpayScript();
        if (!isLoaded) {
          alert("Razorpay SDK failed to load. Please check your internet connection.");
          setBusyId(null);
          return;
        }

        const orderRes = await createPaymentOrderApi(finalTotal, "quotation_payment");
        if (!orderRes || !orderRes.success) {
          alert(orderRes?.message || "Failed to initiate quotation payment.");
          setBusyId(null);
          return;
        }

        const orderData = orderRes.data;
        const options = {
          key: import.meta.env.VITE_RAZORPAY_KEY_ID,
          amount: orderData.amount,
          currency: orderData.currency,
          name: "QuickSeva",
          description: `Stage 2 Final payment for ${booking.service_title || booking.service_name}`,
          order_id: orderData.id,
          handler: async function (response) {
            try {
              setBusyId(booking.id);
              await apiClient.patch(`/orders/${booking.id}/approve-quotation`, {
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
              });
              alert("Payment successful! Work will resume shortly.");
              await refresh();
            } catch (err) {
              console.error("Quotation approval verification error:", err);
              alert(err?.response?.data?.message || "Payment verified but quotation approval failed.");
            } finally {
              setBusyId(null);
            }
          },
          prefill: {
            name: user?.name || "",
            email: user?.email || "",
            contact: user?.phone || "",
          },
          theme: {
            color: "#2563EB",
          },
          modal: {
            ondismiss: function () {
              setBusyId(null);
            }
          }
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
      } catch (err) {
        console.error("Quotation Razorpay initiation error:", err);
        alert("Failed to open Razorpay payment gateway.");
        setBusyId(null);
      }
    }
  };

  const executeApproveQuotation = async (id) => {
    setBusyId(id);
    try {
      await buyerOrdersApi.approveQuotation(id);
      await refresh();
    } catch (e) {
      alert(e?.response?.data?.message || "Failed to approve quotation");
    } finally {
      setBusyId(null);
    }
  };

  const handleSwitchToCash = async (orderId) => {
    if (!window.confirm("Are you sure you want to change the payment method to Cash? / क्या आप वाकई भुगतान का माध्यम नकद करना चाहते हैं?")) return;
    setBusyId(orderId);
    try {
      await apiClient.patch(`/orders/${orderId}/switch-to-cash`);
      alert("Switched to Cash payment successfully! A Completion PIN has been generated for you.");
      await refresh();
    } catch (e) {
      alert(e?.response?.data?.message || "Failed to switch to Cash payment");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-800 px-4 py-12 relative overflow-hidden">
      <div className="mx-auto max-w-4xl relative z-10">
        <div className="mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-6 border-b border-slate-200 pb-6">
          <div>
            <p className="text-xs font-bold tracking-wider text-blue-600 uppercase">QuickSeva</p>
            <h1 className="text-3xl font-bold text-slate-800 mt-1">My Bookings</h1>
          </div>

          {/* Stats Bar */}
          {!loading && bookings.length > 0 && (
            <div className="flex gap-3 flex-wrap">
              <div className="rounded-2xl border border-slate-200 bg-white py-2.5 px-4 flex items-center gap-3 shadow-sm">
                <span className="h-2 w-2 rounded-full bg-blue-600" />
                <div className="text-xs">
                  <span className="block font-semibold text-slate-400">Total</span>
                  <span className="font-bold text-slate-800 text-sm">{bookings.length}</span>
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white py-2.5 px-4 flex items-center gap-3 shadow-sm">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <div className="text-xs">
                  <span className="block font-semibold text-slate-400">Completed</span>
                  <span className="font-bold text-slate-800 text-sm">
                    {bookings.filter((b) => b.status === "completed").length}
                  </span>
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white py-2.5 px-4 flex items-center gap-3 shadow-sm">
                <span className="h-2 w-2 rounded-full bg-amber-500" />
                <div className="text-xs">
                  <span className="block font-semibold text-slate-400">Active</span>
                  <span className="font-bold text-slate-800 text-sm">
                    {bookings.filter((b) => ["pending", "accepted", "in_progress"].includes(b.status)).length}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700 shadow-sm">
            <span className="mr-1.5 font-bold">⚠️ Error:</span> {error}
          </div>
        )}

        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-16 text-center shadow-sm flex flex-col items-center justify-center">
            <span className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-slate-100 border-t-blue-600 mr-3 align-middle" />
            <h2 className="text-xl font-bold text-slate-650 mt-4">Loading your bookings…</h2>
          </div>
        ) : sortedBookings.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-16 text-center shadow-sm flex flex-col items-center justify-center">
            <div className="text-5xl mb-4">📭</div>
            <h2 className="text-2xl font-bold text-slate-850">No bookings yet</h2>
            <p className="mt-2 text-slate-500 text-sm max-w-sm">
              You haven't placed any service requests yet. Find our top-rated partners and book now!
            </p>
            <Link
              to="/services"
              className="mt-6 rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-sm hover:bg-blue-700 transition"
            >
              Find Services
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {sortedBookings.map((booking) => {
              const avatarLetter = (
                booking.business_name ||
                booking.seller_name ||
                "Provider"
              )
                .trim()[0]
                .toUpperCase();

              return (
                <article
                  key={booking.id}
                  className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow group text-left"
                >
                  <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
                    <div className="flex flex-col sm:flex-row items-start gap-4 flex-1">
                      {/* Avatar Ring */}
                      <div className="flex-shrink-0 mt-1">
                        {booking.seller_pic ? (
                          <img
                            src={getImageUrl(booking.seller_pic)}
                            alt={booking.business_name || booking.seller_name}
                            className="h-14 w-14 rounded-full border-2 border-slate-100 object-cover shadow-sm"
                          />
                        ) : (
                          <div className="h-14 w-14 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 font-bold text-white flex items-center justify-center text-lg shadow-sm">
                            {avatarLetter}
                          </div>
                        )}
                      </div>

                      {/* Info block */}
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="flex items-center text-xs font-mono text-slate-600 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200">
                            <svg className="h-3.5 w-3.5 mr-1 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            {booking.order_number || `#${booking.id}`}
                          </span>
                          <span
                            className={`rounded-full border px-3 py-0.5 text-[11px] font-bold uppercase tracking-wider ${
                              statusClasses[booking.status] ||
                              "border-slate-200 bg-slate-50 text-slate-650"
                            }`}
                          >
                            {(booking.status || "pending").replace("_", " ")}
                          </span>
                          {booking.scheduled_at && new Date(booking.scheduled_at) < new Date() && ["pending", "accepted", "in_progress", "quoted"].includes(booking.status) && (
                            <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-0.5 text-[11px] font-bold uppercase tracking-wider text-amber-700">
                              ⚠️ Overdue / समय बीत गया
                            </span>
                          )}
                        </div>

                        <h2 className="mt-3.5 text-xl font-bold text-slate-800 leading-tight">
                          {booking.service_title || booking.service_name || "Service"}
                        </h2>

                        <p className="mt-1 text-sm font-bold text-blue-600">
                          {booking.business_name ||
                            booking.seller_business_name ||
                            booking.seller_name ||
                            "Provider"}
                        </p>

                        <div className="mt-4 space-y-2 border-t border-slate-100 pt-4">
                          <p className="flex items-center text-sm text-slate-600">
                            <svg className="h-4 w-4 text-slate-400 mr-2.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span className="font-semibold text-slate-500">Date &amp; Time:</span>
                            <span className="ml-1.5 text-slate-850 font-semibold">
                              {formatDate(booking.scheduled_at || booking.created_at)}
                            </span>
                          </p>

                          <p className="flex items-start text-sm text-slate-600">
                            <svg className="h-4 w-4 text-slate-400 mr-2.5 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span className="font-semibold text-slate-500 flex-shrink-0">Address:</span>
                            <span className="ml-1.5 text-slate-850 font-semibold break-all">
                              {booking.address || "—"}
                            </span>
                          </p>

                          {booking.seller_phone && (
                            <p className="flex items-center text-sm text-slate-600">
                              <svg className="h-4 w-4 text-slate-400 mr-2.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                              </svg>
                              <span className="font-semibold text-slate-500 flex-shrink-0">Seller Contact:</span>
                              <a href={`tel:${booking.seller_phone}`} className="ml-1.5 text-blue-600 font-bold hover:underline">
                                {booking.seller_phone}
                              </a>
                            </p>
                          )}

                          <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
                            <div className="flex flex-col gap-2 rounded-xl bg-slate-50 border border-slate-200 p-3.5">
                              {/* Stage 1 details */}
                              <div className="flex items-center justify-between text-xs text-slate-500">
                                <span className="font-semibold">Stage 1: Visiting Charge / विजिटिंग चार्ज:</span>
                                <span className="font-bold text-emerald-700">
                                  ₹{Number(booking.visiting_charge_amount || booking.total_amount || 0).toLocaleString("en-IN")}
                                  {booking.payment_method === "cash" && booking.visiting_payment_status !== "paid" ? " (Pay via Cash / नकद भुगतान)" : " (✓ Paid / भुगतान हुआ)"}
                                </span>
                              </div>
                              
                              {/* Stage 2 details */}
                              {booking.service_charge_amount > 0 && (
                                <div className="border-t border-slate-200 pt-2 mt-2 space-y-1 text-xs">
                                  <span className="block font-bold text-slate-700 mb-1">Stage 2: Quotation / काम का पक्का बिल:</span>
                                  <div className="flex justify-between text-slate-600 font-medium">
                                    <span>Service Fee / काम का दाम:</span>
                                    <span>₹{Number(booking.service_charge_amount || 0).toLocaleString("en-IN")}</span>
                                  </div>
                                  
                                  {/* Parts breakdown for buyer */}
                                  {(() => {
                                    let parsedNotes = { notes: booking.quotation_notes || "", parts: [] };
                                    try {
                                      if (booking.quotation_notes && booking.quotation_notes.startsWith("{")) {
                                        parsedNotes = JSON.parse(booking.quotation_notes);
                                      }
                                    } catch (e) {}

                                    return (
                                      <>
                                        {parsedNotes.parts && parsedNotes.parts.length > 0 ? (
                                          <div className="space-y-1.5 pl-2.5 border-l border-blue-200 my-1.5">
                                            <span className="text-[10px] text-blue-600 block font-bold">Itemized Parts / सामानों की सूची:</span>
                                            {parsedNotes.parts.map((p, idx) => (
                                              <div key={idx} className="flex justify-between text-slate-650 text-[11px] font-medium">
                                                <span>• {p.name}:</span>
                                                <span>₹{Number(p.price).toLocaleString("en-IN")}</span>
                                              </div>
                                            ))}
                                            <div className="flex justify-between text-slate-750 font-bold border-t border-slate-200 pt-1 mt-1">
                                              <span>Total Parts Cost:</span>
                                              <span>₹{Number(booking.parts_cost_amount || 0).toLocaleString("en-IN")}</span>
                                            </div>
                                          </div>
                                        ) : (
                                          booking.parts_cost_amount > 0 && (
                                            <div className="flex justify-between text-slate-600 font-medium">
                                              <span>Parts/Materials / सामान का चार्ज:</span>
                                              <span>₹{Number(booking.parts_cost_amount || 0).toLocaleString("en-IN")}</span>
                                            </div>
                                          )
                                        )}

                                        {parsedNotes.notes && (
                                          <div className="text-slate-500 italic text-[11px] mt-1.5 border-t border-slate-200 pt-1.5">
                                            <span className="font-bold not-italic text-slate-600">Notes:</span> {parsedNotes.notes}
                                          </div>
                                        )}
                                      </>
                                    );
                                  })()}

                                  {booking.discount_amount > 0 && (
                                    <div className="flex justify-between text-red-650 font-bold">
                                      <span>Discount / छूट:</span>
                                      <span>-₹{Number(booking.discount_amount || 0).toLocaleString("en-IN")}</span>
                                    </div>
                                  )}
                                  <div className="flex justify-between text-sm font-bold text-slate-800 border-t border-slate-200 pt-1.5 mt-1">
                                    <span>Remaining Total / बकाया कुल राशि:</span>
                                    <span>₹{Number(
                                      parseFloat(booking.service_charge_amount || 0) + 
                                      parseFloat(booking.parts_cost_amount || 0) - 
                                      parseFloat(booking.discount_amount || 0) +
                                      parseFloat(booking.final_platform_fee || 0)
                                    ).toLocaleString("en-IN")}</span>
                                  </div>
                                </div>
                              )}
                            </div>

                            <p className="flex items-center text-xs text-slate-500">
                              <span>Payment Mode / भुगतान का माध्यम:</span>
                              <span className="ml-1.5 px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-[10px] uppercase font-bold tracking-wider text-slate-600">
                                {booking.payment_method}
                              </span>
                            </p>
                            {/* Completion PIN Display for Cash Orders in Progress */}
                            {booking.status === "in_progress" && booking.payment_method === "cash" && booking.completion_otp_code && (
                              <div className="mt-3.5 p-3.5 rounded-2xl border border-emerald-250 bg-emerald-50 text-center shadow-sm">
                                <span className="block text-[10px] font-bold text-emerald-700 uppercase tracking-widest">Share this Completion PIN with Technician / काम पूरा होने का कोड</span>
                                <span className="block text-2xl font-black text-emerald-755 mt-1.5 tracking-widest">{booking.completion_otp_code}</span>
                                <span className="block text-[10px] text-emerald-600 mt-1.5 font-semibold leading-normal">Share this ONLY after the service is done and you have paid the technician ₹{Number(parseFloat(booking.service_charge_amount || 0) + parseFloat(booking.parts_cost_amount || 0) - parseFloat(booking.discount_amount || 0) + parseFloat(booking.visiting_charge_amount || 0)).toLocaleString("en-IN")} in cash.</span>
                              </div>
                            )}

                            {/* Cash Payment Information */}
                            {booking.status === "in_progress" && booking.payment_method === "cash" && !booking.completion_otp_code && (
                              <div className="mt-3.5 p-3.5 rounded-2xl border border-amber-250 bg-amber-50 text-center shadow-sm">
                                <span className="block text-[10px] font-bold text-amber-700 uppercase tracking-widest">Cash Payment / नकद भुगतान</span>
                                <p className="text-xs text-amber-800 font-bold mt-1.5">
                                  Please pay ₹{Number(parseFloat(booking.service_charge_amount || 0) + parseFloat(booking.parts_cost_amount || 0) - parseFloat(booking.discount_amount || 0) + parseFloat(booking.visiting_charge_amount || 0)).toLocaleString("en-IN")} in cash to the technician.
                                </p>
                              </div>
                            )}

                            {/* Online Paid Confirmation Information */}
                            {booking.status === "in_progress" && booking.payment_method === "online" && booking.final_payment_status === "paid" && (
                              <div className="mt-3.5 p-3.5 rounded-2xl border border-emerald-250 bg-emerald-55 text-center shadow-sm">
                                <span className="block text-[10px] font-bold text-emerald-700 uppercase tracking-widest">✓ Payout Completed Online / ऑनलाइन भुगतान पूर्ण</span>
                                <p className="text-xs text-emerald-800 font-bold mt-1.5">
                                  Final bill payment of ₹{Number(parseFloat(booking.service_charge_amount || 0) + parseFloat(booking.parts_cost_amount || 0) - parseFloat(booking.discount_amount || 0)).toLocaleString("en-IN")} was successfully paid via Razorpay.
                                </p>
                                <p className="text-[10px] text-emerald-600 mt-1 font-semibold leading-normal">
                                  No further payment is required. The technician is currently working on your request. / कोई अतिरिक्त भुगतान आवश्यक नहीं है।
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex md:flex-col shrink-0 flex-wrap gap-2.5 items-stretch justify-end md:justify-start w-full md:w-auto md:min-w-[140px] border-t border-slate-100 pt-4 md:pt-0 md:border-t-0">
                      {booking.seller_id && (
                        <Link
                          to={`/seller/${booking.seller_id}`}
                          className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 px-4 py-2.5 text-xs font-bold text-slate-700 transition duration-300 w-full text-center shadow-sm"
                        >
                          <svg className="h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          View Provider
                        </Link>
                      )}
                      
                      {booking.status === "quoted" && (booking.payment_method === "cash" ? !booking.completion_otp_code : booking.final_payment_status !== "paid") && (
                        <>
                          <button
                            type="button"
                            disabled={busyId === booking.id}
                            onClick={() => triggerApproveQuotation(booking)}
                            className="flex items-center justify-center gap-1.5 rounded-xl border border-emerald-250 bg-emerald-50 hover:bg-emerald-100 px-4 py-2.5 text-xs font-bold text-emerald-700 transition duration-300 w-full text-center disabled:opacity-50 shadow-sm cursor-pointer"
                          >
                            {busyId === booking.id ? (
                              <>
                                <span className="h-3 w-3 animate-spin rounded-full border-2 border-emerald-500 border-t-white" />
                                Approving…
                              </>
                            ) : (
                              <>
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {booking.payment_method === "cash" ? "Approve Quotation" : "Approve & Pay"}
                              </>
                            )}
                          </button>
                          
                          {booking.payment_method === "online" && (
                            <button
                              type="button"
                              disabled={busyId === booking.id}
                              onClick={() => handleSwitchToCash(booking.id)}
                              className="flex items-center justify-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 hover:bg-amber-100 px-4 py-2.5 text-xs font-bold text-amber-700 transition duration-300 w-full text-center cursor-pointer shadow-sm animate-pulse"
                            >
                              💵 Pay in Cash instead
                            </button>
                          )}

                          <button
                             type="button"
                             disabled={busyId === booking.id}
                             onClick={() => cancelBooking(booking)}
                            className="flex items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 px-4 py-2.5 text-xs font-bold text-red-700 transition duration-300 w-full text-center disabled:opacity-50 cursor-pointer"
                          >
                            Reject Quotation
                          </button>
                        </>
                      )}

                      {booking.status === "in_progress" && booking.payment_method === "online" && booking.final_payment_status !== "paid" && (
                        <button
                          type="button"
                          disabled={busyId === booking.id}
                          onClick={() => handleSwitchToCash(booking.id)}
                          className="flex items-center justify-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 hover:bg-amber-100 px-4 py-2.5 text-xs font-bold text-amber-700 transition duration-300 w-full text-center cursor-pointer shadow-sm"
                        >
                          💵 Pay in Cash instead
                        </button>
                      )}

                      {booking.status === "pending" && (
                        <button
                          type="button"
                          disabled={busyId === booking.id || (booking.scheduled_at && new Date(booking.scheduled_at) < new Date())}
                          onClick={() => cancelBooking(booking)}
                          className="flex items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 px-4 py-2.5 text-xs font-bold text-red-700 transition duration-300 w-full text-center disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                        >
                          {busyId === booking.id ? (
                            <>
                              <span className="h-3 w-3 animate-spin rounded-full border-2 border-red-550 border-t-white" />
                              Cancelling…
                            </>
                          ) : (
                            <>
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {booking.scheduled_at && new Date(booking.scheduled_at) < new Date() ? "Expired" : "Cancel Booking"}
                            </>
                          )}
                        </button>
                      )}

                      {booking.status === "accepted" && (
                        <>
                          {booking.scheduled_at && new Date(booking.scheduled_at) < new Date() ? (
                            <button
                              type="button"
                              disabled={busyId === booking.id}
                              onClick={() => openDisputeModal(booking)}
                              className="flex items-center justify-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 hover:bg-amber-100 px-4 py-2.5 text-xs font-bold text-amber-700 transition duration-300 w-full text-center disabled:opacity-50 cursor-pointer"
                            >
                              {busyId === booking.id ? (
                                <>
                                  <span className="h-3 w-3 animate-spin rounded-full border-2 border-amber-500 border-t-white" />
                                  Submitting Dispute…
                                </>
                              ) : (
                                <>
                                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                  </svg>
                                  Report No-Show / Dispute
                                </>
                              )}
                            </button>
                          ) : (
                            <button
                              type="button"
                              disabled={busyId === booking.id}
                              onClick={() => cancelBooking(booking)}
                              className="flex items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 px-4 py-2.5 text-xs font-bold text-red-700 transition duration-300 w-full text-center disabled:opacity-50 cursor-pointer"
                            >
                              {busyId === booking.id ? (
                                <>
                                  <span className="h-3 w-3 animate-spin rounded-full border-2 border-red-550 border-t-white" />
                                  Cancelling…
                                </>
                              ) : (
                                <>
                                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  Cancel Booking
                                </>
                              )}
                            </button>
                          )}
                        </>
                      )}

                      {["in_progress", "quoted"].includes(booking.status) && booking.scheduled_at && new Date(booking.scheduled_at) < new Date() && (
                        <button
                          type="button"
                          disabled={busyId === booking.id}
                          onClick={() => openDisputeModal(booking)}
                          className="flex items-center justify-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 hover:bg-amber-100 px-4 py-2.5 text-xs font-bold text-amber-700 transition duration-300 w-full text-center disabled:opacity-50 cursor-pointer"
                        >
                          {busyId === booking.id ? (
                            <>
                              <span className="h-3 w-3 animate-spin rounded-full border-2 border-amber-500 border-t-white" />
                              Submitting Dispute…
                            </>
                          ) : (
                            <>
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                              </svg>
                              Dispute Booking
                            </>
                          )}
                        </button>
                      )}
                      {(booking.status === "completed" || (booking.payment_method === "online" && booking.final_payment_status === "paid")) && (
                        <button
                          type="button"
                          onClick={() => {
                            const payload = {
                              ...booking,
                              customer_name: booking.buyer_name || "Customer",
                              customer_phone: booking.buyer_phone || "",
                              service_name: booking.service_title || booking.service_name || "Service",
                              seller_business: booking.business_name || booking.seller_business_name || booking.seller_name || "QuickSeva",
                              date: booking.scheduled_at || booking.created_at || booking.date
                            };
                            import("../utils/invoiceGenerator").then((m) =>
                              m.generateInvoicePDF(payload)
                            );
                          }}
                          className="flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 px-4 py-2.5 text-xs font-bold text-white shadow-sm active:scale-95 transition duration-300 w-full text-center cursor-pointer"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                          Download Invoice
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>



      {/* Custom Dispute Reason Modal */}
      {showDisputeModal && disputeBookingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fade-in text-slate-850">
          <div className="w-full max-w-md rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden relative flex flex-col">
            {/* Modal Header */}
            <div className="bg-slate-50 p-4 border-b border-slate-200 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="text-xl">⚠️</span>
                <div className="text-left">
                  <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Raise a Dispute / विवाद दर्ज करें</h2>
                  <p className="text-[10px] text-slate-500">Order #{disputeBookingItem.order_number || disputeBookingItem.id}</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setShowDisputeModal(false);
                  setDisputeBookingItem(null);
                }}
                className="text-slate-400 hover:text-slate-600 text-sm cursor-pointer p-1.5"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 text-left">
              <div className="space-y-1.5">
                <span className="block text-[10px] text-slate-550 uppercase font-semibold">Service Details</span>
                <p className="text-sm font-bold text-blue-600">{disputeBookingItem.service_title || disputeBookingItem.service_name}</p>
                <p className="text-xs text-slate-500">Provider: {disputeBookingItem.business_name || disputeBookingItem.seller_name}</p>
              </div>

              <div className="space-y-2">
                <label htmlFor="dispute-reason-input" className="block text-[10px] text-slate-500 uppercase font-semibold">
                  Reason for Dispute / विवाद का कारण:
                </label>
                <textarea
                  id="dispute-reason-input"
                  rows={4}
                  placeholder="e.g. The service provider did not show up at the scheduled time. / उदा. सेवा प्रदाता निर्धारित समय पर नहीं आया।"
                  value={disputeReasonText}
                  onChange={(e) => setDisputeReasonText(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 hover:border-blue-500 focus:border-blue-500 rounded-xl p-3 text-slate-800 outline-none resize-none transition duration-200"
                />
                <p className="text-[10px] text-slate-400 font-semibold leading-normal">
                  Note: Stating the reason accurately helps support administrators resolve the dispute faster. The reason is stored in the database.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowDisputeModal(false);
                    setDisputeBookingItem(null);
                  }}
                  className="flex-1 py-3 text-xs font-bold bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl active:scale-95 transition cursor-pointer text-center"
                >
                  Cancel / रद्द
                </button>
                <button
                  type="button"
                  onClick={submitDispute}
                  className="flex-1 py-3 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-xl active:scale-95 transition cursor-pointer text-center shadow-sm"
                >
                  Submit Dispute / विवाद सबमिट करें
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
