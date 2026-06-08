import { useRef } from "react";
import { useNavigate } from "react-router-dom";
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

export default function Hero() {
  return <ServiceIconStrip />;
}

function ServiceIconStrip() {
  const navigate = useNavigate();
  const scrollRef = useRef(null);

  const scroll = (direction) => {
    if (!scrollRef.current) return;

    const scrollAmount = 200;
    const newScrollLeft =
      scrollRef.current.scrollLeft +
      (direction === "left" ? -scrollAmount : scrollAmount);

    scrollRef.current.scrollTo({
      left: newScrollLeft,
      behavior: "smooth",
    });
  };

  return (
    <div className="bg-[#1a2056] border-b border-white/10 w-full flex items-center px-1 sm:px-2 gap-1 overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full max-w-full overflow-hidden">
        <div className="relative flex items-center w-full max-w-full overflow-hidden">
          {/* Left Arrow - Hidden on mobile */}
          <button
            type="button"
            onClick={() => scroll("left")}
            className="hidden sm:flex items-center justify-center w-10 h-12 bg-white border border-gray-200 rounded-r-lg hover:bg-gray-50 hover:text-emerald-600 transition flex-shrink-0 z-10"
            aria-label="Scroll left"
          >
            <span className="text-xl font-bold">‹</span>
          </button>

          {/* Dedicated horizontal scrolling container (mobile swipe supported) */}
          <div
            className="w-full max-w-full overflow-hidden"
            /* keeps arrows from causing horizontal overflow */
          >
            <div
              ref={scrollRef}
              className="flex gap-1 sm:gap-2 overflow-x-auto overflow-y-hidden whitespace-nowrap flex-nowrap scrollbar-hide py-2 px-1 touch-pan-x"
              style={{
                scrollbarWidth: "none",
                msOverflowStyle: "none",
                WebkitOverflowScrolling: "touch",
                touchAction: "pan-x",
              }}
            >
              {services.map(({ name, icon: Icon, category }) => (
                <button
                  type="button"
                  key={name}
                  onClick={() =>
                    navigate(`/services?category=${encodeURIComponent(category)}`)
                  }
                  className="flex flex-col items-center gap-2 rounded-xl cursor-pointer flex-shrink-0 w-[84px] sm:w-[96px] py-3 hover:bg-white/5 transition-colors"
                >
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center flex-shrink-0">
                    <Icon
                      className="w-[22px] h-[22px] sm:w-[24px] sm:h-[24px] text-green-400 flex-shrink-0"
                      strokeWidth={1.5}
                    />
                  </div>

                  <span className="text-[11px] sm:text-[12px] text-slate-400 text-center leading-tight whitespace-nowrap">
                    {name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Right Arrow - Hidden on mobile */}
          <button
            type="button"
            onClick={() => scroll("right")}
            className="hidden sm:flex items-center justify-center w-10 h-12 bg-white border border-gray-200 rounded-l-lg hover:bg-gray-50 hover:text-emerald-600 transition flex-shrink-0 z-10"
            aria-label="Scroll right"
          >
            <span className="text-xl font-bold">›</span>
          </button>
        </div>
      </div>

      {/* Scrollbar hiding without breaking swipe */}
      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}


