import React, { useState } from "react";
import { ArrowDownLeft, ArrowUpRight, Plus, Wallet, ShieldCheck, CreditCard } from "lucide-react";
import { useWallet } from "../../context/WalletContext";
import { useAuth } from "../../context/AuthContext";
import AddFundsModal from "../../components/AddFundsModal";
import PageTransition from "../../components/PageTransition";
import "../../index.css";

const formatDate = (isoStr) => {
  if (!isoStr) return "";
  try {
    const d = new Date(isoStr);
    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return isoStr;
  }
};

export default function ContractorWallet() {
  const { user } = useAuth();
  const { walletBalance, transactions, refreshWallet } = useWallet();
  const [rechargeOpen, setRechargeOpen] = useState(false);

  const balance = Number(walletBalance || 0);

  return (
    <PageTransition className="space-y-6">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest block mb-0.5">
            Contractor Wallet & Credits
          </span>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Lead Credits Management
          </h1>
          <p className="text-xs font-medium text-slate-500 mt-0.5">
            Use credits to unlock direct contact details of worker & agency applicants for your site posts.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setRechargeOpen(true)}
          className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-black text-xs rounded-xl shadow-xs transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer shrink-0"
        >
          <Plus size={16} strokeWidth={3} />
          <span>Buy Credits</span>
        </button>
      </div>

      {/* ── Balance Banner Card ── */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-xs relative overflow-hidden">
        <div
          className={`absolute top-0 left-0 right-0 h-1.5 ${
            balance <= 0
              ? "bg-gradient-to-r from-red-500 via-rose-500 to-red-600"
              : "bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-500"
          }`}
        />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div className="flex items-center gap-3.5">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                balance <= 0
                  ? "bg-red-50 text-red-600 border border-red-100"
                  : "bg-amber-50 text-amber-600 border border-amber-200/80"
              }`}
            >
              <Wallet size={24} strokeWidth={2.2} />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Available Credits
              </span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span
                  className={`text-3xl sm:text-4xl font-black tracking-tight ${
                    balance <= 0 ? "text-red-600" : "text-slate-900"
                  }`}
                >
                  {balance}
                </span>
                <span className="text-base font-bold text-slate-500">Credits</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Active Wallet
            </span>
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-extrabold bg-slate-100 text-slate-600 border border-slate-200">
              1 Credit = ₹1
            </span>
          </div>
        </div>

        {/* Pricing Info bar */}
        <div className="pt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <ShieldCheck size={16} className="text-amber-600 shrink-0" />
            <span className="font-semibold">
              Unlocking an applicant contact costs <span className="font-extrabold text-slate-900">1 Credit</span>. Re-viewing is always free.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setRechargeOpen(true)}
            className="font-extrabold text-amber-700 hover:text-amber-800 underline decoration-amber-300 transition cursor-pointer"
          >
            Recharge Credits →
          </button>
        </div>
      </div>

      {/* ── Transaction History Table ── */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard size={18} className="text-amber-600" />
            <h3 className="text-base font-black text-slate-900">Transaction History</h3>
          </div>
          <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
            {transactions.length} total
          </span>
        </div>

        {transactions.length === 0 ? (
          <div className="py-12 text-center text-xs font-semibold text-slate-400 border border-dashed border-slate-200 rounded-2xl">
            <Wallet size={32} className="text-slate-300 mx-auto mb-2" />
            <p>No credit transactions recorded yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {transactions.map((tx) => {
              const isCredit = tx.type !== "debit";
              const absAmt = Math.abs(Number(tx.amount || 0));

              return (
                <div
                  key={tx.id || tx.created_at}
                  className="py-3.5 flex items-center justify-between gap-3 hover:bg-slate-50/80 px-2 rounded-xl transition"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        isCredit
                          ? "bg-emerald-50 text-emerald-600 border border-emerald-200/60"
                          : "bg-rose-50 text-rose-600 border border-rose-200/60"
                      }`}
                    >
                      {isCredit ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
                    </div>
                    <div>
                      <p className="text-xs font-extrabold text-slate-800 leading-snug">
                        {tx.description || (isCredit ? "Credits purchased" : "Contact unlocked")}
                      </p>
                      <span className="text-[10px] text-slate-400 font-bold block mt-0.5">
                        {formatDate(tx.created_at)}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span
                      className={`text-sm font-black ${
                        isCredit ? "text-emerald-600" : "text-rose-600"
                      }`}
                    >
                      {isCredit ? `+${absAmt}` : `-${absAmt}`} Credits
                    </span>
                    {tx.balance_after !== undefined && (
                      <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">
                        Bal: {tx.balance_after} Cr
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Funds Modal */}
      <AddFundsModal
        open={rechargeOpen}
        onClose={() => setRechargeOpen(false)}
        prefillAmount={10}
        continueButtonLabel="Return to Wallet"
        closeOnSuccess={true}
        onSuccess={() => {
          if (refreshWallet) refreshWallet();
        }}
      />
    </PageTransition>
  );
}
