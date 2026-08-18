import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { User, Store, Building2, Layers, Sparkles } from "lucide-react";

const WorkspaceSwitcher = ({ layout = "dropdown", onClose }) => {
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

  if (layout === "sidebar") {
    return (
      <div className="py-3 px-1">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
            <Layers className="w-3 h-3 text-indigo-500" />
            Switch Workspace
          </span>
        </div>
        <div className="grid grid-cols-3 gap-1 rounded-2xl bg-slate-100 p-1 border border-slate-200/80 shadow-inner">
          <button
            type="button"
            onClick={handleUserClick}
            className={`flex items-center justify-center gap-1 py-2 text-[11px] font-black rounded-xl transition-all cursor-pointer ${
              isUserActive ? "bg-blue-600 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <User className="w-3 h-3" />
            <span>Buyer</span>
          </button>

          <button
            type="button"
            onClick={handleSellerClick}
            className={`flex items-center justify-center gap-1 py-2 text-[11px] font-black rounded-xl transition-all cursor-pointer ${
              isSellerActive ? "bg-indigo-600 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Store className="w-3 h-3" />
            <span>{userHasSellerProfile ? "Seller" : "Join"}</span>
          </button>

          <button
            type="button"
            onClick={handleContractorClick}
            className={`flex items-center justify-center gap-1 py-2 text-[11px] font-black rounded-xl transition-all cursor-pointer ${
              isContractorActive ? "bg-amber-600 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Building2 className="w-3 h-3" />
            <span>{userHasContractorProfile ? "Contractor" : "Join"}</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-5 py-3 border-y border-slate-100 bg-slate-50/70 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
      <div className="flex items-center gap-1.5 text-slate-500">
        <Sparkles className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
          WORKSPACE / कार्यक्षेत्र
        </span>
      </div>

      <div className="grid grid-cols-3 gap-1 flex-1 rounded-2xl bg-slate-200/80 p-1 border border-slate-300/50 max-w-none sm:max-w-[280px]">
        <button
          type="button"
          onClick={handleUserClick}
          className={`flex items-center justify-center gap-1 py-1.5 px-2 text-[11px] font-black rounded-xl transition-colors cursor-pointer ${
            isUserActive ? "bg-blue-600 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <User className="w-3 h-3 shrink-0" />
          <span>Buyer</span>
        </button>

        <button
          type="button"
          onClick={handleSellerClick}
          className={`flex items-center justify-center gap-1 py-1.5 px-2 text-[11px] font-black rounded-xl transition-colors cursor-pointer ${
            isSellerActive ? "bg-indigo-600 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Store className="w-3 h-3 shrink-0" />
          <span>{userHasSellerProfile ? "Seller" : "Join"}</span>
        </button>

        <button
          type="button"
          onClick={handleContractorClick}
          className={`flex items-center justify-center gap-1 py-1.5 px-2 text-[11px] font-black rounded-xl transition-colors cursor-pointer ${
            isContractorActive ? "bg-amber-600 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Building2 className="w-3 h-3 shrink-0" />
          <span>{userHasContractorProfile ? "Contractor" : "Join"}</span>
        </button>
      </div>
    </div>
  );
};

export default WorkspaceSwitcher;
