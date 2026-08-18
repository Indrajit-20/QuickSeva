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
  User,
  Wallet,
  X,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import WorkspaceSwitcher from "../components/WorkspaceSwitcher";

const navItems = [
  { label: "Dashboard", path: "/contractor/dashboard", icon: LayoutDashboard },
  { label: "Post Site Requirement", path: "/contractor/create-post", icon: PlusCircle },
  { label: "Customer Leads", path: "/contractor/quotes", icon: MessageSquare },
  { label: "My Site Listings", path: "/contractor/posts", icon: Building2 },
  { label: "Public Contractor Hub", path: "/contractor-hub", icon: Globe, isExternal: true },
];

const getInitial = (name) => (name?.trim()?.[0] || "C").toUpperCase();

function ContractorSidebar({ user, onLogout, onNavigate, onClose }) {
  const location = useLocation();

  return (
    <div className="flex h-full flex-col border-r border-slate-200 bg-white px-4 py-4 text-slate-800">
      <div className="mb-5 flex flex-col gap-2">
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
              className="flex items-center justify-center w-9 h-9 rounded-xl bg-slate-100 text-slate-500 hover:text-slate-900"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      <nav className="flex-1 space-y-1.5 overflow-y-auto no-scrollbar">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = location.pathname === item.path;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onNavigate}
              className={`flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all ${
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
              {item.isExternal && (
                <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-white text-amber-700 rounded-md border border-amber-200 shadow-2xs">
                  Public ↗
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className="border-t border-slate-200 pt-3 mt-3">
        <div className="mb-3 flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-600 text-sm font-black text-white shadow-sm">
            {getInitial(user?.name)}
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-bold text-slate-900">
              {user?.company_name || user?.name || "Contractor"}
            </div>
            <div className="truncate text-xs text-slate-500 font-medium">
              {user?.phone || user?.email || "Contractor Workspace"}
            </div>
          </div>
        </div>

        <WorkspaceSwitcher layout="sidebar" />

        <button
          type="button"
          onClick={onLogout}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-600 transition hover:bg-rose-100"
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

      {/* Mobile Top Header */}
      <header className="sticky top-0 z-20 bg-white border-b border-slate-200 lg:hidden shadow-xs">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="flex items-center justify-center w-10 h-10 rounded-xl bg-slate-100 text-slate-700 active:scale-95 transition"
            >
              <Menu size={20} />
            </button>
            <div>
              <div className="text-lg font-black text-slate-900 leading-tight">
                Quick<span className="text-amber-600">Seva</span>
              </div>
              <div className="text-[10px] font-extrabold text-amber-600 uppercase tracking-wider">Contractor Hub</div>
            </div>
          </div>

          <button
            onClick={() => navigate("/contractor/create-post")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-600 text-white text-xs font-bold shadow-xs active:scale-95 transition"
          >
            <PlusCircle size={15} />
            <span>Post Site</span>
          </button>
        </div>
      </header>

      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
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

      <main className="min-h-screen px-4 py-5 sm:px-6 lg:ml-72 lg:px-8 lg:py-6">
        <Outlet />
      </main>
    </div>
  );
}
