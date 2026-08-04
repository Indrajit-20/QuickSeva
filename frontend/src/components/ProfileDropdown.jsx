import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import WorkspaceSwitcher from "./WorkspaceSwitcher";
import apiClient from "../api/axiosConfig";
import {
  User,
  ClipboardList,
  LogOut,
  LayoutDashboard,
  Briefcase,
  ChevronRight,
  UserCheck,
  X,
  Sparkles,
  Calendar,
} from "lucide-react";

const getImageUrl = (url) => {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  const base = apiClient.defaults.baseURL
    ? apiClient.defaults.baseURL.replace("/api", "")
    : "http://localhost:5000";
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
      month: "short",
      year: "numeric",
    }).format(new Date(value));
  } catch {
    return "";
  }
};

export default function ProfileDropdown({ user, onLogout }) {
  const navigate = useNavigate();
  const { activeRole } = useAuth();

  const isSellerRole = activeRole === "seller";
  const isAdminRole = user?.role === "admin";

  const rootRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  const initials = useMemo(() => getInitials(user?.name), [user?.name]);
  const email = user?.email || "";
  const phone = user?.phone || "";

  // Fetch real count of bookings/orders from database
  useEffect(() => {
    if (!open || !user) return;
    const fetchRealCount = async () => {
      try {
        const endpoint = isSellerRole ? "/orders/seller" : "/orders/my";
        const res = await apiClient.get(endpoint);
        const list = res?.data?.orders || res?.orders || [];
        if (Array.isArray(list)) {
          setTotalCount(list.length);
        }
      } catch (err) {
        console.error("Failed to load real count:", err);
      }
    };
    fetchRealCount();
  }, [open, isSellerRole, user]);

  // Outside click close (desktop + mobile)
  useEffect(() => {
    const onDocMouseDown = (e) => {
      if (!open) return;
      const el = rootRef.current;
      if (!el || el.contains(e.target)) return;
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
    try {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      window.scrollTo(0, 0);
    }
    navigate(path);
  };

  const handleLogout = () => {
    setOpen(false);
    onLogout?.();
    navigate("/login");
  };

  const handlePrimaryToggle = () => {
    setOpen((v) => !v);
  };

  const formattedDate = user?.created_at ? formatDate(user.created_at) : "";

  return (
    <div ref={rootRef} className="relative">
      {/* Trigger Button */}
      <button
        type="button"
        onClick={handlePrimaryToggle}
        className="flex items-center space-x-2 bg-white hover:bg-slate-50 border border-slate-200/90 hover:border-slate-300 shadow-2xs rounded-full p-1 pr-3.5 transition-all duration-200 cursor-pointer focus:outline-none active:scale-95"
        aria-label="Open profile menu"
      >
        <div className="relative rounded-full p-[2px] ring-2 ring-blue-500/80 bg-white shadow-2xs">
          {user?.profile_pic ? (
            <img
              src={getImageUrl(user.profile_pic)}
              alt="Profile"
              className="w-7 h-7 rounded-full object-cover bg-slate-100"
            />
          ) : (
            <div className="w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center font-black text-xs">
              {initials}
            </div>
          )}
        </div>
        <span className="text-slate-800 text-sm font-extrabold max-w-[120px] truncate hidden sm:inline-block">
          {user?.name || "User"}
        </span>
      </button>

      {/* Backdrop + Mobile Bottom Sheet */}
      {open && (
        <>
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[1100] md:hidden animate-fade-in"
            aria-hidden="true"
            onClick={() => setOpen(false)}
          />

          {/* Mobile Bottom Sheet Card */}
          <div
            className="fixed inset-x-0 bottom-0 z-[1200] md:hidden transform transition-transform duration-300 ease-out translate-y-0"
            role="dialog"
            aria-modal="true"
          >
            <div className="bg-white border-t border-slate-200/80 rounded-t-3xl shadow-2xl pb-6">
              {/* Drag Handle & Close Button */}
              <div className="px-5 pt-4 pb-4 relative border-b border-slate-100">
                <div className="absolute left-1/2 top-2.5 h-1.5 w-12 -translate-x-1/2 rounded-full bg-slate-300" />

                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="absolute right-4 top-3.5 rounded-full w-8 h-8 flex items-center justify-center bg-slate-100 text-slate-500 hover:bg-slate-200 transition cursor-pointer"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>

                {/* Profile Overview Card */}
                <div className="pt-3 flex items-center gap-3.5 text-left">
                  <div className="relative rounded-full p-[2px] ring-2 ring-blue-500/80 bg-white shadow-xs">
                    {user?.profile_pic ? (
                      <img
                        src={getImageUrl(user.profile_pic)}
                        alt="Profile"
                        className="w-13 h-13 rounded-full object-cover bg-slate-100"
                      />
                    ) : (
                      <div className="w-13 h-13 rounded-full bg-slate-900 text-white flex items-center justify-center font-black text-lg">
                        {initials}
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="text-slate-900 font-black text-lg truncate flex items-center gap-1.5 leading-snug">
                      {user?.name || "User"}
                      {user?.is_verified === 1 && (
                        <UserCheck className="w-4 h-4 text-blue-600 shrink-0" />
                      )}
                    </h3>
                    <p className="text-slate-500 text-xs font-semibold truncate mt-0.5">{email || phone}</p>

                    <div className="mt-2 flex items-center gap-2 flex-wrap">
                      <span className="inline-flex items-center gap-1 rounded-lg bg-blue-50 border border-blue-200/80 px-2.5 py-1 text-[11px] font-extrabold text-blue-700">
                        <ClipboardList className="w-3 h-3 text-blue-600" />
                        {isSellerRole ? `Orders: ${totalCount}` : `Bookings: ${totalCount}`}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Workspace Switcher */}
              <WorkspaceSwitcher layout="dropdown" onClose={() => setOpen(false)} />

              {/* Navigation Action Buttons */}
              <div className="px-5 mt-4 space-y-2.5">
                {isSellerRole ? (
                  <>
                    <button
                      type="button"
                      onClick={() => closeAndNav("/seller/profile")}
                      className="w-full flex items-center justify-between rounded-2xl bg-slate-50 border border-slate-200/90 px-4 py-3.5 text-sm font-extrabold text-slate-800 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition cursor-pointer shadow-2xs group"
                    >
                      <span className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-blue-100/70 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                          <User className="w-4 h-4" />
                        </div>
                        <span>My Seller Profile</span>
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                    </button>

                    <button
                      type="button"
                      onClick={() => closeAndNav("/seller/services")}
                      className="w-full flex items-center justify-between rounded-2xl bg-slate-50 border border-slate-200/90 px-4 py-3.5 text-sm font-extrabold text-slate-800 hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-700 transition cursor-pointer shadow-2xs group"
                    >
                      <span className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-indigo-100/70 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                          <Briefcase className="w-4 h-4" />
                        </div>
                        <span>My Offered Services</span>
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                    </button>

                    <button
                      type="button"
                      onClick={() => closeAndNav("/seller/dashboard")}
                      className="w-full flex items-center justify-between rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-3.5 text-sm font-black hover:from-blue-700 hover:to-indigo-700 shadow-md shadow-blue-500/20 transition cursor-pointer"
                    >
                      <span className="flex items-center gap-3">
                        <LayoutDashboard className="w-5 h-5 text-white" />
                        <span>Seller Partner Dashboard</span>
                      </span>
                      <ChevronRight className="w-4 h-4 text-white/80" />
                    </button>
                  </>
                ) : isAdminRole ? (
                  <button
                    type="button"
                    onClick={() => closeAndNav("/admin/dashboard")}
                    className="w-full flex items-center justify-between rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-3.5 text-sm font-black hover:from-purple-700 hover:to-indigo-700 shadow-md transition cursor-pointer"
                  >
                    <span className="flex items-center gap-3">
                      <LayoutDashboard className="w-5 h-5 text-white" />
                      <span>Admin Control Panel</span>
                    </span>
                    <ChevronRight className="w-4 h-4 text-white/80" />
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => closeAndNav("/profile")}
                      className="w-full flex items-center justify-between rounded-2xl bg-slate-50 border border-slate-200/90 px-4 py-3.5 text-sm font-extrabold text-slate-800 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition cursor-pointer shadow-2xs group"
                    >
                      <span className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-blue-100/70 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                          <User className="w-4 h-4" />
                        </div>
                        <span>My Account Profile</span>
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                    </button>

                    <button
                      type="button"
                      onClick={() => closeAndNav("/my-bookings")}
                      className="w-full flex items-center justify-between rounded-2xl bg-slate-50 border border-slate-200/90 px-4 py-3.5 text-sm font-extrabold text-slate-800 hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-700 transition cursor-pointer shadow-2xs group"
                    >
                      <span className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-indigo-100/70 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                          <ClipboardList className="w-4 h-4" />
                        </div>
                        <span>My Bookings History</span>
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  </>
                )}

                {/* Logout Button */}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 rounded-2xl bg-rose-50 border border-rose-200/80 px-4 py-3.5 text-xs font-black text-rose-600 hover:bg-rose-100 transition cursor-pointer mt-3 shadow-2xs"
                >
                  <LogOut className="w-4 h-4 text-rose-600" />
                  <span>Logout Account</span>
                </button>
              </div>
            </div>
          </div>

          {/* Desktop Dropdown Card */}
          <div className="hidden md:block absolute right-0 mt-2.5 w-[360px] z-[1050] animate-fade-in-down">
            <div className="rounded-3xl border border-slate-200/80 bg-white/95 backdrop-blur-md shadow-2xl overflow-hidden">
              {/* User Profile Summary */}
              <div className="p-5 border-b border-slate-100">
                <div className="flex items-center gap-3.5">
                  <div className="relative rounded-full p-[2px] ring-2 ring-blue-500/80 bg-white shadow-xs">
                    {user?.profile_pic ? (
                      <img
                        src={getImageUrl(user.profile_pic)}
                        alt="Profile"
                        className="w-12 h-12 rounded-full object-cover bg-slate-100"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-slate-900 text-white flex items-center justify-center font-black text-base">
                        {initials}
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <h4 className="text-slate-900 font-black truncate text-base flex items-center gap-1.5">
                      {user?.name || "User"}
                      {user?.is_verified === 1 && (
                        <UserCheck className="w-4 h-4 text-blue-600 shrink-0" />
                      )}
                    </h4>
                    <p className="text-slate-500 text-xs font-semibold truncate mt-0.5">{email || phone}</p>
                  </div>
                </div>

                {/* Sub Metadata Badges */}
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1 rounded-xl bg-blue-50 border border-blue-200/70 px-3 py-1 text-[11px] font-extrabold text-blue-700">
                    <ClipboardList className="w-3 h-3 text-blue-600" />
                    {isSellerRole ? `Total Orders: ${totalCount}` : `Total Bookings: ${totalCount}`}
                  </span>
                  {formattedDate && (
                    <span className="inline-flex items-center gap-1 rounded-xl bg-slate-50 border border-slate-200/70 px-3 py-1 text-[11px] font-extrabold text-slate-600">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      Joined: {formattedDate}
                    </span>
                  )}
                </div>
              </div>

              {/* Workspace Selector Segment */}
              <WorkspaceSwitcher layout="dropdown" onClose={() => setOpen(false)} />

              {/* Links & Logout Actions */}
              <div className="p-4 space-y-2.5">
                {isSellerRole ? (
                  <>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => closeAndNav("/seller/profile")}
                        className="flex-1 flex items-center justify-center gap-2 rounded-xl px-3.5 py-2.5 text-xs font-extrabold bg-slate-50 border border-slate-200 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition cursor-pointer shadow-2xs"
                      >
                        <User className="w-3.5 h-3.5 text-blue-600" />
                        <span>Profile</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => closeAndNav("/seller/services")}
                        className="flex-1 flex items-center justify-center gap-2 rounded-xl px-3.5 py-2.5 text-xs font-extrabold bg-slate-50 border border-slate-200 hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-700 transition cursor-pointer shadow-2xs"
                      >
                        <Briefcase className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Services</span>
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => closeAndNav("/seller/dashboard")}
                      className="w-full flex items-center justify-center gap-2 rounded-xl px-3.5 py-3 text-xs font-black bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-md transition cursor-pointer"
                    >
                      <LayoutDashboard className="w-4 h-4 text-white" />
                      <span>Seller Dashboard</span>
                    </button>
                  </>
                ) : isAdminRole ? (
                  <button
                    type="button"
                    onClick={() => closeAndNav("/admin/dashboard")}
                    className="w-full flex items-center justify-center gap-2 rounded-xl px-3.5 py-3 text-xs font-black bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700 shadow-md transition cursor-pointer"
                  >
                    <LayoutDashboard className="w-4 h-4 text-white" />
                    <span>Admin Dashboard</span>
                  </button>
                ) : (
                  <>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => closeAndNav("/profile")}
                        className="flex-1 flex items-center justify-center gap-2 rounded-xl px-3.5 py-2.5 text-xs font-extrabold bg-slate-50 border border-slate-200 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition cursor-pointer shadow-2xs"
                      >
                        <User className="w-3.5 h-3.5 text-blue-600" />
                        <span>My Profile</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => closeAndNav("/my-bookings")}
                        className="flex-1 flex items-center justify-center gap-2 rounded-xl px-3.5 py-2.5 text-xs font-extrabold bg-slate-50 border border-slate-200 hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-700 transition cursor-pointer shadow-2xs"
                      >
                        <ClipboardList className="w-3.5 h-3.5 text-indigo-600" />
                        <span>My Bookings</span>
                      </button>
                    </div>
                  </>
                )}

                {/* Logout Button */}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 rounded-xl px-3.5 py-2.5 text-xs font-black bg-rose-50 border border-rose-200/80 text-rose-600 hover:bg-rose-100 transition cursor-pointer shadow-2xs"
                >
                  <LogOut className="w-3.5 h-3.5 text-rose-600" />
                  <span>Logout Account</span>
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
