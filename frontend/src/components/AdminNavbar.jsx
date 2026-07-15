import React from "react";
import { Link, useNavigate } from "react-router-dom";

const AdminNavbar = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("userRole");
    localStorage.removeItem("isAdminAuthenticated");
    localStorage.removeItem("adminUsername");
    localStorage.removeItem("adminEmail");
    navigate("/");
  };

  return (
    <nav className="bg-white shadow-xs border-b border-slate-200 text-left">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link
            to="/admin/dashboard"
            className="text-slate-800 font-bold text-xl"
          >
            Admin Panel
          </Link>

          <div className="flex items-center space-x-4">
            <Link
              to="/admin/dashboard"
              className="text-slate-600 hover:text-blue-600 font-bold text-sm"
            >
              Dashboard
            </Link>
            <Link
              to="#"
              className="text-slate-600 hover:text-blue-600 font-bold text-sm"
            >
              Reports
            </Link>
            <button
              onClick={handleLogout}
              className="px-4 py-2 rounded-xl bg-red-50 border border-red-200 text-red-700 font-bold text-xs hover:bg-red-100 transition cursor-pointer"
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
