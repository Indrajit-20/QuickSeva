import React, { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

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

const statusBadgeClasses = {
  pending: "border-amber-300 bg-amber-50 text-amber-700",
  confirmed: "border-emerald-300 bg-emerald-50 text-emerald-700",
  completed: "border-emerald-300 bg-emerald-50 text-emerald-700",
  cancelled: "border-red-300 bg-red-50 text-red-700",
};

export default function BookingHistory() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const historyBookings = useMemo(() => {
    const buyerBookings = readArray("buyerBookings");
    // Treat completed bookings as history (plus optionally cancelled if you want)
    return (buyerBookings || [])
      .filter((b) => (b.status || "").toLowerCase() === "completed")
      .map((b) => ({
        ...b,
        provider: b.sellerName,
        price: b.price ?? b.totalPrice ?? 499, // mock price
      }))
      .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
  }, []);

  const rebook = (booking) => {
    const buyerBookings = readArray("buyerBookings");
    const sellerOrders = readArray("sellerOrders");

    const next = {
      id: `BK${Date.now()}`,
      sellerId: booking.sellerId,
      sellerName: booking.sellerName,
      sellerService: booking.sellerService,
      service: booking.service,
      date: new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0],
      timeSlot: booking.timeSlot || "10:00 AM",
      address: booking.address,
      mobile: user?.phone || booking.mobile || "",
      instructions: booking.instructions || "",
      status: "pending",
      bookedAt: new Date().toISOString(),
      price: booking.price,
    };

    buyerBookings.push(next);
    sellerOrders.push(next);

    localStorage.setItem("buyerBookings", JSON.stringify(buyerBookings));
    localStorage.setItem("sellerOrders", JSON.stringify(sellerOrders));

    navigate("/my-bookings");
  };

  return (
    <main className="min-h-screen bg-brand-bg px-4 py-10">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6">
          <p className="text-sm font-bold text-indigo-600">QuickSeva</p>
          <h1 className="text-4xl font-black text-slate-900">
            Booking History
          </h1>
        </div>

        {historyBookings.length === 0 ? (
          <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
            <h2 className="text-2xl font-black text-slate-900">
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
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-lg font-black text-slate-900">
                        {b.service}
                      </h2>
                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-black capitalize ${
                          statusBadgeClasses[b.status] ||
                          "border-slate-300 bg-slate-50 text-slate-700"
                        }`}
                      >
                        {b.status}
                      </span>
                    </div>

                    <p className="mt-2 text-sm font-semibold text-slate-800">
                      Provider: {b.provider}
                    </p>

                    <p className="mt-2 text-sm text-slate-600">
                      🗓️ {formatDate(b.date)} <span className="mx-2">🕒</span>
                      {b.timeSlot}
                    </p>

                    <p className="mt-3 text-sm font-black text-indigo-700">
                      💰 ₹{b.price}
                    </p>

                    <p className="mt-2 text-sm text-slate-600">
                      📍 {b.address}
                    </p>
                  </div>

                  <div className="flex shrink-0 flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => rebook(b)}
                      className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-600"
                    >
                      Re-book
                    </button>
                    <Link
                      to="/services"
                      className="rounded-lg border border-indigo-300 bg-white px-4 py-2 text-sm font-bold text-indigo-700 hover:bg-indigo-50"
                    >
                      Browse
                    </Link>
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
