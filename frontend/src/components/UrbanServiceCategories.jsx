import React, { useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";

import { categoriesData } from "../data/servicesData";

function ServiceCard({ card, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-[188px] shrink-0 rounded-xl bg-white shadow-sm hover:shadow-md hover:scale-[1.02] transition border border-gray-100 overflow-hidden text-left"
    >
      <div className="h-44 w-full overflow-hidden">
        <img
          src={card.image}
          alt={card.name}
          className="h-full w-full object-cover rounded-xl"
          loading="lazy"
        />
      </div>

      <div className="px-3 pt-2 pb-4">
        <div className="text-sm font-semibold text-slate-800 leading-snug px-1">
          {card.name}
        </div>
      </div>
    </button>
  );
}

function scrollRow(rowEl, dir = 1) {
  const el = rowEl;
  if (!el) return;
  const amount = Math.round(el.clientWidth * 0.85);
  el.scrollBy({ left: amount * dir, behavior: "smooth" });
}

export default function UrbanServiceCategories() {
  const navigate = useNavigate();
  const rowRefs = useRef({});

  const categories = useMemo(() => categoriesData, []);

  const goToCategory = (catTitle) => {
    navigate(`/services?category=${encodeURIComponent(catTitle)}`);
  };

  const mostPopular = useMemo(() => {
    const titles = ["Cleaning Essentials", "AC Repair", "Electrician"];

    return titles
      .map((t) => categories.find((c) => c.title === t))
      .filter(Boolean)
      .map((c) => ({
        ...c,
        services: (c.services || []).slice(0, 4),
      }));
  }, [categories]);

  const mostBookedLabel = (
    <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2 py-0.5 rounded-full">
      Most Booked
    </span>
  );

  return (
    <section className="bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        {mostPopular.map((cat, idx) => (
          <div key={cat.title}>
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                  {cat.title}
                </h2>
                {idx === 0 ? mostBookedLabel : null}
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => goToCategory(cat.title)}
                  className="hidden sm:inline-block rounded-full px-4 py-2 text-sm font-semibold text-slate-700 hover:text-slate-900 transition"
                >
                  See all
                </button>

                <button
                  type="button"
                  aria-label="Scroll right"
                  onClick={() => scrollRow(rowRefs.current[cat.title], 1)}
                  className="rounded-full w-10 h-10 bg-white border border-gray-200 text-slate-700 flex items-center justify-center hover:border-gray-300 hover:shadow-sm transition"
                >
                  →
                </button>
              </div>
            </div>

            {idx !== 0 && <div className="border-b border-gray-100 mb-6" />}

            <div
              ref={(el) => {
                rowRefs.current[cat.title] = el;
              }}
              className="flex gap-3 overflow-x-auto pb-3 scrollbar-hide"
            >
              {cat.services.map((card) => (
                <ServiceCard
                  key={card.id}
                  card={card}
                  onClick={() => goToCategory(cat.title)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
