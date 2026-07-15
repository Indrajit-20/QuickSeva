import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPinOff,
  AlertTriangle,
  X,
  RefreshCw,
  Compass,
  Smartphone
} from "lucide-react";

export default function LocationErrorModal({ isOpen, onClose, onRetry }) {
  const [activeTab, setActiveTab] = useState("chrome");
  const [detecting, setDetecting] = useState(false);

  // Auto-detect browser/OS on mount
  useEffect(() => {
    if (!isOpen) return;
    const ua = navigator.userAgent.toLowerCase();
    if (ua.includes("iphone") || ua.includes("ipad") || ua.includes("macintosh")) {
      setActiveTab("safari");
    } else if (ua.includes("android")) {
      setActiveTab("mobile");
    } else if (ua.includes("firefox")) {
      setActiveTab("firefox");
    } else {
      setActiveTab("chrome");
    }
  }, [isOpen]);

  const handleRetryClick = async () => {
    setDetecting(true);
    try {
      await onRetry();
    } finally {
      setDetecting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        />

        {/* Modal Box */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          transition={{ type: "spring", duration: 0.4 }}
          className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-800 shadow-2xl"
        >
          {/* Top Decorative Border */}
          <div className="h-1.5 w-full bg-gradient-to-r from-rose-500 via-amber-500 to-blue-600" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-full p-1.5 text-slate-400 hover:bg-slate-50 hover:text-slate-650 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Modal Content */}
          <div className="p-6 text-left">
            {/* Header: Icon & Title */}
            <div className="flex items-start gap-4 mb-5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600 border border-rose-100">
                <MapPinOff className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  Location Access Disabled
                </h3>
                <p className="mt-1 text-sm text-slate-500 leading-relaxed font-semibold">
                  QuickSeva needs location access to find and display the nearest service providers. Both your browser GPS and approximate IP location could not be determined.
                </p>
              </div>
            </div>

            {/* Instruction Tabs Header */}
            <div className="mb-4 flex border-b border-slate-200 text-xs font-bold">
              <button
                type="button"
                onClick={() => setActiveTab("chrome")}
                className={`pb-2.5 px-3 border-b-2 transition-all cursor-pointer ${
                  activeTab === "chrome"
                    ? "border-blue-500 text-blue-650"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                Chrome
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("safari")}
                className={`pb-2.5 px-3 border-b-2 transition-all cursor-pointer ${
                  activeTab === "safari"
                    ? "border-blue-500 text-blue-650"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                Safari / Mac
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("firefox")}
                className={`pb-2.5 px-3 border-b-2 transition-all cursor-pointer ${
                  activeTab === "firefox"
                    ? "border-blue-500 text-blue-650"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                Firefox
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("mobile")}
                className={`pb-2.5 px-3 border-b-2 transition-all cursor-pointer ${
                  activeTab === "mobile"
                    ? "border-blue-500 text-blue-650"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                Mobile Settings
              </button>
            </div>

            {/* Tab Contents */}
            <div className="min-h-[120px] rounded-xl bg-slate-50 border border-slate-200 p-4 text-sm text-slate-600 leading-relaxed font-semibold">
              {activeTab === "chrome" && (
                <ol className="list-decimal pl-5 space-y-2">
                  <li>
                    Click the <strong>Lock (🔒)</strong> or settings icon on the left side of the address bar at the top of the browser.
                  </li>
                  <li>
                    Find <strong>Location</strong> in the list and set the toggle to <strong>Allow</strong>.
                  </li>
                  <li>
                    Click <strong>Reload / Refresh</strong> if prompted, or click the **Retry Detection** button below.
                  </li>
                </ol>
              )}

              {activeTab === "safari" && (
                <ol className="list-decimal pl-5 space-y-2">
                  <li>
                    Open <strong>Safari Preferences</strong> (Mac menu: Safari &gt; Settings).
                  </li>
                  <li>
                    Go to the <strong>Websites</strong> tab at the top, then choose <strong>Location</strong> on the left.
                  </li>
                  <li>
                    Find <strong>QuickSeva</strong> in the active websites list and set its permission to <strong>Allow</strong>.
                  </li>
                </ol>
              )}

              {activeTab === "firefox" && (
                <ol className="list-decimal pl-5 space-y-2">
                  <li>
                    Click the <strong>Permissions icon</strong> (next to the lock icon) in the address bar.
                  </li>
                  <li>
                    If Location is listed as "Blocked", clear the block by clicking the <strong>X</strong> next to it.
                  </li>
                  <li>
                    Click the **Retry Detection** button below and click **Allow** when prompted.
                  </li>
                </ol>
              )}

              {activeTab === "mobile" && (
                <div className="space-y-3 text-left">
                  <div className="flex items-start gap-2.5">
                    <Smartphone className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
                    <div>
                      <h4 className="font-bold text-slate-800 text-xs">For Android / iOS Devices:</h4>
                      <p className="text-slate-500 text-xs mt-0.5 font-semibold">
                        Ensure device-wide Location/GPS services are toggled **ON** in your pull-down status bar or system settings.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Compass className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
                    <div>
                      <h4 className="font-bold text-slate-800 text-xs">For mobile browsers:</h4>
                      <p className="text-slate-500 text-xs mt-0.5 font-semibold">
                        Tap the browser settings menu &gt; Site settings &gt; Location &gt; Allow QuickSeva to access location.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Note / Tip */}
            <div className="mt-4 flex items-start gap-2.5 rounded-lg bg-blue-50 border border-blue-100 p-3 text-xs text-blue-700">
              <AlertTriangle className="h-4 w-4 shrink-0 text-blue-500 mt-0.5" />
              <span className="font-semibold">
                <strong>Quick Tip:</strong> If browser geolocation is blocked permanently, you must enable it in your browser settings using the steps above before clicking "Retry".
              </span>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={handleRetryClick}
                disabled={detecting}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 text-sm transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <RefreshCw className={`h-4 w-4 ${detecting ? "animate-spin" : ""}`} />
                {detecting ? "Detecting Location..." : "Retry Detection"}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center justify-center rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold px-5 py-3 text-sm transition border border-slate-200 cursor-pointer shadow-2xs"
              >
                Search Manually
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
