import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { buyerOrdersApi } from "../api/orderApi";
import apiClient from "../api/axiosConfig";
import { useAuth } from "../context/AuthContext";

const getImageUrl = (url) => {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  const base = apiClient.defaults.baseURL ? apiClient.defaults.baseURL.replace("/api", "") : "http://localhost:5000";
  return `${base}${url}`;
};

const statusClasses = {
  pending: "border-amber-500/30 bg-amber-500/10 text-amber-300",
  accepted: "border-sky-500/30 bg-sky-500/10 text-sky-300",
  quoted: "border-teal-500/30 bg-teal-500/10 text-teal-300",
  in_progress: "border-indigo-500/30 bg-indigo-500/10 text-indigo-300",
  completed: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  cancelled: "border-red-500/30 bg-red-500/10 text-red-300",
  disputed: "border-orange-500/30 bg-orange-500/10 text-orange-300",
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

  // Simulated payment gateway states
  const [showPaymentGateway, setShowPaymentGateway] = useState(false);
  const [paymentGatewayStatus, setPaymentGatewayStatus] = useState("idle"); // "idle", "processing", "success", "failed"
  const [gatewayError, setGatewayError] = useState("");
  const [gatewaySubView, setGatewaySubView] = useState("select");
  const [activeBookingForPayment, setActiveBookingForPayment] = useState(null);

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
    let confirmMsg = "Are you sure you want to cancel this booking?";

    if (typeof bookingOrId === "object" && bookingOrId.scheduled_at && ["pending", "accepted"].includes(bookingOrId.status)) {
      const scheduledTime = new Date(bookingOrId.scheduled_at).getTime();
      const currentTime = Date.now();
      const isWithin2Hours = (scheduledTime - currentTime) < 2 * 60 * 60 * 1000;
      if (isWithin2Hours) {
        confirmMsg = `Warning: This booking is scheduled to start in less than 2 hours. If you cancel now, your visiting charge of ₹${parseFloat(bookingOrId.visiting_charge_amount || 0)} will NOT be refunded. Are you sure you want to cancel?`;
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

  const triggerApproveQuotation = (booking) => {
    if (booking.payment_method === "cash") {
      if (!window.confirm("Are you sure you want to approve this quotation? / क्या आप कोटेशन मंजूर करना चाहते हैं?")) return;
      executeApproveQuotation(booking.id);
    } else {
      setActiveBookingForPayment(booking);
      setGatewaySubView("select");
      setPaymentGatewayStatus("idle");
      setGatewayError("");
      setShowPaymentGateway(true);
    }
  };

  const executeApproveQuotation = async (id) => {
    setBusyId(id);
    setPaymentGatewayStatus("processing");
    try {
      // Simulate gateway payment processing latency
      await new Promise((r) => setTimeout(r, 1500));
      await buyerOrdersApi.approveQuotation(id);
      await refresh();
      setShowPaymentGateway(false);
    } catch (e) {
      setGatewayError(e?.response?.data?.message || "Failed to approve quotation");
      setPaymentGatewayStatus("failed");
      if (activeBookingForPayment?.payment_method === "cash") {
        alert(e?.response?.data?.message || "Failed to approve quotation");
      }
    } finally {
      setBusyId(null);
    }
  };

  return (
    <main className="min-h-screen bg-[#0b0a17] text-white px-4 py-12 relative overflow-hidden">
      {/* Glow Blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 h-[600px] w-[600px] rounded-full bg-indigo-600/10 blur-[150px]" />
        <div className="absolute -bottom-40 -right-40 h-[600px] w-[600px] rounded-full bg-fuchsia-600/10 blur-[150px]" />
      </div>

      <div className="mx-auto max-w-4xl relative z-10">
        <div className="mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-6 border-b border-indigo-500/10 pb-6">
          <div>
            <p className="text-xs font-black tracking-widest text-indigo-400 uppercase">QuickSeva</p>
            <h1 className="text-4xl font-black text-white mt-1">My Bookings</h1>
          </div>

          {/* Stats Bar */}
          {!loading && bookings.length > 0 && (
            <div className="flex gap-3 flex-wrap">
              <div className="qs-glass-panel py-2.5 px-4 flex items-center gap-3">
                <span className="h-2 w-2 rounded-full bg-indigo-400 animate-pulse" />
                <div className="text-xs">
                  <span className="block font-medium text-indigo-300/70">Total</span>
                  <span className="font-bold text-white text-sm">{bookings.length}</span>
                </div>
              </div>
              <div className="qs-glass-panel py-2.5 px-4 flex items-center gap-3">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                <div className="text-xs">
                  <span className="block font-medium text-indigo-300/70">Completed</span>
                  <span className="font-bold text-white text-sm">
                    {bookings.filter((b) => b.status === "completed").length}
                  </span>
                </div>
              </div>
              <div className="qs-glass-panel py-2.5 px-4 flex items-center gap-3">
                <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                <div className="text-xs">
                  <span className="block font-medium text-indigo-300/70">Active</span>
                  <span className="font-bold text-white text-sm">
                    {bookings.filter((b) => ["pending", "accepted", "in_progress"].includes(b.status)).length}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm font-semibold text-red-300 shadow-lg">
            <span className="mr-1.5 font-black">⚠️ Error:</span> {error}
          </div>
        )}

        {loading ? (
          <div className="qs-glass-panel p-16 text-center shadow-2xl flex flex-col items-center justify-center">
            <span className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-indigo-500/30 border-t-indigo-400 mr-3 align-middle" />
            <h2 className="text-xl font-bold text-indigo-200 mt-4">Loading your bookings…</h2>
          </div>
        ) : sortedBookings.length === 0 ? (
          <div className="qs-glass-panel p-16 text-center shadow-2xl flex flex-col items-center justify-center">
            <div className="text-5xl mb-4">📭</div>
            <h2 className="text-2xl font-black text-white">No bookings yet</h2>
            <p className="mt-2 text-indigo-200/60 text-sm max-w-sm">
              You haven't placed any service requests yet. Find our top-rated partners and book now!
            </p>
            <Link
              to="/services"
              className="mt-6 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-500/25 hover:scale-[1.01] transition duration-300"
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
                  className="qs-glass-panel p-6 shadow-2xl transition-all duration-300 hover:border-indigo-400/30 hover:scale-[1.005] group"
                >
                  <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
                    <div className="flex flex-col sm:flex-row items-start gap-4 flex-1">
                      {/* Avatar Ring */}
                      <div className="qs-avatar-ring flex-shrink-0 mt-1">
                        {booking.seller_pic ? (
                          <img
                            src={getImageUrl(booking.seller_pic)}
                            alt={booking.business_name || booking.seller_name}
                            className="qs-avatar object-cover rounded-full"
                          />
                        ) : (
                          <div className="qs-avatar bg-gradient-to-br from-indigo-600 to-indigo-900 font-extrabold text-white">
                            {avatarLetter}
                          </div>
                        )}
                      </div>

                      {/* Info block */}
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="flex items-center text-xs font-mono text-indigo-300 bg-indigo-950/60 px-2.5 py-1 rounded-md border border-indigo-500/20">
                            <svg className="h-3.5 w-3.5 mr-1 text-indigo-400/80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            {booking.order_number || `#${booking.id}`}
                          </span>
                          <span
                            className={`rounded-full border px-3 py-0.5 text-[11px] font-black uppercase tracking-wider ${
                              statusClasses[booking.status] ||
                              "border-slate-500/30 bg-slate-500/10 text-slate-300"
                            }`}
                          >
                            {(booking.status || "pending").replace("_", " ")}
                          </span>
                        </div>

                        <h2 className="mt-3.5 text-xl font-extrabold text-white leading-tight">
                          {booking.service_title || booking.service_name || "Service"}
                        </h2>

                        <p className="mt-1 text-sm font-semibold text-indigo-200">
                          {booking.business_name ||
                            booking.seller_business_name ||
                            booking.seller_name ||
                            "Provider"}
                        </p>

                        <div className="mt-4 space-y-2 border-t border-indigo-500/5 pt-4">
                          <p className="flex items-center text-sm text-indigo-200/70">
                            <svg className="h-4 w-4 text-indigo-400/80 mr-2.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span className="font-medium">Date &amp; Time:</span>
                            <span className="ml-1.5 text-white">
                              {formatDate(booking.scheduled_at || booking.created_at)}
                            </span>
                          </p>

                          <p className="flex items-start text-sm text-indigo-200/70">
                            <svg className="h-4 w-4 text-indigo-400/80 mr-2.5 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span className="font-medium flex-shrink-0">Address:</span>
                            <span className="ml-1.5 text-white break-all">
                              {booking.address || "—"}
                            </span>
                          </p>

                          {booking.seller_phone && (
                            <p className="flex items-center text-sm text-indigo-200/70">
                              <svg className="h-4 w-4 text-indigo-400/80 mr-2.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                              </svg>
                              <span className="font-medium flex-shrink-0">Seller Contact:</span>
                              <a href={`tel:${booking.seller_phone}`} className="ml-1.5 text-indigo-300 font-bold hover:underline">
                                {booking.seller_phone}
                              </a>
                            </p>
                          )}

                          <div className="mt-4 pt-3 border-t border-indigo-500/10 space-y-2">
                            <div className="flex flex-col gap-2 rounded-xl bg-indigo-950/40 border border-indigo-500/10 p-3.5">
                              {/* Stage 1 details */}
                              <div className="flex items-center justify-between text-xs text-indigo-300">
                                <span>Stage 1: Visiting Charge / विजिटिंग चार्ज:</span>
                                <span className="font-extrabold text-emerald-400">
                                  ₹{Number(booking.visiting_charge_amount || booking.total_amount || 0).toLocaleString("en-IN")} (✓ Paid / भुगतान हुआ)
                                </span>
                              </div>
                              
                              {/* Stage 2 details */}
                              {booking.service_charge_amount > 0 && (
                                <div className="border-t border-indigo-500/5 pt-2 mt-2 space-y-1 text-xs">
                                  <span className="block font-bold text-indigo-400 mb-1">Stage 2: Quotation / काम का पक्का बिल:</span>
                                  <div className="flex justify-between text-indigo-200">
                                    <span>Service Fee / काम का दाम:</span>
                                    <span>₹{Number(booking.service_charge_amount || 0).toLocaleString("en-IN")}</span>
                                  </div>
                                  {booking.parts_cost_amount > 0 && (
                                    <div className="flex justify-between text-indigo-200">
                                      <span>Parts/Materials / सामान का चार्ज:</span>
                                      <span>₹{Number(booking.parts_cost_amount || 0).toLocaleString("en-IN")}</span>
                                    </div>
                                  )}
                                  {booking.discount_amount > 0 && (
                                    <div className="flex justify-between text-red-400 font-semibold">
                                      <span>Discount / छूट:</span>
                                      <span>-₹{Number(booking.discount_amount || 0).toLocaleString("en-IN")}</span>
                                    </div>
                                  )}
                                  {booking.final_platform_fee > 0 && (
                                    <div className="flex justify-between text-indigo-300/80">
                                      <span>Platform Fee / सुरक्षा शुल्क:</span>
                                      <span>+₹{Number(booking.final_platform_fee || 0).toLocaleString("en-IN")}</span>
                                    </div>
                                  )}
                                  <div className="flex justify-between text-sm font-extrabold text-white border-t border-indigo-500/10 pt-1.5 mt-1">
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

                            <p className="flex items-center text-xs text-indigo-200/50">
                              <span>Payment Mode / भुगतान का माध्यम:</span>
                              <span className="ml-1.5 px-1.5 py-0.5 rounded bg-indigo-950/60 border border-indigo-500/20 text-[10px] uppercase font-bold tracking-wider text-indigo-300">
                                {booking.payment_method}
                              </span>
                            </p>
                            
                            {/* OTP Start Code display */}
                            {booking.status === "quoted" && booking.final_payment_status === "paid" && booking.start_otp_code && (
                              <div className="mt-3.5 p-3.5 rounded-2xl border border-indigo-400/30 bg-indigo-950/60 text-center shadow-lg">
                                <span className="block text-[10px] font-black text-indigo-400 uppercase tracking-widest">Share this Start Code with Technician / काम शुरू करने का कोड</span>
                                <span className="block text-2xl font-black text-white mt-1.5 tracking-widest">{booking.start_otp_code}</span>
                                <span className="block text-[10px] text-indigo-200/50 mt-1">Technician will enter this code in their app to verify and start service.</span>
                              </div>
                            )}

                            {/* Secure Cash Handshake Completion Code */}
                            {booking.status === "in_progress" && booking.payment_method === "cash" && booking.completion_otp_code && (
                              <div className="mt-3.5 p-3.5 rounded-2xl border border-amber-500/20 bg-amber-955/20 text-center shadow-md">
                                <span className="block text-[10px] font-black text-amber-400 uppercase tracking-widest">Secure Cash Completion PIN / भुगतान सत्यापन पिन</span>
                                <span className="block text-3xl font-black text-white mt-1.5 tracking-wider">{booking.completion_otp_code}</span>
                                <span className="block text-[10px] text-amber-200/60 mt-1.5 leading-normal">
                                  🔴 Share this PIN with the technician ONLY after they complete the work and you hand over the cash.
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex md:flex-col shrink-0 flex-wrap gap-2.5 items-stretch justify-end md:justify-start w-full md:w-auto md:min-w-[140px] border-t border-indigo-500/5 pt-4 md:pt-0 md:border-t-0">
                      {booking.seller_id && (
                        <Link
                          to={`/seller/${booking.seller_id}`}
                          className="flex items-center justify-center gap-1.5 rounded-xl border border-indigo-500/30 bg-indigo-600/10 hover:bg-indigo-600/35 px-4 py-2.5 text-xs font-bold text-indigo-200 hover:text-white transition duration-300 w-full text-center shadow-lg shadow-indigo-950/40"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          View Provider
                        </Link>
                      )}
                      {booking.status === "quoted" && booking.final_payment_status !== "paid" && (
                        <>
                          <button
                            type="button"
                            disabled={busyId === booking.id}
                            onClick={() => triggerApproveQuotation(booking)}
                            className="flex items-center justify-center gap-1.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 hover:bg-emerald-500/25 px-4 py-2.5 text-xs font-bold text-emerald-400 hover:text-emerald-300 transition duration-300 w-full text-center disabled:opacity-50 shadow-md"
                          >
                            {busyId === booking.id ? (
                              <>
                                <span className="h-3 w-3 animate-spin rounded-full border-2 border-emerald-400 border-t-white" />
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
                                                    <button
                             type="button"
                             disabled={busyId === booking.id}
                             onClick={() => cancelBooking(booking)}
                            className="flex items-center justify-center gap-1.5 rounded-xl border border-red-500/20 bg-red-500/10 hover:bg-red-500/25 px-4 py-2.5 text-xs font-bold text-red-400 hover:text-red-300 transition duration-300 w-full text-center disabled:opacity-50"
                          >
                            Reject Quotation
                          </button>
                        </>
                      )}
                      {["pending", "accepted"].includes(booking.status) && (
                        <button
                          type="button"
                          disabled={busyId === booking.id}
                          onClick={() => cancelBooking(booking)}
                          className="flex items-center justify-center gap-1.5 rounded-xl border border-red-500/20 bg-red-500/10 hover:bg-red-500/25 px-4 py-2.5 text-xs font-bold text-red-400 hover:text-red-300 transition duration-300 w-full text-center disabled:opacity-50"
                        >
                          {busyId === booking.id ? (
                            <>
                              <span className="h-3 w-3 animate-spin rounded-full border-2 border-red-400 border-t-white" />
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
                      {booking.status === "completed" && (
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
                          className="flex items-center justify-center gap-1.5 rounded-xl border border-purple-500/20 bg-purple-500/10 hover:bg-purple-500/25 px-4 py-2.5 text-xs font-bold text-purple-200 hover:text-purple-100 transition duration-300 w-full text-center shadow-lg shadow-purple-950/40"
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

      {/* Fake Razorpay/PhonePe Payment Gateway Modal */}
      {showPaymentGateway && activeBookingForPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-fade-in text-white">
          <div className="w-full max-w-sm rounded-2xl bg-[#0f111a] border border-slate-800 shadow-2xl overflow-hidden relative flex flex-col force-text-white">
            {/* Gateway Header */}
            <div className="bg-[#0b0c13] p-4 border-b border-slate-800 flex justify-between items-center">
              <div className="flex items-center gap-2 text-left">
                <span className="text-xl">💳</span>
                <div>
                  <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">QuickSeva Secure Pay</h2>
                  <p className="text-[10px] text-slate-500">Stage 2 Quotation Payment Emulator</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setShowPaymentGateway(false);
                  setGatewaySubView("select");
                }}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            {paymentGatewayStatus === "idle" && (
              <div className="p-6 space-y-5 flex-1 text-left">
                {/* Total box */}
                <div className="bg-[#0b0c13] p-4 rounded-xl border border-slate-800/80 text-center">
                  <span className="block text-[10px] text-slate-500 uppercase font-semibold">Payable Quote Amount / भुगतान राशि</span>
                  <span className="text-3xl font-black text-emerald-400 mt-1 block" style={{ color: '#34d399' }}>
                    ₹{Number(
                      parseFloat(activeBookingForPayment.service_charge_amount || 0) + 
                      parseFloat(activeBookingForPayment.parts_cost_amount || 0) - 
                      parseFloat(activeBookingForPayment.discount_amount || 0) +
                      parseFloat(activeBookingForPayment.final_platform_fee || 0)
                    ).toLocaleString("en-IN")}
                  </span>
                </div>

                {gatewaySubView === "select" && (
                  <>
                    <div className="space-y-2.5">
                      <span className="block text-[10px] text-slate-500 uppercase font-bold tracking-wider">Select Payment Mode</span>
                      {[
                        { id: "upi_qr", icon: "📱", name: "UPI QR (GPay / PhonePe / Paytm)" },
                        { id: "card_info", icon: "💳", name: "Debit / Credit Card" },
                        { id: "wallet_pay", icon: "💼", name: "Wallet Balance (Auto-Debit)" }
                      ].map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setGatewaySubView(opt.id)}
                          className="w-full text-left p-3.5 rounded-xl border border-slate-800 bg-[#08090e] hover:bg-slate-900 hover:border-slate-750 transition flex items-center gap-3 cursor-pointer group active:scale-[0.99]"
                        >
                          <span className="text-lg bg-slate-850 p-1.5 rounded-lg group-hover:bg-slate-700">{opt.icon}</span>
                          <span className="text-xs font-bold text-slate-200 group-hover:text-slate-100 flex-1">{opt.name}</span>
                          <span className="text-slate-500 text-xs">➔</span>
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-2.5 pt-1">
                      <button
                        type="button"
                        onClick={() => executeApproveQuotation(activeBookingForPayment.id)}
                        className="w-full py-2.5 text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white rounded-xl active:scale-95 transition cursor-pointer text-center"
                      >
                        Bypass Directly ✓ (Simulate Success)
                      </button>
                    </div>
                  </>
                )}

                {gatewaySubView === "upi_qr" && (
                  <div className="space-y-4 text-center">
                    <span className="block text-[10px] text-slate-500 uppercase font-bold tracking-wider text-left">Scan UPI QR Code</span>
                    <div className="flex flex-col items-center justify-center p-4 bg-white rounded-xl border border-slate-200 shadow-inner">
                      <svg className="h-32 w-32 text-slate-800 animate-pulse" viewBox="0 0 100 100" fill="currentColor">
                        <path d="M0 0h30v30H0V0zm10 10v10h10V10H10zm60-10h30v30H70V0zm10 10v10h10V10H10zM0 70h30v30H0V70zm10 10v10h10V10H10zm45-45h10v10H55zm10 10h10v10H65zm-20 20h10v10H45zm25 0h10v10H70zm-15 15h10v10H55zm15 0h10v10H70zm-35-15h10v10H35zm0-20h10v10H35zm30-25h5v5h-5z" />
                      </svg>
                      <span className="text-[10px] text-slate-400 font-medium mt-2">Scan with GPay, PhonePe, or Paytm</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setGatewaySubView("select")}
                        className="flex-1 py-2.5 text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white rounded-xl active:scale-95 transition cursor-pointer"
                      >
                        Back / पीछे
                      </button>
                      <button
                        type="button"
                        onClick={() => executeApproveQuotation(activeBookingForPayment.id)}
                        className="flex-1 py-2.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl active:scale-95 transition cursor-pointer"
                      >
                        I have Scanned &amp; Paid
                      </button>
                    </div>
                  </div>
                )}

                {gatewaySubView === "card_info" && (
                  <div className="space-y-4">
                    <span className="block text-[10px] text-slate-500 uppercase font-bold tracking-wider">Card Details</span>
                    <div className="space-y-3">
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-1">Card Number</label>
                        <input
                          type="text"
                          placeholder="4111 2222 3333 4444"
                          maxLength="19"
                          className="w-full text-xs bg-[#0b0c13] border border-slate-850 rounded-lg p-2.5 text-white outline-none"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] text-slate-400 block mb-1">Expiry Date</label>
                          <input
                            type="text"
                            placeholder="MM/YY"
                            maxLength="5"
                            className="w-full text-xs bg-[#0b0c13] border border-slate-850 rounded-lg p-2.5 text-white outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-400 block mb-1">CVV</label>
                          <input
                            type="password"
                            placeholder="•••"
                            maxLength="3"
                            className="w-full text-xs bg-[#0b0c13] border border-slate-850 rounded-lg p-2.5 text-white outline-none"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setGatewaySubView("select")}
                        className="flex-1 py-2.5 text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white rounded-xl active:scale-95 transition cursor-pointer"
                      >
                        Back / पीछे
                      </button>
                      <button
                        type="button"
                        onClick={() => executeApproveQuotation(activeBookingForPayment.id)}
                        className="flex-1 py-2.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl active:scale-95 transition cursor-pointer"
                      >
                        Pay &amp; Confirm
                      </button>
                    </div>
                  </div>
                )}

                {gatewaySubView === "wallet_pay" && (
                  <div className="space-y-4">
                    <span className="block text-[10px] text-slate-500 uppercase font-bold tracking-wider">Wallet Balance Payment</span>
                    <div className="bg-[#0b0c13] p-4 rounded-xl border border-slate-855 flex justify-between items-center">
                      <div>
                        <span className="block text-[10px] text-slate-500">Your Current Balance</span>
                        <span className="text-sm font-bold text-white">₹{Number(user?.wallet_balance || 0).toLocaleString("en-IN")}</span>
                      </div>
                      <span className="text-lg">💼</span>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setGatewaySubView("select")}
                        className="flex-1 py-2.5 text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white rounded-xl active:scale-95 transition cursor-pointer"
                      >
                        Back / पीछे
                      </button>
                      <button
                        type="button"
                        onClick={() => executeApproveQuotation(activeBookingForPayment.id)}
                        className="flex-1 py-2.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl active:scale-95 transition cursor-pointer"
                      >
                        Pay via Wallet
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {paymentGatewayStatus === "failed" && (
              <div className="p-6 text-center space-y-5 flex flex-col items-center justify-center flex-1">
                <span className="text-5xl text-red-500">❌</span>
                <h3 className="text-base font-extrabold text-red-400">Payment Failed</h3>
                <p className="text-xs text-slate-400">{gatewayError || "Transaction rejected."}</p>
                <button
                  type="button"
                  onClick={() => setPaymentGatewayStatus("idle")}
                  className="w-full py-2.5 text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white rounded-lg active:scale-95 transition"
                >
                  Try Again
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
