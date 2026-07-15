import { useEffect, useMemo, useState } from "react";
import { History, Wallet, Plus, RefreshCw, Rocket } from "lucide-react";
import { useAuth } from "../../../src/context/AuthContext";
import { isWalletSufficient } from "../../utils/wallet";
import AddFundsModal from "../../components/AddFundsModal";
import { useWallet } from "../../context/WalletContext";
import { Link } from "react-router-dom";
import { isPremiumActive } from "../../utils/premium";

const cardBase =
  "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm";

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
  if (balance <= 0) return "bg-red-50 text-red-700 border-red-200";
  if (balance < 20)
    return "bg-amber-50 text-amber-700 border-amber-200";
  return "bg-emerald-50 text-emerald-700 border-emerald-200";
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
          <span className="font-bold text-slate-800">
            {typeInfo.eng} {planInfo.eng}
          </span>
          <span className="text-xs text-slate-500">
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
        <span className="font-bold text-slate-800">Wallet Top-up</span>
        <span className="text-xs text-slate-500">वॉलेट में पैसे जोड़े</span>
      </div>
    );
  }

  return <span className="text-slate-700">{desc}</span>;
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
          <p className="text-sm font-semibold text-blue-600">Seller Wallet</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-800">
            Manage search credits
          </h1>
          <p className="mt-1 text-sm text-slate-500">
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
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-slate-100">
              <Wallet size={22} className="text-slate-600" />
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-500">
                Balance
              </div>
              <div className="text-4xl font-black text-slate-800">₹{balance}</div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div
              className="rounded-xl border px-4 py-2 text-sm font-bold bg-emerald-50 text-emerald-700 border-emerald-200"
            >
              Free Listing Active
            </div>
            <button
              onClick={() => setRechargeOpen(true)}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700 shadow-sm cursor-pointer"
            >
              <Plus size={16} />
              Add Funds
            </button>
          </div>
        </div>
      </section>

      {/* Premium Boost Banner */}
      {!hasPremium && (
        <div className="rounded-xl border border-purple-200 bg-purple-50 p-5 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-purple-100 text-purple-600">
              <Rocket className="rotate-45" size={20} />
            </div>
            <div className="text-left">
              <h3 className="text-sm font-bold text-slate-800">Boost your profile with Premium Membership</h3>
              <p className="text-xs text-slate-500">
                Get top results in searches, highlight your map pin, and display a gold badge to attract more customers.
              </p>
            </div>
          </div>
          <Link
            to="/seller/packages"
            className="shrink-0 inline-flex items-center justify-center px-4 py-2 rounded-lg text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 transition-all duration-200 shadow-sm"
          >
            GET PREMIUM MEMBERSHIP
          </Link>
        </div>
      )}

      <section className={cardBase}>
        <div className="flex items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-lg font-bold text-slate-800">
            <History size={18} /> Transaction History
          </h2>
          <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
            {transactions.length} transactions
          </span>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="border-b border-slate-200 text-xs uppercase text-slate-400 tracking-wide">
              <tr>
                <th className="py-3 pr-4 font-semibold">Date</th>
                <th className="py-3 pr-4 font-semibold">Description</th>
                <th className="py-3 pr-4 font-semibold">Amount</th>
                <th className="py-3 font-semibold">Balance After</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-400">
                    No transactions yet
                  </td>
                </tr>
              ) : (
                transactions.slice(0, 20).map((tx) => (
                  <tr key={tx.id} className="text-slate-600 hover:bg-slate-50 transition-colors">
                    <td className="py-4 pr-4 text-slate-400">
                      {formatDateShort(tx.created_at || tx.timestamp)}
                    </td>
                    <td className="py-4 pr-4">{formatDescription(tx.description)}</td>
                    <td className={`py-4 pr-4 font-bold ${
                      tx.type === "debit" ? "text-red-600" : "text-emerald-600"
                    }`}>
                      {tx.type === "debit" ? "-₹" : "+₹"}
                      {Number(tx.amount || 0)}
                    </td>
                    <td className="py-4 font-bold text-slate-800">
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
