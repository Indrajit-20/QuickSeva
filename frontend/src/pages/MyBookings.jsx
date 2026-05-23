import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";

const statusClasses = {
  pending: "border-amber-300 bg-amber-50 text-amber-700",
  confirmed: "border-emerald-300 bg-emerald-50 text-emerald-700",
  completed: "border-emerald-300 bg-emerald-50 text-emerald-700",
  cancelled: "border-red-300 bg-red-50 text-red-700",
};

const readArray = (key) => {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const formatDate = (value) => {
  if (!value) return "";
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
};

const loadBookings = () => {
  const buyerBookings = readArray("buyerBookings");
  const sellerOrders = readArray("sellerOrders");

  return buyerBookings.map((booking) => {
    const sellerOrder = sellerOrders.find((order) => order.id === booking.id);
    return sellerOrder?.status
      ? { ...booking, status: sellerOrder.status }
      : booking;
  });
};

export default function MyBookings() {
  const [bookings, setBookings] = useState(() => loadBookings());

  const sortedBookings = useMemo(
    () =>
      [...bookings].sort(
        (a, b) => new Date(b.bookedAt || 0) - new Date(a.bookedAt || 0),
      ),
    [bookings],
  );

  const cancelBooking = (id) => {
    const nextBookings = bookings.map((booking) =>
      booking.id === id ? { ...booking, status: "cancelled" } : booking,
    );
    const sellerOrders = readArray("sellerOrders").map((order) =>
      order.id === id ? { ...order, status: "cancelled" } : order,
    );

    setBookings(nextBookings);
    localStorage.setItem("buyerBookings", JSON.stringify(nextBookings));
    localStorage.setItem("sellerOrders", JSON.stringify(sellerOrders));
  };

  return (
    <main className="min-h-screen bg-brand-bg px-4 py-10">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6">
          <p className="text-sm font-bold text-indigo-600">QuickSeva</p>
          <h1 className="text-4xl font-black text-slate-900">My Bookings</h1>
        </div>

        {sortedBookings.length === 0 ? (
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
                        {booking.id}
                      </h2>
                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-black capitalize ${
                          statusClasses[booking.status] ||
                          "border-slate-300 bg-slate-50 text-slate-700"
                        }`}
                      >
                        {(booking.status || "pending").toLowerCase() ===
                        "pending"
                          ? "Pending"
                          : (booking.status || "").toLowerCase() === "confirmed"
                            ? "Confirmed"
                            : (booking.status || "").toLowerCase() ===
                                "completed"
                              ? "Completed"
                              : (booking.status || "").toLowerCase() ===
                                  "cancelled"
                                ? "Cancelled"
                                : booking.status}
                      </span>
                    </div>
                    <p className="mt-3 text-base font-black text-indigo-700">
                      {booking.service}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-800">
                      {booking.sellerName}
                    </p>
                    <p className="mt-3 text-sm text-slate-600">
                      📅 {formatDate(booking.date)}{" "}
                      <span className="mx-2">🕐</span>
                      {booking.timeSlot}
                    </p>
                    <p className="mt-2 text-sm text-slate-600">
                      📍 {booking.address}
                    </p>
                  </div>

                  <div className="flex shrink-0 flex-wrap gap-2">
                    <Link
                      to={`/seller/${booking.sellerId}`}
                      className="rounded-lg border border-indigo-300 bg-white px-4 py-2 text-sm font-bold text-indigo-700 hover:bg-indigo-50"
                    >
                      View Provider
                    </Link>
                    {booking.status === "pending" && (
                      <button
                        type="button"
                        onClick={() => cancelBooking(booking.id)}
                        className="rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-sm font-bold text-red-700 hover:bg-red-100"
                      >
                        Cancel
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
