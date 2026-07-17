import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Users, Briefcase, CheckCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import apiClient from "../api/axiosConfig";
import NearbyServices from "../components/NearbyServices";
import ActivityNotification from "../components/ActivityNotification";

// CountUp animation component using requestAnimationFrame
const CountUp = ({ end, duration = 1500, suffix = "+" }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTimestamp = null;
    let cancelled = false;

    const step = (timestamp) => {
      if (cancelled) return;
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };

    window.requestAnimationFrame(step);

    return () => {
      cancelled = true;
    };
  }, [end, duration]);

  return (
    <span>
      {count.toLocaleString()}
      {suffix}
    </span>
  );
};

const Home = () => {
  const { user, isAuthenticated } = useAuth();
  const isSeller = user?.role === "seller";
  
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await apiClient.get("/nearby/stats");
        if (response.data && response.data.success && response.data.data) {
          const { totalCustomers, totalSellers, totalOrders } = response.data.data;
          setStats({
            totalCustomers: totalCustomers || 500,
            totalSellers: totalSellers || 150,
            totalOrders: totalOrders || 1200,
          });
        } else {
          setStats({
            totalCustomers: 500,
            totalSellers: 150,
            totalOrders: 1200,
          });
        }
      } catch (error) {
        console.error("Error fetching stats:", error);
        setStats({
          totalCustomers: 500,
          totalSellers: 150,
          totalOrders: 1200,
        });
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect(); // Trigger animation once
        }
      },
      { threshold: 0.1 } // triggers when 10% of the section is visible
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <main className="min-h-screen flex flex-col" style={{ backgroundColor: "#f8fafc" }}>

      {/* ── Services Near You Section (light hero) ── */}
      <section className="bg-white py-12 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center text-center mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-850 tracking-tight">
              Services Near You
            </h1>
            <p className="text-sm text-slate-500 mt-1 max-w-xl font-semibold">
              Find verified professionals within 5km of your location
            </p>
          </div>
          <NearbyServices />
        </div>
      </section>

      {/* ── Why Choose QuickSeva (white background) ── */}
      <section ref={sectionRef} className="bg-white py-20 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-bold text-slate-900 mb-3">
              QuickSeva by the Numbers
            </h2>
            <p className="text-lg text-slate-500">
              Empowering local communities and connecting trusted service experts
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Active Customers */}
            <div className="bg-white border border-slate-100 rounded-3xl p-8 shadow-sm hover:shadow-2xl hover:shadow-indigo-100/50 hover:-translate-y-1 transition-all duration-300 flex flex-col items-start relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110 duration-500" />
              <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-6 relative z-10">
                <Users className="w-7 h-7" />
              </div>
              <div className="text-5xl font-black text-indigo-600 tracking-tight mb-2 relative z-10 min-h-[3rem]">
                {!loading && stats && isVisible ? (
                  <CountUp end={stats.totalCustomers} suffix="+" />
                ) : (
                  <span>0+</span>
                )}
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2 relative z-10">Active Customers</h3>
              <p className="text-slate-500 leading-relaxed text-sm relative z-10">
                Trusted by hundreds of daily active users looking for reliable local assistance and home repairs.
              </p>
            </div>

            {/* Skilled Sellers */}
            <div className="bg-white border border-slate-100 rounded-3xl p-8 shadow-sm hover:shadow-2xl hover:shadow-emerald-100/50 hover:-translate-y-1 transition-all duration-300 flex flex-col items-start relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50/50 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110 duration-500" />
              <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-6 relative z-10">
                <Briefcase className="w-7 h-7" />
              </div>
              <div className="text-5xl font-black text-emerald-600 tracking-tight mb-2 relative z-10 min-h-[3rem]">
                {!loading && stats && isVisible ? (
                  <CountUp end={stats.totalSellers} suffix="+" />
                ) : (
                  <span>0+</span>
                )}
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2 relative z-10">Skilled Sellers</h3>
              <p className="text-slate-500 leading-relaxed text-sm relative z-10">
                Verified and background-checked service professionals delivering top-tier service directly to your doorstep.
              </p>
            </div>

            {/* Verified Bookings */}
            <div className="bg-white border border-slate-100 rounded-3xl p-8 shadow-sm hover:shadow-2xl hover:shadow-purple-100/50 hover:-translate-y-1 transition-all duration-300 flex flex-col items-start relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-50/50 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110 duration-500" />
              <div className="w-14 h-14 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mb-6 relative z-10">
                <CheckCircle className="w-7 h-7" />
              </div>
              <div className="text-5xl font-black text-purple-600 tracking-tight mb-2 relative z-10 min-h-[3rem]">
                {!loading && stats && isVisible ? (
                  <CountUp end={stats.totalOrders} suffix="+" />
                ) : (
                  <span>0+</span>
                )}
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2 relative z-10">Verified Bookings</h3>
              <p className="text-slate-500 leading-relaxed text-sm relative z-10">
                Successfully completed bookings connecting clients with local experts for everything from plumbing to painting.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Call to Action (light theme) ── */}
      <section className="py-16 bg-slate-50/50 border-t border-slate-100 flex-grow flex items-center justify-center relative overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="relative overflow-hidden rounded-3xl bg-white border border-slate-200/80 px-8 py-12 shadow-sm sm:px-16 sm:py-16 text-center">
            <div className="relative z-10 max-w-2xl mx-auto">
              {isSeller ? (
                <>
                  <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-800 tracking-tight mb-4">
                    Manage Your Business
                  </h2>
                  <p className="text-base sm:text-lg text-slate-500 font-semibold mb-8 leading-relaxed">
                    You are already a registered partner on QuickSeva! Go to your seller dashboard to view leads, manage services, and track bookings.
                  </p>
                  <Link
                    to="/seller/dashboard"
                    className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white force-text-white font-bold px-8 py-3.5 rounded-2xl transition duration-150 shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                  >
                    Go to Dashboard
                  </Link>
                </>
              ) : (
                <>
                  <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-800 tracking-tight mb-4">
                    Ready to Grow Your Business?
                  </h2>
                  <p className="text-base sm:text-lg text-slate-500 font-semibold mb-8 leading-relaxed">
                    Join thousands of local service experts who trust QuickSeva. Setup your professional seller profile, list your services, and start receiving job requests instantly.
                  </p>
                  <Link
                    to={isAuthenticated ? "/become-seller" : "/seller-register"}
                    className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white force-text-white font-bold px-8 py-3.5 rounded-2xl transition duration-150 shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                  >
                    Become a Partner
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Dynamic recent user registration notification popup */}
      <ActivityNotification />

    </main>
  );
};


export default Home;
