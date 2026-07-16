import { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Megaphone,
  BriefcaseBusiness,
  ClipboardList,
  Wallet,
} from "lucide-react";

const sellerBottomItems = [
  { label: "Home", path: "/seller/dashboard", icon: LayoutDashboard },
  { label: "Leads", path: "/seller/dashboard/leads", icon: Megaphone },
  { label: "Services", path: "/seller/services", icon: BriefcaseBusiness },
  { label: "Orders", path: "/seller/orders", icon: ClipboardList },
  { label: "Wallet", path: "/seller/wallet", icon: Wallet },
];

export default function BottomNavSeller({ pendingOrdersCount = 0, unreadLeadsCount = 0 }) {
  const location = useLocation();
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

  return (
    <nav
      className={`bottom-nav-bar bottom-nav-bar--seller ${isKeyboardVisible ? "bottom-nav-bar--hidden" : ""}`}
      aria-label="Seller quick navigation"
    >
      {sellerBottomItems.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.path;
        const badgeCount = item.label === "Orders" ? pendingOrdersCount : item.label === "Leads" ? unreadLeadsCount : 0;
        const hasBadge = badgeCount > 0;

        return (
          <NavLink
            key={item.path}
            to={item.path}
            className={`bottom-nav-item ${isActive ? "bottom-nav-item--active" : ""}`}
          >
            <span className="bottom-nav-icon-wrap">
              <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
              {hasBadge && (
                <span className="bottom-nav-badge">
                  {badgeCount > 9 ? "9+" : badgeCount}
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
