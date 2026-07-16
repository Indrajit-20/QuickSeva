import { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Home, CalendarCheck, User, Compass } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const guestItems = [
  { label: "Home", path: "/", icon: Home },
  { label: "Services", path: "/services", icon: Compass },
  { label: "Bookings", path: "/my-bookings", icon: CalendarCheck },
  { label: "Login", path: "/login", icon: User },
];

const userItems = [
  { label: "Home", path: "/", icon: Home },
  { label: "Services", path: "/services", icon: Compass },
  { label: "Bookings", path: "/my-bookings", icon: CalendarCheck },
  { label: "Me", path: "/profile", icon: User },
];

export default function BottomNavUser() {
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

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

  const items = isAuthenticated ? userItems : guestItems;

  return (
    <nav
      className={`bottom-nav-bar bottom-nav-bar--user ${
        isKeyboardVisible ? "bottom-nav-bar--hidden" : ""
      }`}
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
            </span>
            <span className="bottom-nav-label">{item.label}</span>
            {isActive && <span className="bottom-nav-indicator" />}
          </NavLink>
        );
      })}
    </nav>
  );
}

