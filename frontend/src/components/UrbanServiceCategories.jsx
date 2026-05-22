import React, { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

const categoriesData = [
  {
    title: "Cleaning Essentials",
    subtitle: "Monthly cleaning essential services",
    theme: "#16a34a",
    services: [
      {
        id: "clean-1",
        name: "Intense cleaning (2 bathrooms)",
        rating: 4.8,
        price: 942,
        originalPrice: 1018,
        image: "/images/315-carpet-cleaning-service-urban-solution-thumb.webp",
        sellerId: 1,
      },
      {
        id: "clean-2",
        name: "Deep kitchen cleaning",
        rating: 4.7,
        price: 799,
        originalPrice: 899,
        image: "/images/233-kitchen-cleaning.webp",
        sellerId: 2,
      },
      {
        id: "clean-3",
        name: "Bathroom & toilet sparkle",
        rating: 4.9,
        price: 650,
        originalPrice: 740,
        image: "/images/toilet clean.webp",
        sellerId: 3,
      },
      {
        id: "clean-4",
        name: "Carpet stain removal",
        rating: 4.6,
        price: 1190,
        originalPrice: 1390,
        image: "/images/img.jpg",
        sellerId: 4,
      },
      {
        id: "clean-5",
        name: "Home cleaning (Full house)",
        rating: 4.75,
        price: 1599,
        originalPrice: 1799,
        image: "/images/739-urban-cleaners-homepage.webp",
        sellerId: 5,
      },
    ],
  },
  {
    title: "Appliance Repair & Service",
    subtitle: "Fast doorstep repair for your appliances",
    theme: "#16a34a",
    services: [
      {
        id: "app-1",
        name: "AC maintenance & servicing",
        rating: 4.7,
        price: 1290,
        originalPrice: 1490,
        image:
          "/images/a-to-z-aircon-gorwa-vadodara-ac-repair-and-services-ra1caj6hjs-250.webp",
        sellerId: 2,
      },
      {
        id: "app-2",
        name: "Washing machine not spinning",
        rating: 4.6,
        price: 1099,
        originalPrice: 1299,
        image:
          "/images/best-one-enterprises-kondhwa-khurd-pune-ac-repair-and-services-06mbo-250.webp",
        sellerId: 3,
      },
      {
        id: "app-3",
        name: "Refrigerator cooling issue",
        rating: 4.8,
        price: 1390,
        originalPrice: 1590,
        image: "/images/technology-in-home.webp",
        sellerId: 4,
      },
      {
        id: "app-4",
        name: "Microwave repair",
        rating: 4.5,
        price: 699,
        originalPrice: 799,
        image: "/images/premium_photo-1661911021547-b0188f22d548.webp",
        sellerId: 5,
      },
      {
        id: "app-5",
        name: "RO water purifier service",
        rating: 4.75,
        price: 899,
        originalPrice: 1099,
        image: "/images/Urban-Company-cleaning-services-ad-hoc-cleaning-1.webp",
        sellerId: 6,
      },
    ],
  },
  {
    title: "AC Repair",
    subtitle: "Premium AC repair with quick scheduling",
    theme: "#16a34a",
    services: [
      {
        id: "ac-1",
        name: "AC gas recharge (split unit)",
        rating: 4.8,
        price: 1590,
        originalPrice: 1890,
        image:
          "/images/close-up-of-repairman-in-uniform-standing-on-home-kitchen-and-holding-his-tool-bag.webp",
        sellerId: 1,
      },
      {
        id: "ac-2",
        name: "AC not cooling diagnosis",
        rating: 4.6,
        price: 1199,
        originalPrice: 1399,
        image: "/images/315-carpet-cleaning-service-urban-solution-thumb.webp",
        sellerId: 2,
      },
      {
        id: "ac-3",
        name: "AC deep cleaning",
        rating: 4.9,
        price: 999,
        originalPrice: 1199,
        image: "/images/hs_cleaning_compressed.webp",
        sellerId: 3,
      },
      {
        id: "ac-4",
        name: "AC installation support",
        rating: 4.7,
        price: 1890,
        originalPrice: 2190,
        image:
          "/images/a-to-z-aircon-gorwa-vadodara-ac-repair-and-services-ra1caj6hjs-250.webp",
        sellerId: 4,
      },
      {
        id: "ac-5",
        name: "AC filter & PCB check",
        rating: 4.55,
        price: 750,
        originalPrice: 899,
        image: "/images/technology-in-home.webp",
        sellerId: 5,
      },
    ],
  },
  {
    title: "Electrician",
    subtitle: "Electrical fixes made easy",
    theme: "#16a34a",
    services: [
      {
        id: "elec-1",
        name: "Switchboard & wiring check",
        rating: 4.75,
        price: 590,
        originalPrice: 690,
        image: "/images/img.jpg",
        sellerId: 6,
      },
      {
        id: "elec-2",
        name: "Fan installation",
        rating: 4.6,
        price: 699,
        originalPrice: 799,
        image: "/images/premium_photo-1661911021547-b0188f22d548.webp",
        sellerId: 7,
      },
      {
        id: "elec-3",
        name: "MCB & breaker troubleshooting",
        rating: 4.8,
        price: 899,
        originalPrice: 1099,
        image: "/images/technology-in-home.webp",
        sellerId: 8,
      },
      {
        id: "elec-4",
        name: "Socket & plug replacement",
        rating: 4.55,
        price: 399,
        originalPrice: 499,
        image:
          "/images/close-up-of-repairman-in-uniform-standing-on-home-kitchen-and-holding-his-tool-bag.webp",
        sellerId: 9,
      },
      {
        id: "elec-5",
        name: "Inverter servicing",
        rating: 4.7,
        price: 1299,
        originalPrice: 1499,
        image: "/images/Urban-Company-cleaning-services-ad-hoc-cleaning-1.webp",
        sellerId: 10,
      },
    ],
  },
  {
    title: "Plumbing",
    subtitle: "Leak fixes, unclog & more",
    theme: "#16a34a",
    services: [
      {
        id: "pl-1",
        name: "Leakage repair (tap & pipe)",
        rating: 4.85,
        price: 499,
        originalPrice: 599,
        image: "/images/friendly-plumber-giving-a-thumbs-photo.webp",
        sellerId: 1,
      },
      {
        id: "pl-2",
        name: "Toilet clog removal",
        rating: 4.7,
        price: 799,
        originalPrice: 949,
        image: "/images/toilet clean.webp",
        sellerId: 2,
      },
      {
        id: "pl-3",
        name: "Sink & drain cleaning",
        rating: 4.6,
        price: 650,
        originalPrice: 790,
        image: "/images/bathromclean.jpg",
        sellerId: 3,
      },
      {
        id: "pl-4",
        name: "Water heater installation",
        rating: 4.75,
        price: 1490,
        originalPrice: 1790,
        image: "/images/technology-in-home.webp",
        sellerId: 4,
      },
      {
        id: "pl-5",
        name: "Faucet replacement",
        rating: 4.55,
        price: 399,
        originalPrice: 499,
        image: "/images/img.jpg",
        sellerId: 5,
      },
    ],
  },
  {
    title: "Pest Control",
    subtitle: "Effective pest removal for a healthier home",
    theme: "#16a34a",
    services: [
      {
        id: "pc-1",
        name: "Anti-cockroach treatment",
        rating: 4.8,
        price: 899,
        originalPrice: 1099,
        image: "/images/Urban-Company-cleaning-services-ad-hoc-cleaning-1.webp",
        sellerId: 2,
      },
      {
        id: "pc-2",
        name: "Bed bug extermination",
        rating: 4.6,
        price: 1290,
        originalPrice: 1590,
        image: "/images/premium_photo-1661911021547-b0188f22d548.webp",
        sellerId: 3,
      },
      {
        id: "pc-3",
        name: "Mosquito control",
        rating: 4.7,
        price: 799,
        originalPrice: 999,
        image: "/images/technology-in-home.webp",
        sellerId: 4,
      },
      {
        id: "pc-4",
        name: "Rodent control",
        rating: 4.55,
        price: 1090,
        originalPrice: 1290,
        image: "/images/hs_cleaning_compressed.webp",
        sellerId: 5,
      },
      {
        id: "pc-5",
        name: "Termite inspection & treatment",
        rating: 4.85,
        price: 1690,
        originalPrice: 1990,
        image:
          "/images/a-to-z-aircon-gorwa-vadodara-ac-repair-and-services-ra1caj6hjs-250.webp",
        sellerId: 6,
      },
    ],
  },
  {
    title: "Carpentry",
    subtitle: "Wood repair & installation services",
    theme: "#16a34a",
    services: [
      {
        id: "carp-1",
        name: "Door hinge repair",
        rating: 4.65,
        price: 549,
        originalPrice: 649,
        image: "/images/img.jpg",
        sellerId: 7,
      },
      {
        id: "carp-2",
        name: "Drawer alignment & repair",
        rating: 4.8,
        price: 699,
        originalPrice: 849,
        image:
          "/images/builder-or-painter-in-cap-paints-walls-with-long-painting-roller-business-building-renovation.webp",
        sellerId: 8,
      },
      {
        id: "carp-3",
        name: "Furniture installation help",
        rating: 4.7,
        price: 1099,
        originalPrice: 1299,
        image:
          "/images/best-one-enterprises-kondhwa-khurd-pune-ac-repair-and-services-06mbo-250.webp",
        sellerId: 9,
      },
      {
        id: "carp-4",
        name: "Wood polish & finishing",
        rating: 4.6,
        price: 799,
        originalPrice: 999,
        image: "/images/premium_photo-1661911021547-b0188f22d548.webp",
        sellerId: 10,
      },
      {
        id: "carp-5",
        name: "Custom shelf fix",
        rating: 4.85,
        price: 1290,
        originalPrice: 1490,
        image:
          "/images/close-up-of-repairman-in-uniform-standing-on-home-kitchen-and-holding-his-tool-bag.webp",
        sellerId: 11,
      },
    ],
  },
];

function ServiceCard({ card, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-[180px] shrink-0 rounded-2xl bg-white/5 border border-indigo-500/20 hover:border-emerald-400/40 hover:shadow-lg transition p-3 text-left"
    >
      <div className="aspect-square w-full overflow-hidden rounded-xl bg-indigo-950/30">
        <img
          src={card.image}
          alt={card.name}
          className="h-full w-full object-cover"
          loading="lazy"
        />
      </div>

      <div className="mt-3 text-xs font-semibold text-white leading-snug">
        {card.name}
      </div>

      <div className="mt-2 text-xs font-bold text-amber-300">
        ★ {card.rating.toFixed(2)}
      </div>

      <div className="mt-2 flex items-baseline gap-2">
        <div className="text-sm font-black text-white">₹{card.price}</div>
        <div className="text-xs font-semibold text-indigo-200 line-through">
          ₹{card.originalPrice}
        </div>
      </div>
    </button>
  );
}

function scrollRow(ref, dir = 1) {
  const el = ref.current;
  if (!el) return;
  const amount = Math.round(el.clientWidth * 0.85);
  el.scrollBy({ left: amount * dir, behavior: "smooth" });
}

export default function UrbanServiceCategories() {
  const navigate = useNavigate();

  const rowRefs = useRef({});
  const [activeCategory, setActiveCategory] = useState(null);

  const categories = useMemo(() => categoriesData, []);

  const getRowRef = (title) => (el) => {
    rowRefs.current[title] = el;
  };

  return (
    <main className="bg-brand-bg">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        {categories.map((cat) => (
          <section key={cat.title} className="mb-10">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-white">
                  {cat.title}
                </h2>
                <p className="mt-1 text-sm text-indigo-200">{cat.subtitle}</p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setActiveCategory(cat.title)}
                  className="hidden sm:inline-block rounded-full border border-indigo-500/30 bg-indigo-950/20 px-4 py-2 text-sm font-bold text-white hover:border-emerald-400/40 hover:bg-indigo-950/30 transition"
                >
                  See all
                </button>

                <button
                  type="button"
                  aria-label="Scroll right"
                  onClick={() =>
                    scrollRow(
                      rowRefs.current[cat.title]
                        ? { current: rowRefs.current[cat.title] }
                        : { current: null },
                      1,
                    )
                  }
                  className="rounded-full w-10 h-10 bg-indigo-950/30 border border-indigo-500/20 text-white flex items-center justify-center hover:border-emerald-400/40 hover:bg-indigo-950/40 transition"
                >
                  →
                </button>
              </div>
            </div>

            <div
              ref={getRowRef(cat.title)}
              className="flex gap-3 overflow-x-auto pb-3 scrollbar-hide"
              onMouseEnter={() => setActiveCategory(cat.title)}
            >
              {cat.services.map((card) => (
                <ServiceCard
                  key={card.id}
                  card={card}
                  onClick={() => {
                    const sellersRaw = localStorage.getItem("sellers");
                    const sellers = sellersRaw ? JSON.parse(sellersRaw) : [];
                    const match = sellers?.find(
                      (s) => String(s.id) === String(card.sellerId),
                    );
                    // fallback: use first seller if the dummy sellerId is not found
                    const targetSellerId =
                      match?.id ?? sellers?.[0]?.id ?? card.sellerId;
                    navigate(`/book/${targetSellerId}`);
                  }}
                />
              ))}
            </div>

            {activeCategory === cat.title && null}
          </section>
        ))}
      </div>
    </main>
  );
}
