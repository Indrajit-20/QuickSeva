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
      <div className="min-h-screen flex items-center justify-center text-white bg-[#0f0e1a]">
        Loading...
      </div>
    );
  }

  // Case 1: Not Authenticated
  if (!isAuthenticated) {
    if (guestOnly || allowGuests) {
      return <Outlet />;
    }
    return <Navigate to="/login" replace />;
  }

  // Case 2: Authenticated as Admin
  if (user?.role === "admin") {
    return <Navigate to="/admin/dashboard" replace />;
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
