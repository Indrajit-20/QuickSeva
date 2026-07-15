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
import { deductPackagePurchase } from "../../utils/wallet";
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
    highlight: "Highlighted map pin",
    features: ["Top results", "Contact visible", "Highlighted pin"],
  },
  {
    id: "pro",
    name: "Pro",
    price: 355,
    days: 30,
    highlight: "Gold badge and support",
    features: [
      "Top results",
      "Contact visible",
      "Highlighted pin",
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
            plan: seller.plan,
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
      balanceAfter: walletBalance - selectedPlan.price,
      forfeitedDays:
        type === "upgrade" || type === "downgrade" ? remainingDays : 0,
    };
  }, [activePremium, remainingDays, selectedPlan, walletBalance]);

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

    // If wallet is insufficient, do not allow deduction flow here.
    if (purchasePreview.balanceAfter < 0) return;

    setProcessing(true);

    try {
      const resp = await apiClient.post("/sellers/packages/purchase", {
        planId: selectedPlan.id,
      });

      if (resp.data?.success) {
        const { premium: updatedPremium, walletBalance: newWalletBalance, transaction } = resp.data.data;
        
        const isPremiumActiveFlag = updatedPremium.is_premium === 1 || updatedPremium.is_premium === true;
        setPremium({
          plan: updatedPremium.plan,
          expiresAt: updatedPremium.premium_expires_at,
          isPremium: isPremiumActiveFlag
        });

        // Write to localStorage for immediate availability in other dashboard pages
        localStorage.setItem(
          "sellerPremium",
          JSON.stringify({
            plan: updatedPremium.plan,
            expiresAt: updatedPremium.premium_expires_at,
            isPremium: isPremiumActiveFlag,
          })
        );

        // Update the global auth user context
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
          `✅ ${selectedPlan.name} plan active until ${formatDate(updatedPremium.premium_expires_at)}. Wallet: Rs ${newWalletBalance}`,
        );
      } else {
        setToast(resp.data?.message || "Failed to purchase plan");
      }
    } catch (err) {
      console.error("Error purchasing plan:", err);
      setToast(err.response?.data?.message || "Error processing package purchase");
    } finally {
      setProcessing(false);
    }
  }, [selectedPlan, purchasePreview, processing, refreshWallet, updateUser]);

  // Flag for UI: whether current wallet balance can cover selected plan price
  const insufficient = purchasePreview?.balanceAfter < 0;

  if (loadingProfile) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-blue-600">
            Premium Packages
          </p>
          <h1 className="mt-1 text-2xl font-bold text-slate-800">
            Grow your QuickSeva business
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-500">
            Buy a package from your wallet. The plan starts immediately after a
            successful wallet debit.
          </p>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
          <Wallet size={20} className="text-emerald-700" />
          <div>
            <p className="text-xs font-semibold text-emerald-600">
              Wallet Balance
            </p>
            <p className="text-2xl font-black text-slate-800">Rs {walletBalance}</p>
          </div>
        </div>
      </div>

      {toast && (
        <div
          className={`rounded-xl border p-4 text-sm font-semibold ${
            toast.startsWith("Insufficient") || toast.startsWith("Failed") || toast.startsWith("Error")
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-emerald-200 bg-emerald-50 text-emerald-700"
          }`}
        >
          {toast}
        </div>
      )}

      {activePremium && remainingDays <= 2 && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-700">
          <AlertTriangle size={18} className="mt-0.5 flex-shrink-0" />
          <span>Your plan expires soon. Renew to keep your visibility.</span>
        </div>
      )}

      {expiredPremium && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
          Your {getPlanLabel(expiredPremium.plan)} plan expired on{" "}
          {formatDate(expiredPremium.expiresAt)}. Choose a package below to
          renew.
        </div>
      )}

      <section className={cardBase}>
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <Crown
                size={20}
                className={activePremium ? "text-amber-500" : "text-slate-400"}
              />
              <h2 className="text-lg font-bold text-slate-850">Current Status</h2>
              <span
                className={`rounded-full border px-3 py-1 text-xs font-bold ${
                  activePremium
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-slate-200 bg-slate-50 text-slate-600"
                }`}
              >
                {activePremium ? "Active" : "Free Plan"}
              </span>
            </div>

            <p className="text-sm text-slate-600">
              {activePremium
                ? `${activePlan?.name || "Premium"} plan active until ${expiryLabel}`
                : "No active package. You still appear to customers, but below active package sellers."}
            </p>

            {activePremium && (
              <p className="mt-2 text-sm font-bold text-emerald-600">
                {remainingDays} {remainingDays === 1 ? "day" : "days"} remaining
              </p>
            )}
          </div>

          <div className="rounded-lg bg-slate-50 border border-slate-200 p-4">
            {activePlan ? (
              <FeatureList features={activePlan.features} />
            ) : (
              <ul className="space-y-2 text-sm text-slate-500">
                <li>Top placement locked</li>
                <li>Contact hidden until booking</li>
                <li>Badge and highlighted pin unavailable</li>
              </ul>
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        {plans.map((plan) => {
          const isCurrent = activePlan?.id === plan.id;
          return (
            <div
              key={plan.id}
              className={`${cardBase} ${
                isCurrent
                  ? "border-emerald-350 shadow-sm"
                  : plan.id === "pro"
                    ? "border-amber-250"
                    : ""
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-xl font-bold text-slate-800">{plan.name}</h3>
                  <p className="mt-1 text-sm text-blue-600 font-semibold">
                    {plan.highlight}
                  </p>
                </div>
                {isCurrent && (
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800 border border-emerald-250">
                    Active
                  </span>
                )}
              </div>

              <div className="mt-5 flex items-end gap-2">
                <span className="text-4xl font-black text-slate-800">
                  Rs {plan.price}
                </span>
                <span className="pb-1 text-sm text-slate-400">
                  / {plan.days} days
                </span>
              </div>

              <div className="mt-5">
                <FeatureList features={plan.features} />
              </div>

              <button
                type="button"
                onClick={() => openConfirmation(plan)}
                className="mt-6 w-full rounded-lg bg-blue-600 hover:bg-blue-700 px-4 py-2.5 text-sm font-bold text-white transition shadow-sm cursor-pointer"
              >
                {isCurrent ? "Renew / Extend" : "Buy Now"}
              </button>
            </div>
          );
        })}
      </section>

      <section className={cardBase}>
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-slate-800">Package History</h2>
          <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
            {history.length} purchases
          </span>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-slate-200 text-xs uppercase text-slate-400 tracking-wide">
              <tr>
                <th className="py-3 pr-4 font-semibold">Date</th>
                <th className="py-3 pr-4 font-semibold">Plan</th>
                <th className="py-3 pr-4 font-semibold">Type</th>
                <th className="py-3 pr-4 font-semibold">Amount</th>
                <th className="py-3 font-semibold">Expires</th>
                <th className="py-3 pl-4 font-semibold">Invoice</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {history.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No package purchases yet
                  </td>
                </tr>
              ) : (
                history.slice(0, 10).map((entry) => (
                  <tr key={entry.receiptId} className="text-slate-600 hover:bg-slate-50 transition-colors">
                    <td className="py-4 pr-4 text-slate-400">
                      {formatDateTime(entry.purchasedAt)}
                    </td>
                    <td className="py-4 pr-4 font-bold text-slate-800">
                      {getPlanLabel(entry.plan)}
                    </td>
                    <td className="py-4 pr-4 capitalize">{entry.type}</td>
                    <td className="py-4 pr-4 font-bold text-red-600">-Rs {entry.price}</td>
                    <td className="py-4">{formatDate(entry.expiresAt)}</td>
                    <td className="py-4 pl-4">
                      <button
                        type="button"
                        onClick={() => openInvoice(entry)}
                        className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-slate-100 cursor-pointer"
                      >
                        Invoice
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {invoiceOpen && invoice && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm px-4"
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            aria-label="Close invoice"
            className="fixed inset-0"
            onClick={closeInvoice}
          />

          <div className="relative w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <button
              type="button"
              onClick={closeInvoice}
              disabled={invoicePrinting}
              className="absolute right-4 top-4 rounded-lg bg-slate-100 p-2 text-slate-500 hover:text-slate-700 disabled:opacity-50 cursor-pointer"
              aria-label="Close invoice modal"
            >
              <X size={18} />
            </button>

            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-blue-600">Invoice</p>
                <p className="mt-1 text-2xl font-black text-slate-805">
                  {invoice.id}
                </p>
                <p className="mt-1 text-sm text-slate-400">
                  Invoice date:{" "}
                  {formatDate(invoice.meta?.purchasedAt || invoice.meta?.date)}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setInvoicePrinting(true);
                    window.print();
                    window.setTimeout(() => setInvoicePrinting(false), 1000);
                  }}
                  className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-700 shadow-sm cursor-pointer"
                >
                  Download / Print
                </button>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-slate-800">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-xl font-bold">QuickSeva</div>
                  <div className="text-sm text-slate-500">
                    Premium Seller Invoice
                  </div>
                </div>
                <div className="text-sm">
                  <div className="font-semibold text-slate-500">Invoice No:</div>
                  <div>{invoice.id}</div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <div className="text-sm font-semibold text-slate-500">
                    Seller
                  </div>
                  <div className="text-sm text-slate-700 font-bold">
                    {invoice.seller?.name || "User"} —{" "}
                    {invoice.seller?.phone || "8160977394"}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-500">
                    Date
                  </div>
                  <div className="text-sm text-slate-700">
                    {formatDate(
                      invoice.meta?.purchasedAt || invoice.meta?.date,
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <div className="mb-2 text-sm font-semibold text-slate-500 border-b border-slate-200 pb-1">
                  Plan Details
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Plan</span>
                    <span className="font-semibold text-slate-800">{invoice.plan?.name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Type</span>
                    <span className="font-semibold capitalize text-slate-800">
                      {(
                        invoice.plan?.type ||
                        invoice.payment?.status ||
                        "new"
                      ).toString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Amount</span>
                    <span className="font-semibold text-slate-800 font-mono">
                      Rs {invoice.pricing?.subtotal}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Expiry date</span>
                    <span className="font-semibold text-slate-800">
                      {formatDate(invoice.plan?.expiresAt)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6 border-t border-slate-200 pt-4 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">GST (18%)</span>
                  <span className="font-semibold text-slate-700 font-mono">
                    Rs {invoice.pricing?.gstAmount}
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="font-semibold text-slate-800">Total</span>
                  <span className="font-bold text-slate-800 text-lg font-mono">
                    Rs {invoice.pricing?.grandTotal}
                  </span>
                </div>
              </div>

              <div className="mt-8 text-xs text-slate-400">
                Payment method: {invoice.payment?.method || "UPI (Fake)"}
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={closeInvoice}
                className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedPlan && purchasePreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm px-4">
          <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            {insufficient ? (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
                Insufficient wallet balance. Please recharge your wallet.
              </div>
            ) : null}

            <button
              type="button"
              onClick={closeConfirmation}
              disabled={processing}
              className="absolute right-4 top-4 rounded-lg bg-slate-100 p-2 text-slate-500 hover:text-slate-700 disabled:opacity-50 cursor-pointer"
              aria-label="Close confirmation"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-2 text-amber-600">
              <Crown size={18} />
              <span className="text-sm font-bold">
                Confirm package purchase
              </span>
            </div>

            <h2 className="mt-2 text-2xl font-bold text-slate-800">
              {selectedPlan.name} Plan
            </h2>

            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
              <PlanActionCopy
                type={purchasePreview.type}
                activePremium={activePremium}
                selectedPlan={selectedPlan}
              />
            </div>

            <div className="mt-4 space-y-3 rounded-xl bg-slate-50 border border-slate-200 p-4 text-sm text-slate-650">
              <div className="flex items-center justify-between gap-4">
                <span>Plan amount</span>
                <span className="font-bold text-slate-800 font-mono">
                  Rs {selectedPlan.price}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span>Current wallet balance</span>
                <span className="font-bold text-slate-800 font-mono">Rs {walletBalance}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span>Balance after deduction</span>
                <span
                  className={`font-bold font-mono ${
                    purchasePreview.balanceAfter < 0
                      ? "text-red-700"
                      : "text-emerald-700"
                  }`}
                >
                  Rs {purchasePreview.balanceAfter}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span>New expiry</span>
                <span className="font-bold text-slate-800">
                  {purchasePreview.expiryLabel}
                </span>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={closeConfirmation}
                disabled={processing}
                className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>

              {insufficient ? (
                <button
                  type="button"
                  onClick={openAddFundsFromConfirmation}
                  disabled={processing}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-purple-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-purple-700 disabled:opacity-50 cursor-pointer shadow-sm"
                >
                  {processing && <Loader2 size={16} className="animate-spin" />}
                  + Add Money to Wallet
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleConfirmPurchase}
                  disabled={processing || purchasePreview.balanceAfter < 0}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 px-4 py-2.5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer shadow-sm"
                >
                  {processing && <Loader2 size={16} className="animate-spin" />}
                  Confirm
                </button>
              )}
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
