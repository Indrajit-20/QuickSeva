import { useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  Building2,
  Globe,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  PlusCircle,
  Sparkles,
  User,
  Wallet,
  X,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import WorkspaceSwitcher from "../components/WorkspaceSwitcher";
import BottomNavContractor from "../components/BottomNavContractor";
import { getProfilePicUrl } from "../utils/imageUtils";

const navItems = [
  { label: "Dashboard", path: "/contractor/dashboard", icon: LayoutDashboard },
  { label: "Social Inbox", path: "/contractor/social-inbox", icon: Sparkles, badge: "CRM" },
  { label: "Profile & Trade Settings", path: "/contractor/profile", icon: User },
  { label: "Customer Leads", path: "/contractor/quotes", icon: MessageSquare },
  { label: "My Site Listings", path: "/contractor/posts", icon: Building2 },
  { label: "Post Site Requirement", path: "/contractor/create-post", icon: PlusCircle },
  { label: "Public Contractor Hub", path: "/contractor-hub", icon: Globe, isExternal: true },
];

const getInitial = (name) => (name?.trim()?.[0] || "C").toUpperCase();

function ContractorSidebar({ user, onLogout, onNavigate, onClose }) {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div className="flex h-full flex-col overflow-y-auto no-scrollbar border-r border-slate-200 bg-white px-4 py-4 text-slate-800">
      <div className="mb-5 flex flex-col gap-2 shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-2xl font-black tracking-normal text-slate-900">
              Quick<span className="text-amber-600">Seva</span>
            </div>
            <p className="mt-0.5 text-xs font-bold text-amber-600 uppercase tracking-wider">Contractor Portal</p>
          </div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="flex items-center justify-center w-9 h-9 rounded-xl bg-slate-100 text-slate-500 hover:text-slate-900 active:scale-95 transition cursor-pointer"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      <nav className="flex-1 min-h-0 space-y-1 overflow-y-auto no-scrollbar py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = location.pathname === item.path;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onNavigate}
              className={`flex items-center justify-between rounded-xl px-3 py-2 text-[13px] font-semibold transition-all ${
                item.isExternal
                  ? "mt-4 bg-slate-100 text-slate-700 hover:bg-amber-100 hover:text-amber-900 border border-slate-200"
                  : active
                  ? "bg-amber-50 text-amber-700 font-bold border-l-4 border-amber-600 shadow-xs"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon size={18} className={active ? "text-amber-600" : item.isExternal ? "text-amber-600" : "text-slate-400"} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-amber-100 text-amber-800 rounded-md border border-amber-200">
                  {item.badge}
                </span>
              )}
              {item.isExternal && (
                <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-white text-amber-700 rounded-md border border-amber-200 shadow-2xs">
                  Public ↗
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className="mt-auto shrink-0 border-t border-slate-200/90 pt-3 pb-8 lg:pb-0">
        <button
          type="button"
          onClick={() => {
            navigate("/contractor/profile");
            if (onNavigate) onNavigate();
          }}
          className="mb-3 flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-left hover:bg-amber-50 hover:border-amber-200 transition cursor-pointer group"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-600 text-sm font-black text-white shadow-sm overflow-hidden border border-amber-400/30">
            {user?.profile_pic ? (
              <img
                src={getProfilePicUrl(user.profile_pic)}
                alt={user?.name || "Profile"}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.style.display = "none";
                }}
              />
            ) : null}
            {(!user?.profile_pic || user?.profile_pic.includes("undefined")) && (
              <span>{getInitial(user?.name)}</span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-bold text-slate-900 group-hover:text-amber-700">
              {user?.company_name || user?.name || "Contractor"}
            </div>
            <div className="truncate text-xs text-slate-500 font-medium">
              {user?.phone || user?.email || "Edit Contractor Profile →"}
            </div>
          </div>
        </button>

        <WorkspaceSwitcher layout="sidebar" onClose={onNavigate} />

        <button
          type="button"
          onClick={() => {
            if (onLogout) onLogout();
            if (onNavigate) onNavigate();
          }}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs font-bold text-rose-600 transition hover:bg-rose-100 cursor-pointer shadow-xs active:scale-98"
        >
          <LogOut size={16} />
          Logout
        </button>
      </div>
    </div>
  );
}

export default function ContractorLayout() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 lg:block">
        <ContractorSidebar user={user} onLogout={handleLogout} />
      </aside>

      {/* Mobile-only Top Header */}
      <header className="sticky top-0 z-20 bg-white border-b border-slate-200 lg:hidden shadow-xs">
        <div className="flex items-center justify-between px-3 py-2">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="flex items-center justify-center w-9 h-9 rounded-xl bg-slate-100 text-slate-700 active:scale-95 transition"
              aria-label="Open menu"
            >
              <Menu size={18} />
            </button>
            <div>
              <div className="text-base font-black text-slate-900 leading-tight">
                Quick<span className="text-amber-600">Seva</span>
              </div>
              <div className="text-[9px] font-extrabold text-amber-600 uppercase tracking-wider">Contractor</div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate("/contractor/create-post")}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-600 text-white text-[11px] font-bold shadow-xs active:scale-95 transition"
          >
            <PlusCircle size={13} />
            <span>Post</span>
          </button>
        </div>
      </header>

      {drawerOpen && (
        <div className="fixed inset-0 z-[1200] lg:hidden">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="relative h-full w-80 max-w-[80vw]">
            <ContractorSidebar
              user={user}
              onLogout={handleLogout}
              onNavigate={() => setDrawerOpen(false)}
              onClose={() => setDrawerOpen(false)}
            />
          </div>
        </div>
      )}

      <main className="min-h-screen px-3 py-3 sm:px-5 sm:py-4 lg:ml-72 lg:px-8 lg:py-6 bottom-nav-spacer">
        <Outlet />
      </main>

      <BottomNavContractor />
    </div>
  );
}
