import { useState, useEffect } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import QuickSevaLoader from "./QuickSevaLoader";

export default function UserRoute({ allowGuests = false, guestOnly = false }) {
  const { user, isAuthenticated, isLoading, activeRole } = useAuth();
  const [initialLoadDone, setInitialLoadDone] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      setInitialLoadDone(true);
    }
  }, [isLoading]);

  if (isLoading && !initialLoadDone) {
    return <QuickSevaLoader />;
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
