import React from "react";
import { useNavigate } from "react-router-dom";
import heroFallback from "../assets/hero.png";
import { serviceCategories, serviceImages } from "../data/dummyData";
import {
  Wind,
  Droplets,
  Sparkles,
  Zap,
  Paintbrush,
  Hammer,
  Bug,
  Wrench,
} from "lucide-react";

export default function Hero() {
  const navigate = useNavigate();

  const handleImageError = (e) => {
    e.currentTarget.onerror = null;
    e.currentTarget.src = heroFallback;
  };

  const services = [
    {
      name: "AC Repair",
      icon: Wind,
      category: "AC Repair",
    },
    {
      name: "Plumbing",
      icon: Droplets,
      category: "Plumbing",
    },
    {
      name: "Cleaning",
      icon: Sparkles,
      category: "Cleaning Essentials",
    },
    {
      name: "Electrician",
      icon: Zap,
      category: "Electrician",
    },
    {
      name: "Home Painting",
      icon: Paintbrush,
      category: "Home Painting",
    },
    {
      name: "Carpentry",
      icon: Hammer,
      category: "Carpentry",
    },
    {
      name: "Pest Control",
      icon: Bug,
      category: "Pest Control",
    },
    {
      name: "Appliance Repair",
      icon: Wrench,
      category: "Appliance Repair & Service",
    },
  ];

  return (
    <section className="bg-brand-bg">
      <div className="mx-auto max-w-7xl px-6 lg:px-12 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.15fr] gap-10 lg:gap-14 items-center">
          <div>
            <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 leading-tight">
              Home services at your doorstep
            </h1>
            <p className="mt-4 text-slate-600">
              Quick booking in minutes—choose a service, select a time slot, and
              get trusted pros at your home.
            </p>

            <div className="mt-7 grid grid-cols-4 gap-4">
              {services.map(({ name, icon: Icon, category }) => (
                <button
                  type="button"
                  key={name}
                  onClick={() =>
                    navigate(
                      `/services?category=${encodeURIComponent(category)}`,
                    )
                  }
                  className="flex flex-col items-center p-4 bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md hover:border-emerald-200 hover:scale-105 transition duration-200 cursor-pointer"
                >
                  <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center mb-3">
                    <Icon
                      className="w-7 h-7 text-emerald-600"
                      strokeWidth={1.5}
                    />
                  </div>
                  <span className="text-sm font-semibold text-slate-700 text-center leading-tight">
                    {name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="min-w-0">
            <div className="grid grid-cols-2 grid-rows-2 gap-4">
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
