import React from "react";
import { useLocation } from "react-router-dom";
import { Hammer, Calendar, Award, Star, Bell, Settings, Mail, BarChart } from "lucide-react";

const AdminPlaceholder = () => {
  const location = useLocation();
  const path = location.pathname;

  const getSectionDetails = () => {
    if (path.includes("bookings")) {
      return {
        title: "Platform Bookings Center",
        desc: "Monitor all active, scheduled, completed, and canceled customer service requests.",
        icon: Calendar,
        color: "text-amber-600 border-amber-200 bg-amber-50",
      };
    }
    if (path.includes("services") || path.includes("approvals")) {
      return {
        title: "Partner Services & Listings Audit",
        desc: "Moderate, review, and approve individual custom service packages created by registered sellers.",
        icon: Hammer,
        color: "text-blue-600 border-blue-200 bg-blue-50",
      };
    }
    if (path.includes("leads")) {
      return {
        title: "Bidding & Seller Leads Panel",
        desc: "View and distribute customer requests to available nearby service partners.",
        icon: Award,
        color: "text-sky-600 border-sky-200 bg-sky-50",
      };
    }
    if (path.includes("reviews")) {
      return {
        title: "User Reviews & Ratings Panel",
        desc: "Inspect ratings and delete inappropriate or toxic feedback comments to maintain store policy.",
        icon: Star,
        color: "text-purple-600 border-purple-200 bg-purple-50",
      };
    }
    if (path.includes("notifications")) {
      return {
        title: "System Alerts & Push Center",
        desc: "Broadcast custom notifications and marketing push alerts to user mobile applications.",
        icon: Bell,
        color: "text-rose-605 border-rose-200 bg-rose-50",
      };
    }
    if (path.includes("support")) {
      return {
        title: "Support Tickets Helpdesk",
        desc: "View customer support inquiries, solve chat queries, and view user ticket details.",
        icon: Mail,
        color: "text-teal-600 border-teal-200 bg-teal-50",
      };
    }
    if (path.includes("reports")) {
      return {
        title: "Platform Performance Reports",
        desc: "Analyze and export spreadsheets regarding monthly booking statistics, active user analytics, and platform profit margins.",
        icon: BarChart,
        color: "text-emerald-600 border-emerald-200 bg-emerald-50",
      };
    }
    return {
      title: "System Feature Control",
      desc: "Configure platform settings, manage local zones, manage promo coupons, and audit security events.",
      icon: Settings,
      color: "text-slate-600 border-slate-200 bg-slate-50",
    };
  };

  const info = getSectionDetails();
  const Icon = info.icon;

  return (
    <div className="flex items-center justify-center min-h-[60vh] text-left">
      <div className="bg-white border border-slate-200 rounded-3xl p-8 max-w-lg w-full text-center space-y-5 shadow-sm">
        <div className={`mx-auto w-16 h-16 rounded-2xl border flex items-center justify-center shadow-xs ${info.color}`}>
          <Icon size={32} />
        </div>

        <div className="space-y-2">
          <h2 className="text-slate-800 text-xl font-bold tracking-tight">{info.title}</h2>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Administrative Feature</p>
        </div>

        <p className="text-slate-600 text-xs font-semibold leading-relaxed bg-slate-50 px-6 py-4 rounded-2xl border border-slate-200">
          {info.desc}
        </p>

        <div className="pt-2 text-[10px] text-blue-600 font-bold uppercase tracking-wider animate-pulse">
          ⚡ System Operations Module Active
        </div>
      </div>
    </div>
  );
};

export default AdminPlaceholder;
