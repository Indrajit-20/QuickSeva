import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function SellerRoute() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (user?.role !== "seller") return <Navigate to="/unauthorized" replace />;

  const profileCompleted = Number(user?.profile_completed ?? 0);
  if (profileCompleted === 0 && location.pathname !== "/seller/profile") {
    return <Navigate to="/seller/profile" replace />;
  }

  const servicesCount = Number(user?.services_count ?? 0);
  if (
    profileCompleted === 1 &&
    servicesCount === 0 &&
    !["/seller/profile", "/seller/services"].includes(location.pathname)
  ) {
    return <Navigate to="/seller/services" replace />;
  }

  return <Outlet />;
}
