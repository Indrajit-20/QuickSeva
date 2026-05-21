import React from "react";
import heroFallback from "../assets/hero.png";
import { serviceCategories, serviceImages } from "../data/dummyData";
import {
  Droplets,
  Sparkles,
  Zap,
  Paintbrush,
  Hammer,
  Bug,
  Wrench,
  Snowflake,
} from "lucide-react";

const iconMap = {
  Snowflake,
  Droplets,
  Sparkles,
  Zap,
  Paintbrush,
  Hammer,
  Bug,
  Wrench,
};

export default function Hero() {
  const handleImageError = (e) => {
    e.currentTarget.onerror = null;
    e.currentTarget.src = heroFallback;
  };

  return (
    <section className="bg-brand-bg">
      <div className="mx-auto max-w-7xl px-6 lg:px-12 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.15fr] gap-10 lg:gap-14 items-center">
          {/* Left Column (Text & Services) */}
          <div>
            <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 leading-tight">
              Home services at your doorstep
            </h1>
            <p className="mt-4 text-slate-600">
              Quick booking in minutes—choose a service, select a time slot, and
              get trusted pros at your home.
            </p>

            <div className="mt-7 grid grid-cols-2 sm:grid-cols-3 gap-4">
              {serviceCategories.map((cat) => {
                const Icon = iconMap[cat.iconName];

                return (
                  <div
                    key={cat.name}
                    className="rounded-2xl border border-slate-100 bg-white shadow-sm p-4 flex items-center gap-3 hover:shadow-md hover:-translate-y-1 transition-all duration-300"
                  >
                    <div className="h-11 w-11 rounded-2xl bg-emerald-50 flex items-center justify-center">
                      {Icon ? (
                        <Icon className="h-5 w-5 text-emerald-700" />
                      ) : null}
                    </div>
                    <div className="text-sm font-semibold text-slate-900">
                      {cat.name}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column (Bento Box Collage) */}
          <div className="min-w-0">
            <div className="grid grid-cols-2 grid-rows-2 gap-4">
              {/* Use explicit aspect ratios so images don't get squeezed/cropped oddly */}
              <div className="col-span-1 row-span-2 overflow-hidden rounded-3xl shadow-sm">
                <img
                  src={serviceImages[0]}
                  alt="Home services"
                  className="w-full h-full object-cover object-center"
                  style={{ aspectRatio: "4 / 5" }}
                  loading="lazy"
                  onError={handleImageError}
                />
              </div>

              <div className="overflow-hidden rounded-3xl shadow-sm">
                <img
                  src={serviceImages[1]}
                  alt="Happy customer"
                  className="w-full h-full object-cover object-center"
                  style={{ aspectRatio: "1 / 1" }}
                  loading="lazy"
                  onError={handleImageError}
                />
              </div>

           

              <div className="overflow-hidden rounded-3xl shadow-sm">
                <img
                  src={serviceImages[3]}
                  alt="Home interior"
                  className="w-full h-full object-cover object-center"
                  style={{ aspectRatio: "1 / 1" }}
                  loading="lazy"
                  onError={handleImageError}
                />
              </div>

             
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
