import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import QuickSevaLoader from "./QuickSevaLoader";

export default function AdminRoute() {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <QuickSevaLoader />;
  }

  const isAdmin = Boolean(isAuthenticated && user?.role === "admin");

  if (!isAdmin) return <Navigate to="/admin/login" replace />;

  return <Outlet />;
}
