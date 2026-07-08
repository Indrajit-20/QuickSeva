import React from "react";
import { useAuth } from "../context/AuthContext";

const WorkspaceSwitcher = ({ layout = "dropdown" }) => {
  const { isSeller, activeRole, switchRole } = useAuth();

  const isUserActive = activeRole === "user";
  const isSellerActive = activeRole === "seller";

  if (layout === "sidebar") {
    return (
      <div className="py-2.5">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 px-0.5">
          Workspace / कार्यक्षेत्र
        </p>
        <div className="relative flex rounded-xl bg-slate-100 p-0.5 border border-slate-200">
          {/* Sliding indicator */}
          <div
            className={`absolute top-0.5 bottom-0.5 left-0.5 w-[calc(50%-2px)] rounded-lg bg-white shadow-sm transition-transform duration-200 ease-out ${
              isSellerActive ? "translate-x-full" : "translate-x-0"
            }`}
          />
          
          <button
            type="button"
            onClick={() => !isUserActive && switchRole("user")}
            className={`relative z-10 flex flex-1 items-center justify-center gap-1.5 py-2 text-xs font-extrabold transition-colors duration-200 ${
              isUserActive ? "text-emerald-700" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            👤 Customer
          </button>
          
          <button
            type="button"
            onClick={() => {
              if (!isSeller) {
                switchRole("seller");
              } else if (!isSellerActive) {
                switchRole("seller");
              }
            }}
            className={`relative z-10 flex flex-1 items-center justify-center gap-1.5 py-2 text-xs font-extrabold transition-colors duration-200 ${
              isSellerActive ? "text-indigo-700" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            🏪 {isSeller ? "Seller" : "Join"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-2.5 border-t border-b border-slate-100 bg-slate-50/50 flex items-center justify-between gap-3">
      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 shrink-0">
        Workspace / कार्यक्षेत्र
      </span>

      <div className="relative flex flex-1 rounded-xl bg-slate-200/80 p-0.5 border border-slate-300/40 max-w-[210px]">
        {/* Sliding indicator */}
        <div
          className={`absolute top-0.5 bottom-0.5 left-0.5 w-[calc(50%-2px)] rounded-lg bg-white shadow-sm transition-transform duration-200 ease-out ${
            isSellerActive ? "translate-x-full" : "translate-x-0"
          }`}
        />
        
        <button
          type="button"
          onClick={() => !isUserActive && switchRole("user")}
          className={`relative z-10 flex flex-1 items-center justify-center py-1.5 text-xs font-black transition-colors duration-200 cursor-pointer ${
            isUserActive ? "text-emerald-700" : "text-slate-500 hover:text-slate-700"
          }`}
        >
          👤 Customer
        </button>
        
        <button
          type="button"
          onClick={() => {
            if (!isSeller) {
              switchRole("seller");
            } else if (!isSellerActive) {
              switchRole("seller");
            }
          }}
          className={`relative z-10 flex flex-1 items-center justify-center py-1.5 text-xs font-black transition-colors duration-200 cursor-pointer ${
            isSellerActive ? "text-indigo-700" : "text-slate-500 hover:text-slate-700"
          }`}
        >
          🏪 {isSeller ? "Seller" : "Join"}
        </button>
      </div>
    </div>
  );
};

export default WorkspaceSwitcher;
