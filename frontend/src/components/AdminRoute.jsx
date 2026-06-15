import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function AdminRoute() {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );

  const isAdmin = Boolean(isAuthenticated && user?.role === "admin");

  if (!isAdmin) return <Navigate to="/admin/login" replace />;

  return <Outlet />;
}
