import React, { useMemo, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useNearbyLocation } from "../hooks/useNearbyLocation";
import ProfileDropdown from "./ProfileDropdown";

const ALL_SERVICES = [
  "Cleaning",
  "Electrical",
  "Plumbing",
  "Carpentry",
  "AC Repair",
  "Pest Control",
  "Home Painting",
  "Appliance Repair",
];

const getInitials = (name) => {
  if (!name) return "U";
  const parts = String(name).trim().split(/\s+/).filter(Boolean);

  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
};

import { Search, MapPin, Globe, CalendarCheck, Wrench, LayoutDashboard } from "lucide-react";
import SearchOverlay from "./SearchOverlay";

function NavbarSearch({ className = "", onTriggerSearch }) {
  return (
    <div className={`relative ${className}`}>
      <div
        onClick={onTriggerSearch}
        className="group relative flex h-10 w-full cursor-pointer items-center rounded-full border border-slate-200 bg-slate-50 px-4 transition-all duration-200 hover:border-indigo-400 hover:bg-white hover:shadow-md hover:shadow-indigo-500/5"
      >
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-slate-400 group-hover:text-indigo-500 transition-colors" />
          <span className="text-sm text-slate-400 group-hover:text-slate-600 transition-colors">
            Search services e.g. Plumber...
          </span>
        </div>
      </div>
    </div>
  );
}

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isPartnerOpen, setIsPartnerOpen] = useState(false);
  const [isSearchOverlayOpen, setIsSearchOverlayOpen] = useState(false);
  const partnerRef = useRef(null);
  const { user, isAuthenticated, logout, activeRole } = useAuth();
  const { address, loading } = useNearbyLocation();

  const initials = useMemo(() => getInitials(user?.name), [user?.name]);
  void initials;

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleLogout = () => {
    logout();
    setIsMenuOpen(false);
    setIsPartnerOpen(false);
  };

  useEffect(() => {
    const onDocMouseDown = (e) => {
      if (!isPartnerOpen) return;
      const el = partnerRef.current;
      if (!el) return;
      if (el.contains(e.target)) return;
      setIsPartnerOpen(false);
    };

    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, [isPartnerOpen]);

  useEffect(() => {
    const handleOpenGlobalSearch = () => {
      setIsSearchOverlayOpen(true);
    };
    window.addEventListener("open-global-search", handleOpenGlobalSearch);
    return () => window.removeEventListener("open-global-search", handleOpenGlobalSearch);
  }, []);

  return (
    <nav className="sticky top-0 z-50 border-b border-[#e5e7eb] bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2" onClick={() => window.scrollTo({ top: 0, behavior: "instant" })}>
            <span className="text-xl sm:text-2xl font-bold text-[#0284c7] tracking-tight"
              style={{ fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif" }}>
              QuickSeva
            </span>
          </Link>

          <div className="hidden max-w-[260px] items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-500 sm:flex">
            <MapPin className="h-3.5 w-3.5 text-rose-500 shrink-0" />
            <span className="truncate font-semibold">
              {loading ? "Locating..." : address || "Allow location"}
            </span>
          </div>



          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-6">
            <Link
              to="/"
              onClick={() => window.scrollTo({ top: 0, behavior: "instant" })}
              className="flex items-center gap-1.5 text-sm font-medium text-slate-700 transition-colors duration-200 hover:text-[#0284c7]"
            >
              <MapPin className="h-3.5 w-3.5 text-rose-500 shrink-0" />
              <span>Nearby Map</span>
            </Link>

            <Link
              to="/services"
              onClick={() => window.scrollTo({ top: 0, behavior: "instant" })}
              className="flex items-center gap-1.5 text-sm font-medium text-slate-700 transition-colors duration-200 hover:text-[#0284c7]"
            >
              <Globe className="h-3.5 w-3.5 text-blue-600 shrink-0" />
              <span>All India Services</span>
            </Link>

            {isAuthenticated && activeRole === "seller" ? (
              <>
                <Link
                  to="/seller/services"
                  className="flex items-center gap-1.5 text-sm font-medium text-slate-700 transition-colors duration-200 hover:text-[#0284c7]"
                >
                  <Wrench className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                  <span>My Services</span>
                </Link>
                <Link
                  to="/seller/dashboard"
                  className="flex items-center gap-1.5 text-sm font-medium text-slate-700 transition-colors duration-200 hover:text-[#0284c7]"
                >
                  <LayoutDashboard className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
                  <span>Dashboard</span>
                </Link>
              </>
            ) : isAuthenticated && (
              <Link
                to="/my-bookings"
                className="flex items-center gap-1.5 text-sm font-medium text-slate-700 transition-colors duration-200 hover:text-[#0284c7]"
              >
                <CalendarCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                <span>My Bookings</span>
              </Link>
            )}

            {user && (
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "5px",
                padding: "3px 10px",
                borderRadius: "999px",
                background: activeRole === "seller"
                  ? "rgba(24,95,165,0.1)"
                  : "rgba(15,110,86,0.1)",
                border: activeRole === "seller"
                  ? "1px solid rgba(24,95,165,0.28)"
                  : "1px solid rgba(15,110,86,0.28)",
                fontSize: "11px",
                fontWeight: 600,
                color: activeRole === "seller" ? "#0284c7" : "#0F6E56"
              }}>
                <span style={{
                  width: "6px", height: "6px",
                  borderRadius: "50%",
                  background: activeRole === "seller" ? "#0284c7" : "#0F6E56",
                  display: "inline-block"
                }} />
                <span className="hidden sm:inline">
                  {activeRole === "seller" ? "Seller" : "User"}
                </span>
              </div>
            )}
            {user ? (
              <ProfileDropdown user={user} onLogout={handleLogout} />
            ) : (
              <>
                <Link
                  to="/login"
                  className="font-semibold text-[#1a1a1a] transition-colors duration-300 hover:text-[#4f46e5]"
                >
                  Login
                </Link>
                <div
                  className="relative"
                  ref={partnerRef}
                  onMouseEnter={() => setIsPartnerOpen(true)}
                >
                  <button
                    type="button"
                    className="list-none cursor-pointer"
                    onClick={() => setIsPartnerOpen(true)}
                  >
                    <span className="font-semibold text-[#1a1a1a] transition-colors duration-300 hover:text-[#4f46e5]">
                      Become a partner
                    </span>
                  </button>

                  {isPartnerOpen && (
                    <div
                      className="absolute right-0 mt-2 w-64 rounded-xl border border-[#e5e7eb] bg-white p-4 shadow-lg"
                      onMouseLeave={() => setIsPartnerOpen(false)}
                    >
                      <div className="mb-2 font-semibold text-[#1a1a1a]">
                        Seller / Partner registration
                      </div>
                      <div className="mb-3 text-sm leading-relaxed text-[#6b7280]">
                        Register, fill your details, and start onboarding with
                        QuickSeva.
                      </div>
                      <Link
                        to="/seller-register"
                        onClick={() => {
                          setIsMenuOpen(false);
                          setIsPartnerOpen(false);
                        }}
                        className="btn-partner-register"
                      >
                        Register as Seller
                      </Link>
                    </div>
                  )}
                </div>
                <Link to="/register" className="btn btn-primary">
                  Register
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={toggleMenu}
            aria-label="Toggle Menu"
            className="flex h-9 w-9 flex-col items-center justify-center rounded-lg transition hover:bg-[#0284c7]/10 active:scale-95 md:hidden"
          >
            <span
              className={`mb-1 block h-0.5 w-5 bg-[#e53935] rounded-full transition-transform duration-300 ${isMenuOpen ? "rotate-45 translate-y-1.5" : ""
                }`}
            ></span>
            <span
              className={`block h-0.5 w-5 bg-[#e53935] rounded-full transition-opacity duration-300 ${isMenuOpen ? "opacity-0" : ""
                }`}
            ></span>
            <span
              className={`mt-1 block h-0.5 w-5 bg-[#e53935] rounded-full transition-transform duration-300 ${isMenuOpen ? "-rotate-45 -translate-y-1.5" : ""
                }`}
            ></span>
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 space-y-3 animate-fade-in-down">


            <Link
              to="/"
              onClick={() => {
                setIsMenuOpen(false);
                window.scrollTo({ top: 0, behavior: "instant" });
              }}
              className="flex items-center gap-2 rounded-lg px-3 py-2 font-semibold text-[#1a1a1a] transition-colors hover:bg-[#f8f9fb] hover:text-[#4f46e5]"
            >
              <MapPin className="h-4 w-4 text-rose-500 shrink-0" />
              <span>Nearby Map (GPS)</span>
            </Link>

            <Link
              to="/services"
              onClick={() => {
                setIsMenuOpen(false);
                window.scrollTo({ top: 0, behavior: "instant" });
              }}
              className="flex items-center gap-2 rounded-lg px-3 py-2 font-semibold text-[#1a1a1a] transition-colors hover:bg-[#f8f9fb] hover:text-[#4f46e5]"
            >
              <Globe className="h-4 w-4 text-blue-600 shrink-0" />
              <span>All India Services (City Search)</span>
            </Link>

            {isAuthenticated && activeRole === "seller" ? (
              <>
                <Link
                  to="/seller/services"
                  onClick={() => setIsMenuOpen(false)}
                  className="block rounded-lg px-3 py-2 font-semibold text-[#1a1a1a] transition-colors hover:bg-[#f8f9fb] hover:text-[#4f46e5]"
                >
                  My Services
                </Link>
                <Link
                  to="/seller/dashboard"
                  onClick={() => setIsMenuOpen(false)}
                  className="block rounded-lg px-3 py-2 font-semibold text-[#1a1a1a] transition-colors hover:bg-[#f8f9fb] hover:text-[#4f46e5]"
                >
                  Dashboard
                </Link>
              </>
            ) : isAuthenticated && (
              <Link
                to="/my-bookings"
                onClick={() => setIsMenuOpen(false)}
                className="block rounded-lg px-3 py-2 font-semibold text-[#1a1a1a] transition-colors hover:bg-[#f8f9fb] hover:text-[#4f46e5]"
              >
                My Bookings
              </Link>
            )}

            {user ? (
              <div className="space-y-3 pt-2">
                <div className="flex justify-center">
                  <ProfileDropdown user={user} onLogout={handleLogout} />
                </div>
              </div>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setIsMenuOpen(false)}
                  className="block rounded-lg px-3 py-2 font-semibold text-[#1a1a1a] transition-colors hover:bg-[#f8f9fb] hover:text-[#4f46e5]"
                >
                  Login
                </Link>
                <div className="rounded-xl border border-[#e5e7eb] bg-white p-3">
                  <div className="mb-1 font-semibold text-[#1a1a1a]">
                    Become a partner
                  </div>
                  <div className="mb-2 text-xs leading-relaxed text-[#6b7280]">
                    Seller registration and onboarding form.
                  </div>
                  <Link
                    to="/seller-register"
                    onClick={() => setIsMenuOpen(false)}
                    className="btn-partner-register"
                  >
                    Register as Seller
                  </Link>
                </div>
                <Link
                  to="/register"
                  onClick={() => setIsMenuOpen(false)}
                  className="block btn btn-primary w-full text-center"
                >
                  Register
                </Link>
              </>
            )}
          </div>
        )}
      </div>
      <SearchOverlay isOpen={isSearchOverlayOpen} onClose={() => setIsSearchOverlayOpen(false)} />
    </nav>
  );
};

export default Navbar;
