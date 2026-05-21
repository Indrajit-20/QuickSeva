import React, { useMemo, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useNearbyLocation } from "./NearbyServices";

const getInitials = (name) => {
  if (!name) return "U";
  const parts = String(name).trim().split(/\s+/).filter(Boolean);

  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
};

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isPartnerOpen, setIsPartnerOpen] = useState(false);
  const partnerRef = useRef(null);
  const { user, logout } = useAuth();
  const { address, loading } = useNearbyLocation();

  const initials = useMemo(() => getInitials(user?.name), [user?.name]);

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

  return (
    <nav className="bg-indigo-950 shadow-lg border-b border-indigo-900">
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

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-6">
            <Link
              to="/"
              className="text-indigo-100 hover:text-red-400 font-semibold transition-colors duration-300"
            >
              Home
            </Link>

            {user ? (
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-3 bg-indigo-900/40 border border-indigo-500/30 rounded-full px-3 py-1.5">
                  <div className="w-9 h-9 rounded-full bg-red-500/90 text-white flex items-center justify-center font-bold">
                    {initials}
                  </div>
                  <div className="hidden lg:block">
                    <span className="text-indigo-100 font-semibold max-w-[160px] truncate inline-block">
                      {user.name || "User"}
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  className="px-3 py-2 rounded bg-red-600 text-white font-semibold hover:bg-red-700 transition-colors"
                >
                  Logout
                </button>
              </div>
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
              className={`block w-6 h-0.5 bg-red-500 mb-1.5 transition-transform duration-300 ${
                isMenuOpen ? "rotate-45 translate-y-2" : ""
              }`}
            ></span>
            <span
              className={`block w-6 h-0.5 bg-red-500 transition-opacity duration-300 ${
                isMenuOpen ? "opacity-0" : ""
              }`}
            ></span>
            <span
              className={`block w-6 h-0.5 bg-red-500 transition-transform duration-300 ${
                isMenuOpen ? "-rotate-45 -translate-y-2" : ""
              }`}
            ></span>
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 space-y-3 animate-fade-in-down">
            <Link
              to="/"
              onClick={() => setIsMenuOpen(false)}
              className="block text-indigo-100 hover:text-red-400 font-semibold py-2 px-3 rounded-lg hover:bg-indigo-900 transition-colors"
            >
              Home
            </Link>

            {user ? (
              <div className="space-y-3 pt-2">
                <div className="flex items-center space-x-3 bg-indigo-900/40 border border-indigo-500/30 rounded-xl px-3 py-2">
                  <div className="w-9 h-9 rounded-full bg-red-500/90 text-white flex items-center justify-center font-bold">
                    {initials}
                  </div>
                  <div>
                    <div className="text-indigo-100 font-semibold">
                      {user.name || "User"}
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  className="w-full px-3 py-2 rounded bg-red-600 text-white font-semibold hover:bg-red-700 transition-colors"
                >
                  Logout
                </button>
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
    </nav>
  );
};

export default Navbar;
