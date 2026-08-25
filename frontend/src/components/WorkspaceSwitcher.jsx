import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { User, Store, Building2 } from "lucide-react";

const WorkspaceSwitcher = ({ onClose, className = "" }) => {
  const { user, isSeller, activeRole, switchRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const userHasSellerProfile =
    isSeller ||
    user?.role === "seller" ||
    Boolean(user?.has_seller_profile) ||
    Boolean(user?.seller_id);

  const userHasContractorProfile =
    user?.role === "contractor" ||
    user?.is_verified_contractor === 1 ||
    Boolean(user?.trade_specialization) ||
    Boolean(user?.has_contractor_profile);

  const isContractorActive = location.pathname.startsWith("/contractor");
  const isSellerActive = activeRole === "seller" && !isContractorActive;
  const isUserActive = !isSellerActive && !isContractorActive;

  const handleUserClick = () => {
    onClose?.();
    if (!isUserActive) switchRole("user");
  };

  const handleSellerClick = () => {
    onClose?.();
    if (!userHasSellerProfile) {
      navigate("/become-seller");
    } else if (!isSellerActive) {
      switchRole("seller");
    }
  };

  const handleContractorClick = () => {
    onClose?.();
    if (!userHasContractorProfile) {
      navigate("/contractor-register");
    } else {
      navigate("/contractor/dashboard");
    }
  };

  return (
    <div className={`w-full ${className}`}>
      <div className="grid grid-cols-3 gap-1 rounded-2xl bg-slate-100/90 p-1 border border-slate-200/90 shadow-inner">
        <button
          type="button"
          onClick={handleUserClick}
          className={`flex items-center justify-center gap-1 py-2 px-1.5 text-[11px] font-bold rounded-xl transition-all duration-200 cursor-pointer whitespace-nowrap ${
            isUserActive
              ? "bg-[#0284c7] text-white shadow-sm ring-1 ring-black/5"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
          }`}
        >
          <User className="w-3.5 h-3.5 shrink-0" />
          <span>Buyer</span>
        </button>

        <button
          type="button"
          onClick={handleSellerClick}
          className={`flex items-center justify-center gap-1 py-2 px-1.5 text-[11px] font-bold rounded-xl transition-all duration-200 cursor-pointer whitespace-nowrap ${
            isSellerActive
              ? "bg-indigo-600 text-white shadow-sm ring-1 ring-black/5"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
          }`}
        >
          <Store className="w-3.5 h-3.5 shrink-0" />
          <span>Seller</span>
        </button>

        <button
          type="button"
          onClick={handleContractorClick}
          className={`flex items-center justify-center gap-1 py-2 px-1.5 text-[11px] font-bold rounded-xl transition-all duration-200 cursor-pointer whitespace-nowrap ${
            isContractorActive
              ? "bg-amber-600 text-white shadow-sm ring-1 ring-black/5"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
          }`}
        >
          <Building2 className="w-3.5 h-3.5 shrink-0" />
          <span>Contractor</span>
        </button>
      </div>
    </div>
  );
};

export default WorkspaceSwitcher;
