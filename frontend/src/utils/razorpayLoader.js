/**
 * Dynamically and safely loads the Razorpay checkout script into the page DOM with caching and timeout handling.
 * @returns {Promise<boolean>} Resolves to true if loaded successfully, otherwise false.
 */
let razorpayPromise = null;

export function loadRazorpayScript() {
  if (typeof window !== "undefined" && window.Razorpay) {
    return Promise.resolve(true);
  }

  if (razorpayPromise) {
    return razorpayPromise;
  }

  razorpayPromise = new Promise((resolve) => {
    const timeout = setTimeout(() => {
      console.warn("⚠️ Razorpay SDK load timeout safeguard triggered.");
      resolve(typeof window !== "undefined" && !!window.Razorpay);
    }, 8000);

    const existingScript = document.querySelector(
      'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
    );

    let script = existingScript;

    if (!script) {
      script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      document.body.appendChild(script);
    }

    const handleSuccess = () => {
      clearTimeout(timeout);
      resolve(true);
    };

    const handleError = () => {
      clearTimeout(timeout);
      razorpayPromise = null;
      resolve(false);
    };

    if (window.Razorpay) {
      handleSuccess();
    } else {
      script.addEventListener("load", handleSuccess, { once: true });
      script.addEventListener("error", handleError, { once: true });
    }
  });

  return razorpayPromise;
}
