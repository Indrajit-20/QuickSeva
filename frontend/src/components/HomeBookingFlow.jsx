import React, { useMemo, useState } from "react";

const bookingCategories = [
  {
    key: "electrical-ac",
    icon: "⚡",
    title: "Electrical & AC Repair",
    description: "Wiring fixes, AC service & installation",
    services: [
      {
        id: "wiring-fix",
        name: "Wiring Fix",
        description: "Electrical wiring diagnostics and quick fixes",
        rating: 4.5,
        price: 580,
        originalPrice: 690,
      },
      {
        id: "panel-upgrade",
        name: "Panel Upgrade",
        description: "Safe panel upgrade for improved performance",
        rating: 4.5,
        price: 750,
        originalPrice: 890,
      },
      {
        id: "ac-service",
        name: "AC Service",
        description: "Routine AC service and basic part checks",
        rating: 4.5,
        price: 899,
        originalPrice: 1050,
      },
      {
        id: "ac-installation",
        name: "AC Installation",
        description: "Installation support and system setup",
        rating: 4.6,
        price: 2500,
        originalPrice: 2900,
      },
      {
        id: "fan-installation",
        name: "Fan Installation",
        description: "Fan installation with proper wiring checks",
        rating: 4.4,
        price: 499,
        originalPrice: 599,
      },
    ],
  },
  {
    key: "plumbing-leak",
    icon: "🔧",
    title: "Plumbing & Leak Fix",
    description: "Unclog, fix leaks & restore flow",
    services: [
      {
        id: "pipe-leak",
        name: "Pipe Leak Fix",
        description: "Leak detection and reliable pipe repair",
        rating: 4.6,
        price: 499,
        originalPrice: 599,
      },
      {
        id: "toilet-unclog",
        name: "Toilet Unclog",
        description: "Fast unclog service for toilets",
        rating: 4.5,
        price: 649,
        originalPrice: 790,
      },
      {
        id: "drain-cleaning",
        name: "Drain Cleaning",
        description: "Clear blockage and remove buildup",
        rating: 4.4,
        price: 780,
        originalPrice: 950,
      },
      {
        id: "water-heater",
        name: "Water Heater Repair",
        description: "Heater troubleshooting and repair",
        rating: 4.7,
        price: 1750,
        originalPrice: 1990,
      },
    ],
  },
  {
    key: "home-maintenance",
    icon: "🏠",
    title: "Home Maintenance & Cleaning",
    description: "Deep cleaning and trusted home services",
    services: [
      {
        id: "deep-cleaning",
        name: "Deep Cleaning",
        description: "Thorough deep cleaning for your home",
        rating: 4.6,
        price: 1200,
        originalPrice: 1450,
      },
      {
        id: "pest-control",
        name: "Pest Control",
        description: "Effective pest removal for a healthier home",
        rating: 4.5,
        price: 999,
        originalPrice: 1190,
      },
      {
        id: "painting",
        name: "Painting",
        description: "Wall painting with a clean finish",
        rating: 4.4,
        price: 3500,
        originalPrice: 3990,
      },
      {
        id: "appliance-repair",
        name: "Appliance Repair",
        description: "Doorstep appliance repairs and servicing",
        rating: 4.5,
        price: 850,
        originalPrice: 1100,
      },
    ],
  },
];

const TIME_SLOTS = ["Morning", "Afternoon", "Evening"];

function FadeSlide({ children, keyName }) {
  return (
    <div key={keyName} className="animate-[bb_fade_slide_250ms_ease]">
      {children}
    </div>
  );
}

export default function HomeBookingFlow() {
  const [step, setStep] = useState(1);
  const [activeCategoryKey, setActiveCategoryKey] = useState(null);
  const [activeServiceId, setActiveServiceId] = useState(null);
  const [toast, setToast] = useState(null);

  const activeCategory = useMemo(
    () => bookingCategories.find((c) => c.key === activeCategoryKey) || null,
    [activeCategoryKey],
  );

  const activeService = useMemo(() => {
    if (!activeCategory) return null;
    return (
      activeCategory.services.find((s) => s.id === activeServiceId) || null
    );
  }, [activeCategory, activeServiceId]);

  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    address: "",
    date: "",
    timeSlot: "Morning",
    notes: "",
  });

  const resetForm = () =>
    setFormData({
      fullName: "",
      phone: "",
      address: "",
      date: "",
      timeSlot: "Morning",
      notes: "",
    });

  const startFromCategory = (categoryKey) => {
    setActiveCategoryKey(categoryKey);
    setActiveServiceId(null);
    resetForm();
    setToast(null);
    setStep(2);
  };

  const openService = (serviceId) => {
    setActiveServiceId(serviceId);
    resetForm();
    setToast(null);
    setStep(3);
  };

  const goBack = () => {
    setToast(null);
    if (step === 3) {
      setActiveServiceId(null);
      setStep(2);
      return;
    }
    if (step === 2) {
      setActiveCategoryKey(null);
      setStep(1);
    }
  };

  const validate = () => {
    const errors = {};
    if (!formData.fullName.trim()) errors.fullName = "Full name is required";
    if (!formData.phone.trim()) errors.phone = "Phone number is required";
    if (formData.phone.replace(/\D/g, "").length !== 10)
      errors.phone = "Phone must be 10 digits";
    if (!formData.address.trim()) errors.address = "Address is required";
    if (!formData.date) errors.date = "Pick a date";
    if (!formData.timeSlot) errors.timeSlot = "Pick a time slot";
    if (!activeCategory) errors.category = "Pick a category";
    if (!activeService) errors.service = "Pick a service";
    return errors;
  };

  const [errors, setErrors] = useState({});

  const submit = (e) => {
    e.preventDefault();
    const next = validate();
    setErrors(next);
    if (Object.keys(next).length) return;

    setToast("✅ Booking Confirmed! We'll contact you soon.");
  };

  return (
    <section className="bg-[#0F172A] py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="rounded-3xl bg-gradient-to-r from-indigo-950 via-[#0F172A] to-[#0F172A] border border-white/5 p-6 md:p-10">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h2 className="text-3xl md:text-4xl font-extrabold text-white">
                  Expert Services, One Click Away
                </h2>
                <p className="mt-2 text-indigo-200">
                  Choose a category, pick a service, and confirm your booking.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-4 py-2 text-emerald-200 text-sm font-bold">
                  Step {step} / 3
                </div>
              </div>
            </div>
          </div>
        </div>

        {toast && (
          <div className="mb-5 rounded-xl bg-emerald-500/15 border border-emerald-400/25 p-4 text-emerald-200 font-semibold">
            {toast}
          </div>
        )}

        {/* Step 1: Category cards */}
        {step === 1 && <FadeSlide keyName="step1" />}

        {step === 1 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {bookingCategories.map((cat) => (
              <div
                key={cat.key}
                className="group rounded-3xl bg-white/5 border border-white/10 hover:border-emerald-400/30 hover:shadow-lg transition-shadow p-5"
              >
                <div className="flex items-start justify-between">
                  <div className="text-3xl">{cat.icon}</div>
                </div>
                <h3 className="mt-3 text-white text-lg font-extrabold">
                  {cat.title}
                </h3>
                <p className="mt-2 text-indigo-200 text-sm">
                  {cat.description}
                </p>
                <button
                  type="button"
                  onClick={() => startFromCategory(cat.key)}
                  className="mt-5 w-full rounded-2xl bg-[#F97316] hover:bg-orange-500 text-white font-extrabold py-3 transition"
                >
                  View Services 0
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Step 2: Services list */}
        {step === 2 && activeCategory && <FadeSlide keyName="step2" />}

        {step === 2 && activeCategory && (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-indigo-200 text-sm">Category</div>
                <h3 className="text-white text-2xl font-extrabold">
                  {activeCategory.icon} {activeCategory.title}
                </h3>
                <p className="mt-1 text-indigo-200 text-sm">
                  {activeCategory.description}
                </p>
              </div>
              <button
                type="button"
                onClick={goBack}
                className="rounded-2xl px-4 py-2 text-white font-bold border border-white/15 bg-white/5 hover:bg-white/10 transition"
              >
                 Back
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeCategory.services.map((srv) => (
                <div
                  key={srv.id}
                  className="rounded-3xl bg-white/5 border border-white/10 hover:border-emerald-400/30 p-5 hover:shadow-lg transition"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-white font-extrabold">
                        {srv.name}
                      </div>
                      <div className="mt-2 text-indigo-200 text-sm">
                        {srv.description}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-amber-300 font-extrabold">
                          {srv.rating.toFixed(1)}
                      </div>
                      <div className="mt-2 flex items-center justify-end gap-3">
                        <div className="text-white font-extrabold">
                           ₹{srv.price}
                        </div>
                        <div className="text-indigo-200 text-sm line-through">
                          ₹{srv.originalPrice}
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => openService(srv.id)}
                    className="mt-4 w-full rounded-2xl bg-[#F97316] hover:bg-orange-500 text-white font-extrabold py-3 transition"
                  >
                    Book Now  
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Service detail + booking form */}
        {step === 3 && activeCategory && activeService && (
          <FadeSlide keyName="step3" />
        )}

        {step === 3 && activeCategory && activeService && (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-indigo-200 text-sm">Service</div>
                <h3 className="text-white text-2xl font-extrabold">
                  {activeCategory.icon} {activeService.name}
                </h3>
                <div className="mt-2 text-indigo-200 text-sm">
                  {activeService.description}
                </div>
                <div className="mt-3 flex items-center gap-4">
                  <div className="text-amber-300 font-extrabold">
                      {activeService.rating.toFixed(1)}
                  </div>
                  <div className="flex items-baseline gap-3">
                    <div className="text-white font-extrabold">
                      ₹{activeService.price}
                    </div>
                    <div className="text-indigo-200 text-sm line-through">
                      ₹{activeService.originalPrice}
                    </div>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={goBack}
                className="rounded-2xl px-4 py-2 text-white font-bold border border-white/15 bg-white/5 hover:bg-white/10 transition"
              >
                 Back
              </button>
            </div>

            <form
              onSubmit={submit}
              className="rounded-3xl bg-white/5 border border-white/10 p-5 md:p-7"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-indigo-100">
                    Full Name
                  </label>
                  <input
                    value={formData.fullName}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, fullName: e.target.value }))
                    }
                    className="mt-2 w-full rounded-2xl bg-[#0F172A] border border-white/10 px-4 py-3 text-white outline-none focus:border-[#F97316]"
                    placeholder="Your name"
                  />
                  {errors.fullName && (
                    <p className="mt-1 text-xs text-rose-300">
                      {errors.fullName}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-bold text-indigo-100">
                    Phone Number
                  </label>
                  <input
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, phone: e.target.value }))
                    }
                    className="mt-2 w-full rounded-2xl bg-[#0F172A] border border-white/10 px-4 py-3 text-white outline-none focus:border-[#F97316]"
                    placeholder="10-digit phone"
                  />
                  {errors.phone && (
                    <p className="mt-1 text-xs text-rose-300">{errors.phone}</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-indigo-100">
                    Address
                  </label>
                  <textarea
                    value={formData.address}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, address: e.target.value }))
                    }
                    rows={3}
                    className="mt-2 w-full resize-none rounded-2xl bg-[#0F172A] border border-white/10 px-4 py-3 text-white outline-none focus:border-[#F97316]"
                    placeholder="House/flat, area, landmark"
                  />
                  {errors.address && (
                    <p className="mt-1 text-xs text-rose-300">
                      {errors.address}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-bold text-indigo-100">
                    Date
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, date: e.target.value }))
                    }
                    className="mt-2 w-full rounded-2xl bg-[#0F172A] border border-white/10 px-4 py-3 text-white outline-none focus:border-[#F97316]"
                  />
                  {errors.date && (
                    <p className="mt-1 text-xs text-rose-300">{errors.date}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-bold text-indigo-100">
                    Time Slot
                  </label>
                  <select
                    value={formData.timeSlot}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, timeSlot: e.target.value }))
                    }
                    className="mt-2 w-full rounded-2xl bg-[#0F172A] border border-white/10 px-4 py-3 text-white outline-none focus:border-[#F97316]"
                  >
                    {TIME_SLOTS.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                  {errors.timeSlot && (
                    <p className="mt-1 text-xs text-rose-300">
                      {errors.timeSlot}
                    </p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-indigo-100">
                    Special Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, notes: e.target.value }))
                    }
                    rows={3}
                    className="mt-2 w-full resize-none rounded-2xl bg-[#0F172A] border border-white/10 px-4 py-3 text-white outline-none focus:border-[#F97316]"
                    placeholder="Anything we should know?"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="mt-6 w-full rounded-2xl bg-[#F97316] hover:bg-orange-500 text-white font-extrabold py-4 transition"
              >
                Confirm Booking
              </button>
            </form>
          </div>
        )}
      </div>
    </section>
  );
}
