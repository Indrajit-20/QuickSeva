import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { User, Store, Sparkles, Layers } from "lucide-react";

const WorkspaceSwitcher = ({ layout = "dropdown", onClose }) => {
  const { isSeller, activeRole, switchRole } = useAuth();
  const navigate = useNavigate();

  const isUserActive = activeRole === "user";
  const isSellerActive = activeRole === "seller";

  const handleUserClick = () => {
    onClose?.();
    if (!isUserActive) switchRole("user");
  };

  const handleSellerClick = () => {
    onClose?.();
    if (!isSeller) {
      navigate("/become-seller");
    } else if (!isSellerActive) {
      switchRole("seller");
    }
  };

  if (layout === "sidebar") {
    return (
      <div className="py-3 px-1">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
            <Layers className="w-3 h-3 text-indigo-500" />
            Workspace
          </span>
        </div>
        <div className="relative flex rounded-2xl bg-slate-100/90 p-1 border border-slate-200/80 shadow-inner">
          <div
            className={`absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] rounded-xl transition-all duration-300 ease-out shadow-md ${
              isSellerActive
                ? "translate-x-full bg-gradient-to-r from-indigo-600 to-purple-600"
                : "translate-x-0 bg-gradient-to-r from-blue-600 to-indigo-600"
            }`}
          />
          
          <button
            type="button"
            onClick={handleUserClick}
            className={`relative z-10 flex flex-1 items-center justify-center gap-1.5 py-2 text-xs font-black transition-all duration-200 cursor-pointer ${
              isUserActive ? "text-white" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Customer</span>
          </button>
          
          <button
            type="button"
            onClick={handleSellerClick}
            className={`relative z-10 flex flex-1 items-center justify-center gap-1.5 py-2 text-xs font-black transition-all duration-200 cursor-pointer ${
              isSellerActive ? "text-white" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Store className="w-3.5 h-3.5" />
            <span>{isSeller ? "Seller" : "Join Partner"}</span>
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

      <div className="relative flex flex-1 rounded-2xl bg-slate-200/80 p-1 border border-slate-300/50 max-w-none sm:max-w-[220px]">
        {/* Sliding indicator */}
        <div
          className={`absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] rounded-xl transition-all duration-300 ease-out shadow-sm ${
            isSellerActive
              ? "translate-x-full bg-gradient-to-r from-indigo-600 to-purple-600"
              : "translate-x-0 bg-gradient-to-r from-blue-600 to-indigo-600"
          }`}
        />
        
        <button
          type="button"
          onClick={handleUserClick}
          className={`relative z-10 flex flex-1 items-center justify-center gap-1.5 py-1.5 px-3 text-xs font-black transition-colors duration-200 cursor-pointer ${
            isUserActive ? "text-white" : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <User className="w-3.5 h-3.5 shrink-0" />
          <span>Customer</span>
        </button>
        
        <button
          type="button"
          onClick={handleSellerClick}
          className={`relative z-10 flex flex-1 items-center justify-center gap-1.5 py-1.5 px-3 text-xs font-black transition-colors duration-200 cursor-pointer ${
            isSellerActive ? "text-white" : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Store className="w-3.5 h-3.5 shrink-0" />
          <span>{isSeller ? "Seller" : "Join"}</span>
        </button>
      </div>
    </div>
  );
};

export default WorkspaceSwitcher;
