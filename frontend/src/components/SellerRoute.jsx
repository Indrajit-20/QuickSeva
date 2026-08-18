import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function SellerRoute() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-800 font-sans">
        <div className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-white border border-slate-200 shadow-xl max-w-xs w-full text-center">
          <div className="h-9 w-9 animate-spin rounded-full border-4 border-slate-100 border-t-indigo-600" />
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  const isSeller = user?.role === "seller" || Boolean(user?.has_seller_profile) || Boolean(user?.seller_id);
  if (!isSeller) return <Navigate to="/unauthorized" replace />;

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
