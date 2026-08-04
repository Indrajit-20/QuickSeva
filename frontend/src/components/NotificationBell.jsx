import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  CheckCheck,
  Package,
  Megaphone,
  Wallet,
  ShieldAlert,
  Sparkles,
  X,
  ChevronRight,
  Clock,
} from "lucide-react";
import apiClient from "../api/axiosConfig";
import { useSocket } from "../context/SocketContext";
import { useAuth } from "../context/AuthContext";

const formatTimeAgo = (value) => {
  if (!value) return "Just now";
  const time = new Date(value).getTime();
  if (isNaN(time)) return "Just now";
  const diff = Math.max(0, Date.now() - time);
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

const getNotificationIcon = (type, title = "") => {
  const t = String(type || "").toLowerCase();
  const titleLower = String(title || "").toLowerCase();

  if (t === "order" || titleLower.includes("order") || titleLower.includes("booking") || titleLower.includes("#qs-")) {
    return {
      icon: Package,
      bg: "bg-blue-100 text-blue-700 border-blue-200",
      pillBg: "bg-blue-50 text-blue-700 border-blue-200",
      tag: "ORDER",
    };
  }
  if (t === "lead" || titleLower.includes("lead")) {
    return {
      icon: Megaphone,
      bg: "bg-amber-100 text-amber-800 border-amber-200",
      pillBg: "bg-amber-50 text-amber-800 border-amber-200",
      tag: "LEAD",
    };
  }
  if (t === "wallet" || titleLower.includes("wallet") || titleLower.includes("recharge")) {
    return {
      icon: Wallet,
      bg: "bg-emerald-100 text-emerald-800 border-emerald-200",
      pillBg: "bg-emerald-50 text-emerald-800 border-emerald-200",
      tag: "WALLET",
    };
  }
  return {
    icon: ShieldAlert,
    bg: "bg-indigo-100 text-indigo-800 border-indigo-200",
    pillBg: "bg-indigo-50 text-indigo-800 border-indigo-200",
    tag: "ALERT",
  };
};

export default function NotificationBell({ className = "", isSeller = false, align = "auto" }) {
  const { user } = useAuth();
  const { socket } = useSocket();
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [toastAlert, setToastAlert] = useState(null);

  const containerRef = useRef(null);

  // Fetch notifications & unread count
  const fetchNotifications = useCallback(async ({ silent = false } = {}) => {
    if (!user) return;
    if (!silent) setLoading(true);

    try {
      const res = await apiClient.get("/notifications?page=1&limit=25");
      const data = res?.data?.data || res?.data || {};
      const list = data.notifications || [];
      const count = Number(data.unread ?? list.filter((n) => !n.is_read).length);

      setNotifications(Array.isArray(list) ? list : []);
      setUnreadCount(count >= 0 ? count : 0);
    } catch (err) {
      console.warn("Failed to fetch notifications:", err?.message);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [user]);

  // Initial load + listener setup + 5s polling fallback
  useEffect(() => {
    fetchNotifications();

    const handleSync = () => fetchNotifications({ silent: true });
    window.addEventListener("notifications-updated", handleSync);
    window.addEventListener("leads-read", handleSync);

    const interval = setInterval(() => {
      fetchNotifications({ silent: true });
    }, 5000);

    return () => {
      window.removeEventListener("notifications-updated", handleSync);
      window.removeEventListener("leads-read", handleSync);
      clearInterval(interval);
    };
  }, [fetchNotifications]);

  // Listen to Socket real-time events
  useEffect(() => {
    if (!socket || !user) return;

    const handleNewNotification = (data) => {
      fetchNotifications({ silent: true });
      if (data?.title || data?.message) {
        setToastAlert({
          title: data.title || "New Notification",
          message: data.message || "You have a new update",
        });
        setTimeout(() => setToastAlert(null), 5000);
      }
    };

    const handleOrderUpdate = (data) => {
      fetchNotifications({ silent: true });
      const statusText = data?.status ? `Order status: ${data.status.replace("_", " ")}` : "Order updated";
      setToastAlert({
        title: "📦 Order Update",
        message: statusText,
      });
      setTimeout(() => setToastAlert(null), 5000);
    };

    const handleLeadUpdate = (data) => {
      fetchNotifications({ silent: true });
      if (isSeller) {
        setToastAlert({
          title: "📢 New Lead in your area!",
          message: `${data?.customer_name || "Customer"} needs ${data?.category || "service"} in ${data?.pincode || "your area"}.`,
        });
        setTimeout(() => setToastAlert(null), 6000);
      }
    };

    socket.on("new_notification", handleNewNotification);
    socket.on("order_updated", handleOrderUpdate);
    socket.on("new_lead_created", handleLeadUpdate);
    socket.on("new_lead_for_you", handleLeadUpdate);

    return () => {
      socket.off("new_notification", handleNewNotification);
      socket.off("order_updated", handleOrderUpdate);
      socket.off("new_lead_created", handleLeadUpdate);
      socket.off("new_lead_for_you", handleLeadUpdate);
    };
  }, [socket, user, isSeller, fetchNotifications]);

  // Outside click close
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  // Mark single as read
  const handleMarkAsRead = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      await apiClient.put(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: 1 } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      window.dispatchEvent(new CustomEvent("notifications-updated"));
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  };

  // Mark all as read
  const handleMarkAllAsRead = async () => {
    try {
      await apiClient.put("/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
      setUnreadCount(0);
      window.dispatchEvent(new CustomEvent("notifications-updated"));
    } catch (err) {
      console.error("Failed to mark all notifications as read:", err);
    }
  };

  // Click notification item to navigate
  const handleItemClick = (item) => {
    if (!item.is_read) {
      handleMarkAsRead(item.id);
    }
    setIsOpen(false);

    // Target navigation based on type / seller role
    const typeLower = String(item.type || "").toLowerCase();
    const titleLower = String(item.title || "").toLowerCase();

    if (typeLower === "lead" || titleLower.includes("lead")) {
      navigate("/seller/dashboard/leads");
    } else if (typeLower === "order" || titleLower.includes("order") || titleLower.includes("booking")) {
      if (isSeller) {
        navigate("/seller/orders");
      } else {
        navigate("/my-bookings");
      }
    } else if (typeLower === "wallet" || titleLower.includes("wallet")) {
      if (isSeller) {
        navigate("/seller/wallet");
      }
    } else if (isSeller) {
      navigate("/seller/dashboard");
    } else {
      navigate("/my-bookings");
    }
  };

  if (!user) return null;

  // Determine desktop popover position class based on alignment prop
  const positionClass =
    align === "left"
      ? "sm:left-0 sm:mt-2"
      : align === "right"
      ? "sm:right-0 sm:mt-2"
      : "sm:right-0 sm:mt-2";

  return (
    <div className={`relative inline-block ${className}`} ref={containerRef}>
      {/* ── Bell Icon Button ── */}
      <button
        type="button"
        onClick={() => {
          setIsOpen((prev) => !prev);
          if (!isOpen) fetchNotifications({ silent: true });
        }}
        className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 active:scale-95 transition-all shadow-2xs cursor-pointer"
        aria-label="View notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-extrabold text-white shadow-sm animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* ── Mobile Dim Backdrop Overlay ── */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-[99998] sm:hidden"
        />
      )}

      {/* ── Dropdown Popover (Mobile Responsive Fixed Sheet + Desktop Popover) ── */}
      {isOpen && (
        <div
          className={`fixed inset-x-3 top-16 sm:inset-x-auto sm:top-auto sm:absolute ${positionClass} sm:w-96 max-w-[calc(100vw-1.5rem)] sm:max-w-[400px] rounded-2xl border border-slate-200 bg-white shadow-2xl z-[99999] overflow-hidden animate-fade-in`}
          style={{ boxShadow: "0 25px 60px -12px rgba(15, 23, 42, 0.3)" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/90 px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 leading-tight">
                  Notifications
                </h3>
                <p className="text-[10px] font-semibold text-slate-400">
                  {isSeller ? "Seller alerts & updates" : "Order & account updates"}
                </p>
              </div>
              {unreadCount > 0 && (
                <span className="ml-1 rounded-full bg-rose-500 px-2 py-0.5 text-[10px] font-extrabold text-white">
                  {unreadCount} new
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllAsRead}
                className="flex items-center gap-1 rounded-lg bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-blue-600 hover:bg-blue-100 transition active:scale-95 cursor-pointer"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Mark all read
              </button>
            )}
          </div>

          {/* List Content */}
          <div className="max-h-[60vh] sm:max-h-[420px] overflow-y-auto divide-y divide-slate-100 no-scrollbar">
            {loading && notifications.length === 0 ? (
              <div className="py-12 text-center text-xs font-semibold text-slate-400">
                <div className="mx-auto mb-2.5 h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                Loading notifications...
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-12 text-center px-4">
                <div className="mx-auto mb-2.5 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                  <Bell className="h-6 w-6" />
                </div>
                <p className="text-xs font-extrabold text-slate-700">All caught up!</p>
                <p className="text-[11px] font-medium text-slate-400 mt-1">
                  No notifications yet / कोई नई सूचना नहीं
                </p>
              </div>
            ) : (
              notifications.map((item) => {
                const { icon: ItemIcon, bg, pillBg, tag } = getNotificationIcon(
                  item.type,
                  item.title
                );
                const isUnread = !item.is_read;

                return (
                  <div
                    key={item.id}
                    onClick={() => handleItemClick(item)}
                    className={`group relative flex items-start gap-3.5 p-3.5 cursor-pointer transition-all ${
                      isUnread
                        ? "bg-blue-50/50 hover:bg-blue-50/80 border-l-4 border-l-blue-600"
                        : "bg-white hover:bg-slate-50 border-l-4 border-l-transparent"
                    }`}
                  >
                    {/* Category Icon */}
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${bg} shadow-2xs mt-0.5`}
                    >
                      <ItemIcon className="h-5 w-5" />
                    </div>

                    {/* Main Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold tracking-wider border shrink-0 ${pillBg}`}>
                            {tag}
                          </span>
                          <p
                            className={`text-xs font-bold truncate ${
                              isUnread ? "text-slate-900" : "text-slate-700"
                            }`}
                          >
                            {item.title || "Notification"}
                          </p>
                        </div>
                        <span className="flex items-center gap-0.5 text-[10px] font-semibold text-slate-400 shrink-0">
                          <Clock size={10} />
                          {formatTimeAgo(item.created_at)}
                        </span>
                      </div>

                      <p className="text-[11.5px] font-medium text-slate-600 line-clamp-2 leading-relaxed">
                        {item.message}
                      </p>
                    </div>

                    <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-slate-600 shrink-0 self-center transition-transform group-hover:translate-x-0.5" />
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-slate-100 bg-slate-50/80 px-4 py-2.5 flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-400">
              {notifications.length} total
            </span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-1 px-3 py-1 rounded-lg bg-slate-200/80 hover:bg-slate-200 text-slate-700 text-[11px] font-bold transition active:scale-95 cursor-pointer"
            >
              <X size={13} />
              Close
            </button>
          </div>
        </div>
      )}

      {/* ── Real-time Toast Alert Popup ── */}
      {toastAlert && (
        <div className="fixed top-16 right-4 z-[999999] max-w-sm w-full animate-bounce-in">
          <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xl">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-extrabold text-slate-900">{toastAlert.title}</h4>
              <p className="text-[11.5px] font-medium text-slate-600 mt-0.5 line-clamp-2 leading-snug">
                {toastAlert.message}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setToastAlert(null)}
              className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
