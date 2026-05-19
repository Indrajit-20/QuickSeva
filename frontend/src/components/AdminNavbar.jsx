import React from "react";
import { Link, useNavigate } from "react-router-dom";

const AdminNavbar = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("userRole");
    localStorage.removeItem("adminEmail");
    navigate("/");
  };

  return (
    <nav className="bg-indigo-950 shadow-lg border-b border-indigo-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link
            to="/admin/dashboard"
            className="text-indigo-300 font-bold text-xl"
          >
            Admin Panel
          </Link>

          <div className="flex items-center space-x-4">
            <Link
              to="/admin/dashboard"
              className="text-indigo-100 hover:text-red-400 font-semibold"
            >
              Dashboard
            </Link>
            <Link
              to="#"
              className="text-indigo-100 hover:text-red-400 font-semibold"
            >
              Reports
            </Link>
            <button
              onClick={handleLogout}
              className="px-3 py-2 rounded bg-red-600 text-white font-semibold"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default AdminNavbar;
