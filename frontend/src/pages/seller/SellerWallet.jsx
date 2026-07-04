import { useEffect, useMemo, useState } from "react";
import { History, Wallet, Plus, RefreshCw, Rocket } from "lucide-react";
import { useAuth } from "../../../src/context/AuthContext";
import { isWalletSufficient } from "../../utils/wallet";
import AddFundsModal from "../../components/AddFundsModal";
import { useWallet } from "../../context/WalletContext";
import { Link } from "react-router-dom";
import { isPremiumActive } from "../../utils/premium";

const cardBase =
  "rounded-xl border border-[rgba(99,102,241,0.2)] bg-[#1a1830] p-5";

function formatDateShort(iso) {
  try {
    return new Intl.DateTimeFormat("en-IN", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).format(new Date(iso));
  } catch {
    return "";
  }
}

function balanceColorClasses(balance) {
  if (balance <= 0) return "bg-red-500/15 text-red-200 border-red-400/30";
  if (balance < 10)
    return "bg-yellow-500/15 text-yellow-200 border-yellow-400/30";
  if (balance < 20)
    return "bg-yellow-500/15 text-yellow-200 border-yellow-400/30";
  return "bg-emerald-500/15 text-emerald-200 border-emerald-400/30";
}

function formatDescription(desc) {
  if (!desc) return "";
  const trimmed = desc.trim();
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    try {
      const data = JSON.parse(trimmed);
      
      const plans = {
        basic: { eng: "Basic Plan", hin: "बेसिक प्लान" },
        standard: { eng: "Standard Plan", hin: "स्टैंडर्ड प्लान" },
        pro: { eng: "Pro Plan", hin: "प्रो प्लान" }
      };

      const planInfo = plans[data.planId?.toLowerCase()] || { eng: `${data.planId || 'Premium'} Plan`, hin: "प्रीमियम प्लान" };

      const types = {
        new: { eng: "Purchased", hin: "खरीदा गया" },
        upgrade: { eng: "Upgraded to", hin: "अपग्रेड किया गया" },
        downgrade: { eng: "Downgraded to", hin: "डाउनग्रेड किया गया" },
        extend: { eng: "Extended", hin: "समय बढ़ाया गया" }
      };

      const typeInfo = types[data.purchaseType] || { eng: "Activated", hin: "चालू किया गया" };

      let expiryStr = "";
      if (data.expiresAt) {
        const dateObj = new Date(data.expiresAt);
        if (!isNaN(dateObj.getTime())) {
          const formattedDate = new Intl.DateTimeFormat("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric"
          }).format(dateObj);
          expiryStr = ` (Expiry: ${formattedDate})`;
        }
      }

      return (
        <div className="flex flex-col">
          <span className="font-bold text-white">
            {typeInfo.eng} {planInfo.eng}
          </span>
          <span className="text-xs text-indigo-300">
            {typeInfo.hin} {planInfo.hin}
            {expiryStr}
          </span>
        </div>
      );
    } catch (e) {
      console.error("Failed to parse transaction description JSON:", e);
      return desc;
    }
  }
  
  if (trimmed.toLowerCase() === "wallet top-up") {
    return (
      <div className="flex flex-col">
        <span className="font-bold text-white">Wallet Top-up</span>
        <span className="text-xs text-indigo-300">वॉलेट में पैसे जोड़े</span>
      </div>
    );
  }

  return desc;
}

export default function SellerWallet() {
  const { user } = useAuth();
  const { walletBalance, transactions, refreshWallet, addFundsToWallet } =
    useWallet();

  const [rechargeOpen, setRechargeOpen] = useState(false);
  const sufficient = isWalletSufficient();

  const [hasPremium, setHasPremium] = useState(true);

  useEffect(() => {
    setHasPremium(isPremiumActive(user) || isPremiumActive());
  }, [user]);

  const balance = Number(walletBalance || 0);

  const activeBanner = null;

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-indigo-300">Seller Wallet</p>
          <h1 className="mt-1 text-3xl font-bold text-white">
            Manage search credits
          </h1>
          <p className="mt-2 text-sm text-slate-300">
            Logged in as: {user?.name || "Seller"}
          </p>
        </div>

        <div className="flex flex-col items-end gap-3">
          {activeBanner && (
            <div className={activeBanner.tone}>{activeBanner.text}</div>
          )}
        </div>
      </div>

      <section className={cardBase}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-white/5">
              <Wallet size={22} className="text-indigo-200" />
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-300">
                Balance
              </div>
              <div className="text-4xl font-black text-white">₹{balance}</div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div
              className="rounded-xl border px-4 py-2 text-sm font-bold bg-emerald-500/15 text-emerald-200 border-emerald-400/30"
            >
              Free Listing Active
            </div>
            <button
              onClick={() => setRechargeOpen(true)}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-bold text-white hover:bg-indigo-500"
            >
              <Plus size={16} />
              Add Funds
            </button>
          </div>
        </div>

      </section>

      {/* Premium Boost Banner */}
      {!hasPremium && (
        <div className="rounded-xl border border-purple-500/20 bg-purple-950/10 p-5 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-purple-500/10 text-purple-400">
              <Rocket className="rotate-45" size={20} />
            </div>
            <div className="text-left">
              <h3 className="text-sm font-bold text-white">Boost your profile with Premium Membership</h3>
              <p className="text-xs text-slate-400">
                Get top results in searches, highlight your map pin, and display a gold badge to attract more customers.
              </p>
            </div>
          </div>
          <Link
            to="/seller/packages"
            className="shrink-0 inline-flex items-center justify-center px-4 py-2 rounded-lg text-xs font-bold force-text-white bg-purple-600 hover:bg-purple-700 transition-all duration-200 shadow-md shadow-purple-600/20"
          >
            GET PREMIUM MEMBERSHIP
          </Link>
        </div>
      )}

      <section className={cardBase}>
        <div className="flex items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-xl font-bold text-white">
            <History size={18} /> Transaction History
          </h2>
          <span className="rounded-full border border-indigo-400/30 bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-200">
            {transactions.length} transactions
          </span>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="border-b border-indigo-500/20 text-xs uppercase text-[#94a3b8]">
              <tr>
                <th className="py-3 pr-4">Date</th>
                <th className="py-3 pr-4">Description</th>
                <th className="py-3 pr-4">Amount</th>
                <th className="py-3">Balance After</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-indigo-500/10">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-[#94a3b8]">
                    No transactions yet
                  </td>
                </tr>
              ) : (
                transactions.slice(0, 20).map((tx) => (
                  <tr key={tx.id} className="text-slate-200">
                    <td className="py-4 pr-4 text-[#94a3b8]">
                      {formatDateShort(tx.created_at || tx.timestamp)}
                    </td>
                    <td className="py-4 pr-4">{formatDescription(tx.description)}</td>
                    <td className={`py-4 pr-4 font-bold ${
                      tx.type === "debit" ? "text-red-300" : "text-emerald-300"
                    }`}>
                      {tx.type === "debit" ? "-₹" : "+₹"}
                      {Number(tx.amount || 0)}
                    </td>
                    <td className="py-4 font-bold">
                      ₹{Number(tx.balance_after || tx.balanceAfter || 0)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <AddFundsModal
        open={rechargeOpen}
        onClose={() => setRechargeOpen(false)}
        prefillAmount={100}
        successMessage={"₹X added! You can now search again."}
        continueButtonLabel={"Done"}
        onSuccess={() => {
          refreshWallet();
          setRechargeOpen(false);
        }}
        closeOnSuccess={true}
      />
    </div>
  );
}
