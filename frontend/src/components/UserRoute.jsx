import { useState, useEffect } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function UserRoute({ allowGuests = false, guestOnly = false }) {
  const { user, isAuthenticated, isLoading, activeRole } = useAuth();
  const [initialLoadDone, setInitialLoadDone] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      setInitialLoadDone(true);
    }
  }, [isLoading]);

  if (isLoading && !initialLoadDone) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-800 font-sans">
        <div className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-white border border-slate-200 shadow-xl max-w-xs w-full text-center">
          <div className="h-9 w-9 animate-spin rounded-full border-4 border-slate-100 border-t-indigo-600" />
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Loading...</p>
        </div>
      </div>
    );
  }

  // Case 1: Authenticated as Admin -> Force redirect to Admin Dashboard
  // This prevents admins from accessing or seeing the customer-facing interface.
  if (isAuthenticated && user?.role === "admin") {
    return <Navigate to="/admin/dashboard" replace />;
  }

  // If a route allows guests, anyone (authenticated or not, seller, buyer) can view it.
  if (allowGuests) {
    return <Outlet />;
  }

  // Case 2: Not Authenticated
  if (!isAuthenticated) {
    if (guestOnly) {
      return <Outlet />;
    }
    return <Navigate to="/login" replace />;
  }

  // Case 3: Authenticated as Seller
  if (user?.role === "seller" && activeRole === "seller") {
    return <Navigate to="/seller/dashboard" replace />;
  }

  // Case 4: Authenticated as Buyer (User)
  if (guestOnly) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
