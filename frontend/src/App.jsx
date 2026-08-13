import {
  BrowserRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";

import { useEffect } from "react";
import Navbar from "./components/Navbar";
import BottomNavUser from "./components/BottomNavUser";
import Footer from "./components/Footer";
import AdminDashboard from "./pages/AdminDashboard";
import AdminLogin from "./pages/AdminLogin";
import AdminLayout from "./layouts/AdminLayout";
import AdminUsers from "./pages/AdminUsers";
import AdminSellers from "./pages/AdminSellers";
import AdminDisputes from "./pages/AdminDisputes";
import AdminCategories from "./pages/AdminCategories";
import AdminPlaceholder from "./pages/AdminPlaceholder";
import { AuthProvider, useAuth } from "./context/AuthContext";

import SellerRoute from "./components/SellerRoute";
import AdminRoute from "./components/AdminRoute";
import UserRoute from "./components/UserRoute";

import { WalletProvider } from "./context/WalletContext";
import { SocketProvider } from "./context/SocketContext";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import OtpVerification from "./pages/OtpVerification";
import SellerRegister from "./pages/SellerRegister";
import BecomeSeller from "./pages/BecomeSeller";
import ServicesPage from "./pages/ServicesPage";
import BookingPage from "./pages/BookingPage";
import MyBookings from "./pages/MyBookings";
import BookingHistory from "./pages/BookingHistory";
import ProfilePage from "./pages/ProfilePage";
import NotFound from "./pages/NotFound";
import PrivacyPolicy from "./pages/SitePrivacy";
import TermsOfService from "./pages/TermsOfService";
import { cleanupExpiredPremium } from "./utils/premium";
import Unauthorized from "./pages/Unauthorized";
import SellerLayout from "./layouts/SellerLayout";
import SellerDashboard from "./pages/seller/SellerDashboard";
import SellerProfile from "./pages/seller/SellerProfile";
import SellerServices from "./pages/seller/SellerServices";
import SellerOrders from "./pages/seller/SellerOrders";
import SellerPackages from "./pages/seller/SellerPackages";
import SellerWallet from "./pages/seller/SellerWallet";
import SellerLeads from "./pages/seller/SellerLeads";
import SellerPublicProfile from "./pages/SellerPublicProfile";

import ContractorRoute from "./components/ContractorRoute";
import ContractorLayout from "./layouts/ContractorLayout";
import ContractorFeed from "./pages/ContractorFeed";
import ContractorPostDetail from "./pages/ContractorPostDetail";
import CreateContractorPost from "./pages/contractor/CreateContractorPost";
import ContractorDashboard from "./pages/contractor/ContractorDashboard";
import ContractorRegister from "./pages/ContractorRegister";
function SellerProtectedRoute() {
  // Kept for backward-compatibility; the source of truth is SellerRoute.
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-800 font-sans">
        <div className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-white border border-slate-200 shadow-xl max-w-xs w-full text-center">
          <div className="h-9 w-9 animate-spin rounded-full border-4 border-slate-100 border-t-indigo-600" />
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role !== "seller") {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
}

function AppRoutes() {
  const location = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    cleanupExpiredPremium();
  }, []);

  // Global scroll to top on route change / page navigation
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [location.pathname]);

  const isAdminRoute = location.pathname.startsWith("/admin");
  const isSellerRoute =
    location.pathname === "/seller" ||
    location.pathname.startsWith("/seller/dashboard") ||
    location.pathname.startsWith("/seller/profile") ||
    location.pathname.startsWith("/seller/services") ||
    location.pathname.startsWith("/seller/orders") ||
    location.pathname.startsWith("/seller/packages") ||
    location.pathname.startsWith("/seller/wallet");
  const isContractorWorkspaceRoute = location.pathname.startsWith("/contractor/") || location.pathname === "/contractor";
  const userRole = user?.role || null;

  return (
    <>
      {!isAdminRoute && !isSellerRoute && !isContractorWorkspaceRoute && <Navbar />}

      <Routes>
        {/* Guest or Customer routes */}
        <Route element={<UserRoute allowGuests={true} />}>
          <Route path="/" element={<Home />} />
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/seller/:id" element={<SellerPublicProfile />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms-of-service" element={<TermsOfService />} />
        </Route>

        {/* Guest-only auth routes */}
        <Route element={<UserRoute guestOnly={true} />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/seller-register" element={<SellerRegister />} />
          <Route path="/verify-otp" element={<OtpVerification />} />
        </Route>

        {/* Customer-only protected routes */}
        <Route element={<UserRoute />}>
          <Route path="/book/:sellerId" element={<BookingPage />} />
          <Route path="/my-bookings" element={<MyBookings />} />
          <Route path="/booking-history" element={<BookingHistory />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/become-seller" element={<BecomeSeller />} />
        </Route>

        {/* Contractor Hub Public Routes */}
        <Route path="/contractor-hub" element={<ContractorFeed />} />
        <Route path="/work-site-requirements" element={<ContractorFeed />} />
        <Route path="/contractor-posts/:id" element={<ContractorPostDetail />} />
        <Route path="/contractor-register" element={<ContractorRegister />} />
        <Route path="/become-contractor" element={<ContractorRegister />} />

        {/* Contractor Protected Dashboard */}
        <Route element={<ContractorRoute />}>
          <Route path="/contractor" element={<ContractorLayout />}>
            <Route index element={<Navigate to="/contractor/dashboard" replace />} />
            <Route path="dashboard" element={<ContractorDashboard />} />
            <Route path="create-post" element={<CreateContractorPost />} />
            <Route path="quotes" element={<ContractorDashboard />} />
            <Route path="posts" element={<ContractorDashboard />} />
          </Route>
        </Route>

        {/* Seller (seller only) */}
        <Route element={<SellerRoute />}>
          <Route path="/seller" element={<SellerLayout />}>
            <Route
              index
              element={<Navigate to="/seller/dashboard" replace />}
            />
            <Route path="dashboard" element={<SellerDashboard />} />
            <Route path="profile" element={<SellerProfile />} />
            <Route path="services" element={<SellerServices />} />
            <Route path="dashboard/leads" element={<SellerLeads />} />
            <Route path="orders" element={<SellerOrders />} />
            <Route path="packages" element={<SellerPackages />} />
            <Route path="wallet" element={<SellerWallet />} />
          </Route>
        </Route>

        {/* Admin */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route element={<AdminRoute />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route
              index
              element={<Navigate to="/admin/dashboard" replace />}
            />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="sellers" element={<AdminSellers />} />
            <Route path="disputes" element={<AdminDisputes />} />
            <Route path="categories" element={<AdminCategories />} />
            {/* Placeholders */}
            <Route path="bookings" element={<AdminPlaceholder />} />
            <Route path="leads" element={<AdminPlaceholder />} />
            <Route path="services" element={<AdminPlaceholder />} />
            <Route path="services/approvals" element={<AdminPlaceholder />} />
            <Route path="payments" element={<AdminPlaceholder />} />
            <Route path="reviews" element={<AdminPlaceholder />} />
            <Route path="notifications" element={<AdminPlaceholder />} />
            <Route path="support" element={<AdminPlaceholder />} />
            <Route path="reports" element={<AdminPlaceholder />} />
            <Route path="locations" element={<AdminPlaceholder />} />
            <Route path="coupons" element={<AdminPlaceholder />} />
            <Route path="policies" element={<AdminDashboard />} />
            <Route path="settings" element={<AdminPlaceholder />} />
            <Route path="security" element={<AdminPlaceholder />} />
            <Route path="marketing" element={<AdminPlaceholder />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>

      {!isAdminRoute && !isSellerRoute && !isContractorWorkspaceRoute && <Footer />}
      {!isAdminRoute && !isSellerRoute && !isContractorWorkspaceRoute && <BottomNavUser />}
    </>
  );
}

// ✅ FIX: AuthProvider must be OUTERMOST, then SocketProvider and WalletProvider inside it
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <WalletProvider>
            <AppRoutes />
          </WalletProvider>
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
