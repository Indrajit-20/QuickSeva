import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ContractorRoute() {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-800 font-sans">
        <div className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-white border border-slate-200 shadow-xl max-w-xs w-full text-center">
          <div className="h-9 w-9 animate-spin rounded-full border-4 border-slate-100 border-t-amber-600" />
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Loading Contractor Portal...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Allow users with role 'contractor', 'seller', or 'admin'
  if (user?.role !== "contractor" && user?.role !== "seller" && user?.role !== "admin") {
    return <Navigate to="/contractor-register" replace />;
  }

  return <Outlet />;
}
