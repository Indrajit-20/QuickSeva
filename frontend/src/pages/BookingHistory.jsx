import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { buyerOrdersApi } from "../api/orderApi";

const formatDate = (value) => {
  if (!value) return "";
  const normalized = typeof value === "string" ? value.replace(" ", "T") : value;
  const dateObj = new Date(normalized);
  if (isNaN(dateObj.getTime())) return String(value);

  const formattedDate = new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(dateObj);

  const formattedTime = dateObj.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  return `${formattedDate} at ${formattedTime}`;
};

export default function BookingHistory() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await buyerOrdersApi.list({ status: "completed" });
        const list = res?.data?.orders || res?.orders || [];
        setBookings(Array.isArray(list) ? list : []);
      } catch {
        setBookings([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const historyBookings = useMemo(
    () =>
      [...bookings].sort(
        (a, b) =>
          new Date(b.completed_at || b.created_at || 0) -
          new Date(a.completed_at || a.created_at || 0),
      ),
    [bookings],
  );

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6">
          <p className="text-sm font-bold text-indigo-600">QuickSeva</p>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900">
            Booking History
          </h1>
        </div>

        {loading ? (
          <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900">Loading…</h2>
          </div>
        ) : historyBookings.length === 0 ? (
          <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900">
              No completed bookings
            </h2>
            <p className="mt-2 text-slate-600">
              When you complete a booking, it will show up here.
            </p>
            <Link
              to="/services"
              className="mt-5 inline-block rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-indigo-700"
            >
              Explore Services
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {historyBookings.map((b) => (
              <article
                key={b.id}
                className="rounded-2xl border border-indigo-100 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="text-lg font-black text-slate-900">
                      {b.service_title || b.service_name || "Service"}
                    </h2>
                    <p className="mt-1 text-sm font-semibold text-slate-800">
                      {b.seller_business_name ||
                        b.seller_name ||
                        "Provider"}
                    </p>
                    <p className="mt-2 text-sm text-slate-600">
                      📅 {formatDate(b.scheduled_at || b.created_at)}
                    </p>
                    <p className="mt-2 text-sm font-semibold text-slate-800">
                      ₹{Number(b.total_amount || 0).toLocaleString("en-IN")}
                    </p>
                  </div>
                  {b.seller_id && (
                    <Link
                      to={`/seller/${b.seller_id}`}
                      className="self-start rounded-lg border border-indigo-300 bg-white px-4 py-2 text-sm font-bold text-indigo-700 hover:bg-indigo-50"
                    >
                      Book Again
                    </Link>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
