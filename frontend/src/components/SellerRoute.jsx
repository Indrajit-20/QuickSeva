import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function SellerRoute() {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );

  const isSeller = Boolean(isAuthenticated && user?.role === "seller");

  if (!isSeller) return <Navigate to="/login" replace />;

  return <Outlet />;
}
