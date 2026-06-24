import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { buyerOrdersApi } from "../api/orderApi";

const statusClasses = {
  pending: "border-amber-500/30 bg-amber-500/10 text-amber-300",
  accepted: "border-sky-500/30 bg-sky-500/10 text-sky-300",
  in_progress: "border-indigo-500/30 bg-indigo-500/10 text-indigo-300",
  completed: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  cancelled: "border-red-500/30 bg-red-500/10 text-red-300",
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

  const cancelBooking = async (id) => {
    if (!window.confirm("Are you sure you want to cancel this booking?")) return;
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
                        <div className="qs-avatar bg-gradient-to-br from-indigo-600 to-indigo-900 font-extrabold text-white">
                          {avatarLetter}
                        </div>
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

                          <p className="flex items-center text-sm text-indigo-200/70">
                            <svg className="h-4 w-4 text-indigo-400/80 mr-2.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 8h6m-5 0a3 3 0 110 6H9l3 3m-3-6h6m6 1a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="font-medium">Total Amount:</span>
                            <span className="ml-1.5 text-white font-extrabold">
                              ₹{Number(booking.total_amount || 0).toLocaleString("en-IN")}
                            </span>
                            {booking.payment_method && (
                              <span className="ml-2 px-1.5 py-0.5 rounded bg-indigo-950/60 border border-indigo-500/20 text-[10px] uppercase font-bold tracking-wider text-indigo-300">
                                {booking.payment_method}
                              </span>
                            )}
                          </p>
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
                      {booking.status === "pending" && (
                        <button
                          type="button"
                          disabled={busyId === booking.id}
                          onClick={() => cancelBooking(booking.id)}
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
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
