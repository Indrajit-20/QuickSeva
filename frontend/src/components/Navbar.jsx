import React, { useMemo, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useNearbyLocation } from "./NearbyServices";
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

import SearchOverlay from "./SearchOverlay";

function NavbarSearch({ className = "", onTriggerSearch }) {
  return (
    <div className={`relative ${className}`}>
      <div className="relative w-full">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-indigo-200">
          🔍
        </span>
        <input
          readOnly
          onClick={onTriggerSearch}
          onFocus={onTriggerSearch}
          placeholder="Search services e.g. Plumber, AC"
          className="h-9 w-full rounded-full border border-indigo-500/30 bg-indigo-950/40 py-2 pl-9 pr-10 text-sm text-white placeholder-indigo-300 focus:outline-none cursor-pointer"
        />
        <button
          type="button"
          onClick={onTriggerSearch}
          className="absolute right-1 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-xs text-indigo-100 hover:bg-indigo-800/60 cursor-pointer"
          aria-label="Search services"
        >
          ↵
        </button>
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
    <nav className="sticky top-0 z-50 bg-indigo-950 shadow-lg border-b border-indigo-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <span className="text-3xl font-bold text-indigo-300">
              QuickSeva
            </span>
          </Link>

          <div className="hidden sm:flex items-center gap-1 text-xs text-indigo-300 bg-indigo-950/50 px-3 py-1 rounded-full border border-indigo-500/20 max-w-[260px]">
            <span>📍</span>
            <span className="truncate">
              {loading ? "Locating..." : address || "Allow location"}
            </span>
          </div>

          <NavbarSearch className="hidden sm:flex w-[280px]" onTriggerSearch={() => setIsSearchOverlayOpen(true)} />

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-6">
            <Link
              to="/"
              className="text-indigo-100 hover:text-red-400 font-semibold transition-colors duration-300"
            >
              Home
            </Link>

            {isAuthenticated && activeRole === "seller" ? (
              <>
                <Link
                  to="/seller/services"
                  className="text-indigo-100 hover:text-red-400 font-semibold transition-colors duration-300"
                >
                  My Services
                </Link>
                <Link
                  to="/seller/dashboard"
                  className="text-indigo-100 hover:text-red-400 font-semibold transition-colors duration-300"
                >
                  Dashboard
                </Link>
              </>
            ) : isAuthenticated && (
              <Link
                to="/my-bookings"
                className="text-indigo-100 hover:text-red-400 font-semibold transition-colors duration-300"
              >
                My Bookings
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
                  ? "rgba(99,102,241,0.15)"
                  : "rgba(34,197,94,0.15)",
                border: activeRole === "seller"
                  ? "1px solid rgba(99,102,241,0.4)"
                  : "1px solid rgba(34,197,94,0.4)",
                fontSize: "11px",
                fontWeight: 600,
                color: activeRole === "seller" ? "#6366f1" : "#22c55e"
              }}>
                <span style={{
                  width: "6px", height: "6px",
                  borderRadius: "50%",
                  background: activeRole === "seller" ? "#6366f1" : "#22c55e",
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
                  className="text-indigo-100 hover:text-red-400 font-semibold transition-colors duration-300"
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
                    <span className="text-indigo-100 hover:text-red-400 font-semibold transition-colors duration-300">
                      Become a partner
                    </span>
                  </button>

                  {isPartnerOpen && (
                    <div
                      className="absolute right-0 mt-2 w-64 rounded-xl bg-indigo-950 border border-indigo-500/30 shadow-lg p-4"
                      onMouseLeave={() => setIsPartnerOpen(false)}
                    >
                      <div className="text-indigo-100 font-semibold mb-2">
                        Seller / Partner registration
                      </div>
                      <div className="text-indigo-200 text-sm leading-relaxed mb-3">
                        Register, fill your details, and start onboarding with
                        QuickSeva.
                      </div>
                      <Link
                        to="/seller-register"
                        onClick={() => {
                          setIsMenuOpen(false);
                          setIsPartnerOpen(false);
                        }}
                        className="block text-center bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-3 rounded-lg"
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
            className="md:hidden flex flex-col items-center justify-center w-10 h-10 rounded-md hover:bg-indigo-900 transition"
          >
            <span
              className={`block w-6 h-0.5 bg-red-500 mb-1.5 transition-transform duration-300 ${isMenuOpen ? "rotate-45 translate-y-2" : ""
                }`}
            ></span>
            <span
              className={`block w-6 h-0.5 bg-red-500 transition-opacity duration-300 ${isMenuOpen ? "opacity-0" : ""
                }`}
            ></span>
            <span
              className={`block w-6 h-0.5 bg-red-500 transition-transform duration-300 ${isMenuOpen ? "-rotate-45 -translate-y-2" : ""
                }`}
            ></span>
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 space-y-3 animate-fade-in-down">
            <NavbarSearch
              className="flex w-full"
              onTriggerSearch={() => {
                setIsMenuOpen(false);
                setIsSearchOverlayOpen(true);
              }}
            />

            <Link
              to="/"
              onClick={() => setIsMenuOpen(false)}
              className="block text-indigo-100 hover:text-red-400 font-semibold py-2 px-3 rounded-lg hover:bg-indigo-900 transition-colors"
            >
              Home
            </Link>

            {isAuthenticated && activeRole === "seller" ? (
              <>
                <Link
                  to="/seller/services"
                  onClick={() => setIsMenuOpen(false)}
                  className="block text-indigo-100 hover:text-red-400 font-semibold py-2 px-3 rounded-lg hover:bg-indigo-900 transition-colors"
                >
                  My Services
                </Link>
                <Link
                  to="/seller/dashboard"
                  onClick={() => setIsMenuOpen(false)}
                  className="block text-indigo-100 hover:text-red-400 font-semibold py-2 px-3 rounded-lg hover:bg-indigo-900 transition-colors"
                >
                  Dashboard
                </Link>
              </>
            ) : isAuthenticated && (
              <Link
                to="/my-bookings"
                onClick={() => setIsMenuOpen(false)}
                className="block text-indigo-100 hover:text-red-400 font-semibold py-2 px-3 rounded-lg hover:bg-indigo-900 transition-colors"
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
                  className="block text-indigo-100 hover:text-red-400 font-semibold py-2 px-3 rounded-lg hover:bg-indigo-900 transition-colors"
                >
                  Login
                </Link>
                <div className="rounded-xl border border-indigo-500/30 bg-indigo-950/30 p-3">
                  <div className="text-indigo-100 font-semibold mb-1">
                    Become a partner
                  </div>
                  <div className="text-indigo-200 text-xs leading-relaxed mb-2">
                    Seller registration and onboarding form.
                  </div>
                  <Link
                    to="/seller-register"
                    onClick={() => setIsMenuOpen(false)}
                    className="block w-full text-center bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-3 rounded-lg"
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
