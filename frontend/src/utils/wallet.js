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
  // Free listing: sellers are always active
  return true;
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
  // Free listing: search impressions are free and allowed
  const wallet = initWallet();
  return {
    impressed: true,
    deducted: false,
    allowed: true,
    wallet,
  };
}

export function deductContactView(sellerId, serviceName) {
  // Free listing: contact views are free and allowed
  const wallet = initWallet();
  return { allowed: true, deducted: false, wallet };
}

// Backward compatibility: keep old API name but route to new impression logic at 5/5.
export function deductSearchImpression(sellerId, serviceName) {
  return trackSearchImpression(sellerId, serviceName);
}
