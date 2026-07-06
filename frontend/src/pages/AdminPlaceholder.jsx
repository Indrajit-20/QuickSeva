import React from "react";
import { useLocation } from "react-router-dom";
import { Hammer, Calendar, Award, Star, Bell, Shield, BarChart, Settings, Mail, MapPin } from "lucide-react";

const AdminPlaceholder = () => {
  const location = useLocation();
  const path = location.pathname;

  const getSectionDetails = () => {
    if (path.includes("bookings")) {
      return {
        title: "Platform Bookings Center",
        desc: "Monitor all active, scheduled, completed, and canceled customer service requests.",
        icon: Calendar,
        color: "text-amber-400 border-amber-500/20 bg-amber-500/5",
      };
    }
    if (path.includes("services") || path.includes("approvals")) {
      return {
        title: "Partner Services & Listings Audit",
        desc: "Moderate, review, and approve individual custom service packages created by registered sellers.",
        icon: Hammer,
        color: "text-indigo-400 border-indigo-500/20 bg-indigo-500/5",
      };
    }
    if (path.includes("leads")) {
      return {
        title: "Bidding & Seller Leads Panel",
        desc: "View and distribute customer requests to available nearby service partners.",
        icon: Award,
        color: "text-cyan-400 border-cyan-500/20 bg-cyan-500/5",
      };
    }
    if (path.includes("reviews")) {
      return {
        title: "User Reviews & Ratings Panel",
        desc: "Inspect ratings and delete inappropriate or toxic feedback comments to maintain store policy.",
        icon: Star,
        color: "text-purple-400 border-purple-500/20 bg-purple-500/5",
      };
    }
    if (path.includes("notifications")) {
      return {
        title: "System Alerts & Push Center",
        desc: "Broadcast custom notifications and marketing push alerts to user mobile applications.",
        icon: Bell,
        color: "text-rose-400 border-rose-500/20 bg-rose-500/5",
      };
    }
    if (path.includes("support")) {
      return {
        title: "Support Tickets Helpdesk",
        desc: "View customer support inquiries, solve chat queries, and view user ticket details.",
        icon: Mail,
        color: "text-teal-400 border-teal-500/20 bg-teal-500/5",
      };
    }
    if (path.includes("reports")) {
      return {
        title: "Platform Performance Reports",
        desc: "Analyze and export spreadsheets regarding monthly booking statistics, active user analytics, and platform profit margins.",
        icon: BarChart,
        color: "text-emerald-400 border-emerald-500/20 bg-emerald-500/5",
      };
    }
    return {
      title: "System Feature Control",
      desc: "Configure platform settings, manage local zones, manage promo coupons, and audit security events.",
      icon: Settings,
      color: "text-slate-400 border-slate-500/20 bg-slate-500/5",
    };
  };

  const info = getSectionDetails();
  const Icon = info.icon;

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="bg-slate-900/40 border border-indigo-950/40 rounded-3xl p-8 max-w-lg w-full text-center space-y-5 backdrop-blur-md">
        <div className={`mx-auto w-16 h-16 rounded-2xl border flex items-center justify-center shadow-lg ${info.color}`}>
          <Icon size={32} />
        </div>

        <div className="space-y-2">
          <h2 className="text-white text-xl font-black tracking-tight">{info.title}</h2>
          <p className="text-slate-400 text-xs font-semibold uppercase tracking-widest">Administrative Feature</p>
        </div>

        <p className="text-slate-400 text-xs font-medium leading-relaxed bg-slate-950/40 px-6 py-4 rounded-2xl border border-indigo-950">
          {info.desc}
        </p>

        <div className="pt-2 text-[10px] text-indigo-400 font-bold uppercase tracking-widest animate-pulse">
          ⚡ System Operations Module Active
        </div>
      </div>
    </div>
  );
};

export default AdminPlaceholder;
