import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import apiClient from "../api/axiosConfig";

const FALLBACK_ACTIVITIES = [
  { name: "Sai Barath", role: "seller", category_name: "Civil Contractor", city: "Kanchipuram", created_at: new Date(Date.now() - 6 * 3600 * 1000).toISOString() },
  { name: "Amit Kumar", role: "buyer", category_name: null, city: "Pune", created_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString() },
  { name: "Rajesh Sharma", role: "seller", category_name: "Electrician", city: "Mumbai", created_at: new Date(Date.now() - 45 * 60 * 1000).toISOString() },
  { name: "Priya Patel", role: "buyer", category_name: null, city: "Ahmedabad", created_at: new Date(Date.now() - 15 * 60 * 1000).toISOString() },
  { name: "Suresh Rao", role: "seller", category_name: "Plumber", city: "Bengaluru", created_at: new Date(Date.now() - 12 * 3600 * 1000).toISOString() },
  { name: "Meera Nair", role: "seller", category_name: "Beautician", city: "Kochi", created_at: new Date(Date.now() - 8 * 3600 * 1000).toISOString() }
];

const timeAgo = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);

  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? "s" : ""} ago`;
};

const ActivityNotification = () => {
  const [activities, setActivities] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [isClosed, setIsClosed] = useState(false);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const response = await apiClient.get("/nearby/activities");
        if (response.data && response.data.success && response.data.data) {
          const fetched = response.data.data.activities || [];
          // Deduplicate fallback activities so it looks organic
          const combined = [...fetched];
          FALLBACK_ACTIVITIES.forEach((fb) => {
            if (!combined.some((item) => item.name === fb.name)) {
              combined.push(fb);
            }
          });
          setActivities(combined);
        } else {
          setActivities(FALLBACK_ACTIVITIES);
        }
      } catch (error) {
        console.error("Error fetching activities:", error);
        setActivities(FALLBACK_ACTIVITIES);
      }
    };
    fetchActivities();
  }, []);

  useEffect(() => {
    if (activities.length === 0 || isClosed) return;

    // Show first popup after 3 seconds
    const startTimer = setTimeout(() => {
      setIsVisible(true);
    }, 3000);

    return () => clearTimeout(startTimer);
  }, [activities, isClosed]);

  useEffect(() => {
    if (activities.length === 0 || isClosed) return;

    let timer;
    if (isVisible) {
      // Stay visible for 6 seconds, then fade/slide out
      timer = setTimeout(() => {
        setIsVisible(false);
        // Increment index after sliding out finishes (0.5s transition time)
        setTimeout(() => {
          setCurrentIndex((prev) => (prev + 1) % activities.length);
        }, 500);
      }, 6000);
    } else {
      // Wait for 8 seconds before sliding in the next activity
      timer = setTimeout(() => {
        setIsVisible(true);
      }, 8000);
    }

    return () => clearTimeout(timer);
  }, [isVisible, activities, currentIndex, isClosed]);

  if (activities.length === 0 || isClosed) return null;

  const current = activities[currentIndex];
  const initials = current.name
    ? current.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "QS";

  // Palette generator based on initials for avatar backgrounds
  const getAvatarBg = (nameStr) => {
    const charSum = nameStr.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
    const colors = [
      { bg: "bg-indigo-50 border-indigo-100 text-indigo-600" },
      { bg: "bg-emerald-50 border-emerald-100 text-emerald-600" },
      { bg: "bg-purple-50 border-purple-100 text-purple-600" },
      { bg: "bg-pink-50 border-pink-100 text-pink-600" },
      { bg: "bg-sky-50 border-sky-100 text-sky-600" }
    ];
    return colors[charSum % colors.length].bg;
  };

  const avatarStyles = getAvatarBg(current.name || "QuickSeva");

  return (
    <div
      className={`fixed bottom-6 left-6 z-50 bg-white/95 backdrop-blur-md border border-slate-100 rounded-3xl p-4 shadow-2xl flex items-center gap-4 max-w-sm transition-all duration-500 ease-out transform ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10 pointer-events-none"
      }`}
      style={{
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.15), 0 10px 20px -10px rgba(0, 0, 0, 0.1)"
      }}
    >
      {/* Avatar Circle with initials */}
      <div className={`w-12 h-12 rounded-full border-2 font-extrabold flex items-center justify-center text-sm flex-shrink-0 ${avatarStyles}`}>
        {initials}
      </div>

      {/* Info Body */}
      <div className="flex flex-col pr-5">
        <div className="font-bold text-slate-800 text-sm leading-tight flex items-center flex-wrap gap-1.5">
          <span>{current.name}</span>
          {current.role === "seller" && (
            <span className="text-[10px] text-indigo-600 font-semibold bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
              {current.category_name || "Partner"}
            </span>
          )}
        </div>
        <div className="text-xs text-slate-500 mt-1 leading-snug">
          Registered from <span className="font-semibold text-slate-700">{current.city || "India"}</span>
        </div>
        <div className="text-[10px] text-slate-400 mt-1.5 font-medium">
          {timeAgo(current.created_at)}
        </div>
      </div>

      {/* Manual close x button */}
      <button
        onClick={() => setIsClosed(true)}
        className="absolute top-2 right-2 text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-50 transition-colors"
        aria-label="Dismiss notification"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

export default ActivityNotification;
