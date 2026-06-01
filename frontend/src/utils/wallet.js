const STORAGE_KEYS = {
  wallet: "sellerWallet",
  sellers: "sellers",
};

function safeJsonParse(raw, fallback) {
  try {
    const parsed = JSON.parse(raw);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

export function getWallet() {
  const raw = localStorage.getItem(STORAGE_KEYS.wallet);
  if (!raw) return null;
  const parsed = safeJsonParse(raw, null);
  return parsed && typeof parsed === "object" ? parsed : null;
}

export function initWallet() {
  const existing = getWallet();
  if (existing) return existing;

  const wallet = {
    balance: 50,
    transactions: [],
  };
  localStorage.setItem(STORAGE_KEYS.wallet, JSON.stringify(wallet));
  return wallet;
}

export function getTransactions() {
  const w = initWallet();
  return Array.isArray(w.transactions) ? w.transactions : [];
}

export function addFunds(amount) {
  const amt = Math.max(0, Number(amount || 0));
  if (!amt) return getWallet();

  const wallet = initWallet();
  const nextBalance = Number(wallet.balance || 0) + amt;

  const tx = {
    id: `QS-TX-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    type: "credit",
    amount: amt,
    description: "Wallet recharge",
    timestamp: new Date().toISOString(),
    balanceAfter: nextBalance,
  };

  const updated = {
    ...wallet,
    balance: nextBalance,
    transactions: [tx, ...(wallet.transactions || [])],
  };

  localStorage.setItem(STORAGE_KEYS.wallet, JSON.stringify(updated));
  return updated;
}

export function isWalletSufficient() {
  const wallet = initWallet();
  return Number(wallet.balance || 0) > 0;
}

export function canAfford(amount) {
  const wallet = initWallet();
  return Number(wallet.balance || 0) >= Number(amount || 0);
}

export function deductPackagePurchase(plan) {
  const price = Number(plan?.price || 0);
  const wallet = initWallet();
  const balance = Number(wallet.balance || 0);

  if (!plan?.id || price <= 0) {
    return {
      ok: false,
      reason: "invalid_plan",
      wallet,
      message: "Invalid package selected.",
    };
  }

  if (balance < price) {
    return {
      ok: false,
      reason: "insufficient_balance",
      wallet,
      message: "Insufficient wallet balance. Please recharge your wallet.",
    };
  }

  const nextBalance = balance - price;
  const tx = {
    id: `QS-TX-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    type: "debit",
    amount: price,
    description: `${plan.name || "Premium"} package purchase`,
    timestamp: new Date().toISOString(),
    balanceAfter: nextBalance,
    planId: plan.id,
  };

  const updated = {
    ...wallet,
    balance: nextBalance,
    transactions: [tx, ...(wallet.transactions || [])],
  };

  localStorage.setItem(STORAGE_KEYS.wallet, JSON.stringify(updated));

  return { ok: true, wallet: updated, transaction: tx };
}

function getLocalDayKey(d = new Date()) {
  // YYYY-MM-DD in local time (not UTC) for correct “per day” reset.
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function formatTimeForTx(tsIso) {
  // Used only for descriptions; tx.timestamp stays ISO.
  try {
    return new Intl.DateTimeFormat("en-IN", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).format(new Date(tsIso));
  } catch {
    return tsIso;
  }
}

export function trackSearchImpression(sellerId, serviceName) {
  const wallet = initWallet();
  const balance = Number(wallet.balance || 0);
  if (balance <= 0)
    return { impressed: false, deducted: false, allowed: false, wallet };

  const sellerKey = `${sellerId}_${getLocalDayKey()}`;
  const impressionsRaw = localStorage.getItem("sellerImpressions");
  const impressions = safeJsonParse(impressionsRaw, {});

  const current = Number(impressions[sellerKey] || 0);
  const next = current + 1;

  impressions[sellerKey] = next;
  localStorage.setItem("sellerImpressions", JSON.stringify(impressions));

  // Every 5 appearances => deduct ₹1 and reset counter to 0
  const shouldDeduct = next >= 5;
  let deducted = false;
  let updatedWallet = wallet;

  if (shouldDeduct) {
    if (Number(wallet.balance || 0) <= 0) {
      return {
        impressed: true,
        deducted: false,
        allowed: false,
        wallet,
      };
    }

    const nextBalance = Number(wallet.balance || 0) - 1;

    const tx = {
      id: `QS-TX-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      type: "debit",
      amount: 1,
      description: `Search impression - ${serviceName || "Service"} (5/5 → ₹1 deducted)`,
      timestamp: new Date().toISOString(),
      balanceAfter: nextBalance,
      sellerId: sellerId || undefined,
    };

    updatedWallet = {
      ...wallet,
      balance: nextBalance,
      transactions: [
        {
          ...tx,
          amount: 1,
        },
        ...(wallet.transactions || []),
      ],
    };

    localStorage.setItem(STORAGE_KEYS.wallet, JSON.stringify(updatedWallet));

    // reset counter to 0 after deduction
    impressions[sellerKey] = 0;
    localStorage.setItem("sellerImpressions", JSON.stringify(impressions));

    deducted = true;

    if (nextBalance === 0) {
      try {
        const sellersRaw = localStorage.getItem(STORAGE_KEYS.sellers);
        const sellers = safeJsonParse(sellersRaw, []);
        if (Array.isArray(sellers)) {
          const updatedSellers = sellers.map((s) => {
            const match = sellerId ? s.id === sellerId : true;
            if (!match) return s;
            return { ...s, isPremium: false };
          });
          localStorage.setItem(
            STORAGE_KEYS.sellers,
            JSON.stringify(updatedSellers),
          );
        }
      } catch {
        // ignore
      }
    }
  }

  return {
    impressed: true,
    deducted,
    allowed: Number(updatedWallet.balance || 0) > 0,
    wallet: updatedWallet,
  };
}

export function deductContactView(sellerId, serviceName) {
  const wallet = initWallet();
  const balance = Number(wallet.balance || 0);
  if (balance <= 0) return { allowed: false, deducted: false, wallet };

  const nextBalance = balance - 1;

  const tx = {
    id: `QS-TX-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    type: "debit",
    amount: 1,
    description: `Contact viewed - ${serviceName || "Service"}`,
    timestamp: new Date().toISOString(),
    balanceAfter: nextBalance,
    sellerId: sellerId || undefined,
  };

  const updated = {
    ...wallet,
    balance: nextBalance,
    transactions: [
      {
        ...tx,
        amount: 1,
      },
      ...(wallet.transactions || []),
    ],
  };

  localStorage.setItem(STORAGE_KEYS.wallet, JSON.stringify(updated));

  if (nextBalance === 0) {
    try {
      const sellersRaw = localStorage.getItem(STORAGE_KEYS.sellers);
      const sellers = safeJsonParse(sellersRaw, []);
      if (Array.isArray(sellers)) {
        const updatedSellers = sellers.map((s) => {
          const match = sellerId ? s.id === sellerId : true;
          if (!match) return s;
          return { ...s, isPremium: false };
        });
        localStorage.setItem(
          STORAGE_KEYS.sellers,
          JSON.stringify(updatedSellers),
        );
      }
    } catch {
      // ignore
    }
  }

  return { allowed: nextBalance > 0, deducted: true, wallet: updated };
}

// Backward compatibility: keep old API name but route to new impression logic at 5/5.
export function deductSearchImpression(sellerId, serviceName) {
  return trackSearchImpression(sellerId, serviceName);
}
