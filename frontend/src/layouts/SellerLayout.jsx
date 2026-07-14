import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  BriefcaseBusiness,
  ClipboardList,
  Crown,
  Megaphone,
  LayoutDashboard,
  LogOut,
  Menu,
  User,
  X,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import WorkspaceSwitcher from "../components/WorkspaceSwitcher";
import BottomNavSeller from "../components/BottomNavSeller";
import { sellerOrdersApi } from "../api/orderApi";
import apiClient from "../api/axiosConfig";

const getImageUrl = (url) => {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  const base = apiClient.defaults.baseURL ? apiClient.defaults.baseURL.replace("/api", "") : "http://localhost:5000";
  return `${base}${url}`;
};

const navItems = [
  { label: "Dashboard", path: "/seller/dashboard", icon: LayoutDashboard },
  { label: "Leads", path: "/seller/dashboard/leads", icon: Megaphone },
  { label: "Profile", path: "/seller/profile", icon: User },
  { label: "My Services", path: "/seller/services", icon: BriefcaseBusiness },
  { label: "Orders", path: "/seller/orders", icon: ClipboardList },
  { label: "Wallet", path: "/seller/wallet", icon: BriefcaseBusiness },
  { label: "Packages", path: "/seller/packages", icon: Crown },
];

const getInitial = (name) => (name?.trim()?.[0] || "S").toUpperCase();

function SellerNavLink({ item, onClick, badgeCount }) {
  const location = useLocation();
  const Icon = item.icon;
  const active = location.pathname === item.path;

  return (
    <NavLink
      to={item.path}
      onClick={onClick}
      className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm font-semibold transition-all ${active
        ? "bg-[#0284c7]/10 text-[#0284c7] shadow-[inset_3px_0_0_#0284c7]"
        : "text-[#6b7280] hover:bg-[#f8f9fb] hover:text-[#0284c7]"
        }`}
    >
      <div className="flex items-center gap-3">
        <Icon size={18} />
        <span>{item.label}</span>
      </div>
      {item.label === "Orders" && badgeCount > 0 && (
        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#e53935] px-1.5 text-xs font-bold text-white shadow-none">
          {badgeCount}
        </span>
      )}
    </NavLink>
  );
}

function SellerSidebar({ user, onLogout, onNavigate, pendingOrdersCount, onToggleAvailability }) {
  return (
    <div className="flex h-full flex-col border-r border-[#e5e7eb] bg-white px-4 py-4 text-[#1a1a1a]">
      <div className="mb-4 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-2xl font-black tracking-normal text-[#1a1a1a]">
              Quick<span className="text-[#0284c7]">Seva</span>
            </div>
            <p className="mt-0.5 text-xs font-semibold text-[#6b7280]">Seller Panel</p>
          </div>
          {/* Small Availability Toggle */}
          <button
            onClick={onToggleAvailability}
            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${user?.is_available ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-slate-300 hover:bg-slate-400'}`}
            title={user?.is_available ? "Active: Customers can see and book your services / चालू: ग्राहक आपकी सेवाएं देख सकते हैं" : "Inactive: Customers cannot see or book your services / बंद: ग्राहक आपकी सेवाएं नहीं देख सकते"}
            aria-label="Toggle availability"
          >
            <span
              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${user?.is_available ? 'translate-x-4' : 'translate-x-0'}`}
            />
          </button>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] font-bold">
          <span className={`h-1.5 w-1.5 rounded-full ${user?.is_available ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
          <span className={user?.is_available ? 'text-emerald-600' : 'text-rose-600'}>
            {user?.is_available ? 'Active / चालू' : 'Inactive / बंद'}
          </span>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto no-scrollbar">
        {navItems.map((item) => (
          <SellerNavLink key={item.path} item={item} onClick={onNavigate} badgeCount={pendingOrdersCount} />
        ))}
      </nav>

      <div className="border-t border-[#e5e7eb] pt-2.5 mt-2.5">
        <div className="mb-2.5 flex items-center gap-3 rounded-lg border border-[#e5e7eb] bg-[#f8f9fb] p-2.5">
          {user?.profile_pic ? (
            <img
              src={getImageUrl(user.profile_pic)}
              alt="Profile"
              className="h-9 w-9 shrink-0 rounded-full object-cover border border-[#e5e7eb]"
            />
          ) : (
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#0284c7] text-sm font-bold text-white">
              {getInitial(user?.name)}
            </div>
          )}
          <div className="min-w-0">
            <div className="truncate text-sm font-bold text-[#1a1a1a]">
              {user?.name || "Seller"}
            </div>
            <div className="truncate text-xs text-[#6b7280]">
              {user?.email || user?.phone || "QuickSeva partner"}
            </div>
          </div>
        </div>
        <WorkspaceSwitcher layout="sidebar" />
        <button
          type="button"
          onClick={onLogout}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-[#e53935]/30 bg-[#e53935]/10 px-3 py-2 text-sm font-semibold text-[#e53935] transition hover:-translate-y-0.5 hover:bg-[#e53935]/15 hover:shadow-[0_10px_22px_-14px_#e53935]"
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
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const [pendingOrdersCount, setPendingOrdersCount] = useState(0);

  useEffect(() => {
    let active = true;
    const fetchPendingCount = async () => {
      try {
        const res = await sellerOrdersApi.list();
        const list = res?.data?.orders || res?.orders || [];
        const count = Array.isArray(list) ? list.filter(o => o.status === "pending").length : 0;
        if (active) setPendingOrdersCount(count);
      } catch (err) {
        console.error("Failed to fetch pending orders count:", err);
      }
    };
    fetchPendingCount();
    const interval = setInterval(fetchPendingCount, 15000); // Poll every 15 seconds
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleToggleAvailability = async () => {
    try {
      const res = await apiClient.patch("/sellers/me/toggle-availability");
      if (res?.data?.success) {
        const nextVal = user?.is_available ? 0 : 1;
        updateUser({ is_available: nextVal });
      }
    } catch (err) {
      console.error("Failed to toggle availability:", err);
      alert(err?.response?.data?.message || "Failed to toggle availability status");
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fb] text-[#1a1a1a]">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 lg:block">
        <SellerSidebar
          user={user}
          onLogout={handleLogout}
          pendingOrdersCount={pendingOrdersCount}
          onToggleAvailability={handleToggleAvailability}
        />
      </aside>

      <header className="sticky top-0 z-20 border-b border-[#e5e7eb] bg-white px-4 py-3 lg:hidden">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="rounded-lg border border-[#e5e7eb] bg-white p-2 text-[#0284c7]"
            aria-label="Open seller navigation"
          >
            <Menu size={20} />
          </button>

          <div className="text-center">
            <div className="text-sm font-bold text-[#1a1a1a]">
              {user?.name || "Seller"}
            </div>
            <div className="text-xs text-[#6b7280]">QuickSeva Seller</div>
          </div>

          <div className="flex items-center gap-3">
            {/* Mobile Availability Toggle */}
            <button
              onClick={handleToggleAvailability}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${user?.is_available ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-slate-300 hover:bg-slate-400'}`}
              title={user?.is_available ? "Active / Click to deactivate" : "Inactive / Click to activate"}
              aria-label="Toggle availability"
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${user?.is_available ? 'translate-x-4' : 'translate-x-0'}`}
              />
            </button>

            {user?.profile_pic ? (
              <img
                src={getImageUrl(user.profile_pic)}
                alt="Profile"
                className="h-9 w-9 rounded-full object-cover border border-[#e5e7eb]"
              />
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0284c7] text-xs font-bold text-white">
                {getInitial(user?.name)}
              </div>
            )}
          </div>
        </div>
      </header>

      {drawerOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            aria-label="Close seller navigation"
            className="absolute inset-0 bg-[#1a1a1a]/35"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="relative h-full w-80 max-w-[85vw] animate-slide-in-right">
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              className="absolute right-3 top-3 z-10 rounded-lg border border-[#e5e7eb] bg-white p-2 text-[#1a1a1a]"
              aria-label="Close menu"
            >
              <X size={18} />
            </button>
            <SellerSidebar
              user={user}
              onLogout={handleLogout}
              onNavigate={() => setDrawerOpen(false)}
              pendingOrdersCount={pendingOrdersCount}
              onToggleAvailability={handleToggleAvailability}
            />
          </div>
        </div>
      )}

      <main className="min-h-screen px-4 py-6 sm:px-6 lg:ml-72 lg:px-8 bottom-nav-spacer">
        <Outlet />
      </main>

      <BottomNavSeller pendingOrdersCount={pendingOrdersCount} />
    </div>
  );
}
