import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Crown,
  Loader2,
  Wallet,
  X,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import {
  cleanupExpiredPremium,
  getPlanLabel,
  getPlanRank,
  getRemainingDays,
  getUpgradedFeatures,
  isPremiumActive,
} from "../../utils/premium";
import { deductPackagePurchase, initWallet } from "../../utils/wallet";

const plans = [
  {
    id: "basic",
    name: "Basic",
    price: 10,
    days: 7,
    highlight: "Top search placement",
    features: ["Top results", "Contact visible"],
  },
  {
    id: "standard",
    name: "Standard",
    price: 20,
    days: 15,
    highlight: "Highlighted map pin",
    features: ["Top results", "Contact visible", "Highlighted pin"],
  },
  {
    id: "pro",
    name: "Pro",
    price: 30,
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
  "rounded-xl border border-[rgba(99,102,241,0.2)] bg-[#1a1830] p-5";

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

function readPremium() {
  return readJson(STORAGE_KEYS.premium, null);
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
    return new Date(currentExpiry + plan.days * 24 * 60 * 60 * 1000)
      .toISOString();
  }

  return new Date(Date.now() + plan.days * 24 * 60 * 60 * 1000).toISOString();
}

function getPurchaseType(plan, activePremium) {
  if (!activePremium?.plan) return "new";
  const currentRank = getPlanRank(activePremium.plan);
  const selectedRank = getPlanRank(plan.id);
  if (selectedRank === currentRank) return "extend";
  if (selectedRank > currentRank) return "upgrade";
  return "downgrade";
}

function updateSellerPremium(user, premiumData) {
  const { sellerId, userPhone, userName } = getSellerIdentity(user);
  const sellers = readArray(STORAGE_KEYS.sellers);

  const updated = sellers.map((seller) => {
    const matches =
      seller.id === sellerId ||
      (userPhone && seller.phone === userPhone) ||
      (userName && seller.name === userName);

    if (!matches) return seller;

    return {
      ...seller,
      isPremium: true,
      plan: premiumData.plan,
      premiumExpiresAt: premiumData.expiresAt,
    };
  });

  localStorage.setItem(STORAGE_KEYS.sellers, JSON.stringify(updated));
}

function FeatureList({ features }) {
  return (
    <ul className="space-y-2 text-sm text-slate-200">
      {features.map((feature) => (
        <li key={feature} className="flex items-center gap-2">
          <CheckCircle2 size={16} className="text-emerald-300" />
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
      <p className="text-sm text-amber-100">
        Your current {selectedPlan.name} plan will be extended by{" "}
        {selectedPlan.days} days.
      </p>
    );
  }

  if (type === "upgrade") {
    const gained = getUpgradedFeatures(activePremium?.plan, selectedPlan.id);
    return (
      <div className="space-y-2">
        <p className="text-sm text-amber-100">
          Upgrading from {getPlanLabel(activePremium?.plan)} to{" "}
          {selectedPlan.name} starts the new plan immediately. Remaining days on
          the old plan are forfeited.
        </p>
        {gained.length > 0 && (
          <p className="text-sm text-emerald-200">
            New benefits: {gained.join(", ")}
          </p>
        )}
      </div>
    );
  }

  if (type === "downgrade") {
    return (
      <p className="text-sm text-amber-100">
        Downgrading starts {selectedPlan.name} today and forfeits remaining days
        on {getPlanLabel(activePremium?.plan)}.
      </p>
    );
  }

  return (
    <p className="text-sm text-slate-300">
      The package benefit activates immediately after wallet deduction.
    </p>
  );
}

export default function SellerPackages() {
  const { user } = useAuth();
  const [premium, setPremium] = useState(readPremium);
  const [wallet, setWallet] = useState(() => initWallet());
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [toast, setToast] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    cleanupExpiredPremium();
    setPremium(readPremium());
    setWallet(initWallet());
  }, []);

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
  const walletBalance = Number(wallet?.balance || 0);

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

  const history = useMemo(
    () => readArray(STORAGE_KEYS.premiumHistory),
    [premium, wallet],
  );

  const openConfirmation = (plan) => {
    setToast("");
    setSelectedPlan(plan);
  };

  const closeConfirmation = () => {
    if (processing) return;
    setSelectedPlan(null);
  };

  const handleConfirmPurchase = () => {
    if (!selectedPlan || !purchasePreview || processing) return;

    setProcessing(true);

    const debit = deductPackagePurchase(selectedPlan);
    if (!debit.ok) {
      setWallet(debit.wallet);
      setToast(
        debit.reason === "insufficient_balance"
          ? "Insufficient wallet balance. Please recharge your wallet."
          : debit.message,
      );
      setProcessing(false);
      return;
    }

    const premiumData = {
      plan: selectedPlan.id,
      price: selectedPlan.price,
      purchasedAt: new Date().toISOString(),
      expiresAt: purchasePreview.expiresAt,
      isPremium: true,
      type: purchasePreview.type,
      upgradeFrom:
        purchasePreview.type === "upgrade" || purchasePreview.type === "downgrade"
          ? activePremium?.plan
          : null,
      upgradeTo: selectedPlan.id,
      forfeitedDays: purchasePreview.forfeitedDays,
      walletTransactionId: debit.transaction.id,
    };

    localStorage.setItem(STORAGE_KEYS.premium, JSON.stringify(premiumData));
    updateSellerPremium(user, premiumData);

    const historyEntry = {
      receiptId: `QS-PKG-${Date.now()}`,
      plan: selectedPlan.id,
      price: selectedPlan.price,
      purchasedAt: premiumData.purchasedAt,
      expiresAt: premiumData.expiresAt,
      type: premiumData.type,
      walletTransactionId: debit.transaction.id,
      balanceAfter: debit.wallet.balance,
      forfeitedDays: premiumData.forfeitedDays,
      upgradeFrom: premiumData.upgradeFrom,
      upgradeTo: premiumData.upgradeTo,
    };

    localStorage.setItem(
      STORAGE_KEYS.premiumHistory,
      JSON.stringify([historyEntry, ...history]),
    );

    setWallet(debit.wallet);
    setPremium(premiumData);
    setSelectedPlan(null);
    setProcessing(false);
    setToast(
      `${selectedPlan.name} plan active until ${formatDate(
        premiumData.expiresAt,
      )}. Wallet balance updated to Rs ${debit.wallet.balance}.`,
    );
  };

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-indigo-300">
            Premium Packages
          </p>
          <h1 className="mt-1 text-3xl font-bold text-white">
            Grow your QuickSeva business
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-300">
            Buy a package from your wallet. The plan starts immediately after a
            successful wallet debit.
          </p>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3">
          <Wallet size={20} className="text-emerald-200" />
          <div>
            <p className="text-xs font-semibold text-emerald-200">
              Wallet Balance
            </p>
            <p className="text-2xl font-black text-white">Rs {walletBalance}</p>
          </div>
        </div>
      </div>

      {toast && (
        <div
          className={`rounded-xl border p-4 text-sm font-semibold ${
            toast.startsWith("Insufficient")
              ? "border-red-400/30 bg-red-500/10 text-red-200"
              : "border-emerald-400/30 bg-emerald-500/10 text-emerald-200"
          }`}
        >
          {toast}
        </div>
      )}

      {activePremium && remainingDays <= 2 && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-400/30 bg-amber-500/10 p-4 text-sm font-semibold text-amber-100">
          <AlertTriangle size={18} className="mt-0.5 flex-shrink-0" />
          <span>
            Your plan expires soon. Renew to keep your visibility.
          </span>
        </div>
      )}

      {expiredPremium && (
        <div className="rounded-xl border border-red-400/30 bg-red-500/10 p-4 text-sm font-semibold text-red-200">
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
                className={activePremium ? "text-amber-300" : "text-slate-500"}
              />
              <h2 className="text-xl font-bold text-white">Current Status</h2>
              <span
                className={`rounded-full border px-3 py-1 text-xs font-bold ${
                  activePremium
                    ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-300"
                    : "border-slate-500/30 bg-white/5 text-slate-300"
                }`}
              >
                {activePremium ? "Active" : "Free Plan"}
              </span>
            </div>

            <p className="text-sm text-slate-300">
              {activePremium
                ? `${activePlan?.name || "Premium"} plan active until ${expiryLabel}`
                : "No active package. You still appear to customers, but below active package sellers."}
            </p>

            {activePremium && (
              <p className="mt-2 text-sm font-bold text-emerald-200">
                {remainingDays} {remainingDays === 1 ? "day" : "days"} remaining
              </p>
            )}
          </div>

          <div className="rounded-lg bg-white/5 p-4">
            {activePlan ? (
              <FeatureList features={activePlan.features} />
            ) : (
              <ul className="space-y-2 text-sm text-slate-300">
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
                  ? "border-emerald-400/50 shadow-[0_0_25px_rgba(16,185,129,0.12)]"
                  : plan.id === "pro"
                    ? "border-amber-400/40"
                    : ""
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                  <p className="mt-1 text-sm text-indigo-200">
                    {plan.highlight}
                  </p>
                </div>
                {isCurrent && (
                  <span className="rounded-full bg-emerald-400 px-3 py-1 text-xs font-black text-emerald-950">
                    Active
                  </span>
                )}
              </div>

              <div className="mt-5 flex items-end gap-2">
                <span className="text-4xl font-black text-white">
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
                className="mt-6 w-full rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2.5 text-sm font-bold text-white transition hover:from-indigo-500 hover:to-violet-500"
              >
                {isCurrent ? "Renew / Extend" : "Buy Now"}
              </button>
            </div>
          );
        })}
      </section>

      <section className={cardBase}>
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-bold text-white">Package History</h2>
          <span className="rounded-full border border-indigo-400/30 bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-200">
            {history.length} purchases
          </span>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-indigo-500/20 text-xs uppercase text-slate-400">
              <tr>
                <th className="py-3 pr-4">Date</th>
                <th className="py-3 pr-4">Plan</th>
                <th className="py-3 pr-4">Type</th>
                <th className="py-3 pr-4">Amount</th>
                <th className="py-3">Expires</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-indigo-500/10">
              {history.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    No package purchases yet
                  </td>
                </tr>
              ) : (
                history.slice(0, 10).map((entry) => (
                  <tr key={entry.receiptId} className="text-slate-200">
                    <td className="py-4 pr-4 text-slate-400">
                      {formatDateTime(entry.purchasedAt)}
                    </td>
                    <td className="py-4 pr-4 font-bold">
                      {getPlanLabel(entry.plan)}
                    </td>
                    <td className="py-4 pr-4 capitalize">{entry.type}</td>
                    <td className="py-4 pr-4 font-bold">-Rs {entry.price}</td>
                    <td className="py-4">{formatDate(entry.expiresAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {selectedPlan && purchasePreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="relative w-full max-w-md rounded-2xl border border-indigo-400/30 bg-[#1a1830] p-6 shadow-2xl">
            <button
              type="button"
              onClick={closeConfirmation}
              disabled={processing}
              className="absolute right-4 top-4 rounded-lg bg-white/5 p-2 text-slate-300 hover:text-white disabled:opacity-50"
              aria-label="Close confirmation"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-2 text-amber-300">
              <Crown size={18} />
              <span className="text-sm font-bold">Confirm package purchase</span>
            </div>

            <h2 className="mt-2 text-2xl font-black text-white">
              {selectedPlan.name} Plan
            </h2>

            <div className="mt-4 rounded-xl border border-amber-400/30 bg-amber-500/10 p-4">
              <PlanActionCopy
                type={purchasePreview.type}
                activePremium={activePremium}
                selectedPlan={selectedPlan}
              />
            </div>

            <div className="mt-4 space-y-3 rounded-xl bg-white/5 p-4 text-sm">
              <div className="flex items-center justify-between gap-4">
                <span className="text-slate-300">Plan amount</span>
                <span className="font-bold text-white">Rs {selectedPlan.price}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-slate-300">Current wallet balance</span>
                <span className="font-bold text-white">Rs {walletBalance}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-slate-300">Balance after deduction</span>
                <span
                  className={`font-bold ${
                    purchasePreview.balanceAfter < 0
                      ? "text-red-200"
                      : "text-emerald-200"
                  }`}
                >
                  Rs {purchasePreview.balanceAfter}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-slate-300">New expiry</span>
                <span className="font-bold text-white">
                  {purchasePreview.expiryLabel}
                </span>
              </div>
            </div>

            {purchasePreview.balanceAfter < 0 && (
              <div className="mt-4 rounded-xl border border-red-400/30 bg-red-500/10 p-4 text-sm font-semibold text-red-200">
                Insufficient wallet balance. Please recharge your wallet.
              </div>
            )}

            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={closeConfirmation}
                disabled={processing}
                className="rounded-lg border border-slate-600/50 bg-white/5 px-4 py-2.5 text-sm font-bold text-slate-200 hover:bg-white/10 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmPurchase}
                disabled={processing || purchasePreview.balanceAfter < 0}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2.5 text-sm font-bold text-white hover:from-indigo-500 hover:to-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {processing && <Loader2 size={16} className="animate-spin" />}
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
