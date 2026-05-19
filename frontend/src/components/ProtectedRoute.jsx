import { Navigate } from "react-router-dom";

/**
 * ProtectedRoute Component
 * Protects routes based on user role
 *
 * Props:
 * - element: Component to render if authorized
 * - allowedRoles: Array of roles allowed to access (e.g., ['admin', 'user'])
 * - userRole: Current user's role from localStorage/context
 *
 * Example usage:
 * <Route path="/admin" element={<ProtectedRoute element={<AdminDashboard />} allowedRoles={['admin']} userRole={userRole} />} />
 */
export default function ProtectedRoute({ element, allowedRoles, userRole }) {
  // Check if user role is in allowed roles array
  if (allowedRoles.includes(userRole)) {
    return element;
  }

  // If not authorized, redirect to unauthorized page
  return <Navigate to="/unauthorized" replace />;
}
