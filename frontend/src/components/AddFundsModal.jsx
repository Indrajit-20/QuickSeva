import React, { useMemo, useState } from "react";
import { Loader2, Plus, X } from "lucide-react";

import { useWallet } from "../context/WalletContext";
import { useAuth } from "../context/AuthContext";
import { loadRazorpayScript } from "../utils/razorpayLoader";
import { createPaymentOrderApi, verifyPaymentApi } from "../api/walletApi";

export default function AddFundsModal({
  open,
  onClose,
  prefillAmount = 0,
  onSuccess,
  successMessage,
  continueButtonLabel = "Continue to Purchase",
  closeOnSuccess = false,
}) {
  const { walletBalance } = useWallet();
  const { user } = useAuth();

  const [amountStr, setAmountStr] = useState(
    prefillAmount ? String(prefillAmount) : "",
  );
  const [processing, setProcessing] = useState(false);
  const [paidAmount, setPaidAmount] = useState(null);

  // When modal opens for a new prefill, reset UI
  React.useEffect(() => {
    if (!open) return;
    // reset derived state when (re)opening
    setAmountStr(prefillAmount ? String(prefillAmount) : "");
    setProcessing(false);
    setPaidAmount(null);
  }, [open, prefillAmount]);

  const amount = useMemo(() => {
    const n = Number(amountStr || 0);
    return Number.isFinite(n) ? Math.max(0, n) : 0;
  }, [amountStr]);

  const isSuccess = paidAmount !== null;

  const handleRealPay = async () => {
    if (processing) return;
    if (!amount || amount <= 0) return;

    setProcessing(true);

    try {
      // 1. Load Razorpay script
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        alert("Razorpay SDK failed to load. Please check your internet connection.");
        setProcessing(false);
        return;
      }

      // 2. Create order on backend
      const orderRes = await createPaymentOrderApi(amount, "wallet_recharge");
      if (!orderRes || !orderRes.success) {
        alert(orderRes?.message || "Failed to create payment order");
        setProcessing(false);
        return;
      }

      const orderData = orderRes.data;

      // 3. Open Razorpay Checkout Modal
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "QuickSeva",
        description: `Purchase of ${amount} Lead Credits`,
        order_id: orderData.id,
        handler: async function (response) {
          try {
            setProcessing(true);
            // 4. Verify payment on backend
            const verifyRes = await verifyPaymentApi({
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
              purpose: "wallet_recharge",
              amount: amount,
            });

            if (verifyRes && verifyRes.success) {
              setPaidAmount(amount);
              setProcessing(false);
              // Trigger parent updates
              if (typeof onSuccess === "function") {
                onSuccess({ amount, walletBalance: verifyRes.data?.balance || 0 });
              }
              if (closeOnSuccess) {
                onClose?.();
              }
            } else {
              alert(verifyRes?.message || "Payment verification failed");
              setProcessing(false);
            }
          } catch (err) {
            console.error("Verification error:", err);
            alert("Error verifying payment");
            setProcessing(false);
          }
        },
        prefill: {
          name: user?.name || "",
          email: user?.email || "",
          contact: user?.phone || "",
        },
        theme: {
          color: "#2563EB",
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
      console.error("Razorpay error:", err);
      alert(err.response?.data?.message || "Error initiating payment");
      setProcessing(false);
    }
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
            <div className="pr-8">
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">Buy Credits</h2>
              <p className="mt-1 text-sm text-slate-500 font-semibold">
                Choose an amount of lead credits to buy (1 credit = ₹1).
              </p>
            </div>

            <div className="mt-5">
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                Select or Enter Credits
              </label>
              <div className="grid grid-cols-4 gap-2 mb-3">
                {[100, 250, 500, 1000].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setAmountStr(String(preset))}
                    className={`py-2 px-3 rounded-xl border text-xs font-extrabold transition cursor-pointer ${
                      Number(amountStr) === preset
                        ? "border-blue-600 bg-blue-50 text-blue-700 shadow-2xs"
                        : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    +{preset}
                  </button>
                ))}
              </div>
              <input
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                inputMode="numeric"
                placeholder="Enter credit amount"
                className={inputClass}
              />
            </div>

            <button
              type="button"
              onClick={handleRealPay}
              disabled={processing || amount <= 0}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 px-4 py-3 text-sm font-bold text-white transition disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer shadow-sm"
            >
              {processing && <Loader2 size={16} className="animate-spin" />}
              {processing ? "Processing..." : `Pay ₹${amount || 0} for Credits`}
            </button>
          </div>
        ) : (
          <div className="mt-2 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 border border-emerald-250">
              <div className="text-emerald-700 font-bold text-2xl">✓</div>
            </div>

            <h3 className="mt-4 text-xl font-bold text-slate-800">
              {successMessage ||
                `${paidAmount} Lead Credits added successfully!`}
            </h3>

            <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-500 font-semibold">
              Lead credits purchased successfully.
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
