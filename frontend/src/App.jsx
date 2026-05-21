import {
  BrowserRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import AdminDashboard from "./pages/AdminDashboard";
import AdminLogin from "./pages/AdminLogin";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import OtpVerification from "./pages/OtpVerification";
import SellerRegister from "./pages/SellerRegister";
import NotFound from "./pages/NotFound";
import Unauthorized from "./pages/Unauthorized";
import SellerLayout from "./layouts/SellerLayout";
import SellerDashboard from "./pages/seller/SellerDashboard";
import SellerProfile from "./pages/seller/SellerProfile";
import SellerServices from "./pages/seller/SellerServices";
import SellerOrders from "./pages/seller/SellerOrders";
import SellerPublicProfile from "./pages/SellerPublicProfile";

function SellerProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0f0e1a] flex items-center justify-center text-white">
        Loading...
      </div>
    );
  }

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}

function AppContent() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith("/admin");
  const isSellerRoute = location.pathname.startsWith("/seller");

  // TODO: Get userRole from localStorage or authentication context
  const userRole = localStorage.getItem("userRole") || null;

  return (
    <AuthProvider>
      {/* Show user navbar only on public user routes */}
      {!isAdminRoute && !isSellerRoute && <Navbar />}

      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/seller-register" element={<SellerRegister />} />
        <Route path="/seller/:id" element={<SellerPublicProfile />} />

        <Route path="/verify-otp" element={<OtpVerification />} />

        {/* Seller */}
        <Route element={<SellerProtectedRoute />}>
          <Route path="/seller" element={<SellerLayout />}>
            <Route
              index
              element={<Navigate to="/seller/dashboard" replace />}
            />
            <Route path="dashboard" element={<SellerDashboard />} />
            <Route path="profile" element={<SellerProfile />} />
            <Route path="services" element={<SellerServices />} />
            <Route path="orders" element={<SellerOrders />} />
          </Route>
        </Route>

        {/* Admin */}
        <Route path="/admin/login" element={<AdminLogin />} />

        <Route path="/unauthorized" element={<Unauthorized />} />

        {/* Protected */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute
              element={<AdminDashboard />}
              allowedRoles={["admin"]}
              userRole={userRole}
            />
          }
        />

        {/* Catch-all route for 404 - must be last */}
        <Route path="*" element={<NotFound />} />
      </Routes>

      {!isAdminRoute && !isSellerRoute && <Footer />}
    </AuthProvider>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}
