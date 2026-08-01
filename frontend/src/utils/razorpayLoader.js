/**
 * Dynamically and safely loads the Razorpay checkout script into the page DOM
 * with caching, timeout handling, and retry support.
 *
 * @param {Object} [options]
 * @param {number} [options.timeoutMs=15000] - Max time (ms) to wait for SDK load before giving up
 * @param {number} [options.retries=1] - Number of retry attempts after initial failure
 * @returns {Promise<{ loaded: boolean, error?: string }>}
 *   Resolves with `{ loaded: true }` on success,
 *   or `{ loaded: false, error: "..." }` with a user-friendly reason on failure.
 */

const RAZORPAY_SCRIPT_URL = "https://checkout.razorpay.com/v1/checkout.js";
const DEFAULT_TIMEOUT_MS = 15000;
const DEFAULT_RETRIES = 1;

let razorpayPromise = null;

/**
 * Internal: Attempts a single load of the Razorpay script with a timeout.
 * @param {number} timeoutMs
 * @returns {Promise<{ loaded: boolean, error?: string }>}
 */
function attemptLoad(timeoutMs) {
  return new Promise((resolve) => {
    // Already loaded in a previous call
    if (typeof window !== "undefined" && window.Razorpay) {
      return resolve({ loaded: true });
    }

    if (typeof window === "undefined") {
      return resolve({ loaded: false, error: "Window is not available (SSR environment)." });
    }

    // Remove any previously failed/stale script tag to get a fresh load
    const staleScript = document.querySelector(`script[src="${RAZORPAY_SCRIPT_URL}"]`);
    if (staleScript) {
      staleScript.remove();
    }

    const script = document.createElement("script");
    script.src = RAZORPAY_SCRIPT_URL;
    script.async = true;

    let settled = false;

    const cleanup = () => {
      settled = true;
      clearTimeout(timer);
      script.removeEventListener("load", onLoad);
      script.removeEventListener("error", onError);
    };

    const onLoad = () => {
      if (settled) return;
      cleanup();
      if (window.Razorpay) {
        resolve({ loaded: true });
      } else {
        // Script loaded but Razorpay global not found (corrupted/empty response)
        resolve({ loaded: false, error: "Razorpay script loaded but SDK not available." });
      }
    };

    const onError = () => {
      if (settled) return;
      cleanup();
      // Remove failed script so retry can inject a fresh one
      script.remove();
      resolve({
        loaded: false,
        error: "Could not reach Razorpay servers. Please check your internet connection.",
      });
    };

    const timer = setTimeout(() => {
      if (settled) return;
      cleanup();
      // Remove timed-out script
      script.remove();
      resolve({
        loaded: false,
        error: "Razorpay SDK took too long to load. Please check your internet connection and try again.",
      });
    }, timeoutMs);

    script.addEventListener("load", onLoad, { once: true });
    script.addEventListener("error", onError, { once: true });
    document.body.appendChild(script);
  });
}

/**
 * Loads the Razorpay checkout script with timeout and automatic retry.
 * Results are cached — subsequent calls return immediately if already loaded.
 * On failure the cache is cleared so the next call will retry.
 *
 * @param {Object} [options]
 * @param {number} [options.timeoutMs]
 * @param {number} [options.retries]
 * @returns {Promise<{ loaded: boolean, error?: string }>}
 */
export function loadRazorpayScript(options = {}) {
  const { timeoutMs = DEFAULT_TIMEOUT_MS, retries = DEFAULT_RETRIES } = options;

  // Fast path: already loaded
  if (typeof window !== "undefined" && window.Razorpay) {
    return Promise.resolve({ loaded: true });
  }

  // Deduplicate concurrent calls
  if (razorpayPromise) {
    return razorpayPromise;
  }

  razorpayPromise = (async () => {
    let lastResult = { loaded: false, error: "Unknown error" };

    // Initial attempt + retries
    for (let attempt = 0; attempt <= retries; attempt++) {
      lastResult = await attemptLoad(timeoutMs);
      if (lastResult.loaded) {
        return lastResult;
      }
      // Small delay before retry to let transient DNS issues resolve
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, 2000));
      }
    }

    // All attempts failed — clear cache so future calls can retry
    razorpayPromise = null;
    return lastResult;
  })();

  return razorpayPromise;
}
