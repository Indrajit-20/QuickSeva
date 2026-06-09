// Shared UX helpers for SellerServices (frontend-only)

export const DURATION_PRESETS_MINUTES = [
  15, 30, 45, 60, 120, 180, 240, 300, 360, 480,
];

export function minutesToDurationText(totalMinutes) {
  const n = Number(totalMinutes || 0);
  if (!n || n <= 0) return "";
  const hours = Math.floor(n / 60);
  const mins = n % 60;
  if (hours > 0 && mins > 0) return `${hours}h ${mins}m`;
  if (hours > 0) return `${hours}h`;
  return `${mins}m`;
}

export function durationTextToMinutes(text) {
  if (!text || typeof text !== "string") return 0;
  const t = text.trim().toLowerCase();

  // Support formats like: "1h 30m", "2h", "45m"
  const hourMatch = t.match(/(\d+)\s*h/);
  const minMatch = t.match(/(\d+)\s*m/);

  const hours = hourMatch ? Number(hourMatch[1]) : 0;
  const mins = minMatch ? Number(minMatch[1]) : 0;

  if (!hourMatch && !minMatch) {
    // legacy fallback like "2-3 hours"
    const range = t.match(/(\d+)\s*-\s*(\d+)/);
    if (range) {
      const a = Number(range[1]);
      const b = Number(range[2]);
      return Math.round(((a + b) * 60) / 2);
    }
    const single = t.match(/(\d+)\s*hours?/);
    if (single) return Number(single[1]) * 60;
    return 0;
  }

  return hours * 60 + mins;
}

export function normaliseDateToYMD(value) {
  // value can be Date or yyyy-mm-dd
  if (!value) return "";
  if (value instanceof Date) {
    const y = value.getFullYear();
    const m = String(value.getMonth() + 1).padStart(2, "0");
    const d = String(value.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  if (typeof value === "string") return value.slice(0, 10);
  return "";
}

export function ymdToDisplay(ymd) {
  const v = normaliseDateToYMD(ymd);
  if (!v) return "";
  const [y, m, d] = v.split("-").map((x) => Number(x));
  if (!y || !m || !d) return v;
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(y, m - 1, d));
}
