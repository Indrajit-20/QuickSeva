import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function AdminRoute() {
  const { user, isAuthenticated, isLoading } = useAuth();

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

  const isAdmin = Boolean(isAuthenticated && user?.role === "admin");

  if (!isAdmin) return <Navigate to="/admin/login" replace />;

  return <Outlet />;
}
