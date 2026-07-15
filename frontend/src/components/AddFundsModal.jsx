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

  const inputClass =
    "mt-2 w-full rounded-xl border border-slate-205 bg-white px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-450 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition font-medium shadow-xs";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm px-4">
      <div
        className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl text-slate-800"
        role="dialog"
        aria-modal="true"
      >
        <button
          type="button"
          onClick={() => {
            if (processing) return;
            onClose?.();
          }}
          className="absolute right-4 top-4 rounded-lg p-2 text-slate-400 hover:text-slate-600 disabled:opacity-50 cursor-pointer"
          aria-label="Close"
          disabled={processing}
        >
          <X size={18} />
        </button>

        {!isSuccess ? (
          <div className="text-left">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">Add Funds</h2>
                <p className="mt-1 text-sm text-slate-500 font-semibold">
                  Choose a payment method and add money to your wallet.
                </p>
              </div>
              <div className="flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3.5 py-2 self-start">
                <Plus size={16} className="text-blue-600" />
                <span className="text-sm font-bold text-blue-700">
                  Wallet: ₹{walletBalance}
                </span>
              </div>
            </div>

            <div className="mt-5 flex gap-2 rounded-xl border border-slate-200 bg-slate-50 p-1">
              {[
                { key: "upi", label: "UPI" },
                { key: "card", label: "Card" },
                { key: "net", label: "Net Banking" },
              ].map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setActiveTab(t.key)}
                  className={`flex-1 rounded-lg px-3 py-2 text-sm font-bold transition cursor-pointer ${
                    activeTab === t.key
                      ? "bg-white text-blue-600 shadow-xs border border-slate-200/50"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="mt-4">
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
                Amount (₹)
              </label>
              <input
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                inputMode="numeric"
                placeholder="Enter amount"
                className={inputClass}
              />

              <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-500 font-semibold">
                Selected method:{" "}
                <span className="font-bold text-slate-700 uppercase">
                  {activeTab === "upi"
                    ? "UPI"
                    : activeTab === "card"
                      ? "Card"
                      : "Net Banking"}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleFakePay}
              disabled={processing || amount <= 0}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 px-4 py-3 text-sm font-bold text-white transition disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer shadow-sm"
            >
              {processing && <Loader2 size={16} className="animate-spin" />}
              {processing ? "Processing..." : `Pay ₹${amount || 0}`}
            </button>
          </div>
        ) : (
          <div className="mt-2 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 border border-emerald-250">
              <div className="text-emerald-700 font-bold text-2xl">✓</div>
            </div>

            <h3 className="mt-4 text-xl font-bold text-slate-800">
              {successMessage ||
                `₹${paidAmount} added! You can now purchase the plan.`}
            </h3>

            <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-500 font-semibold">
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
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 px-4 py-3 text-sm font-bold text-white transition cursor-pointer shadow-sm"
            >
              {continueButtonLabel}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
