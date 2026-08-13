import { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { MapPin, CalendarCheck, User, Globe, Building2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import apiClient from "../api/axiosConfig";

const guestItems = [
  { label: "Nearby", path: "/", icon: MapPin },
  { label: "All India", path: "/services", icon: Globe },
  { label: "Site Work", path: "/contractor-hub", icon: Building2 },
  { label: "Bookings", path: "/my-bookings", icon: CalendarCheck },
  { label: "Login", path: "/login", icon: User },
];

const userItems = [
  { label: "Nearby", path: "/", icon: MapPin },
  { label: "All India", path: "/services", icon: Globe },
  { label: "Site Work", path: "/contractor-hub", icon: Building2 },
  { label: "Bookings", path: "/my-bookings", icon: CalendarCheck },
  { label: "Me", path: "/profile", icon: User },
];

export default function BottomNavUser() {
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const handleFocusIn = (e) => {
      if (
        e.target &&
        (e.target.tagName === "INPUT" ||
          e.target.tagName === "TEXTAREA" ||
          e.target.isContentEditable)
      ) {
        setIsKeyboardVisible(true);
      }
    };
    const handleFocusOut = () => {
      setIsKeyboardVisible(false);
    };

    document.addEventListener("focusin", handleFocusIn);
    document.addEventListener("focusout", handleFocusOut);
    return () => {
      document.removeEventListener("focusin", handleFocusIn);
      document.removeEventListener("focusout", handleFocusOut);
    };
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchUnread = async () => {
      try {
        const res = await apiClient.get("/notifications?page=1&limit=20");
        const count = Number(res?.data?.data?.unread || 0);
        setUnreadCount(count);
      } catch {
        // silent catch
      }
    };

    fetchUnread();

    const handleSync = () => fetchUnread();
    window.addEventListener("notifications-updated", handleSync);

    return () => {
      window.removeEventListener("notifications-updated", handleSync);
    };
  }, [isAuthenticated]);

  useEffect(() => {
    if (location.pathname === "/my-bookings") {
      setUnreadCount(0);
    }
  }, [location.pathname]);

  const items = isAuthenticated ? userItems : guestItems;

  return (
    <nav
      className={`bottom-nav-bar bottom-nav-bar--user ${isKeyboardVisible ? "bottom-nav-bar--hidden" : ""}`}
      aria-label="Quick navigation"
    >
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.path;

        return (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={() => {
              window.scrollTo({ top: 0, behavior: "instant" });
            }}
            className={`bottom-nav-item ${isActive ? "bottom-nav-item--active" : ""}`}
          >
            <span className="bottom-nav-icon-wrap">
              <Icon size={20} strokeWidth={isActive ? 2.4 : 1.8} />
              {item.label === "Bookings" && unreadCount > 0 && (
                <span className="bottom-nav-badge">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </span>
            <span className="bottom-nav-label">{item.label}</span>
            {isActive && <span className="bottom-nav-indicator" />}
          </NavLink>
        );
      })}
    </nav>
  );
}
