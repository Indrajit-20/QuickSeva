import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import QuickSevaLoader from "./QuickSevaLoader";

export default function ContractorRoute() {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return <QuickSevaLoader />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const isContractor =
    user?.role === "contractor" ||
    user?.role === "seller" ||
    user?.role === "admin" ||
    user?.is_verified_contractor === 1 ||
    Boolean(user?.trade_specialization) ||
    Boolean(user?.has_contractor_profile);

  if (!isContractor) {
    return <Navigate to="/contractor-register" replace />;
  }

  return <Outlet />;
}
