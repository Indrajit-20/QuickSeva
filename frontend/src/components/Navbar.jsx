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

import { Search, MapPin, Globe, CalendarCheck, Wrench, LayoutDashboard, Building2 } from "lucide-react";
import SearchOverlay from "./SearchOverlay";

import NotificationBell from "./NotificationBell";

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

  const handleHomeClick = (e) => {
    try {
      sessionStorage.removeItem("qs_nearby_search_cache");
    } catch { }
    if (window.location.pathname === "/" && window.location.search) {
      e?.preventDefault?.();
      window.location.href = "/";
    } else {
      window.scrollTo({ top: 0, behavior: "instant" });
    }
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-[#e5e7eb] bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0" onClick={handleHomeClick}>
            <span className="text-xl sm:text-2xl font-bold text-[#0284c7] tracking-tight"
              style={{ fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif" }}>
              QuickSeva
            </span>
          </Link>

          {/* Desktop Nav Links — icon-only on md, icon+text on lg */}
          <div className="hidden md:flex items-center gap-1 lg:gap-1.5">
            <Link
              to="/"
              onClick={handleHomeClick}
              title="Nearby Map"
              className="flex items-center gap-1.5 px-2.5 lg:px-3 py-1.5 rounded-lg text-[13px] font-medium text-slate-600 transition-all duration-200 hover:text-[#0284c7] hover:bg-sky-50/60"
            >
              <MapPin className="h-4 w-4 text-rose-500 shrink-0" />
              <span className="hidden lg:inline">Nearby</span>
            </Link>

            <Link
              to="/contractor-hub"
              onClick={() => window.scrollTo({ top: 0, behavior: "instant" })}
              title="Contractors & Site Work"
              className="flex items-center gap-1.5 px-2.5 lg:px-3 py-1.5 rounded-lg text-[13px] font-medium text-slate-600 transition-all duration-200 hover:text-amber-700 hover:bg-amber-50/60"
            >
              <Building2 className="h-4 w-4 text-amber-600 shrink-0" />
              <span className="hidden lg:inline">Site Work</span>
            </Link>

            <Link
              to="/services"
              onClick={() => window.scrollTo({ top: 0, behavior: "instant" })}
              title="All India Services"
              className="flex items-center gap-1.5 px-2.5 lg:px-3 py-1.5 rounded-lg text-[13px] font-medium text-slate-600 transition-all duration-200 hover:text-[#0284c7] hover:bg-sky-50/60"
            >
              <Globe className="h-4 w-4 text-blue-600 shrink-0" />
              <span className="hidden lg:inline">All India</span>
            </Link>

            {isAuthenticated && activeRole === "seller" ? (
              <>
                <Link
                  to="/seller/services"
                  title="My Services"
                  className="flex items-center gap-1.5 px-2.5 lg:px-3 py-1.5 rounded-lg text-[13px] font-medium text-slate-600 transition-all duration-200 hover:text-amber-700 hover:bg-amber-50/60"
                >
                  <Wrench className="h-4 w-4 text-amber-500 shrink-0" />
                  <span className="hidden lg:inline">Services</span>
                </Link>
                <Link
                  to="/seller/dashboard"
                  title="Seller Dashboard"
                  className="flex items-center gap-1.5 px-2.5 lg:px-3 py-1.5 rounded-lg text-[13px] font-medium text-slate-600 transition-all duration-200 hover:text-indigo-600 hover:bg-indigo-50/60"
                >
                  <LayoutDashboard className="h-4 w-4 text-indigo-600 shrink-0" />
                  <span className="hidden lg:inline">Dashboard</span>
                </Link>
              </>
            ) : isAuthenticated && (
              <Link
                to="/my-bookings"
                title="My Bookings"
                className="flex items-center gap-1.5 px-2.5 lg:px-3 py-1.5 rounded-lg text-[13px] font-medium text-slate-600 transition-all duration-200 hover:text-emerald-600 hover:bg-emerald-50/60"
              >
                <CalendarCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                <span className="hidden lg:inline">Bookings</span>
              </Link>
            )}
          </div>

          {/* Desktop Right — Separator + User badge + Bell + Profile */}
          <div className="hidden md:flex items-center gap-2 shrink-0">
            {/* Subtle vertical separator */}
            <div className="w-px h-6 bg-slate-200 mx-1" />

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
                <span>
                  {activeRole === "seller" ? "Seller" : "User"}
                </span>
              </div>
            )}
            {user ? (
              <>
                <NotificationBell isSeller={activeRole === "seller"} />
                <ProfileDropdown user={user} onLogout={handleLogout} />
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-3 py-1.5 text-[13px] font-semibold text-slate-700 rounded-lg hover:text-[#0284c7] hover:bg-slate-50 transition-colors duration-200"
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
                    className="list-none cursor-pointer px-3 py-1.5 text-[13px] font-semibold text-slate-700 rounded-lg hover:text-[#4f46e5] hover:bg-slate-50 transition-colors duration-200"
                    onClick={() => setIsPartnerOpen(true)}
                  >
                    Become a partner
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

          {/* Mobile Right Controls: Notification Bell + Hamburger Button */}
          <div className="flex items-center gap-2 md:hidden">
            {user && <NotificationBell isSeller={activeRole === "seller"} align="right" />}
            <button
              onClick={toggleMenu}
              aria-label="Toggle Menu"
              className="flex h-9 w-9 flex-col items-center justify-center rounded-lg transition hover:bg-[#0284c7]/10 active:scale-95"
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
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 space-y-3 animate-fade-in-down">

            <Link
              to="/"
              onClick={(e) => {
                setIsMenuOpen(false);
                handleHomeClick(e);
              }}
              className="flex items-center gap-2 rounded-lg px-3 py-2 font-semibold text-[#1a1a1a] transition-colors hover:bg-[#f8f9fb] hover:text-[#4f46e5]"
            >
              <MapPin className="h-4 w-4 text-rose-500 shrink-0" />
              <span>Nearby Map (GPS)</span>
            </Link>

            <Link
              to="/contractor-hub"
              onClick={() => {
                setIsMenuOpen(false);
                window.scrollTo({ top: 0, behavior: "instant" });
              }}
              className="flex items-center gap-2 rounded-lg px-3 py-2 font-bold text-amber-800 bg-amber-50 border border-amber-200 transition-colors"
            >
              <Building2 className="h-4 w-4 text-amber-600 shrink-0" />
              <span>Contractors & Site Work</span>
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
