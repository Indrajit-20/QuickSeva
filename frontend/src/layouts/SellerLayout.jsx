import { useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  BriefcaseBusiness,
  ClipboardList,
  Crown,
  LayoutDashboard,
  LogOut,
  Menu,
  User,
  X,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const navItems = [
  { label: "Dashboard", path: "/seller/dashboard", icon: LayoutDashboard },
  { label: "Profile", path: "/seller/profile", icon: User },
  { label: "My Services", path: "/seller/services", icon: BriefcaseBusiness },
  { label: "Orders", path: "/seller/orders", icon: ClipboardList },
  { label: "Wallet", path: "/seller/wallet", icon: BriefcaseBusiness },
  // { label: "Packages", path: "/seller/packages", icon: Crown },
];

const getInitial = (name) => (name?.trim()?.[0] || "S").toUpperCase();

function SellerNavLink({ item, onClick }) {
  const location = useLocation();
  const Icon = item.icon;
  const active = location.pathname === item.path;

  return (
    <NavLink
      to={item.path}
      onClick={onClick}
      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-all ${
        active
          ? "bg-indigo-500/20 text-white shadow-[inset_3px_0_0_#6366f1]"
          : "text-slate-300 hover:bg-white/5 hover:text-white"
      }`}
    >
      <Icon size={18} />
      <span>{item.label}</span>
    </NavLink>
  );
}

function SellerSidebar({ user, onLogout, onNavigate }) {
  return (
    <div className="flex h-full flex-col bg-[#1e1b4b] px-4 py-5 text-white">
      <div className="mb-8">
        <div className="text-2xl font-black tracking-normal text-white">
          Quick<span className="text-indigo-300">Seva</span>
        </div>
        <p className="mt-1 text-xs font-medium text-slate-400">Seller Panel</p>
      </div>

      <nav className="flex-1 space-y-2">
        {navItems.map((item) => (
          <SellerNavLink key={item.path} item={item} onClick={onNavigate} />
        ))}
      </nav>

      <div className="border-t border-indigo-400/20 pt-4">
        <div className="mb-4 flex items-center gap-3 rounded-lg bg-white/5 p-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-sm font-bold text-white">
            {getInitial(user?.name)}
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-bold text-white">
              {user?.name || "Seller"}
            </div>
            <div className="truncate text-xs text-slate-400">
              {user?.email || user?.phone || "QuickSeva partner"}
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={onLogout}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2.5 text-sm font-semibold text-red-200 transition hover:bg-red-500/20"
        >
          <LogOut size={17} />
          Logout
        </button>
      </div>
    </div>
  );
}

export default function SellerLayout() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-[#0f0e1a] text-white">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 lg:block">
        <SellerSidebar user={user} onLogout={handleLogout} />
      </aside>

      <header className="sticky top-0 z-20 border-b border-indigo-500/20 bg-[#0f0e1a]/95 px-4 py-3 backdrop-blur lg:hidden">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="rounded-lg border border-indigo-500/30 bg-[#1a1830] p-2 text-white"
            aria-label="Open seller navigation"
          >
            <Menu size={20} />
          </button>
          <div className="text-center">
            <div className="text-sm font-bold text-white">
              {user?.name || "Seller"}
            </div>
            <div className="text-xs text-slate-400">QuickSeva Seller</div>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-sm font-bold">
            {getInitial(user?.name)}
          </div>
        </div>
      </header>

      {drawerOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            aria-label="Close seller navigation"
            className="absolute inset-0 bg-black/60"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="relative h-full w-80 max-w-[85vw] animate-slide-in-right">
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              className="absolute right-3 top-3 z-10 rounded-lg bg-white/10 p-2 text-white"
              aria-label="Close menu"
            >
              <X size={18} />
            </button>
            <SellerSidebar
              user={user}
              onLogout={handleLogout}
              onNavigate={() => setDrawerOpen(false)}
            />
          </div>
        </div>
      )}

      <main className="min-h-screen px-4 py-6 sm:px-6 lg:ml-72 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
}
