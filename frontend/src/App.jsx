import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useState } from "react";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import AdminDashboard from "./pages/AdminDashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";
import Home from "./pages/Home";
import Login from "./pages/Login";

import Register from "./pages/Register";
import OtpVerification from "./pages/OtpVerification";
import NotFound from "./pages/NotFound";
import Unauthorized from "./pages/Unauthorized";

// Example protected pages (create these when needed)
// import AdminDashboard from "./pages/AdminDashboard";
// import UserProfile from "./pages/UserProfile";

function App() {
  // TODO: Get userRole from localStorage or authentication context
  // For now, set it to null. After login, store the user's role.
  // Example: localStorage.setItem('userRole', 'user');
  const userRole = localStorage.getItem("userRole") || null;

  return (
    <AuthProvider>
      <BrowserRouter>
        {/* Navbar appears on every page */}
        <Navbar />

        {/* Routes render in the middle between Navbar and Footer */}
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-otp" element={<OtpVerification />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* EXAMPLE: Protected Routes (uncomment when pages are created) */}
          {/* 
        User-only route:
        <Route
          path="/profile"
          element={
            <ProtectedRoute
              element={<UserProfile />}
              allowedRoles={["user", "admin"]}
              userRole={userRole}
            />
          }
        />
*/
        //Admin-only route:
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
/*
        Premium-user only route:
        <Route
          path="/premium"
          element={
            <ProtectedRoute
              element={<PremiumContent />}
              allowedRoles={["premium", "admin"]}
              userRole={userRole}
            />
          }
        />
        */}

          {/* Catch-all route for 404 - must be last */}
          <Route path="*" element={<NotFound />} />
        </Routes>

        {/* Footer appears on every page */}
        <Footer />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
