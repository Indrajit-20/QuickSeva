import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const getInitials = (name) => {
  if (!name) return "U";
  const parts = String(name).trim().split(/\s+/).filter(Boolean);

  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
};

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, logout } = useAuth();

  const initials = useMemo(() => getInitials(user?.name), [user?.name]);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleLogout = () => {
    logout();
    setIsMenuOpen(false);
  };

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
