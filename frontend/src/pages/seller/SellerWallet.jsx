import { useEffect, useMemo, useState } from "react";
import { Plus, History, Wallet } from "lucide-react";
import { useAuth } from "../../../src/context/AuthContext";
import {
  addFunds,
  getTransactions,
  initWallet,
  isWalletSufficient,
} from "../../utils/wallet";

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

export default function SellerWallet() {
  const { user } = useAuth();

  const [wallet, setWallet] = useState(null);
  const [rechargeOpen, setRechargeOpen] = useState(false);
  const [quickAmount, setQuickAmount] = useState(100);
  const [customAmount, setCustomAmount] = useState("");

  const transactions = useMemo(() => {
    if (!wallet) return [];
    return Array.isArray(wallet.transactions) ? wallet.transactions : [];
  }, [wallet]);

  const reload = () => {
    initWallet();
    try {
      const raw = localStorage.getItem("sellerWallet");
      const parsed = raw ? JSON.parse(raw) : null;
      setWallet(parsed);
    } catch {
      setWallet(initWallet());
    }
  };

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const balance = Number(wallet?.balance || 0);
  const sufficient = isWalletSufficient();

  const activeBanner = useMemo(() => {
    if (balance === 0) {
      return {
        tone: "rounded-xl border border-red-400/30 bg-red-500/10 p-4 text-sm font-semibold text-red-200",
        text: "🚫 Your listing is paused. Add funds to resume appearing in search results.",
      };
    }
    if (balance < 10) {
      return {
        tone: "rounded-xl border border-yellow-400/30 bg-yellow-500/10 p-4 text-sm font-semibold text-yellow-200",
        text: "⚠️ Your wallet is running low. Top up to stay visible in searches.",
      };
    }
    return null;
  }, [balance]);

  const handleRecharge = () => {
    const amt = Number(customAmount || quickAmount);
    const next = addFunds(amt);
    setWallet(next);
    setRechargeOpen(false);
    setCustomAmount("");
  };

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

          <div
            className={`rounded-xl border px-4 py-2 text-sm font-bold ${balanceColorClasses(
              balance,
            )}`}
          >
            {balance === 0
              ? "Listing paused"
              : balance < 10
                ? "Low credits"
                : "Active in searches"}
          </div>
        </div>

        {!sufficient && (
          <div className="mt-4 text-sm text-red-200">
            Your balance is 0 — sellers will be excluded from search results.
          </div>
        )}
      </section>

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
                      {formatDateShort(tx.timestamp)}
                    </td>
                    <td className="py-4 pr-4">{tx.description}</td>
                    <td className="py-4 pr-4 font-bold">
                      {tx.type === "debit" ? "-₹" : "+₹"}
                      {Number(tx.amount || 0)}
                    </td>
                    <td className="py-4 font-bold">
                      ₹{Number(tx.balanceAfter || 0)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {rechargeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-md rounded-2xl border border-indigo-400/30 bg-[#1a1830] p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black text-white">
                  Wallet Recharge
                </h2>
                <p className="mt-1 text-sm text-slate-400">
                  Choose a quick amount or enter a custom value.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setRechargeOpen(false)}
                className="rounded-lg bg-white/5 p-2 text-slate-300 hover:text-white"
                aria-label="Close recharge modal"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              {[50, 100, 200].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => {
                    setQuickAmount(amt);
                    setCustomAmount("");
                  }}
                  className={`rounded-lg border px-4 py-2.5 text-sm font-bold transition ${
                    quickAmount === amt && !customAmount
                      ? "border-indigo-500 bg-indigo-500/15 text-indigo-200"
                      : "border-indigo-400/20 bg-white/5 text-slate-300 hover:text-white"
                  }`}
                >
                  ₹{amt}
                </button>
              ))}
            </div>

            <label className="mt-4 block text-xs font-semibold text-indigo-200">
              Custom amount
            </label>
            <input
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              inputMode="numeric"
              placeholder="e.g., 75"
              className="mt-2 w-full rounded-lg border border-indigo-500/30 bg-indigo-950/40 px-3 py-2 text-sm text-white focus:outline-none"
            />

            <button
              type="button"
              onClick={handleRecharge}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2.5 text-sm font-bold text-white transition hover:from-indigo-500 hover:to-violet-500"
            >
              Confirm Recharge
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
