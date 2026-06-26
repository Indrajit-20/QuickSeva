import React, { useMemo, useState } from "react";
import { Loader2, Plus, X } from "lucide-react";

import { useWallet } from "../context/WalletContext";

export default function AddFundsModal({
  open,
  onClose,
  prefillAmount = 0,
  onSuccess,
  successMessage,
  continueButtonLabel = "Continue to Purchase",
  closeOnSuccess = false,
}) {
  const { walletBalance, addFundsToWallet } = useWallet();

  const [activeTab, setActiveTab] = useState("upi");
  const [amountStr, setAmountStr] = useState(
    prefillAmount ? String(prefillAmount) : "",
  );
  const [processing, setProcessing] = useState(false);
  const [paidAmount, setPaidAmount] = useState(null);

  // When modal opens for a new prefill, reset UI
  React.useEffect(() => {
    if (!open) return;
    // reset derived state when (re)opening
    setActiveTab("upi");
    setAmountStr(prefillAmount ? String(prefillAmount) : "");
    setProcessing(false);
    setPaidAmount(null);
  }, [open, prefillAmount]);

  const amount = useMemo(() => {
    const n = Number(amountStr || 0);
    return Number.isFinite(n) ? Math.max(0, n) : 0;
  }, [amountStr]);

  const isSuccess = paidAmount !== null;

  const handleFakePay = () => {
    if (processing) return;
    if (!amount || amount <= 0) return;

    setProcessing(true);

    // Fake payment delay
    window.setTimeout(async () => {
      try {
        const nextWallet = await addFundsToWallet(amount);
        setPaidAmount(amount);
        setProcessing(false);

        if (typeof onSuccess === "function") {
          onSuccess({ amount, walletBalance: nextWallet?.balance || 0 });
        }

        if (closeOnSuccess) {
          // keep for completeness; default false so user clicks continue
          onClose?.();
        }
      } catch (err) {
        setProcessing(false);
      }
    }, 900);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <div
        className="relative w-full max-w-md rounded-2xl border border-indigo-400/30 bg-[#1a1830] p-6 shadow-2xl"
        role="dialog"
        aria-modal="true"
      >
        <button
          type="button"
          onClick={() => {
            if (processing) return;
            onClose?.();
          }}
          className="absolute right-4 top-4 rounded-lg bg-white/5 p-2 text-slate-300 hover:text-white disabled:opacity-50"
          aria-label="Close"
          disabled={processing}
        >
          <X size={18} />
        </button>

        {!isSuccess ? (
          <>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black text-white">Add Funds</h2>
                <p className="mt-1 text-sm text-slate-400">
                  Choose a payment method and add money to your wallet.
                </p>
              </div>
              <div className="flex items-center gap-2 rounded-xl border border-indigo-400/30 bg-indigo-500/10 px-3 py-2">
                <Plus size={16} className="text-indigo-200" />
                <span className="text-sm font-bold text-indigo-200">
                  Wallet: ₹{walletBalance}
                </span>
              </div>
            </div>

            <div className="mt-5 flex gap-2 rounded-xl border border-indigo-400/20 bg-white/5 p-1">
              {[
                { key: "upi", label: "UPI" },
                { key: "card", label: "Card" },
                { key: "net", label: "Net Banking" },
              ].map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setActiveTab(t.key)}
                  className={`flex-1 rounded-lg px-3 py-2 text-sm font-bold transition ${
                    activeTab === t.key
                      ? "bg-indigo-500/20 text-indigo-200"
                      : "text-slate-300 hover:text-white"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="mt-4">
              <label className="block text-xs font-semibold text-indigo-200">
                Amount (₹)
              </label>
              <input
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                inputMode="numeric"
                placeholder="Enter amount"
                className="mt-2 w-full rounded-lg border border-indigo-500/30 bg-indigo-950/40 px-3 py-2 text-sm text-white focus:outline-none"
              />

              <div className="mt-3 rounded-xl border border-indigo-400/20 bg-white/5 p-3 text-xs text-slate-300">
                Selected method:{" "}
                {activeTab === "upi"
                  ? "UPI"
                  : activeTab === "card"
                    ? "Card"
                    : "Net Banking"}
              </div>
            </div>

            <button
              type="button"
              onClick={handleFakePay}
              disabled={processing || amount <= 0}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2.5 text-sm font-bold text-white transition hover:from-indigo-500 hover:to-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {processing && <Loader2 size={16} className="animate-spin" />}
              {processing ? "Processing" : `Pay ₹${amount || 0}`}
            </button>
          </>
        ) : (
          <div className="mt-2 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/15 border border-emerald-400/30">
              <div className="text-emerald-200 font-black text-2xl">✓</div>
            </div>

            <h3 className="mt-4 text-xl font-black text-white">
              {successMessage ||
                `₹${paidAmount} added! You can now purchase the plan.`}
            </h3>

            <div className="mt-5 rounded-xl border border-indigo-400/20 bg-white/5 p-3 text-sm text-slate-300">
              Wallet top-up completed successfully.
            </div>

            <button
              type="button"
              onClick={() => {
                if (processing) return;
                onSuccess?.({
                  amount: paidAmount,
                  paid: true,
                });
                // Let parent decide reopen/close; default just close
                onClose?.();
              }}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2.5 text-sm font-bold text-white hover:from-indigo-500 hover:to-violet-500"
            >
              {continueButtonLabel}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
