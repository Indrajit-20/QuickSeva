const STORAGE_KEYS = {
  premium: "sellerPremium",
  sellers: "sellers",
};

export function getPlanLabel(planId) {
  switch (planId) {
    case "basic":
      return "Basic";
    case "standard":
      return "Standard";
    case "pro":
    case "premium":
      return "Pro";
    default:
      return "";
  }
}

export function getPlanRank(planId) {
  switch (planId) {
    case "basic":
      return 1;
    case "standard":
      return 2;
    case "pro":
    case "premium":
      return 3;
    default:
      return 0;
  }
}

function readPremiumRaw() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.premium);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function isPremiumActive(premium = readPremiumRaw()) {
  if (!premium) return false;
  const expiresAtStr = premium.expiresAt || premium.premium_expires_at || premium.premiumExpiresAt;
  if (!expiresAtStr) return false;
  const expiresAt = new Date(expiresAtStr);
  if (Number.isNaN(expiresAt.getTime())) return false;
  return expiresAt.getTime() > Date.now();
}

export function getValidPremium() {
  const premium = readPremiumRaw();
  return isPremiumActive(premium) ? premium : null;
}

export function getRemainingDays(expiresAt) {
  if (!expiresAt) return 0;
  const dt = new Date(expiresAt);
  if (Number.isNaN(dt.getTime())) return 0;

  const diffMs = dt.getTime() - Date.now();
  if (diffMs <= 0) return 0;
  return Math.ceil(diffMs / (24 * 60 * 60 * 1000));
}

export function getNewExpiryIfExtended(expiresAt, days) {
  const dt = new Date(expiresAt);
  const base = Number.isNaN(dt.getTime()) ? Date.now() : dt.getTime();
  const next = base + days * 24 * 60 * 60 * 1000;
  return new Date(next).toISOString();
}

// Returns only NEW features gained when upgrading (diff only).
export function getUpgradedFeatures(currentPlanId, newPlanId) {
  const rankMap = {
    basic: ["Top results", "Contact visible"],
    standard: ["Top results", "Contact visible", "Highlighted pin"],
    pro: [
      "Top results",
      "Contact visible",
      "Highlighted pin",
      "Gold badge",
      "Priority support",
    ],
    premium: [
      "Top results",
      "Contact visible",
      "Highlighted pin",
      "Gold badge",
      "Priority support",
    ],
  };

  const current = new Set(rankMap[currentPlanId] || []);
  const next = rankMap[newPlanId] || [];
  return next.filter((f) => !current.has(f));
}

export function buildUpgradePaymentData(selectedPlan, currentPremium) {
  const currentPlanId = currentPremium?.plan;
  const forfeitedDays = getRemainingDays(currentPremium?.expiresAt);

  return {
    plan: selectedPlan.id,
    price: selectedPlan.price,
    purchasedAt: new Date().toISOString(),
    // upgrade starts today
    expiresAt: new Date(
      Date.now() + selectedPlan.days * 24 * 60 * 60 * 1000,
    ).toISOString(),
    isPremium: true,
    type: "upgrade",
    upgradeFrom: currentPlanId,
    upgradeTo: selectedPlan.id,
    forfeitedDays,
  };
}

function readSellers() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.sellers);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeSellers(arr) {
  localStorage.setItem(STORAGE_KEYS.sellers, JSON.stringify(arr));
}

export function cleanupExpiredPremium() {
  const premium = readPremiumRaw();
  if (!premium?.expiresAt) return;

  const active = isPremiumActive(premium);
  if (active) return;

  // Reset sellers[] premium flags if any seller was previously marked premium.
  const sellers = readSellers();
  const updated = sellers.map((s) => ({
    ...s,
    isPremium: false,
    plan: null,
    premiumExpiresAt: null,
  }));
  writeSellers(updated);

  localStorage.setItem(
    STORAGE_KEYS.premium,
    JSON.stringify({
      ...premium,
      isPremium: false,
      plan: null,
      expiresAt: null,
    }),
  );
}
