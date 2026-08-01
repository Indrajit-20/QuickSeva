import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import GlobalErrorBoundary from "./components/GlobalErrorBoundary.jsx";

// ── Global unhandled error safety net ──
// Prevents the app from crashing on unhandled promise rejections
// (e.g. Razorpay SDK failures, network errors, third-party script errors)
window.addEventListener("unhandledrejection", (event) => {
  console.warn("🛡️ Unhandled promise rejection caught globally:", event.reason);
  // Prevent the browser from showing the default error and crashing the page
  event.preventDefault();
});

window.addEventListener("error", (event) => {
  // Only suppress third-party script errors (Razorpay, analytics, etc.)
  // Don't suppress our own app errors — let ErrorBoundary handle those
  const src = event.filename || "";
  if (
    src.includes("razorpay") ||
    src.includes("checkout.razorpay") ||
    src.includes("direct.razorpay")
  ) {
    console.warn("🛡️ Third-party script error suppressed:", event.message);
    event.preventDefault();
  }
});

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <GlobalErrorBoundary>
      <App />
    </GlobalErrorBoundary>
  </StrictMode>
);
