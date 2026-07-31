import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Crown,
  Loader2,
  Wallet,
  X,
} from "lucide-react";
import { generateInvoice } from "../../utils/invoice";

import { useAuth } from "../../context/AuthContext";
import {
  cleanupExpiredPremium,
  getPlanLabel,
  getPlanRank,
  getRemainingDays,
  getUpgradedFeatures,
  isPremiumActive,
} from "../../utils/premium";
import { loadRazorpayScript } from "../../utils/razorpayLoader";
import { createPaymentOrderApi, verifyPaymentApi } from "../../api/walletApi";
import AddFundsModal from "../../components/AddFundsModal";
import { useWallet } from "../../context/WalletContext";
import apiClient from "../../api/axiosConfig";

const plans = [
  {
    id: "basic",
    name: "Basic",
    price: 55,
    days: 7,
    highlight: "Top search placement",
    features: ["Top results", "Contact visible"],
  },
  {
    id: "standard",
    name: "Standard",
    price: 155,
    days: 15,
    highlight: "Lead Alerts + Highlighted pin",
    features: ["Top results", "Contact visible", "Highlighted pin", "Lead Alerts"],
  },
  {
    id: "pro",
    name: "Pro",
    price: 355,
    days: 30,
    highlight: "All features + Priority support",
    features: [
      "Top results",
      "Contact visible",
      "Highlighted pin",
      "Lead Alerts",
      "Gold badge",
      "Priority support",
    ],
  },
];

const STORAGE_KEYS = {
  premium: "sellerPremium",
  premiumHistory: "sellerPremiumHistory",
  sellers: "sellers",
  registeredSeller: "registeredSeller",
};

const cardBase =
  "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm";

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function readArray(key) {
  const parsed = readJson(key, []);
  return Array.isArray(parsed) ? parsed : [];
}

function formatDate(iso) {
  if (!iso) return "";
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(iso));
}

function formatDateTime(iso) {
  if (!iso) return "";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(iso));
}

function getSellerIdentity(user) {
  const registeredSeller = readJson(STORAGE_KEYS.registeredSeller, null);
  return {
    sellerId: user?.sellerId || registeredSeller?.id,
    userPhone: user?.phone || registeredSeller?.mobileNumber,
    userName: user?.name || registeredSeller?.businessName,
  };
}

function getExpiryForPurchase(plan, activePremium, purchaseType) {
  if (purchaseType === "extend" && activePremium?.expiresAt) {
    const currentExpiry = new Date(activePremium.expiresAt).getTime();
    return new Date(
      currentExpiry + plan.days * 24 * 60 * 60 * 1000,
    ).toISOString();
  }

  return new Date(Date.now() + plan.days * 24 * 60 * 60 * 1000).toISOString();
}

// Custom purchase plan rank
const getPurchaseType = (plan, activePremium) => {
  if (!activePremium?.plan) return "new";
  const currentRank = getPlanRank(activePremium.plan);
  const selectedRank = getPlanRank(plan.id);
  if (selectedRank === currentRank) return "extend";
  if (selectedRank > currentRank) return "upgrade";
  return "downgrade";
};

function FeatureList({ features, isLight = true }) {
  return (
    <ul className="space-y-2 text-sm text-slate-600">
      {features.map((feature) => (
        <li key={feature} className="flex items-center gap-2">
          <CheckCircle2 size={16} className="text-emerald-600" />
          <span>{feature}</span>
        </li>
      ))}
    </ul>
  );
}

function PlanActionCopy({ type, activePremium, selectedPlan }) {
  if (!selectedPlan) return null;

  if (type === "extend") {
    return (
      <p className="text-sm text-amber-800">
        Your current {selectedPlan.name} plan will be extended by{" "}
        {selectedPlan.days} days.
      </p>
    );
  }

  if (type === "upgrade") {
    const gained = getUpgradedFeatures(activePremium?.plan, selectedPlan.id);
    return (
      <div className="space-y-2 text-slate-700">
        <p className="text-sm text-slate-700">
          Upgrading from {getPlanLabel(activePremium?.plan)} to{" "}
          {selectedPlan.name} starts the new plan immediately. Remaining days on
          the old plan are forfeited.
        </p>
        {gained.length > 0 && (
          <p className="text-sm text-emerald-700 font-semibold">
            New benefits: {gained.join(", ")}
          </p>
        )}
      </div>
    );
  }

  if (type === "downgrade") {
    return (
      <p className="text-sm text-amber-800">
        Downgrading starts {selectedPlan.name} today and forfeits remaining days
        on {getPlanLabel(activePremium?.plan)}.
      </p>
    );
  }

  return (
    <p className="text-sm text-slate-600">
      The package benefit activates immediately after wallet deduction.
    </p>
  );
}

export default function SellerPackages() {
  const { user, updateUser } = useAuth();
  const { walletBalance, refreshWallet } = useWallet();

  const [premium, setPremium] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  const [selectedPlan, setSelectedPlan] = useState(null);
  const [toast, setToast] = useState("");
  const [processing, setProcessing] = useState(false);

  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [invoice, setInvoice] = useState(null);
  const [invoicePrinting, setInvoicePrinting] = useState(false);

  const [history, setHistory] = useState([]);

  useEffect(() => {
    const fetchProfileAndHistory = async () => {
      try {
        setLoadingProfile(true);
        const profileResp = await apiClient.get("/sellers/me/profile");
        const seller = profileResp.data?.data?.seller || profileResp.data?.seller;
        if (seller) {
          setPremium({
            plan: seller.plan === "premium" ? "pro" : seller.plan,
            expiresAt: seller.premium_expires_at,
            isPremium: seller.is_premium === 1 || seller.is_premium === true
          });
        }
        
        const historyResp = await apiClient.get("/sellers/packages/history");
        const histData = historyResp.data?.data || historyResp.data?.history || historyResp.data || [];
        setHistory(Array.isArray(histData) ? histData : []);
      } catch (err) {
        console.error("Failed to fetch seller package info:", err);
      } finally {
        setLoadingProfile(false);
      }
    };

    fetchProfileAndHistory();
    refreshWallet();
  }, [refreshWallet]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(""), 4500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const activePremium = useMemo(
    () => (isPremiumActive(premium) ? premium : null),
    [premium],
  );

  const expiredPremium = premium?.expiresAt && !activePremium ? premium : null;
  const activePlan = plans.find((plan) => plan.id === activePremium?.plan);
  const remainingDays = getRemainingDays(activePremium?.expiresAt);
  const expiryLabel = formatDate(activePremium?.expiresAt);

  const [addFundsOpen, setAddFundsOpen] = useState(false);
  const [addFundsPrefill, setAddFundsPrefill] = useState(0);
  const [resumeConfirmAfterTopUp, setResumeConfirmAfterTopUp] = useState(false);

  // Reusable modal flow state for adding wallet balance from this page
  const [addFundsSuccessTick, setAddFundsSuccessTick] = useState(0);

  const openAddFundsFromConfirmation = useCallback(() => {
    if (!selectedPlan) return;
    const shortfall = Math.max(1, selectedPlan.price - walletBalance);
    setAddFundsPrefill(shortfall);
    setResumeConfirmAfterTopUp(true);
    setAddFundsOpen(true);
    closeConfirmation();
  }, [selectedPlan, walletBalance]);

  const purchasePreview = useMemo(() => {
    if (!selectedPlan) return null;
    const type = getPurchaseType(selectedPlan, activePremium);
    const expiresAt = getExpiryForPurchase(selectedPlan, activePremium, type);
    return {
      type,
      expiresAt,
      expiryLabel: formatDate(expiresAt),
      forfeitedDays:
        type === "upgrade" || type === "downgrade" ? remainingDays : 0,
    };
  }, [activePremium, remainingDays, selectedPlan]);

  const openConfirmation = (plan) => {
    setToast("");
    setSelectedPlan(plan);
  };

  const closeConfirmation = useCallback(() => {
    if (processing) return;
    setSelectedPlan(null);
  }, [processing]);

  const handleAddFundsSuccess = useCallback(() => {
    refreshWallet();
    if (resumeConfirmAfterTopUp && selectedPlan) {
      setResumeConfirmAfterTopUp(false);
      setAddFundsOpen(false);
      // Reopen confirmation modal after wallet has been updated
      setTimeout(() => {
        setSelectedPlan(selectedPlan);
      }, 100);
    }
  }, [resumeConfirmAfterTopUp, selectedPlan, refreshWallet]);

  const openInvoice = (entry) => {
    setInvoicePrinting(false);
    const sellerIdentity = {
      name: user?.name || "User",
      phone: user?.phone || "8160977394",
      purchasedAt: entry?.purchasedAt,
    };

    const planData = {
      name: getPlanLabel(entry?.plan),
      price: entry?.price,
      days: plans.find((p) => p.id === entry?.plan)?.days || 0,
      planId: entry?.plan,
      id: entry?.plan,
      expiresAt: entry?.expiresAt,
    };

    // generateInvoice persists invoice in localStorage and returns printable invoice object
    const inv = generateInvoice(sellerIdentity, planData);

    setInvoice(inv);
    setInvoiceOpen(true);
  };

  const closeInvoice = () => {
    if (invoicePrinting) return;
    setInvoiceOpen(false);
    setInvoice(null);
  };

  const handleConfirmPurchase = useCallback(async () => {
    if (!selectedPlan || !purchasePreview || processing) return;

    setProcessing(true);

    try {
      // 1. Load Razorpay script
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        setToast("❌ Razorpay SDK failed to load. Please check your internet connection.");
        setProcessing(false);
        return;
      }

      // 2. Create payment order on backend
      const orderRes = await createPaymentOrderApi(selectedPlan.price, "premium_package", selectedPlan.id);
      if (!orderRes || !orderRes.success) {
        setToast(orderRes?.message || "❌ Failed to create payment order");
        setProcessing(false);
        return;
      }

      const orderData = orderRes.data;

      // 3. Launch Razorpay modal
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "QuickSeva",
        description: `Premium Package: ${selectedPlan.name} Plan`,
        order_id: orderData.id,
        handler: async function (response) {
          try {
            setProcessing(true);
            // 4. Verify payment on backend
            const verifyRes = await verifyPaymentApi({
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
              purpose: "premium_package",
              planId: selectedPlan.id,
              amount: selectedPlan.price,
            });

            if (verifyRes && verifyRes.success) {
              const { premium: updatedPremium, walletBalance: newWalletBalance, transaction } = verifyRes.data;
              
              const isPremiumActiveFlag = updatedPremium.is_premium === 1 || updatedPremium.is_premium === true;
              setPremium({
                plan: updatedPremium.plan === "premium" ? "pro" : updatedPremium.plan,
                expiresAt: updatedPremium.premium_expires_at,
                isPremium: isPremiumActiveFlag
              });

              // Write to localStorage for immediate availability in other dashboard pages
              localStorage.setItem(
                "sellerPremium",
                JSON.stringify({
                  plan: updatedPremium.plan === "premium" ? "pro" : updatedPremium.plan,
                  expiresAt: updatedPremium.premium_expires_at,
                  isPremium: isPremiumActiveFlag,
                })
              );

              // Update global auth user context
              if (typeof updateUser === "function") {
                updateUser({
                  is_premium: isPremiumActiveFlag ? 1 : 0,
                  plan: updatedPremium.plan,
                  premium_expires_at: updatedPremium.premium_expires_at,
                });
              }

              // Add history entry
              const historyEntry = {
                receiptId: transaction.id || `QS-PKG-${Date.now()}`,
                plan: updatedPremium.plan,
                price: selectedPlan.price,
                purchasedAt: transaction.created_at || new Date().toISOString(),
                expiresAt: updatedPremium.premium_expires_at,
                type: purchasePreview.type,
                walletTransactionId: transaction.id,
                balanceAfter: newWalletBalance,
              };
              setHistory(prev => [historyEntry, ...prev]);
              
              await refreshWallet();
              setSelectedPlan(null);
              setToast(
                `✅ ${selectedPlan.name} plan active until ${formatDate(updatedPremium.premium_expires_at)}.`,
              );
            } else {
              setToast(verifyRes?.message || "❌ Payment verification failed");
            }
          } catch (err) {
            console.error("Verification error:", err);
            setToast("❌ Error verifying payment");
          } finally {
            setProcessing(false);
          }
        },
        prefill: {
          name: user?.name || "",
          email: user?.email || "",
          contact: user?.phone || "",
        },
        theme: {
          color: "#7C3AED", // Pro/Premium Violet brand color
        },
        modal: {
          ondismiss: function () {
            setProcessing(false);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error("Razorpay purchase error:", err);
      setToast(err.response?.data?.message || "❌ Error initiating package purchase");
      setProcessing(false);
    }
  }, [selectedPlan, purchasePreview, processing, refreshWallet, updateUser]);

  // Flag for UI: no longer using wallet balance check for packages
  const insufficient = false;

  if (loadingProfile) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }  return (
    <div className="seller-page space-y-5 animate-fade-in">
      {/* ── Page Header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="seller-page-title">Premium Packages</h1>
          <p className="seller-page-subtitle">
            Buy a package to grow your QuickSeva business / अपना व्यवसाय बढ़ाएं
          </p>
        </div>

        <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 shadow-sm shrink-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
            <Wallet size={20} />
          </div>
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Lead Credits
            </p>
            <p style={{ fontSize: 18, fontWeight: 800, color: '#1e293b' }}>{walletBalance} Credits</p>
          </div>
        </div>
      </div>

      {toast && (
        <div
          className={`rounded-2xl border p-4 text-sm font-semibold ${
            toast.startsWith("Insufficient") || toast.startsWith("Failed") || toast.startsWith("Error")
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-emerald-200 bg-emerald-50 text-emerald-700"
          }`}
        >
          {toast}
        </div>
      )}

      {activePremium && remainingDays <= 2 && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-700">
          <AlertTriangle size={18} className="mt-0.5 flex-shrink-0" />
          <span>Your plan expires soon. Renew to keep your visibility.</span>
        </div>
      )}

      {expiredPremium && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
          Your {getPlanLabel(expiredPremium.plan)} plan expired on{" "}
          {formatDate(expiredPremium.expiresAt)}. Choose a package below to renew.
        </div>
      )}

      {/* ── Current Premium Status ── */}
      <div className="seller-card">
        <div className="seller-card-body">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Crown
                  size={20}
                  className={activePremium ? "text-amber-500 fill-amber-500/20" : "text-slate-400"}
                />
                <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1e293b' }}>Current Status</h2>
              </div>
              <span
                className={`seller-status-pill ${
                  activePremium
                    ? "seller-status-pill--completed"
                    : "seller-status-pill--pending"
                }`}
              >
                <span className="seller-status-dot" />
                {activePremium ? "Premium Active" : "Free Plan"}
              </span>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/60">
              <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.5 }}>
                {activePremium
                  ? `${activePlan?.name || "Premium"} plan active until ${expiryLabel}`
                  : "No active package. You still appear to customers, but below active package sellers."}
              </p>
              {activePremium && (
                <p style={{ fontSize: 13, fontWeight: 800, color: '#059669', marginTop: 6 }}>
                  {remainingDays} {remainingDays === 1 ? "day" : "days"} remaining / {remainingDays} दिन बचे हैं
                </p>
              )}
            </div>

            <div>
              <p style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>
                Plan Benefits / योजना के लाभ
              </p>
              {activePlan ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {activePlan.features.map(f => (
                    <div key={f} className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                      <CheckCircle2 size={16} className="text-emerald-600" />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {["Top search placement locked", "Direct contact visibility locked", "Highlighted map pin & badge unavailable"].map(f => (
                    <div key={f} className="flex items-center gap-2 text-sm font-semibold text-slate-400">
                      <div className="w-4 h-4 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-400">✕</div>
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Subscriptions Plans Grid ── */}
      <div className="grid gap-4 lg:grid-cols-3">
        {plans.map((plan) => {
          const isCurrent = activePlan?.id === plan.id;
          const isRecommended = plan.id === "pro";
          return (
            <div
              key={plan.id}
              className={`seller-plan-card ${isCurrent ? "seller-plan-card--active" : ""} ${isRecommended ? "seller-plan-card--recommended" : ""}`}
            >
              {isRecommended && (
                <div className="seller-plan-badge bg-violet-650 text-white" style={{ background: '#7c3aed' }}>
                  Best Value
                </div>
              )}
              {isCurrent && !isRecommended && (
                <div className="seller-plan-badge bg-emerald-650 text-white" style={{ background: '#059669' }}>
                  Active
                </div>
              )}

              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 850, color: '#0f172a' }}>{plan.name} Plan</h3>
                  <p style={{ fontSize: 13, color: '#2563eb', fontWeight: 705, marginTop: 4 }}>
                    {plan.highlight}
                  </p>
                </div>
              </div>

              <div className="mt-5 flex items-end gap-2">
                <span style={{ fontSize: 32, fontWeight: 900, color: '#0f172a' }}>
                  ₹{plan.price}
                </span>
                <span style={{ fontSize: 13, color: '#94a3b8', fontWeight: 600, paddingBottom: 4 }}>
                  / {plan.days} days
                </span>
              </div>

              <div className="mt-5 space-y-2.5">
                {plan.features.map((feature) => (
                  <div key={feature} className="seller-plan-feature">
                    <div className="seller-plan-feature-check bg-emerald-50 text-emerald-600 border border-emerald-250">
                      <CheckCircle2 size={13} />
                    </div>
                    <span>{feature}</span>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => openConfirmation(plan)}
                className={`seller-action-btn seller-action-btn--full mt-6 ${isCurrent ? "seller-action-btn--success" : "seller-action-btn--primary"}`}
              >
                {isCurrent ? "✓ Renew / Extend" : "Buy Now / अभी खरीदें"}
              </button>
            </div>
          );
        })}
      </div>

      {/* ── Purchase History ── */}
      <div className="seller-card">
        <div className="seller-card-body">
          <div className="flex items-center justify-between gap-3" style={{ marginBottom: 16 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>Purchase History</h2>
            <span style={{
              fontSize: 11, fontWeight: 750, color: '#2563eb',
              background: '#eff6ff', border: '1px solid #bfdbfe',
              padding: '4px 10px', borderRadius: 20,
            }}>
              {history.length} purchases
            </span>
          </div>

          {history.length === 0 ? (
            <div className="seller-empty-state" style={{ padding: '32px 20px', border: 'none' }}>
              <div className="seller-empty-icon">
                <Crown size={24} />
              </div>
              <div className="seller-empty-title">No purchases yet</div>
              <div className="seller-empty-text">Your plan purchase history will appear here</div>
            </div>
          ) : (
            <div className="space-y-3.5">
              {history.slice(0, 10).map((entry) => (
                <div key={entry.receiptId} className="flex items-center justify-between gap-3 pb-3.5 border-b border-slate-100 last:border-none last:pb-0">
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="flex items-center gap-2">
                      <span style={{ fontSize: 14, fontWeight: 800, color: '#1e293b' }}>
                        {getPlanLabel(entry.plan)} Plan
                      </span>
                      <span className="seller-status-pill seller-status-pill--completed" style={{ fontSize: 9, padding: '2px 8px' }}>
                        {entry.type || "active"}
                      </span>
                    </div>
                    <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 4, fontWeight: 500 }}>
                      Expires: {formatDate(entry.expiresAt)}
                    </p>
                    <p style={{ fontSize: 11, color: '#94a3b8', fontWeight: 500 }}>
                      Date: {formatDateTime(entry.purchasedAt)}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <span style={{ fontSize: 15, fontWeight: 900, color: '#ef4444' }}>
                      -₹{entry.price}
                    </span>
                    <button
                      type="button"
                      onClick={() => openInvoice(entry)}
                      className="seller-action-btn seller-action-btn--outline"
                      style={{ padding: '6px 12px', minHeight: 32, fontSize: 11 }}
                    >
                      Invoice
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Invoice Detail Bottom Sheet ── */}
      {invoiceOpen && invoice && (
        <div
          className="seller-bottom-sheet-overlay"
          style={{ alignItems: "center", padding: "16px" }}
          role="dialog"
          aria-modal="true"
          onClick={(e) => { if (e.target === e.currentTarget) closeInvoice(); }}
        >
          <div className="seller-bottom-sheet" style={{ maxWidth: 500, borderRadius: "24px", paddingBottom: "24px" }}>
            <div className="flex items-center justify-between" style={{ marginBottom: 14 }}>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a' }}>Invoice Details</h3>
              <button
                type="button"
                onClick={closeInvoice}
                disabled={invoicePrinting}
                className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-50 border border-slate-200 text-slate-500 active:scale-90 transition"
                aria-label="Close invoice"
              >
                <X size={16} />
              </button>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-slate-800 space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <div style={{ fontSize: 16, fontWeight: 800 }}>QuickSeva Invoice</div>
                  <div style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>Premium Seller Subscription</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Receipt</span>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', fontFamily: 'monospace' }}>{invoice.id?.slice(0, 12)}...</p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, borderTop: '1px solid #e2e8f0', paddingTop: 12 }}>
                <div>
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Seller</span>
                  <p style={{ fontSize: 13, fontWeight: 750, color: '#334155', marginTop: 2 }}>
                    {invoice.seller?.name || "User"}
                  </p>
                  <p style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>
                    {invoice.seller?.phone || ""}
                  </p>
                </div>
                <div>
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Billing Date</span>
                  <p style={{ fontSize: 13, fontWeight: 750, color: '#334155', marginTop: 2 }}>
                    {formatDate(invoice.meta?.purchasedAt || invoice.meta?.date)}
                  </p>
                </div>
              </div>

              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 12 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>
                  Plan details
                </span>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span style={{ color: '#64748b' }}>Plan Type</span>
                    <span style={{ fontWeight: 755, color: '#1e293b' }}>{invoice.plan?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: '#64748b' }}>Duration</span>
                    <span style={{ fontWeight: 755, color: '#1e293b' }}>{plans.find(p => p.id === invoice.plan?.planId)?.days || 30} days</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: '#64748b' }}>Plan Expiry</span>
                    <span style={{ fontWeight: 755, color: '#1e293b' }}>{formatDate(invoice.plan?.expiresAt)}</span>
                  </div>
                  <div className="flex justify-between" style={{ borderTop: '1.5px dashed #cbd5e1', paddingTop: 8, marginTop: 4 }}>
                    <span style={{ color: '#64748b' }}>Subtotal</span>
                    <span style={{ fontWeight: 700 }}>₹{invoice.pricing?.subtotal}</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: '#64748b' }}>GST (18%)</span>
                    <span style={{ fontWeight: 700 }}>₹{invoice.pricing?.gstAmount}</span>
                  </div>
                  <div className="flex justify-between" style={{ borderTop: '1.5px solid #cbd5e1', paddingTop: 8, fontSize: 15, fontWeight: 800, color: '#1e293b' }}>
                    <span>Total Amount</span>
                    <span>₹{invoice.pricing?.grandTotal}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3" style={{ marginTop: 16 }}>
              <button
                type="button"
                onClick={() => {
                  setInvoicePrinting(true);
                  window.print();
                  window.setTimeout(() => setInvoicePrinting(false), 1000);
                }}
                className="seller-action-btn seller-action-btn--primary seller-action-btn--full"
              >
                Download / Print
              </button>
              <button
                type="button"
                onClick={closeInvoice}
                className="seller-action-btn seller-action-btn--outline seller-action-btn--full"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Purchase Confirm Bottom Sheet ── */}
      {selectedPlan && purchasePreview && (
        <div
          className="seller-bottom-sheet-overlay"
          style={{ alignItems: "center", padding: "16px" }}
          role="dialog"
          aria-modal="true"
          onClick={(e) => { if (e.target === e.currentTarget && !processing) closeConfirmation(); }}
        >
          <div className="seller-bottom-sheet" style={{ maxWidth: 450, borderRadius: "24px", paddingBottom: "24px" }}>

            <div className="flex items-center justify-between" style={{ marginBottom: 14 }}>
              <div className="flex items-center gap-2 text-amber-600">
                <Crown size={20} className="fill-amber-500/10" />
                <span style={{ fontSize: 16, fontWeight: 800 }}>Confirm Package</span>
              </div>
              <button
                type="button"
                onClick={closeConfirmation}
                disabled={processing}
                className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-50 border border-slate-200 text-slate-500 active:scale-90 transition"
                aria-label="Close confirmation"
              >
                <X size={16} />
              </button>
            </div>

            {insufficient ? (
              <div className="seller-offline-banner" style={{ borderColor: '#fecaca', background: '#fef2f2', marginBottom: 16 }}>
                <div className="seller-offline-icon" style={{ background: '#fee2e2', color: '#dc2626' }}>
                  <AlertTriangle size={20} />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#991b1b' }}>Insufficient Balance</p>
                  <p style={{ fontSize: 11, color: '#dc2626', marginTop: 1 }}>
                    Please add funds to your wallet to complete purchase.
                  </p>
                </div>
              </div>
            ) : null}

            <h2 style={{ fontSize: 20, fontWeight: 900, color: '#0f172a' }}>
              {selectedPlan.name} Plan
            </h2>

            <div style={{
              borderRadius: 16, border: '1px solid #fde68a', background: '#fffbeb',
              padding: 14, marginTop: 12, fontSize: 13, fontWeight: 600, color: '#b45309'
            }}>
              <PlanActionCopy
                type={purchasePreview.type}
                activePremium={activePremium}
                selectedPlan={selectedPlan}
              />
            </div>

            <div className="space-y-3 rounded-2xl bg-slate-50 border border-slate-200 p-4 text-sm text-slate-650" style={{ marginTop: 14 }}>
              <div className="flex items-center justify-between gap-4">
                <span>Plan cost</span>
                <span style={{ fontWeight: 800, color: '#1e293b' }}>₹{selectedPlan.price}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span>Payment method</span>
                <span style={{ fontWeight: 700, color: '#2563eb' }}>Razorpay Online</span>
              </div>
              <div className="flex items-center justify-between gap-4" style={{ borderTop: '1px dashed #cbd5e1', paddingTop: 10 }}>
                <span>New Expiry</span>
                <span style={{ fontWeight: 700, color: '#1e293b' }}>
                  {purchasePreview.expiryLabel}
                </span>
              </div>
            </div>

            <div className="flex gap-3" style={{ marginTop: 20 }}>
              <button
                type="button"
                onClick={closeConfirmation}
                disabled={processing}
                className="seller-action-btn seller-action-btn--outline seller-action-btn--full"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmPurchase}
                disabled={processing}
                className="seller-action-btn seller-action-btn--success seller-action-btn--full"
              >
                {processing && <Loader2 size={16} className="animate-spin" />}
                Pay & Activate ✓
              </button>
            </div>
          </div>
        </div>
      )}

      {addFundsOpen && (
        <AddFundsModal
          isOpen={addFundsOpen}
          onClose={() => {
            setAddFundsOpen(false);
            setResumeConfirmAfterTopUp(false);
          }}
          prefillAmount={addFundsPrefill}
          onSuccess={handleAddFundsSuccess}
          key={addFundsSuccessTick}
        />
      )}
    </div>
  );
}
