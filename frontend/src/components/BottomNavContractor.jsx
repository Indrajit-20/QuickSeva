import { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  MessageSquare,
  Building2,
  Plus,
  User,
} from "lucide-react";

const contractorBottomItems = [
  { label: "Home", path: "/contractor/dashboard", icon: LayoutDashboard },
  { label: "Leads", path: "/contractor/quotes", icon: MessageSquare },
  { label: "Post", path: "/contractor/create-post", icon: Plus, isCenter: true },
  { label: "Listings", path: "/contractor/posts", icon: Building2 },
  { label: "Profile", path: "/contractor/profile", icon: User },
];

export default function BottomNavContractor() {
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
      className={`bottom-nav-bar bottom-nav-bar--contractor ${isKeyboardVisible ? "bottom-nav-bar--hidden" : ""}`}
      aria-label="Contractor quick navigation"
    >
      {contractorBottomItems.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.path;

        if (item.isCenter) {
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className="bottom-nav-item flex flex-col items-center justify-center -mt-5 group z-20"
              title="Post Work Site Requirement"
            >
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-gradient-to-tr from-amber-600 via-amber-500 to-amber-400 text-white shadow-lg shadow-amber-600/35 flex items-center justify-center border-2 border-white transition-all transform group-hover:scale-110 active:scale-90">
                <Plus size={22} strokeWidth={3} />
              </div>
              <span className="text-[10px] font-black text-amber-700 tracking-tight mt-0.5">
                {item.label}
              </span>
            </NavLink>
          );
        }

        return (
          <NavLink
            key={item.path}
            to={item.path}
            className={`bottom-nav-item ${isActive ? "bottom-nav-item--active" : ""}`}
          >
            <span className="bottom-nav-icon-wrap">
              <Icon size={21} strokeWidth={isActive ? 2.5 : 1.8} />
            </span>
            <span className="bottom-nav-label">{item.label}</span>
            {isActive && <span className="bottom-nav-indicator" />}
          </NavLink>
        );
      })}
    </nav>
  );
}
