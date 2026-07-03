import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import WorkspaceSwitcher from "./WorkspaceSwitcher";
import apiClient from "../api/axiosConfig";

const getImageUrl = (url) => {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  const base = apiClient.defaults.baseURL ? apiClient.defaults.baseURL.replace("/api", "") : "http://localhost:5000";
  return `${base}${url}`;
};

const getInitials = (name) => {
  if (!name) return "U";
  const parts = String(name).trim().split(/\s+/).filter(Boolean);

  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
};

const formatDate = (value) => {
  if (!value) return "";
  try {
    return new Intl.DateTimeFormat("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date(value));
  } catch {
    return "";
  }
};

const readArray = (key) => {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const computeTotalBookings = () => {
  const buyerBookings = readArray("buyerBookings");
  return Array.isArray(buyerBookings) ? buyerBookings.length : 0;
};

export default function ProfileDropdown({ user, onLogout }) {
  const navigate = useNavigate();
  const { updateUser, activeRole } = useAuth();

  const isSeller = user?.role === "seller";
  const isAdmin = user?.role === "admin";

  const rootRef = useRef(null);
  const [open, setOpen] = useState(false);

  const initials = useMemo(() => getInitials(user?.name), [user?.name]);
  const email = user?.email || "";
  const phone = user?.phone || "";

  const memberSince = useMemo(() => {
    return user?.loginTime || localStorage.getItem("memberSince") || "";
  }, [user?.loginTime]);

  const totalBookings = useMemo(() => computeTotalBookings(), [open]);

  // Outside click close (desktop + mobile)
  useEffect(() => {
    const onDocMouseDown = (e) => {
      if (!open) return;
      const el = rootRef.current;
      if (!el) return;
      if (el.contains(e.target)) return;
      setOpen(false);
    };

    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, [open]);

  // Close on route change
  useEffect(() => {
    if (!open) return;
    const onPopState = () => setOpen(false);
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [open]);

  if (!user) return null;

  const closeAndNav = (path) => {
    setOpen(false);
    navigate(path);
  };

  const handleLogout = () => {
    onLogout?.();
    navigate("/login");
  };

  const handlePrimaryToggle = () => {
    setOpen((v) => !v);
  };

  return (
    <div ref={rootRef} className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={handlePrimaryToggle}
        className="flex items-center space-x-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-full px-3 py-1.5 transition"
        aria-label="Open profile menu"
      >
        {user?.profile_pic ? (
          <img
            src={getImageUrl(user.profile_pic)}
            alt="Profile"
            className="w-9 h-9 rounded-full object-cover border border-slate-200"
          />
        ) : (
          <div className="w-9 h-9 rounded-full bg-[#185FA5] text-white force-text-white flex items-center justify-center font-bold">
            {initials}
          </div>
        )}
        <div className="hidden lg:block">
          <span className="text-slate-700 font-semibold max-w-[160px] truncate inline-block">
            {user?.name || "User"}
          </span>
        </div>
      </button>

      {/* Backdrop + Mobile sheet */}
      {open && (
        <>
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[1100] md:hidden"
            aria-hidden="true"
          />

          {/* Mobile bottom sheet */}
          <div
            className={
              "fixed inset-x-0 bottom-0 z-[1200] md:hidden transform transition-transform duration-300 ease-out " +
              (open ? "translate-y-0" : "translate-y-full")
            }
            role="dialog"
            aria-modal="true"
          >
            <div className="bg-white border-t border-slate-200 rounded-t-3xl shadow-2xl">
              <div className="px-4 pt-4 pb-3 relative">
                <div className="absolute left-1/2 top-1 h-1.5 w-14 -translate-x-1/2 rounded-full bg-slate-200" />

                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="absolute right-3 top-3 rounded-full w-9 h-9 flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
                  aria-label="Close"
                >
                  ✕
                </button>

                <div className="pt-3 flex flex-col items-center text-center">
                  {user?.profile_pic ? (
                    <img
                      src={getImageUrl(user.profile_pic)}
                      alt="Profile"
                      className="w-16 h-16 rounded-full object-cover border border-slate-200"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-[#185FA5] text-white force-text-white flex items-center justify-center font-black text-3xl">
                      {initials}
                    </div>
                  )}

                  <div className="mt-3 text-slate-800 font-black text-xl">
                    {user?.name || "User"}
                  </div>
                  <div className="mt-1 text-slate-500 text-sm">
                    {phone || email || ""}
                  </div>

                  <div className="mt-3 flex gap-2">
                    <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-600">
                      Total: {totalBookings}
                    </span>
                    {memberSince && (
                      <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-600">
                        {formatDate(memberSince)}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <WorkspaceSwitcher layout="dropdown" />

              <div className="px-4 pb-5 space-y-3">
                {activeRole === "seller" ? (
                  <>
                    <button
                      type="button"
                      onClick={() => closeAndNav("/seller/profile")}
                      className="w-full rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 font-black py-3 hover:bg-emerald-100 transition"
                    >
                      👤 My Profile
                    </button>
                    <button
                      type="button"
                      onClick={() => closeAndNav("/seller/services")}
                      className="w-full rounded-xl bg-slate-50 border border-slate-200 text-slate-700 font-black py-3 hover:bg-slate-100 transition"
                    >
                      💼 My Services
                    </button>
                    <button
                      type="button"
                      onClick={() => closeAndNav("/seller/dashboard")}
                      className="w-full rounded-xl bg-slate-50 border border-slate-200 text-slate-700 font-black py-3 hover:bg-slate-100 transition"
                    >
                      📊 Seller Dashboard
                    </button>
                  </>
                ) : isAdmin ? (
                  <button
                    type="button"
                    onClick={() => closeAndNav("/admin/dashboard")}
                    className="w-full rounded-xl bg-slate-50 border border-slate-200 text-slate-700 font-black py-3 hover:bg-slate-100 transition"
                  >
                    📊 Admin Dashboard
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => closeAndNav("/profile")}
                      className="w-full rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 font-black py-3 hover:bg-emerald-100 transition"
                    >
                      👤 My Profile
                    </button>
                    <button
                      type="button"
                      onClick={() => closeAndNav("/my-bookings")}
                      className="w-full rounded-xl bg-slate-50 border border-slate-200 text-slate-700 font-black py-3 hover:bg-slate-100 transition"
                    >
                      📋 My Bookings
                    </button>
                    <button
                      type="button"
                      onClick={() => closeAndNav("/booking-history")}
                      className="w-full rounded-xl bg-slate-50 border border-slate-200 text-slate-700 font-black py-3 hover:bg-slate-100 transition"
                    >
                      🕓 Booking History
                    </button>
                  </>
                )}

                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full rounded-xl bg-[#e53935] text-white force-text-white font-black py-3 hover:bg-[#cc2f2c] transition"
                >
                  🚪 Logout
                </button>
              </div>
            </div>
          </div>

          {/* Desktop dropdown */}
          <div className="hidden md:block absolute right-0 mt-2 w-[360px] z-[1050]">
            <div
              className="rounded-2xl border border-slate-200 shadow-xl overflow-hidden"
              style={{ background: "#ffffff" }}
            >
              <div className="p-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  {user?.profile_pic ? (
                    <img
                      src={getImageUrl(user.profile_pic)}
                      alt="Profile"
                      className="w-12 h-12 rounded-full object-cover border border-slate-200"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-[#185FA5] text-white force-text-white flex items-center justify-center font-black text-lg">
                      {initials}
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="text-slate-800 font-black truncate">
                      {user?.name || "User"}
                    </div>
                    <div className="text-slate-500 text-xs truncate">
                      {email ? email : phone ? phone : ""}
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-600">
                    Total Bookings: {totalBookings}
                  </span>
                  {memberSince && (
                    <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-600">
                      Member since: {formatDate(memberSince)}
                    </span>
                  )}
                </div>
              </div>

              <WorkspaceSwitcher layout="dropdown" />

              <div className="p-3">
                {activeRole === "seller" ? (
                  <>
                    <div className="flex gap-2 mb-3">
                      <button
                        type="button"
                        onClick={() => closeAndNav("/seller/profile")}
                        className="flex-1 rounded-xl px-3 py-2 text-sm font-black bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 transition"
                      >
                        👤 My Profile
                      </button>
                      <button
                        type="button"
                        onClick={() => closeAndNav("/seller/services")}
                        className="flex-1 rounded-xl px-3 py-2 text-sm font-black transition bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100"
                      >
                        💼 My Services
                      </button>
                    </div>

                    <div className="flex gap-2 mb-3">
                      <button
                        type="button"
                        onClick={() => closeAndNav("/seller/dashboard")}
                        className="flex-1 rounded-xl px-3 py-2 text-sm font-black bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100 transition"
                      >
                        📊 Seller Dashboard
                      </button>
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="rounded-xl px-3 py-2 text-sm font-black bg-[#e53935] text-white force-text-white hover:bg-[#cc2f2c] transition"
                      >
                        🚪 Logout
                      </button>
                    </div>
                  </>
                ) : isAdmin ? (
                  <div className="flex gap-2 mb-3">
                    <button
                      type="button"
                      onClick={() => closeAndNav("/admin/dashboard")}
                      className="flex-1 rounded-xl px-3 py-2 text-sm font-black bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100 transition"
                    >
                      📊 Admin Dashboard
                    </button>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="rounded-xl px-3 py-2 text-sm font-black bg-[#e53935] text-white force-text-white hover:bg-[#cc2f2c] transition"
                    >
                      🚪 Logout
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex gap-2 mb-3">
                      <button
                        type="button"
                        onClick={() => closeAndNav("/profile")}
                        className="flex-1 rounded-xl px-3 py-2 text-sm font-black bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 transition"
                      >
                        👤 My Profile
                      </button>
                      <button
                        type="button"
                        onClick={() => closeAndNav("/my-bookings")}
                        className="flex-1 rounded-xl px-3 py-2 text-sm font-black transition bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100"
                      >
                        📋 My Bookings
                      </button>
                    </div>

                    <div className="flex gap-2 mb-3">
                      <button
                        type="button"
                        onClick={() => closeAndNav("/booking-history")}
                        className="flex-1 rounded-xl px-3 py-2 text-sm font-black bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100 transition"
                      >
                        🕓 Booking History
                      </button>
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="rounded-xl px-3 py-2 text-sm font-black bg-[#e53935] text-white force-text-white hover:bg-[#cc2f2c] transition"
                      >
                        🚪 Logout
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
