import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import heroFallback from "../assets/hero.png";
import { serviceImages } from "../data/dummyData";
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
import {
  ALL_SERVICE_SUGGESTIONS,
  CATEGORIES,
  serviceToCategory,
} from "../data/servicesData";

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

          {/* Bark.com style search bar */}
          {/* <div className="w-full max-w-3xl mx-auto mt-8 px-4">
            <div className="text-lg font-bold text-slate-700 mb-3 text-center">
              Or search for any service near you
            </div>

            <HeroSearchBar
              navigate={navigate}
              serviceToCategory={serviceToCategory}
              allSuggestions={ALL_SERVICE_SUGGESTIONS}
            />
          </div> */}
        </div>
      </div>
    </section>
  );
}

function HeroSearchBar({ navigate, serviceToCategory, allSuggestions }) {
  const [serviceValue, setServiceValue] = useState("");
  const [locationValue, setLocationValue] = useState("");
  const [locationLoading, setLocationLoading] = useState(false);

  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [showServiceDrop, setShowServiceDrop] = useState(false);
  const [showLocationDrop, setShowLocationDrop] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);

  const [serviceSuggestions, setServiceSuggestions] = useState([]);

  const containerRef = useRef(null);

  useEffect(() => {
    const term = serviceValue.trim().toLowerCase();
    if (!term) {
      setServiceSuggestions([]);
      return;
    }
    const filtered = allSuggestions
      .filter((s) => s.toLowerCase().includes(term))
      .slice(0, 7);
    setServiceSuggestions(filtered);
  }, [serviceValue, allSuggestions]);

  const selectedCategories = useMemo(() => new Set(CATEGORIES), []);

  useEffect(() => {
    const onDocMouseDown = (e) => {
      if (!containerRef.current) return;
      if (containerRef.current.contains(e.target)) return;
      setShowServiceDrop(false);
      setShowLocationDrop(false);
    };

    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, []);

  useEffect(() => {
    if (!locationValue) {
      setLocationSuggestions([]);
      setShowLocationDrop(false);
      return;
    }

    const timer = setTimeout(() => {
      fetchLocations(locationValue);
    }, 400);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locationValue]);

  const fetchLocations = async (query) => {
    if (query.length < 3) return;
    setLocationLoading(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search` +
          `?q=${encodeURIComponent(query)}` +
          `&format=json&limit=5&countrycodes=in`,
      );
      const data = await res.json();
      setLocationSuggestions(Array.isArray(data) ? data : []);
      setShowLocationDrop(true);
    } catch {
      setLocationSuggestions([]);
      setShowLocationDrop(false);
    } finally {
      setLocationLoading(false);
    }
  };

  const handleSearch = () => {
    const category = serviceToCategory[serviceValue] || serviceValue;
    const lat = selectedLocation?.lat || "";
    const lon = selectedLocation?.lon || "";

    navigate(
      `/services?category=${encodeURIComponent(category)}` +
        `&location=${encodeURIComponent(locationValue || "")}` +
        `&lat=${lat}&lon=${lon}&showMap=true`,
    );
  };

  const onPickServiceItem = (item) => {
    setServiceValue(item);
    setShowServiceDrop(false);
  };

  const onPickLocationItem = (item) => {
    setLocationValue(item.display_name);
    setSelectedLocation({
      display_name: item.display_name,
      lat: item.lat,
      lon: item.lon,
    });
    setShowLocationDrop(false);
  };

  return (
    <div
      className="flex gap-3 items-stretch bg-white rounded-2xl shadow-md border border-gray-200 p-2"
      ref={containerRef}
    >
      <div className="flex-1 relative">
        <input
          value={serviceValue}
          onChange={(e) => {
            setServiceValue(e.target.value);
            setShowServiceDrop(true);
          }}
          onFocus={() => setShowServiceDrop(true)}
          placeholder="What service do you need?"
          className="w-full px-4 py-2 text-sm outline-none rounded-xl"
        />
        {showServiceDrop && serviceSuggestions.length > 0 && (
          <div className="absolute left-0 right-0 top-full z-50 mt-2 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
            {serviceSuggestions.map((item) => {
              const isCategory = selectedCategories.has(item);
              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => onPickServiceItem(item)}
                  className="w-full flex justify-between items-center px-4 py-2.5 text-sm hover:bg-indigo-50 cursor-pointer text-left"
                >
                  <span className="flex items-center gap-2 min-w-0">
                    <span className="flex-shrink-0">
                      {isCategory ? "🏷️" : "🔧"}
                    </span>
                    <span className="truncate font-semibold text-slate-700">
                      {item}
                    </span>
                  </span>
                  {isCategory ? (
                    <span className="bg-gray-100 text-gray-500 text-xs px-2 py-0.5 rounded-full flex-shrink-0">
                      Category
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex-1 relative border-l border-gray-200 pl-0.5">
        <input
          value={locationValue}
          onChange={(e) => {
            setLocationValue(e.target.value);
            setShowLocationDrop(true);
          }}
          onFocus={() => setShowLocationDrop(true)}
          placeholder="📍 Your area or city..."
          className="w-full px-4 py-2 text-sm outline-none rounded-xl"
        />

        {showLocationDrop && locationSuggestions.length > 0 && (
          <div className="absolute left-0 right-0 top-full z-50 mt-2 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
            {locationSuggestions.slice(0, 5).map((item) => (
              <button
                key={`${item.place_id}-${item.lat}-${item.lon}`}
                type="button"
                onClick={() => onPickLocationItem(item)}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-indigo-50 cursor-pointer text-left"
              >
                <span>📍</span>
                <span className="truncate text-slate-700">
                  {item.display_name}
                </span>
              </button>
            ))}
          </div>
        )}

        {locationLoading ? (
          <div className="absolute left-4 top-full z-50 mt-2 text-xs text-slate-500">
            Searching...
          </div>
        ) : null}
      </div>

      <button
        type="button"
        onClick={handleSearch}
        className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold text-sm hover:bg-indigo-700 transition whitespace-nowrap"
      >
        Find Pros →
      </button>
    </div>
  );
}
