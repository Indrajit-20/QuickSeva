import { useEffect, useMemo, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Clock, IndianRupee, Pencil, Plus, Trash2, CalendarDays } from "lucide-react";
import { Calendar } from "react-multi-date-picker";
import { days, formatCurrency, serviceOptions } from "./sellerData";
import {
  durationTextToMinutes,
  minutesToDurationText,
  ymdToDisplay,
} from "./SellerServicesUxs";
import { serviceService } from "../../services/serviceService";
import { useAuth } from "../../context/AuthContext";
import apiClient from "../../api/axiosConfig";

const inputClass =
  "w-full rounded-lg border border-indigo-500/20 bg-[#0f0e1a] px-3 py-2.5 text-sm font-medium text-white outline-none transition placeholder:text-slate-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20";

const labelClass = "mb-2 block text-sm font-semibold text-slate-300";

// Helper to extract YYYY-MM-DD from Date or react-multi-date-picker DateObject
const extractYMD = (dt) => {
  if (!dt) return null;
  let dateObj = dt;
  if (typeof dt.toDate === "function") {
    dateObj = dt.toDate();
  }
  if (dateObj instanceof Date) {
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, "0");
    const d = String(dateObj.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  return null;
};

export default function SellerServices() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();

  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  // Availability state (persisted in database)
  const [availableDays, setAvailableDays] = useState(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]);
  const [blackoutDates, setBlackoutDates] = useState([]);
  const [savingAvailability, setSavingAvailability] = useState(false);
  const [availError, setAvailError] = useState("");
  const [availSuccess, setAvailSuccess] = useState(false);

  // Wizard and calendar overlay state ('wizard' | 'calendar' | null)
  const [activeOverlay, setActiveOverlay] = useState(null);
  const [editingService, setEditingService] = useState(null);
  const calendarRef = useRef(null);

  const showWizard = activeOverlay === 'wizard';

  const refreshMyServices = async () => {
    try {
      setLoading(true);
      setLoadError(null);
      const res = await serviceService.getMyServices();
      setServices(res?.data?.data?.services || []);
    } catch (e) {
      setLoadError(e?.response?.data?.message || "Failed to load services");
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailability = async () => {
    try {
      const res = await apiClient.get("/sellers/me/availability");
      if (res?.data?.success) {
        setAvailableDays(res.data.data.available_days || []);
        setBlackoutDates(res.data.data.unavailable_dates || []);
      }
    } catch (err) {
      console.error("Failed to load availability:", err);
    }
  };

  useEffect(() => {
    refreshMyServices();
    fetchAvailability();
  }, []);

  const toggleWeeklyDay = (day) => {
    setAvailableDays((prev) => {
      const set = new Set(prev);
      if (set.has(day)) set.delete(day);
      else set.add(day);
      return Array.from(set);
    });
  };

  const handleSaveAvailability = async () => {
    setSavingAvailability(true);
    setAvailError("");
    setAvailSuccess(false);
    try {
      const res = await apiClient.patch("/sellers/me/availability", {
        available_days: availableDays,
        unavailable_dates: blackoutDates,
      });
      if (res?.data?.success) {
        setAvailSuccess(true);
        setTimeout(() => setAvailSuccess(false), 3000);
      }
    } catch (err) {
      setAvailError(err?.response?.data?.message || err?.message || "Failed to save availability");
    } finally {
      setSavingAvailability(false);
    }
  };

  const handleEdit = (service) => {
    setEditingService(service);
    setActiveOverlay('wizard');
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this service? / क्या आप वाकई इस सेवा को हटाना चाहते हैं?")) return;
    try {
      const res = await serviceService.deleteService(id);
      if (res?.data?.success) {
        setServices((prev) => prev.filter((s) => s.id !== id));
        // Sync services count from server response
        if (res.data?.data?.services_count !== undefined) {
          updateUser({
            services_count: res.data.data.services_count,
          });
        } else if (res.data?.services_count !== undefined) {
          updateUser({
            services_count: res.data.services_count,
          });
        }
      }
    } catch (e) {
      console.error("Failed to delete service:", e);
      alert(e?.response?.data?.message || "Failed to delete service");
    }
  };

  const handleToggleStatus = async (service) => {
    try {
      const nextActive = service.is_active === 0 ? 1 : 0;
      const res = await serviceService.updateService(service.id, {
        is_active: nextActive,
      });
      if (res?.data?.success) {
        setServices((prev) =>
          prev.map((s) => (s.id === service.id ? { ...s, is_active: nextActive } : s))
        );
      }
    } catch (e) {
      console.error("Failed to toggle service status:", e);
      alert(e?.response?.data?.message || "Failed to toggle service status");
    }
  };

  if (loading) {
    return (
      <div className="animate-fade-in space-y-6">
        <div>
          <h1 className="text-3xl font-black text-white">My Services</h1>
          <p className="mt-1 text-[#94a3b8]">
            Configure availability and manage services.
          </p>
        </div>
        <div className="text-center py-20 text-indigo-300 font-bold text-lg animate-pulse">
          🔄 Loading services / सेवाएं लोड हो रही हैं...
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-10 bottom-nav-spacer pb-20">
      {Number(user?.profile_completed ?? 0) === 1 && Number(user?.services_count ?? 0) === 0 && (
        <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-200 text-sm font-semibold flex items-center gap-3 animate-pulse">
          <span className="text-xl">⚠️</span>
          <div>
            <p className="font-bold text-amber-300">Add Your First Service / अपनी पहली सेवा जोड़ें</p>
            <p className="text-xs font-normal text-amber-200/80 mt-0.5">
              Please add at least one service below to unlock the Seller Dashboard, Orders, and Wallet pages.
            </p>
          </div>
        </div>
      )}

      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-indigo-500/10 pb-6">
        <div>
          <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-100 to-indigo-300">
            My Services / मेरी सेवाएं
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Manage your service list first, and configure availability days below.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setEditingService(null);
            setActiveOverlay('wizard');
          }}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 via-indigo-600 to-purple-600 hover:from-indigo-600 hover:via-indigo-700 hover:to-purple-700 px-6 py-3.5 text-sm font-black text-white transition hover:scale-[1.02] active:scale-95 shadow-lg shadow-indigo-500/20 cursor-pointer"
        >
          <Plus size={18} />
          Add New Service / नया काम जोड़ें
        </button>
      </div>

      {/* 1. MY SERVICES LIST - PRIMARY COMPONENT */}
      <div className="space-y-6">
        {loadError && (
          <div className="p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-200 text-sm font-semibold">
            ⚠️ {loadError}
          </div>
        )}

        {services.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-indigo-500/20 bg-[#1a1830]/40 p-12 text-center text-[#94a3b8] backdrop-blur-sm shadow-inner">
            <div className="max-w-md mx-auto space-y-5 py-4">
              <div className="flex justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-500/10 border border-indigo-500/25 text-indigo-400">
                  <Plus size={32} />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">No services added yet / कोई सेवा नहीं जोड़ी गई</h3>
                <p className="text-sm text-slate-400 mt-2">
                  You haven't listed any services. Click the button above to add your very first service.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-indigo-500/15 bg-[#16142a]/90 backdrop-blur-md shadow-2xl">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b border-indigo-500/10 bg-indigo-950/10 text-xs font-bold text-indigo-300 uppercase tracking-wider">
                  <th className="px-6 py-5">Category / प्रकार</th>
                  <th className="px-6 py-5">Service Name / नाम</th>
                  <th className="px-6 py-5">Price / रेट</th>
                  <th className="px-6 py-5">Status / स्थिति</th>
                  <th className="px-6 py-5 text-right font-black">Actions / काम</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-indigo-500/5 text-sm">
                {services.map((service) => (
                  <tr key={service.id} className="hover:bg-white/[0.01] transition-colors duration-150">
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl bg-indigo-500/10 p-2.5 rounded-xl border border-indigo-500/20 shadow-inner block">
                          {service.category_icon || "🔧"}
                        </span>
                        <div>
                          <span className="text-xs font-black text-indigo-400 uppercase tracking-wider block">
                            {service.category_name || "General"}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="max-w-xs md:max-w-md">
                        <h3 className="font-bold text-white text-base">
                          {service.title || service.name}
                        </h3>
                        {service.sub_service_name ? (
                          <span className="text-[10px] bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 mt-1 shadow-inner">
                            🎯 {service.sub_service_name}
                          </span>
                        ) : (
                          <span className="text-[10px] bg-indigo-500/5 border border-indigo-500/10 text-indigo-400 font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 mt-1 shadow-inner">
                            ✨ Custom Service / अन्य काम
                          </span>
                        )}
                        {service.description && (
                          <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                            {service.description.replace(/<[^>]*>/g, '')}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/20 bg-emerald-400/5 px-3 py-1 text-sm font-black text-emerald-300">
                        <IndianRupee size={12} />
                        {formatCurrency(service.price).replace("₹", "")}
                        {service.price_type === "hourly" ? " / hr" : ""}
                      </span>
                      <span className="text-[10px] text-indigo-300 font-semibold block mt-1">
                        {service.price_type === "fixed" ? "पक्का रेट (Fixed)" : service.price_type === "hourly" ? "प्रति घंटा (Hourly)" : "बात कर लेंगे (Discuss)"}
                      </span>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(service)}
                        className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-bold transition duration-200 active:scale-95 cursor-pointer ${
                          service.is_active !== 0
                            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20"
                            : "border-red-500/30 bg-red-500/10 text-red-300 hover:bg-red-500/20"
                        }`}
                        title="Click to toggle status / स्थिति बदलने के लिए क्लिक करें"
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${service.is_active !== 0 ? "bg-emerald-400" : "bg-red-400"}`} />
                        {service.is_active !== 0 ? "Active / चालू" : "Inactive / बंद"}
                      </button>
                    </td>
                    <td className="px-6 py-5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleEdit(service)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-400/30 bg-indigo-500/10 px-3.5 py-2 text-xs font-bold text-indigo-200 transition hover:bg-indigo-500/20 active:scale-95 cursor-pointer"
                        >
                          <Pencil size={12} />
                          Edit / सुधारें
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(service.id)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-red-400/30 bg-red-500/10 px-3.5 py-2 text-xs font-bold text-red-200 transition hover:bg-red-500/20 active:scale-95 cursor-pointer"
                        >
                          <Trash2 size={12} />
                          Delete / हटाएँ
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 2. WEEKLY AVAILABILITY & BLACKOUT DATES - SECONDARY COMPONENT (BELOW SERVICES) */}
      <div className="rounded-2xl border border-indigo-500/15 bg-[#16142a]/90 backdrop-blur-md p-6 space-y-6 shadow-2xl">
        <div className="border-b border-indigo-500/10 pb-4">
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            📅 Weekly Availability & Leave Calendar / साप्ताहिक उपलब्धता और छुट्टियां
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Configure the days and dates you are available to take customer bookings.
          </p>
        </div>

        <div className="space-y-3">
          <label className="text-sm font-bold text-slate-300 block">
            Select Active Days / काम के दिन चुनें:
          </label>
          <div className="flex flex-wrap gap-2">
            {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((day) => {
              const checked = availableDays.includes(day);
              // Translate day names for easy uneducated use
              const hindiDays = {
                Monday: "सोमवार", Tuesday: "मंगलवार", Wednesday: "बुधवार",
                Thursday: "गुरुवार", Friday: "शुक्रवार", Saturday: "शनिवार", Sunday: "रविवार"
              };
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleWeeklyDay(day)}
                  className={`cursor-pointer rounded-xl border px-4 py-3 text-xs font-black transition-all duration-200 active:scale-95 flex flex-col items-center min-w-[90px] ${
                    checked
                      ? "border-indigo-400 bg-indigo-500/20 text-white shadow-lg shadow-indigo-500/10"
                      : "border-indigo-500/10 bg-[#0f0e1a] text-[#94a3b8] hover:border-indigo-500/30"
                  }`}
                >
                  <span className="text-sm font-black">{day}</span>
                  <span className="text-[10px] font-semibold opacity-70 mt-0.5">{hindiDays[day]}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Date picker grid (moved below available days) */}
        <div className="grid gap-6 md:grid-cols-2 pt-2 border-t border-indigo-500/5">
          <div className="space-y-3">
            <label className="text-sm font-bold text-slate-300 block">
              Mark Specific Holidays / छुट्टी के दिन चुनें:
            </label>
            <div className="bg-[#0f0e1a] p-4 rounded-xl border border-indigo-500/10 flex justify-center" style={{ minHeight: "340px" }}>
              <Calendar
                ref={calendarRef}
                multiple
                value={blackoutDates.map((ymd) => {
                  const [y, m, d] = ymd.split("-").map(Number);
                  return new Date(y, m - 1, d);
                })}
                onOpen={() => {
                  if (activeOverlay !== 'wizard') {
                    setActiveOverlay('calendar');
                  }
                }}
                onClose={() => {
                  if (activeOverlay === 'calendar') {
                    setActiveOverlay(null);
                  }
                }}
                onChange={(next) => {
                  const arr = Array.isArray(next) ? next : next ? [next] : [];
                  const out = new Set();
                  for (const item of arr) {
                    const asYmd = extractYMD(item);
                    if (asYmd) out.add(asYmd);
                  }
                  const uniq = Array.from(out).sort();
                  setBlackoutDates(uniq);
                }}
                className="qs-date-picker"
                calendarClassName="qs-date-picker__calendar"
                containerClassName="qs-date-picker__container"
                placeholder="Select unavailable dates"
              />
            </div>
          </div>

          <div className="space-y-3 flex flex-col justify-between">
            <div>
              <label className="text-sm font-bold text-slate-300 block mb-1">
                Leave Calendar / छुट्टी की सूची:
              </label>
              {(blackoutDates || []).length === 0 ? (
                <div className="rounded-xl border border-dashed border-indigo-500/10 bg-[#0f0e1a] p-5 text-center text-xs text-[#94a3b8] font-medium leading-relaxed">
                  No holidays marked yet. Tapping dates on the calendar will add leaves.
                  <br /><span className="text-[10px] text-slate-500">(कोई छुट्टी नहीं चुनी गई है। कैलेंडर पर तारीख दबाएं)</span>
                </div>
              ) : (
                <div className="max-h-[180px] overflow-y-auto space-y-2 pr-1">
                  {blackoutDates.map((ymd) => (
                    <div
                      key={ymd}
                      className="flex items-center justify-between gap-3 rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2"
                    >
                      <span className="text-xs font-bold text-red-200">
                        ❌ {ymdToDisplay(ymd)}
                      </span>
                      <button
                        type="button"
                        onClick={() => setBlackoutDates(prev => prev.filter(d => d !== ymd))}
                        className="rounded-md border border-red-500/20 bg-red-500/10 px-2 py-1 text-[10px] font-bold text-red-200 transition hover:bg-red-500/20 cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {(blackoutDates || []).length > 0 && (
              <button
                type="button"
                onClick={() => setBlackoutDates([])}
                className="w-full py-2 text-center rounded-lg border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-xs font-bold text-red-300 transition duration-150 active:scale-95 cursor-pointer"
              >
                Clear All Leaves / सभी छुट्टियां हटाएं
              </button>
            )}
          </div>
        </div>

        {/* Save Availability Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-indigo-500/10">
          <div>
            {availError && (
              <p className="text-xs font-semibold text-red-400">⚠️ {availError}</p>
            )}
            {availSuccess && (
              <p className="text-xs font-semibold text-emerald-400">✓ Availability settings saved / उपलब्धता सुरक्षित की गई</p>
            )}
          </div>
          <button
            type="button"
            disabled={savingAvailability}
            onClick={handleSaveAvailability}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black px-6 py-3 text-sm transition-all duration-200 active:scale-95 disabled:opacity-50 shadow-lg shadow-indigo-500/20 cursor-pointer"
          >
            {savingAvailability ? "Saving Settings..." : "Save Availability / उपलब्धता सुरक्षित करें"}
          </button>
        </div>
      </div>

      {/* Wizard Modal Overlay */}
      {showWizard && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-xl bg-[#17152b] rounded-3xl border border-[rgba(99,102,241,0.25)] shadow-2xl p-6 my-8 max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => {
                setActiveOverlay(null);
                setEditingService(null);
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition text-lg font-bold p-1 bg-white/5 rounded-full hover:bg-white/10 w-8 h-8 flex items-center justify-center cursor-pointer"
            >
              ✕
            </button>
            <AddServiceWizard
              user={user}
              updateUser={updateUser}
              editingService={editingService}
              onCancel={() => {
                setActiveOverlay(null);
                setEditingService(null);
              }}
              onSuccess={async () => {
                setActiveOverlay(null);
                setEditingService(null);
                await refreshMyServices();
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function AddServiceWizard({ onCancel, onSuccess, user, updateUser, editingService }) {
  // If editing, start at Step 3 (Pricing) directly, but let them go back to Step 2/1 if needed
  const [step, setStep] = useState(editingService ? 3 : 1);
  const [categories, setCategories] = useState([]);
  const [loadingCats, setLoadingCats] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(null);

  // Sub-services states
  const [subServices, setSubServices] = useState([]);
  const [loadingSubServices, setLoadingSubServices] = useState(false);
  const [selectedSubService, setSelectedSubService] = useState(null);
  const [subServicesError, setSubServicesError] = useState("");

  // Step 3 (Price & type)
  const [price, setPrice] = useState(editingService ? Number(editingService.price) : 500);
  const [priceType, setPriceType] = useState(editingService ? editingService.price_type : "fixed");

  // Step 4 (Title & details)
  const [title, setTitle] = useState(editingService ? (editingService.title || editingService.name) : "");
  const [description, setDescription] = useState(editingService ? editingService.description || "" : "");

  // Step 5 (Submit state)
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [success, setSuccess] = useState(false);

  // 1. Fetch categories
  useEffect(() => {
    let isMounted = true;
    const fetchCats = async () => {
      try {
        const res = await apiClient.get("/sellers/me/categories");
        if (isMounted) {
          const cats = res?.data?.data?.categories || [];
          setCategories(cats);
          if (editingService) {
            const matchedCat = cats.find((c) => c.id === editingService.category_id);
            if (matchedCat) {
              setSelectedCategory(matchedCat);
            }
          }
        }
      } catch (err) {
        console.error("Failed to load seller categories:", err);
      } finally {
        if (isMounted) setLoadingCats(false);
      }
    };
    fetchCats();
    return () => {
      isMounted = false;
    };
  }, [editingService]);

  // 2. Fetch sub-services for selected category
  useEffect(() => {
    if (!selectedCategory) {
      setSubServices([]);
      return;
    }
    let isMounted = true;
    const fetchSubs = async () => {
      setLoadingSubServices(true);
      setSubServicesError("");
      try {
        const res = await apiClient.get(`/services/sub-services/${selectedCategory.id}`);
        if (isMounted) {
          const subs = res?.data?.data?.sub_services || [];
          setSubServices(subs);
          
          if (editingService && editingService.sub_service_id) {
            const matchedSub = subs.find(s => s.id === editingService.sub_service_id);
            if (matchedSub) {
              setSelectedSubService(matchedSub);
            }
          }
        }
      } catch (err) {
        console.error("Failed to fetch sub-services:", err);
        if (isMounted) setSubServicesError("Failed to fetch sub-services");
      } finally {
        if (isMounted) setLoadingSubServices(false);
      }
    };
    fetchSubs();
    return () => {
      isMounted = false;
    };
  }, [selectedCategory, editingService]);

  const handleCategorySelect = (cat) => {
    setSelectedCategory(cat);
    // Move to step 2 (subservice selection)
    setStep(2);
  };

  const handleSubServiceSelect = (subService) => {
    setSelectedSubService(subService);
    if (subService) {
      // Auto-prepopulate fields from sub-service
      const englishName = subService.name.split("/")[0].trim();
      setTitle(englishName);
      setDescription(subService.description || "");
      if (subService.default_price) {
        setPrice(Math.round(Number(subService.default_price)));
      }
    }
    setStep(3);
  };

  const handleCustomServiceSelect = () => {
    setSelectedSubService(null);
    if (!editingService) {
      setTitle(selectedCategory.name + " Service");
      setDescription("");
      setPrice(500);
    }
    setStep(3);
  };

  const handlePriceTypeSelect = (type) => {
    setPriceType(type);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError("");
    try {
      const payload = {
        category_id: selectedCategory.id,
        sub_service_id: selectedSubService?.id || null,
        title: title || (selectedCategory.name + " Service"),
        description: description || null,
        price,
        price_type: priceType,
      };
      
      if (editingService) {
        const res = await serviceService.updateService(editingService.id, payload);
        if (res?.data?.success) {
          setSuccess(true);
        } else {
          setSubmitError(res?.data?.message || "Failed to update service");
        }
      } else {
        const res = await serviceService.createService(payload);
        if (res?.data?.success) {
          updateUser({
            services_count: (user?.services_count || 0) + 1,
          });
          setSuccess(true);
        } else {
          setSubmitError(res?.data?.message || "Failed to add service");
        }
      }
    } catch (err) {
      setSubmitError(err?.response?.data?.message || err?.message || "Failed to save service");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setStep(1);
    setSelectedCategory(null);
    setSelectedSubService(null);
    setPrice(500);
    setPriceType("fixed");
    setTitle("");
    setDescription("");
    setSuccess(false);
    setSubmitError("");
  };

  // Get description templates/suggestions based on selected category to aid uneducated users
  const getSuggestions = (catName) => {
    const lower = catName?.toLowerCase() || "";
    if (lower.includes("plumb")) {
      return [
        "Repair leaking taps & pipes / बहते नल और पाइप ठीक करना",
        "Washbasin and kitchen sink repair / वाशबेसिन और सिंक मरम्मत",
        "Toilet flush valve repair / टॉयलेट फ्लश ठीक करना",
        "Full water tank cleaning / पानी की टंकी की पूरी सफाई"
      ];
    }
    if (lower.includes("electri")) {
      return [
        "Ceiling fan & light fitting / पंखा और लाइट लगाना",
        "Switchboard & socket repair / स्विचबोर्ड और बटन मरम्मत",
        "House short circuit repair / शॉर्ट सर्किट की जांच और रिपेयर",
        "Complete new house wiring / पूरे घर की नई वायरिंग"
      ];
    }
    if (lower.includes("ac")) {
      return [
        "AC service & deep cleaning / एसी की सर्विस और धुलाई",
        "AC gas recharge & cooling repair / एसी गैस रिफिल और कूलिंग ठीक करना",
        "AC install & uninstall / एसी लगाना या हटाना",
        "AC compressor error repair / एसी कंप्रेसर खराबी ठीक करना"
      ];
    }
    if (lower.includes("clean")) {
      return [
        "Deep home cleaning service / पूरे घर की गहरी सफाई",
        "Bathroom & tiles stain cleaning / बाथरूम और टाइल्स की धुलाई",
        "Sofa & carpet dry wash / सोफा और कालीन की ड्राई क्लीनिंग",
        "Kitchen chimney oil cleaning / रसोई की चिमनी की सफाई"
      ];
    }
    if (lower.includes("carpent")) {
      return [
        "Door lock & latch repair / दरवाजे का ताला और कुंडी लगाना",
        "Bed & dining table assembly / बेड और मेज मरम्मत या फिटिंग",
        "Cabinet hinges & drawer repair / अलमारी के कब्जे और दराज रिपेयर",
        "Wooden furniture polishing / लकड़ी के फर्नीचर की पॉलिश"
      ];
    }
    if (lower.includes("paint")) {
      return [
        "Single wall texturing & painting / दीवार की पुताई और पेंट",
        "Complete home wall painting / पूरे घर की पुताई",
        "Wall dampness waterproofing / सीलन और वॉटरप्रूफिंग",
        "Wooden door varnish & polish / लकड़ी की पॉलिश और पेंट"
      ];
    }
    return [
      "Professional service / प्रोफेशनल सर्विस",
      "Satisfactory work guaranteed / बढ़िया और पक्का काम",
      "No extra charge / कोई अतिरिक्त चार्ज नहीं"
    ];
  };

  const suggestions = useMemo(() => {
    return getSuggestions(selectedCategory?.name || "");
  }, [selectedCategory]);

  const priceTypeLabels = {
    fixed: "Fixed Price / पक्का रेट",
    hourly: "Per Hour / प्रति घंटा",
    negotiable: "Can Discuss / बात कर लेंगे",
  };

  if (success) {
    return (
      <div className="text-center py-6 space-y-6 animate-fade-in">
        <div className="flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10 border-2 border-emerald-500/40 text-4xl text-emerald-400">
            ✓
          </div>
        </div>
        <div>
          <h2 className="text-2xl font-black text-white">
            {editingService ? "Service Updated! / काम अपडेट हुआ!" : "Service Added! / नया काम जुड़ गया!"}
          </h2>
          <p className="mt-2 text-slate-300 font-bold text-sm">
            {editingService 
              ? "Your service has been successfully updated." 
              : "Your service has been successfully created."}
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center pt-4">
          {!editingService && (
            <button
              type="button"
              onClick={handleReset}
              className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black px-6 py-3 transition hover:scale-[1.01] active:scale-95 text-sm cursor-pointer"
            >
              Add Another Service / दूसरा काम जोड़ें
            </button>
          )}
          <button
            type="button"
            onClick={onSuccess}
            className="rounded-xl border border-indigo-400/30 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-200 font-black px-6 py-3 transition hover:scale-[1.01] active:scale-95 text-sm cursor-pointer"
          >
            Go to My Services / मेरी सेवाएं देखें
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Step Progress Bar (5 Steps!) */}
      <div className="flex items-center justify-between mb-6">
        {[1, 2, 3, 4, 5].map((s) => (
          <div key={s} className="flex items-center grow last:grow-0">
            <button
              type="button"
              disabled={step < s && !editingService}
              onClick={() => setStep(s)}
              className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-black transition-all ${
                step === s
                  ? "bg-indigo-600 border border-indigo-400 text-white ring-4 ring-indigo-500/20"
                  : step > s
                  ? "bg-emerald-500 text-white"
                  : "bg-[#0f0e1a] border border-indigo-500/20 text-slate-500"
              }`}
            >
              {step > s ? "✓" : s}
            </button>
            {s < 5 && (
              <div
                className={`h-0.5 grow mx-2 transition-all ${
                  step > s ? "bg-emerald-500" : "bg-indigo-500/10"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* STEP 1: CATEGORY SELECTION */}
      {step === 1 && (
        <div className="space-y-6 animate-fade-in">
          <div className="text-center">
            <h2 className="text-2xl font-black text-white">What service do you provide? / आपका मुख्य काम क्या है?</h2>
            <p className="mt-1 text-sm text-slate-400">Select your category below / नीचे अपनी काम की श्रेणी चुनें</p>
          </div>

          {loadingCats ? (
            <div className="text-center py-12 text-indigo-300 font-bold animate-pulse">Loading categories / श्रेणियां लोड हो रही हैं...</div>
          ) : categories.length === 0 ? (
            <div className="text-center py-12 text-red-300 font-bold">No categories found / कोई श्रेणी नहीं मिली।</div>
          ) : (
            <div className="grid grid-cols-2 gap-4 max-h-[350px] overflow-y-auto pr-1">
              {categories.map((cat) => {
                const isSelected = selectedCategory?.id === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleCategorySelect(cat)}
                    className={`flex flex-col items-center justify-center gap-3 rounded-2xl border p-5 text-center transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer ${
                      isSelected
                        ? "border-indigo-400 bg-indigo-500/25 text-white ring-2 ring-indigo-500/40"
                        : "border-indigo-500/20 bg-[#0f0e1a] text-slate-300 hover:border-indigo-400/60 hover:bg-indigo-500/5"
                    }`}
                  >
                    <span className="text-4xl">{cat.icon || "🔧"}</span>
                    <span className="text-base font-bold">{cat.name}</span>
                  </button>
                );
              })}
            </div>
          )}

          <div className="flex justify-end pt-4 border-t border-indigo-500/10">
            <button
              type="button"
              onClick={onCancel}
              className="px-5 py-2.5 rounded-xl border border-slate-500/30 text-slate-300 hover:bg-white/5 font-black transition text-sm active:scale-95 cursor-pointer"
            >
              Cancel / रद्द करें
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: SUB-SERVICE SELECTION */}
      {step === 2 && (
        <div className="space-y-6 animate-fade-in">
          <div className="text-center">
            <h2 className="text-2xl font-black text-white">Select Specific Work / काम का प्रकार चुनें</h2>
            <p className="mt-1 text-sm text-slate-400">Choose what specific service you are listing / आप क्या सेवा देना चाहते हैं</p>
          </div>

          {loadingSubServices ? (
            <div className="text-center py-12 text-indigo-300 font-bold animate-pulse">Loading parts / काम के हिस्से लोड हो रहे हैं...</div>
          ) : subServicesError ? (
            <div className="text-center py-8 text-red-300 font-bold">{subServicesError}</div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-3 max-h-[300px] overflow-y-auto pr-1">
                {subServices.map((sub) => {
                  const isSelected = selectedSubService?.id === sub.id;
                  const [engPart, hinPart] = sub.name.split("/");
                  return (
                    <button
                      key={sub.id}
                      type="button"
                      onClick={() => handleSubServiceSelect(sub)}
                      className={`flex flex-col items-start gap-1 rounded-xl border p-4 text-left transition-all duration-150 hover:scale-[1.01] active:scale-[0.99] cursor-pointer ${
                        isSelected
                          ? "border-indigo-400 bg-indigo-500/25 text-white ring-2 ring-indigo-500/40"
                          : "border-indigo-500/10 bg-[#0f0e1a] text-slate-300 hover:border-indigo-400/40 hover:bg-indigo-500/5"
                      }`}
                    >
                      <span className="text-sm font-black text-white">
                        {engPart?.trim()}
                      </span>
                      {hinPart && (
                        <span className="text-xs font-semibold text-indigo-300">
                          {hinPart.trim()}
                        </span>
                      )}
                      {sub.description && (
                        <span className="text-xs text-slate-400 mt-1 block">
                          {sub.description}
                        </span>
                      )}
                      {sub.default_price && (
                        <span className="text-[10px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-bold mt-2">
                          Preset / सुझाया रेट: ₹{Math.round(Number(sub.default_price))}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Custom / General service option */}
              <div className="border-t border-indigo-500/10 pt-3 flex flex-col gap-2">
                <p className="text-xs font-bold text-slate-400 text-center uppercase tracking-widest">Or list another service / या अन्य कोई काम</p>
                <button
                  type="button"
                  onClick={handleCustomServiceSelect}
                  className="w-full py-4 px-4 rounded-xl border border-dashed border-indigo-400/30 hover:border-indigo-400/60 bg-indigo-500/5 hover:bg-indigo-500/10 transition text-center text-sm font-black text-indigo-300 active:scale-95 cursor-pointer"
                >
                  ➕ Custom Service / अन्य सामान्य काम
                </button>
              </div>
            </div>
          )}

          <div className="flex justify-between pt-4 border-t border-indigo-500/10">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2.5 rounded-xl border border-red-500/30 text-red-300 hover:bg-red-500/10 font-bold transition text-xs active:scale-95 cursor-pointer"
              >
                Cancel / रद्द करें
              </button>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-5 py-2.5 rounded-xl border border-slate-500/30 text-slate-300 hover:bg-white/5 font-black transition text-sm active:scale-95 cursor-pointer"
              >
                Back / पीछे
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: PRICING DETAILS */}
      {step === 3 && (
        <div className="space-y-6 animate-fade-in">
          <div className="text-center">
            <h2 className="text-2xl font-black text-white">What do you charge? / आप कितने पैसे लेंगे?</h2>
            <p className="mt-1 text-sm text-slate-400">Set your pricing details below / अपना काम का दाम तय करें</p>
          </div>

          <div className="flex flex-col items-center justify-center gap-3 py-4 bg-[#0f0e1a]/50 rounded-2xl border border-indigo-500/5">
            <span className="text-xs font-black text-[#94a3b8] tracking-widest">PRICE / रेट</span>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setPrice((p) => Math.max(50, p - 50))}
                className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 hover:bg-indigo-700 text-xl font-black text-white transition hover:scale-105 active:scale-95 shadow-lg shadow-indigo-500/20 cursor-pointer"
              >
                -
              </button>
              <div className="flex items-center bg-[#0f0e1a] border border-indigo-500/20 rounded-xl px-4 py-2">
                <span className="text-2xl font-bold text-indigo-300 mr-1">₹</span>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(Math.max(1, parseInt(e.target.value) || 0))}
                  className="w-28 text-center text-3xl font-black bg-transparent text-white outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>
              <button
                type="button"
                onClick={() => setPrice((p) => p + 50)}
                className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 hover:bg-indigo-700 text-xl font-black text-white transition hover:scale-105 active:scale-95 shadow-lg shadow-indigo-500/20 cursor-pointer"
              >
                +
              </button>
            </div>

            {/* Quick Price Preset Buttons (Highly Accessible) */}
            <div className="mt-3 flex flex-wrap justify-center gap-2 px-4 max-w-sm">
              {[100, 200, 350, 500, 800, 1000, 1500, 2000].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setPrice(preset)}
                  className={`px-3 py-2 text-xs font-black rounded-lg border transition duration-150 active:scale-95 cursor-pointer ${
                    price === preset
                      ? "border-emerald-400 bg-emerald-500/20 text-emerald-300"
                      : "border-indigo-500/10 bg-[#0f0e1a] text-slate-400 hover:border-indigo-500/30"
                  }`}
                >
                  ₹{preset}
                </button>
              ))}
            </div>
          </div>

          {/* Pricing Method Selection */}
          <div className="space-y-3">
            <span className="block text-center text-xs font-black text-[#94a3b8] tracking-widest uppercase">Charging Method / पैसा लेने का तरीका</span>
            <div className="grid grid-cols-3 gap-3">
              {[
                { type: "fixed", label: "Fixed", hindi: "पक्का रेट" },
                { type: "hourly", label: "Hourly", hindi: "प्रति घंटा" },
                { type: "negotiable", label: "Discuss", hindi: "बात कर लेंगे" },
              ].map((opt) => {
                const checked = priceType === opt.type;
                return (
                  <button
                    key={opt.type}
                    type="button"
                    onClick={() => handlePriceTypeSelect(opt.type)}
                    className={`rounded-xl border p-4 text-xs font-black transition-all duration-150 text-center flex flex-col items-center justify-center gap-1 active:scale-95 cursor-pointer ${
                      checked
                        ? "border-indigo-400 bg-indigo-500/20 text-white shadow-lg shadow-indigo-500/10"
                        : "border-indigo-500/10 bg-[#0f0e1a] text-slate-400 hover:border-indigo-400/40"
                    }`}
                  >
                    <span className="text-sm font-black">{opt.label}</span>
                    <span className="text-[10px] font-semibold opacity-80">{opt.hindi}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex justify-between pt-6 border-t border-indigo-500/10">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2.5 rounded-xl border border-red-500/30 text-red-300 hover:bg-red-500/10 font-bold transition text-xs active:scale-95 cursor-pointer"
              >
                Cancel / रद्द करें
              </button>
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-5 py-2.5 rounded-xl border border-slate-500/30 text-slate-300 hover:bg-white/5 font-black transition text-sm active:scale-95 cursor-pointer"
              >
                Back / पीछे
              </button>
            </div>
            <button
              type="button"
              onClick={() => setStep(4)}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black transition text-sm hover:scale-[1.01] active:scale-95 cursor-pointer"
            >
              Next / आगे बढ़ें
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: TITLE & DESCRIPTION DETAILS */}
      {step === 4 && (
        <div className="space-y-6 animate-fade-in">
          <div className="text-center">
            <h2 className="text-2xl font-black text-white">Add details / काम की जानकारी दें</h2>
            <p className="mt-1 text-sm text-slate-400">Describe what you do for customers / ग्राहकों को समझाने के लिए विवरण लिखें</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-bold text-slate-300">Service Title / काम का नाम</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="E.g. Tap repair, Fan fitting / जैसे: नल रिपेयर, पंखा लगाना"
                className="w-full rounded-xl border border-indigo-500/20 bg-[#0f0e1a] px-4 py-3.5 text-sm text-white outline-none transition focus:border-indigo-500 placeholder:text-slate-500 font-semibold"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                💡 You can type in English, Hindi, or your preferred language / आप इसे इंग्लिश, हिंदी या अपनी भाषा में लिख सकते हैं
              </span>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-bold text-slate-300">Description / जानकारी विवरण</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Write service details here... / यहाँ काम की जानकारी लिखें..."
                rows="3"
                className="w-full rounded-xl border border-indigo-500/20 bg-[#0f0e1a] px-4 py-3 text-sm text-white outline-none transition focus:border-indigo-500 resize-none placeholder:text-slate-500 font-medium"
              />
            </div>

            {/* Tap suggestions to auto-fill description */}
            <div className="space-y-2">
              <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest block">Quick Suggestions / एक बार छूकर विवरण भरें:</span>
              <div className="flex flex-wrap gap-2">
                {suggestions.map((sug, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setDescription((prev) => {
                        const cleanStr = prev ? prev.trim() : "";
                        if (cleanStr.includes(sug)) return prev; // Avoid repeats
                        return cleanStr ? `${cleanStr}\n• ${sug}` : `• ${sug}`;
                      });
                    }}
                    className="text-[11px] font-bold border border-indigo-500/10 bg-indigo-500/5 hover:bg-indigo-500/15 text-indigo-300 px-3 py-1.5 rounded-lg transition text-left cursor-pointer active:scale-95"
                  >
                    💡 {sug}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-between pt-6 border-t border-indigo-500/10">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2.5 rounded-xl border border-red-500/30 text-red-300 hover:bg-red-500/10 font-bold transition text-xs active:scale-95 cursor-pointer"
              >
                Cancel / रद्द करें
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="px-5 py-2.5 rounded-xl border border-slate-500/30 text-slate-300 hover:bg-white/5 font-black transition text-sm active:scale-95 cursor-pointer"
              >
                Back / पीछे
              </button>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setDescription("");
                  setStep(5);
                }}
                className="px-5 py-2.5 rounded-xl border border-indigo-400/25 bg-indigo-500/5 text-indigo-200 font-black transition text-sm hover:bg-indigo-500/15 active:scale-95 cursor-pointer"
              >
                Clear Details / विवरण हटाएं
              </button>
              <button
                type="button"
                onClick={() => setStep(5)}
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black transition text-sm hover:scale-[1.01] active:scale-95 cursor-pointer"
              >
                Next / आगे बढ़ें
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 5: REVIEW & CONFIRM */}
      {step === 5 && (
        <div className="space-y-6 animate-fade-in">
          <div className="text-center">
            <h2 className="text-2xl font-black text-white">Confirm & Submit / पुष्टि करें</h2>
            <p className="mt-1 text-sm text-slate-400">Please review your service offer / अपनी सेवा की जांच करें</p>
          </div>

          <div className="rounded-2xl border border-indigo-400/30 bg-[#0f0e1a] p-5 space-y-4 shadow-inner">
            <div className="flex items-center gap-3">
              <span className="text-4xl bg-indigo-500/10 p-3 rounded-xl border border-indigo-500/20 shadow-inner block">
                {selectedCategory?.icon || "🔧"}
              </span>
              <div>
                <span className="text-[10px] font-black text-indigo-400 block uppercase tracking-widest">
                  {selectedCategory?.name}
                </span>
                <span className="text-lg font-black text-white block mt-0.5">
                  {title || (selectedCategory?.name + " Service")}
                </span>
                {selectedSubService ? (
                  <span className="text-[10px] bg-indigo-500/20 text-indigo-200 font-bold px-2 py-0.5 rounded-full inline-block mt-1">
                    🎯 {selectedSubService.name.split("/")[0].trim()}
                  </span>
                ) : (
                  <span className="text-[10px] bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 font-bold px-2 py-0.5 rounded-full inline-block mt-1 shadow-inner">
                    ✨ Custom Service / अन्य काम
                  </span>
                )}
              </div>
            </div>

            <div className="border-t border-indigo-500/10 pt-4 flex justify-between items-center text-sm font-semibold">
              <span className="text-slate-400">Price Details / सेवा का रेट:</span>
              <span className="text-base font-black text-white bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-lg text-emerald-300">
                ₹{price} ({priceTypeLabels[priceType]})
              </span>
            </div>

            {description && (
              <div className="border-t border-indigo-500/10 pt-4">
                <span className="text-xs font-black text-slate-500 block uppercase mb-1 tracking-wider">Details / सेवा का विवरण</span>
                <p className="text-xs text-slate-300 font-medium whitespace-pre-wrap leading-relaxed bg-[#16142a]/30 p-3 rounded-xl border border-indigo-500/5">{description}</p>
              </div>
            )}
          </div>

          {submitError && (
            <div className="p-3 bg-red-500/15 border border-red-500/30 rounded-xl text-red-200 text-xs font-semibold">
              ⚠️ {submitError}
            </div>
          )}

          <div className="flex justify-between pt-6 border-t border-indigo-500/10">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2.5 rounded-xl border border-red-500/30 text-red-300 hover:bg-red-500/10 font-bold transition text-xs active:scale-95 cursor-pointer"
              >
                Cancel / रद्द करें
              </button>
              <button
                type="button"
                onClick={() => setStep(4)}
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl border border-slate-500/30 text-slate-300 hover:bg-white/5 font-black transition text-sm disabled:opacity-50 active:scale-95 cursor-pointer"
              >
                Back / पीछे
              </button>
            </div>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-black transition text-sm hover:scale-[1.01] active:scale-95 disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-indigo-500/25 cursor-pointer"
            >
              {isSubmitting 
                ? (editingService ? "Updating..." : "Adding...") 
                : (editingService ? "Update Service / सुरक्षित करें" : "Add Service / सेवा जोड़ें")}
            </button>
          </div>
        </div>
      )}
      <div className="h-28" />
    </div>
  );
}
