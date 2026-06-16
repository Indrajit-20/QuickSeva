import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { buyerOrdersApi } from "../api/orderApi";

const statusClasses = {
  pending: "border-amber-300 bg-amber-50 text-amber-700",
  accepted: "border-sky-300 bg-sky-50 text-sky-700",
  in_progress: "border-indigo-300 bg-indigo-50 text-indigo-700",
  completed: "border-emerald-300 bg-emerald-50 text-emerald-700",
  cancelled: "border-red-300 bg-red-50 text-red-700",
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
    <main className="min-h-screen bg-brand-bg px-4 py-10">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6">
          <p className="text-sm font-bold text-indigo-600">QuickSeva</p>
          <h1 className="text-4xl font-black text-slate-900">My Bookings</h1>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-300 bg-red-50 p-3 text-sm font-bold text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
            <h2 className="text-2xl font-black text-slate-900">Loading…</h2>
          </div>
        ) : sortedBookings.length === 0 ? (
          <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
            <h2 className="text-2xl font-black text-slate-900">
              No bookings yet
            </h2>
            <p className="mt-2 text-slate-600">
              Find a service provider and book now!
            </p>
            <Link
              to="/services"
              className="mt-5 inline-block rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-indigo-700"
            >
              Find Services
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedBookings.map((booking) => (
              <article
                key={booking.id}
                className="rounded-2xl border border-indigo-100 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-lg font-black text-slate-900">
                        {booking.order_number || `#${booking.id}`}
                      </h2>
                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-black capitalize ${
                          statusClasses[booking.status] ||
                          "border-slate-300 bg-slate-50 text-slate-700"
                        }`}
                      >
                        {(booking.status || "pending").replace("_", " ")}
                      </span>
                    </div>
                    <p className="mt-3 text-base font-black text-indigo-700">
                      {booking.service_title || booking.service_name || "Service"}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-800">
                      {booking.seller_business_name ||
                        booking.seller_name ||
                        "Provider"}
                    </p>
                    <p className="mt-3 text-sm text-slate-600">
                      📅{" "}
                      {formatDate(booking.scheduled_at || booking.created_at)}
                    </p>
                    <p className="mt-2 text-sm text-slate-600">
                      📍 {booking.address || "—"}
                    </p>
                    <p className="mt-2 text-sm font-semibold text-slate-800">
                      ₹
                      {Number(booking.total_amount || 0).toLocaleString(
                        "en-IN",
                      )}
                    </p>
                  </div>

                  <div className="flex shrink-0 flex-wrap gap-2">
                    {booking.seller_id && (
                      <Link
                        to={`/seller/${booking.seller_id}`}
                        className="rounded-lg border border-indigo-300 bg-white px-4 py-2 text-sm font-bold text-indigo-700 hover:bg-indigo-50"
                      >
                        View Provider
                      </Link>
                    )}
                    {booking.status === "pending" && (
                      <button
                        type="button"
                        disabled={busyId === booking.id}
                        onClick={() => cancelBooking(booking.id)}
                        className="rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-sm font-bold text-red-700 hover:bg-red-100 disabled:opacity-60"
                      >
                        {busyId === booking.id ? "Cancelling…" : "Cancel"}
                      </button>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
