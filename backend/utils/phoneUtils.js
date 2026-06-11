// Phone utilities for QuickSeva authentication flow
// Ensures DB stores only 10-digit Indian mobile numbers.

const normalizeIndianMobile = (input) => {
  if (input === null || input === undefined) return "";

  // Convert to string, trim, remove spaces/formatting
  const raw = String(input).trim();
  if (!raw) return "";

  // Keep digits only
  const digits = raw.replace(/\D/g, "");

  // Common cases:
  // - 8128824054 -> digits length 10
  // - 918128824054 -> digits length 12 (10-digit + leading country code '91')
  // - 918128824054 with extra digits -> still try to get last 10 if it ends with valid pattern

  if (digits.length === 10) return digits;

  // If starts with 91 and has 12 digits, drop the country code
  if (digits.length === 12 && digits.startsWith("91")) {
    return digits.slice(2);
  }

  // Fallback: if longer than 10, take last 10 digits
  if (digits.length > 10) {
    const last10 = digits.slice(-10);
    return last10;
  }

  return "";
};

module.exports = {
  normalizeIndianMobile,
};
