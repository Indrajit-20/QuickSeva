import React, { useState, useEffect } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Store,
  Wrench,
  Calendar,
  Zap,
  CreditCard,
  Star,
  Bell,
  Headphones,
  TrendingUp,
  MapPin,
  Gift,
  FileText,
  Settings,
  Lock,
  Megaphone,
  LogOut,
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const AdminLayout = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState({
    users: false,
    sellers: false,
    services: false,
  });

  const toggleMenu = (menu) => {
    setExpandedMenus((prev) => ({
      ...prev,
      [menu]: !prev[menu],
    }));
  };

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("userRole");
    localStorage.removeItem("isAdminAuthenticated");
    localStorage.removeItem("adminUsername");
    localStorage.removeItem("adminEmail");
    if (logout) logout();
    navigate("/admin/login");
  };

  // Keep submenus expanded if active item is inside them
  useEffect(() => {
    const path = location.pathname;
    const search = location.search;

    if (path.includes("/admin/users")) {
      setExpandedMenus((prev) => ({ ...prev, users: true }));
    }
    if (path.includes("/admin/sellers")) {
      setExpandedMenus((prev) => ({ ...prev, sellers: true }));
    }
    if (path.includes("/admin/categories") || path.includes("/admin/services")) {
      setExpandedMenus((prev) => ({ ...prev, services: true }));
    }
  }, [location.pathname, location.search]);

  // Sidebar Menu Items definition
  const menuConfig = [
    {
      type: "link",
      label: "Dashboard",
      path: "/admin/dashboard",
      icon: LayoutDashboard,
    },
    {
      type: "submenu",
      label: "Users",
      id: "users",
      icon: Users,
      items: [
        { label: "All Users", path: "/admin/users?tab=all" },
        { label: "Blocked Users", path: "/admin/users?tab=blocked" },
      ],
    },
    {
      type: "submenu",
      label: "Sellers",
      id: "sellers",
      icon: Store,
      items: [
        { label: "Pending Verification", path: "/admin/sellers?tab=pending" },
        { label: "Verified Sellers", path: "/admin/sellers?tab=verified" },
        { label: "Suspended Sellers", path: "/admin/sellers?tab=suspended" },
      ],
    },
    {
      type: "submenu",
      label: "Services",
      id: "services",
      icon: Wrench,
      items: [
        { label: "Categories", path: "/admin/categories" },
        { label: "Services List", path: "/admin/services" },
        { label: "Approvals", path: "/admin/services/approvals" },
      ],
    },
    {
      type: "link",
      label: "Bookings",
      path: "/admin/bookings",
      icon: Calendar,
    },
    {
      type: "link",
      label: "Leads",
      path: "/admin/leads",
      icon: Zap,
    },
    {
      type: "link",
      label: "Disputes & Payouts",
      path: "/admin/disputes",
      icon: ShieldCheck,
    },
    {
      type: "link",
      label: "Wallet & Payments",
      path: "/admin/payments",
      icon: CreditCard,
    },
    {
      type: "link",
      label: "Reviews",
      path: "/admin/reviews",
      icon: Star,
    },
    {
      type: "link",
      label: "Notifications",
      path: "/admin/notifications",
      icon: Bell,
    },
    {
      type: "link",
      label: "Support",
      path: "/admin/support",
      icon: Headphones,
    },
    {
      type: "link",
      label: "Reports",
      path: "/admin/reports",
      icon: TrendingUp,
    },
    {
      type: "link",
      label: "Locations",
      path: "/admin/locations",
      icon: MapPin,
    },
    {
      type: "link",
      label: "Coupons",
      path: "/admin/coupons",
      icon: Gift,
    },
    {
      type: "link",
      label: "CMS & Policies",
      path: "/admin/policies",
      icon: FileText,
    },
    {
      type: "link",
      label: "Settings",
      path: "/admin/settings",
      icon: Settings,
    },
    {
      type: "link",
      label: "Security",
      path: "/admin/security",
      icon: Lock,
    },
    {
      type: "link",
      label: "Marketing",
      path: "/admin/marketing",
      icon: Megaphone,
    },
  ];

  const renderSidebarContent = () => (
    <div className="flex h-full flex-col bg-white border-r border-slate-200 text-slate-700">
      {/* Brand logo */}
      <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
        <div>
          <span className="text-2xl font-black text-slate-800">
            Quick<span className="text-blue-600">Seva</span>
          </span>
          <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mt-0.5">
            System Control Panel
          </p>
        </div>
        <button
          onClick={() => setIsMobileOpen(false)}
          className="lg:hidden text-slate-400 hover:text-slate-600 cursor-pointer p-1"
        >
          <X size={20} />
        </button>
      </div>

      {/* Nav items list */}
      <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-1.5 scrollbar-thin">
        {menuConfig.map((item, idx) => {
          if (item.type === "link") {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <NavLink
                key={idx}
                to={item.path}
                onClick={() => setIsMobileOpen(false)}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  isActive
                    ? "bg-blue-50 text-blue-600 border border-blue-100 shadow-xs"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                }`}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </NavLink>
            );
          }

          if (item.type === "submenu") {
            const Icon = item.icon;
            const isExpanded = expandedMenus[item.id];
            const isChildActive = item.items.some(
              (child) => location.pathname + location.search === child.path
            );

            return (
              <div key={idx} className="space-y-1">
                <button
                  onClick={() => toggleMenu(item.id)}
                  className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                    isChildActive
                      ? "text-blue-600 font-bold"
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon size={18} />
                    <span>{item.label}</span>
                  </div>
                  {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </button>

                {isExpanded && (
                  <div className="pl-9 space-y-1 pr-2">
                    {item.items.map((sub, sIdx) => {
                      const isActive =
                        location.pathname + location.search === sub.path ||
                        (location.pathname === sub.path.split("?")[0] &&
                          location.search.includes(sub.path.split("?")[1]));

                      return (
                        <NavLink
                          key={sIdx}
                          to={sub.path}
                          onClick={() => setIsMobileOpen(false)}
                          className={`block px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                            isActive
                              ? "bg-blue-50/50 text-blue-600 font-bold border-l-2 border-blue-500"
                              : "text-slate-500 hover:text-slate-800"
                          }`}
                        >
                          {sub.label}
                        </NavLink>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }
          return null;
        })}
      </nav>

      {/* User profile & logout footer */}
      <div className="p-4 border-t border-slate-200 bg-slate-50 flex flex-col gap-2">
        <div className="flex items-center gap-3 px-2 py-1.5">
          <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center font-bold text-white text-sm shadow-sm">
            {user?.name ? user.name[0].toUpperCase() : "A"}
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-sm font-bold text-slate-800 truncate">
              {user?.name || "System Admin"}
            </p>
            <p className="text-xs text-slate-500 truncate">
              {user?.email || "admin@quickseva.com"}
            </p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl text-sm font-semibold transition-all cursor-pointer"
        >
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col lg:flex-row overflow-hidden font-sans">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 h-screen sticky top-0 overflow-y-hidden">
        {renderSidebarContent()}
      </aside>

      {/* Mobile Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden bg-slate-900/40 backdrop-blur-xs">
          <div className="w-64 h-full animate-slide-in">
            {renderSidebarContent()}
          </div>
          <div className="flex-1" onClick={() => setIsMobileOpen(false)} />
        </div>
      )}

      {/* Main content wrapper */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        {/* Top bar */}
        <header className="h-16 px-6 bg-white border-b border-slate-200 backdrop-blur-md flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsMobileOpen(true)}
              className="lg:hidden text-slate-500 hover:text-slate-800 cursor-pointer"
            >
              <Menu size={24} />
            </button>
            <h2 className="text-lg font-bold text-slate-850">
              System Admin Console
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-bold bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>LIVE CONTROL</span>
            </div>
          </div>
        </header>

        {/* Content workspace */}
        <main className="flex-1 p-6 md:p-8 bg-slate-50 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
