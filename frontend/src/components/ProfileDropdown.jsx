import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import WorkspaceSwitcher from "./WorkspaceSwitcher";
import apiClient from "../api/axiosConfig";
import { User, ClipboardList, History, LogOut, LayoutDashboard, Briefcase, ChevronRight, UserCheck } from "lucide-react";

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
        className="flex items-center space-x-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 rounded-full pl-2.5 pr-4 py-1.5 transition duration-200 cursor-pointer focus:outline-none"
        aria-label="Open profile menu"
      >
        {user?.profile_pic ? (
          <img
            src={getImageUrl(user.profile_pic)}
            alt="Profile"
            className="w-8 h-8 rounded-full object-cover border border-slate-200/50 shadow-sm"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 text-white flex items-center justify-center font-extrabold text-sm shadow-sm">
            {initials}
          </div>
        )}
        <span className="text-slate-700 text-sm font-semibold max-w-[120px] truncate hidden sm:inline-block">
          {user?.name || "User"}
        </span>
      </button>

      {/* Backdrop + Mobile Bottom Sheet */}
      {open && (
        <>
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[1100] md:hidden"
            aria-hidden="true"
            onClick={() => setOpen(false)}
          />

          {/* Mobile Bottom Sheet Card */}
          <div
            className="fixed inset-x-0 bottom-0 z-[1200] md:hidden transform transition-transform duration-300 ease-out translate-y-0"
            role="dialog"
            aria-modal="true"
          >
            <div className="bg-white border-t border-slate-200 rounded-t-3xl shadow-2xl pb-6">
              <div className="px-5 pt-5 pb-4 relative border-b border-slate-100">
                <div className="absolute left-1/2 top-2 h-1.5 w-12 -translate-x-1/2 rounded-full bg-slate-200" />
                
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="absolute right-4 top-4 rounded-full w-8 h-8 flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition cursor-pointer"
                  aria-label="Close"
                >
                  ✕
                </button>

                <div className="pt-2 flex items-center gap-4 text-left">
                  {user?.profile_pic ? (
                    <img
                      src={getImageUrl(user.profile_pic)}
                      alt="Profile"
                      className="w-16 h-16 rounded-full object-cover border border-slate-200 shadow-md"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 text-white flex items-center justify-center font-black text-2xl shadow-md">
                      {initials}
                    </div>
                  )}

                  <div className="min-w-0">
                    <h3 className="text-slate-800 font-extrabold text-lg truncate flex items-center gap-1">
                      {user?.name || "User"}
                      {user?.is_verified === 1 && (
                        <UserCheck size={16} className="text-indigo-600" />
                      )}
                    </h3>
                    <p className="text-slate-500 text-xs truncate mt-0.5">{email || phone}</p>
                    <div className="mt-2 flex gap-1.5">
                      <span className="inline-flex items-center rounded-full bg-indigo-50 border border-indigo-100/50 px-2.5 py-0.5 text-[10px] font-bold text-indigo-700">
                        {isSellerRole ? `Orders: ${totalCount}` : `Bookings: ${totalCount}`}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Workspace Switcher */}
              <WorkspaceSwitcher layout="dropdown" />

              {/* Navigation Action Buttons */}
              <div className="px-5 mt-4 space-y-2">
                {isSellerRole ? (
                  <>
                    <button
                      type="button"
                      onClick={() => closeAndNav("/seller/profile")}
                      className="w-full flex items-center justify-between rounded-xl bg-slate-50 border border-slate-200/80 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-800 transition cursor-pointer"
                    >
                      <span className="flex items-center gap-2">👤 My Profile</span>
                      <ChevronRight size={14} className="opacity-50" />
                    </button>
                    <button
                      type="button"
                      onClick={() => closeAndNav("/seller/services")}
                      className="w-full flex items-center justify-between rounded-xl bg-slate-50 border border-slate-200/80 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-800 transition cursor-pointer"
                    >
                      <span className="flex items-center gap-2">💼 My Services</span>
                      <ChevronRight size={14} className="opacity-50" />
                    </button>
                    <button
                      type="button"
                      onClick={() => closeAndNav("/seller/dashboard")}
                      className="w-full flex items-center justify-between rounded-xl bg-indigo-600 text-white px-4 py-3 text-sm font-bold hover:bg-indigo-700 shadow-md transition cursor-pointer"
                    >
                      <span className="flex items-center gap-2">📊 Seller Dashboard</span>
                      <ChevronRight size={14} className="text-indigo-100" />
                    </button>
                  </>
                ) : isAdminRole ? (
                  <>
                    <button
                      type="button"
                      onClick={() => closeAndNav("/admin/dashboard")}
                      className="w-full flex items-center justify-between rounded-xl bg-indigo-600 text-white px-4 py-3 text-sm font-bold hover:bg-indigo-700 shadow-md transition cursor-pointer"
                    >
                      <span className="flex items-center gap-2">📊 Admin Dashboard</span>
                      <ChevronRight size={14} className="text-indigo-100" />
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => closeAndNav("/profile")}
                      className="w-full flex items-center justify-between rounded-xl bg-slate-50 border border-slate-200/80 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-800 transition cursor-pointer"
                    >
                      <span className="flex items-center gap-2">👤 My Profile</span>
                      <ChevronRight size={14} className="opacity-50" />
                    </button>
                    <button
                      type="button"
                      onClick={() => closeAndNav("/my-bookings")}
                      className="w-full flex items-center justify-between rounded-xl bg-slate-50 border border-slate-200/80 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-800 transition cursor-pointer"
                    >
                      <span className="flex items-center gap-2">📋 My Bookings / बुकिंग इतिहास</span>
                      <ChevronRight size={14} className="opacity-50" />
                    </button>
                  </>
                )}

                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-rose-50 border border-rose-100 px-4 py-3 text-sm font-bold text-rose-600 hover:bg-rose-100 transition cursor-pointer"
                >
                  <LogOut size={16} />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </div>

          {/* Desktop Dropdown Card */}
          <div className="hidden md:block absolute right-0 mt-2.5 w-[350px] z-[1050] animate-fade-in">
            <div className="rounded-2xl border border-slate-200/80 bg-white/95 backdrop-blur-md shadow-2xl overflow-hidden">
              {/* User Profile Summary */}
              <div className="p-5 border-b border-slate-100">
                <div className="flex items-center gap-3.5">
                  {user?.profile_pic ? (
                    <img
                      src={getImageUrl(user.profile_pic)}
                      alt="Profile"
                      className="w-12 h-12 rounded-full object-cover border border-slate-200 shadow-md"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 text-white flex items-center justify-center font-black text-lg shadow-md">
                      {initials}
                    </div>
                  )}
                  <div className="min-w-0">
                    <h4 className="text-slate-800 font-extrabold truncate text-base flex items-center gap-1">
                      {user?.name || "User"}
                      {user?.is_verified === 1 && (
                        <UserCheck size={15} className="text-indigo-600 flex-shrink-0" />
                      )}
                    </h4>
                    <p className="text-slate-400 text-xs truncate mt-0.5">{email || phone}</p>
                  </div>
                </div>

                {/* Sub Metadata Badges */}
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="inline-flex items-center rounded-full bg-indigo-50 border border-indigo-100/50 px-2.5 py-0.5 text-[10px] font-bold text-indigo-700">
                    {isSellerRole ? `Total Orders: ${totalCount}` : `Total Bookings: ${totalCount}`}
                  </span>
                  {formattedDate && (
                    <span className="inline-flex items-center rounded-full bg-slate-50 border border-slate-200/60 px-2.5 py-0.5 text-[10px] font-bold text-slate-500">
                      Joined: {formattedDate}
                    </span>
                  )}
                </div>
              </div>

              {/* Workspace Selector Segment */}
              <WorkspaceSwitcher layout="dropdown" />

              {/* Links & Logout Actions */}
              <div className="p-3.5 space-y-2">
                {isSellerRole ? (
                  <>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => closeAndNav("/seller/profile")}
                        className="flex-1 flex items-center justify-center gap-1 rounded-xl px-3 py-2.5 text-xs font-bold bg-slate-50 border border-slate-200 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-800 transition cursor-pointer"
                      >
                        <User size={13} />
                        <span>Profile</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => closeAndNav("/seller/services")}
                        className="flex-1 flex items-center justify-center gap-1 rounded-xl px-3 py-2.5 text-xs font-bold bg-slate-50 border border-slate-200 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-800 transition cursor-pointer"
                      >
                        <Briefcase size={13} />
                        <span>Services</span>
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => closeAndNav("/seller/dashboard")}
                      className="w-full flex items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-xs font-black bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm transition cursor-pointer"
                    >
                      <LayoutDashboard size={14} />
                      <span>Dashboard / डैशबोर्ड</span>
                    </button>
                  </>
                ) : isAdminRole ? (
                  <button
                    type="button"
                    onClick={() => closeAndNav("/admin/dashboard")}
                    className="w-full flex items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-xs font-black bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm transition cursor-pointer"
                  >
                    <LayoutDashboard size={14} />
                    <span>Admin Dashboard</span>
                  </button>
                ) : (
                  <>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => closeAndNav("/profile")}
                        className="flex-1 flex items-center justify-center gap-1 rounded-xl px-3 py-2.5 text-xs font-bold bg-slate-50 border border-slate-200 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-800 transition cursor-pointer"
                      >
                        <User size={13} />
                        <span>Profile</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => closeAndNav("/my-bookings")}
                        className="flex-1 flex items-center justify-center gap-1 rounded-xl px-3 py-2.5 text-xs font-bold bg-slate-50 border border-slate-200 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-800 transition cursor-pointer"
                      >
                        <ClipboardList size={13} />
                        <span>Bookings / इतिहास</span>
                      </button>
                    </div>
                  </>
                )}

                {/* Logout Button */}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-xs font-bold bg-rose-50 border border-rose-100 text-rose-600 hover:bg-rose-100 transition cursor-pointer"
                >
                  <LogOut size={13} />
                  <span>Logout / लॉगआउट</span>
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
