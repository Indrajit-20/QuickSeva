import { NavLink, useLocation } from "react-router-dom";
import { Search, Home, CalendarCheck, User, Compass } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const guestItems = [
  { label: "Home", path: "/", icon: Home },
  { label: "Search", path: null, icon: Search, action: "search" },
  { label: "Services", path: "/services", icon: Compass },
  { label: "Login", path: "/login", icon: User },
];

const userItems = [
  { label: "Home", path: "/", icon: Home },
  { label: "Search", path: null, icon: Search, action: "search" },
  { label: "Bookings", path: "/my-bookings", icon: CalendarCheck },
  { label: "Me", path: "/profile", icon: User },
];

export default function BottomNavUser() {
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const items = isAuthenticated ? userItems : guestItems;

  const handleSearchClick = (e) => {
    e.preventDefault();
    window.dispatchEvent(new CustomEvent("open-global-search"));
  };

  return (
    <nav className="bottom-nav-bar bottom-nav-bar--user" aria-label="Quick navigation">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = item.path && location.pathname === item.path;
        const isSearch = item.action === "search";

        if (isSearch) {
          return (
            <button
              key="search"
              type="button"
              className="bottom-nav-item"
              onClick={handleSearchClick}
            >
              <span className="bottom-nav-icon-wrap">
                <Icon size={20} strokeWidth={1.8} />
              </span>
              <span className="bottom-nav-label">{item.label}</span>
            </button>
          );
        }

        return (
          <NavLink
            key={item.path}
            to={item.path}
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
