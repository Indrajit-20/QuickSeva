import { useMemo, useState } from "react";
import { CheckCircle2, Loader2, Star, X } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const plans = [
  {
    id: "basic",
    name: "Basic",
    price: 10,
    days: 7,
    features: ["Top results", "Contact visible"],
  },
  {
    id: "standard",
    name: "Standard",
    price: 20,
    days: 15,
    popular: true,
    features: ["Top results", "Contact visible", "Highlighted pin"],
  },
  {
    id: "pro",
    name: "Pro",
    price: 30,
    days: 30,
    features: [
      "Top results",
      "Contact visible",
      "Highlighted pin",
      "Gold badge",
      "Priority support",
    ],
  },
];

const benefits = [
  {
    icon: "🔝",
    title: "Appear First",
    text: "Your listing shows above all free sellers",
  },
  {
    icon: "📞",
    title: "Contact Visible",
    text: "Buyers can see and call your number directly",
  },
  {
    icon: "⭐",
    title: "Premium Badge",
    text: "Gold badge builds trust with buyers",
  },
  {
    icon: "📈",
    title: "More Bookings",
    text: "Premium sellers get 3x more inquiries",
  },
];

const cardBase =
  "rounded-xl border border-[rgba(99,102,241,0.2)] bg-[#1a1830] p-5";

const readPremium = () => {
  try {
    return JSON.parse(localStorage.getItem("sellerPremium") || "null");
  } catch {
    return null;
  }
};

const readArray = (key) => {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export default function SellerPackages() {
  const { user } = useAuth();
  const [premium, setPremium] = useState(readPremium);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [upiId, setUpiId] = useState("quickseva@upi");
  const [paying, setPaying] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const isPremium = premium && new Date(premium.expiresAt) > new Date();
  const activePlan = plans.find((plan) => plan.id === premium?.plan);

  const expiryLabel = useMemo(() => {
    if (!premium?.expiresAt) return "";
    return new Intl.DateTimeFormat("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date(premium.expiresAt));
  }, [premium?.expiresAt]);

  const updateSellerPremium = (paymentData) => {
    const sellers = readArray("sellers");
    const registeredSeller = (() => {
      try {
        return JSON.parse(localStorage.getItem("registeredSeller") || "null");
      } catch {
        return null;
      }
    })();

    const userPhone = user?.phone || registeredSeller?.mobileNumber;
    const userName = user?.name || registeredSeller?.businessName;
    const sellerId = user?.sellerId || registeredSeller?.id;

    const updated = sellers.map((seller) => {
      const matches =
        seller.id === sellerId ||
        (userPhone && seller.phone === userPhone) ||
        (userName && seller.name === userName);

      if (!matches) return seller;

      return {
        ...seller,
        isPremium: true,
        plan: paymentData.plan,
        premiumExpiresAt: paymentData.expiresAt,
      };
    });

    localStorage.setItem("sellers", JSON.stringify(updated));
  };

  const handlePay = () => {
    if (!selectedPlan) return;

    setPaying(true);
    setTimeout(() => {
      const paymentData = {
        plan: selectedPlan.id,
        price: selectedPlan.price,
        purchasedAt: new Date().toISOString(),
        expiresAt: new Date(
          Date.now() + selectedPlan.days * 24 * 60 * 60 * 1000,
        ).toISOString(),
        isPremium: true,
      };

      localStorage.setItem("sellerPremium", JSON.stringify(paymentData));
      updateSellerPremium(paymentData);
      setPremium(paymentData);
      setPaying(false);
      setSelectedPlan(null);
      setSuccessMessage(
        "🎉 Premium activated! You now appear at the top of search results.",
      );
    }, 1500);
  };

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <p className="text-sm font-semibold text-indigo-300">
          Premium Packages
        </p>
        <h1 className="mt-1 text-3xl font-bold text-white">
          Grow your QuickSeva business
        </h1>
      </div>

      {successMessage && (
        <div className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 p-4 text-sm font-semibold text-emerald-200">
          {successMessage}
        </div>
      )}

      <section className={cardBase}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <h2 className="text-xl font-bold text-white">Current Status</h2>
              {isPremium ? (
                <span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-300">
                  Active
                </span>
              ) : (
                <span className="rounded-full border border-slate-500/30 bg-white/5 px-3 py-1 text-xs font-bold text-slate-300">
                  Free Plan
                </span>
              )}
            </div>
            <p className="text-sm text-slate-300">
              {isPremium
                ? `${activePlan?.name || "Premium"} plan active until ${expiryLabel}`
                : "Upgrade to unlock better visibility and direct buyer contact."}
            </p>
          </div>

          <div className="rounded-lg bg-white/5 p-4 text-sm text-slate-300">
            {isPremium ? (
              <ul className="space-y-2">
                <li>✅ Top placement unlocked</li>
                <li>✅ Phone number visible</li>
                <li>✅ Premium badge active</li>
              </ul>
            ) : (
              <ul className="space-y-2">
                <li>🔒 Top placement locked</li>
                <li>🔒 Contact hidden from buyers</li>
                <li>🔒 Premium badge unavailable</li>
              </ul>
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`${cardBase} relative ${
              plan.popular ? "border-amber-400/50 shadow-[0_0_25px_rgba(245,158,11,0.12)]" : ""
            }`}
          >
            {plan.popular && (
              <span className="absolute right-4 top-4 rounded-full bg-amber-300 px-3 py-1 text-xs font-black text-amber-950">
                Most Popular
              </span>
            )}

            <h3 className="text-xl font-bold text-white">{plan.name}</h3>
            <div className="mt-4 flex items-end gap-2">
              <span className="text-4xl font-black text-white">
                ₹{plan.price}
              </span>
              <span className="pb-1 text-sm text-slate-400">one time</span>
            </div>
            <span className="mt-4 inline-block rounded-full border border-indigo-400/30 bg-indigo-500/10 px-3 py-1 text-xs font-bold text-indigo-200">
              {plan.days} days
            </span>

            <ul className="mt-5 space-y-3 text-sm text-slate-200">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-300" />
                  {feature}
                </li>
              ))}
            </ul>

            <button
              type="button"
              onClick={() => {
                setSelectedPlan(plan);
                setUpiId("quickseva@upi");
              }}
              className="mt-6 w-full rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2.5 text-sm font-bold text-white transition hover:from-indigo-500 hover:to-violet-500"
            >
              Buy Now
            </button>
          </div>
        ))}
      </section>

      <section className={cardBase}>
        <h2 className="text-xl font-bold text-white">Why Go Premium?</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {benefits.map((benefit) => (
            <div key={benefit.title} className="rounded-lg bg-white/5 p-4">
              <div className="text-2xl">{benefit.icon}</div>
              <h3 className="mt-3 text-sm font-bold text-white">
                {benefit.title}
              </h3>
              <p className="mt-1 text-sm text-slate-400">{benefit.text}</p>
            </div>
          ))}
        </div>
      </section>

      {selectedPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-md rounded-2xl border border-indigo-400/30 bg-[#1a1830] p-6 shadow-2xl">
            <div className="mb-5 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 text-amber-300">
                  <Star size={18} />
                  <span className="text-sm font-bold">Fake Payment</span>
                </div>
                <h2 className="mt-2 text-2xl font-black text-white">
                  {selectedPlan.name} Plan
                </h2>
                <p className="text-sm text-slate-400">
                  Pay ₹{selectedPlan.price} for {selectedPlan.days} days
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPlan(null)}
                className="rounded-lg bg-white/5 p-2 text-slate-300 hover:text-white"
                disabled={paying}
                aria-label="Close payment modal"
              >
                <X size={18} />
              </button>
            </div>

            <label className="mb-2 block text-xs font-semibold text-indigo-200">
              UPI ID
            </label>
            <input
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              className="w-full rounded-lg border border-indigo-500/30 bg-indigo-950/40 px-3 py-2 text-sm text-white focus:outline-none"
            />

            <button
              type="button"
              onClick={handlePay}
              disabled={paying}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2.5 text-sm font-bold text-white transition hover:from-indigo-500 hover:to-violet-500 disabled:opacity-60"
            >
              {paying && <Loader2 size={16} className="animate-spin" />}
              {paying ? "Processing..." : `Pay ₹${selectedPlan.price}`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
