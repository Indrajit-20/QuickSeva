import { useEffect, useMemo, useState, useRef } from "react";
import { Clock, IndianRupee, Pencil, Plus, Trash2 } from "lucide-react";
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
    if (calendarRef.current) {
      calendarRef.current.closeCalendar();
    }
    setEditingService(service);
    setActiveOverlay('wizard');
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this service?")) return;
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

  if (loading) {
    return (
      <div className="animate-fade-in space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white">My Services</h1>
          <p className="mt-1 text-[#94a3b8]">
            Configure availability and manage services.
          </p>
        </div>
        <div className="text-center py-12 text-indigo-300 font-semibold">
          Loading services...
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-8">
      {Number(user?.profile_completed ?? 0) === 1 && Number(user?.services_count ?? 0) === 0 && (
        <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-200 text-sm font-semibold flex items-center gap-3 animate-pulse">
          <span className="text-xl">⚠️</span>
          <div>
            <p className="font-bold text-amber-300">Add Your First Service</p>
            <p className="text-xs font-normal text-amber-200/80 mt-0.5">
              Please add at least one service below to unlock the Seller Dashboard, Orders, and Wallet pages.
            </p>
          </div>
        </div>
      )}

      <div>
        <h1 className="text-3xl font-bold text-white">My Services</h1>
        <p className="mt-1 text-[#94a3b8]">
          Configure weekly availability, blackout dates, and manage your service list.
        </p>
      </div>

      {/* Availability Section */}
      <div className="rounded-xl border border-[rgba(99,102,241,0.2)] bg-[#1a1830] p-6 space-y-6">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            📅 Weekly Availability & Blackout Dates
          </h2>
          <p className="text-xs text-[#94a3b8] mt-1">
            Configure the days and dates you are generally available to take bookings.
          </p>
        </div>

        <div className="space-y-3">
          <label className="text-sm font-semibold text-slate-300 block">
            Select Available Days:
          </label>
          <div className="flex flex-wrap gap-2">
            {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((day) => {
              const checked = availableDays.includes(day);
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleWeeklyDay(day)}
                  className={`cursor-pointer rounded-lg border px-4 py-2.5 text-xs font-bold transition-all duration-200 active:scale-95 ${
                    checked
                      ? "border-indigo-400 bg-indigo-500/20 text-white shadow-lg shadow-indigo-500/10"
                      : "border-indigo-500/20 bg-[#0f0e1a] text-[#94a3b8] hover:border-indigo-500/40"
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 pt-2">
          <div className="space-y-3">
            <label className="text-sm font-semibold text-slate-300 block">
              Mark Dates You're Unavailable (Blackout/Leave):
            </label>
            <div className="bg-[#0f0e1a] p-4 rounded-xl border border-indigo-500/20 flex justify-center">
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
              <label className="text-sm font-semibold text-slate-300 block mb-1">
                Unavailable Dates List:
              </label>
              {(blackoutDates || []).length === 0 ? (
                <div className="rounded-xl border border-dashed border-indigo-500/10 bg-[#0f0e1a] p-4 text-center text-xs text-[#94a3b8] font-medium">
                  No blackout dates selected.
                </div>
              ) : (
                <div className="max-h-[180px] overflow-y-auto space-y-2 pr-1">
                  {blackoutDates.map((ymd) => (
                    <div
                      key={ymd}
                      className="flex items-center justify-between gap-3 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2"
                    >
                      <span className="text-xs font-bold text-red-200">
                        ❌ {ymdToDisplay(ymd)}
                      </span>
                      <button
                        type="button"
                        onClick={() => setBlackoutDates(prev => prev.filter(d => d !== ymd))}
                        className="rounded-md border border-red-500/20 bg-red-500/10 px-2 py-1 text-[10px] font-bold text-red-200 transition hover:bg-red-500/20"
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
                className="w-full py-2 text-center rounded-lg border border-red-500/30 bg-red-500/5 hover:bg-red-500/10 text-xs font-bold text-red-300 transition duration-150 active:scale-95"
              >
                Clear All Dates
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-indigo-500/10">
          <div>
            {availError && (
              <p className="text-xs font-semibold text-red-400">⚠️ {availError}</p>
            )}
            {availSuccess && (
              <p className="text-xs font-semibold text-emerald-400">✓ Availability settings saved successfully</p>
            )}
          </div>
          <button
            type="button"
            disabled={savingAvailability}
            onClick={handleSaveAvailability}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5 py-2.5 text-sm transition-all duration-200 active:scale-95 disabled:opacity-50 shadow-lg shadow-indigo-500/20"
          >
            {savingAvailability ? "Saving Settings..." : "Save Availability"}
          </button>
        </div>
      </div>

      {/* Services List Header & Add Button */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            My Services
            <span className="text-sm font-semibold bg-indigo-500/20 text-indigo-300 px-2.5 py-0.5 rounded-full">
              {services.length}
            </span>
          </h2>
          <button
            type="button"
            onClick={() => {
              if (calendarRef.current) {
                calendarRef.current.closeCalendar();
              }
              setEditingService(null);
              setActiveOverlay('wizard');
            }}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 px-4 py-2.5 text-sm font-bold text-white transition hover:scale-[1.02] active:scale-98 shadow-lg shadow-indigo-500/25"
          >
            <Plus size={16} />
            Add New Service
          </button>
        </div>

        {loadError && (
          <div className="p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-200 text-sm font-semibold mb-4">
            ⚠️ {loadError}
          </div>
        )}

        {/* Services Grid */}
        {services.length === 0 ? (
          <div className="rounded-xl border border-dashed border-indigo-500/30 bg-[#1a1830] p-8 text-center text-[#94a3b8]">
            <div className="max-w-md mx-auto space-y-4 py-4">
              <div className="flex justify-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-500/20 text-indigo-400">
                  <Plus size={24} />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">No services added yet</h3>
                <p className="text-sm text-slate-400 mt-1">
                  You haven't listed any services. Click "Add New Service" above to get started.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {services.map((service) => (
              <article
                key={service.id}
                className="rounded-xl border border-[rgba(99,102,241,0.2)] bg-[#1a1830] p-5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl bg-indigo-500/10 p-2 rounded-xl border border-indigo-500/20">
                        {service.category_icon || "🔧"}
                      </span>
                      <div>
                        <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider block">
                          {service.category_name}
                        </span>
                        <h3 className="text-lg font-bold text-white">
                          {service.title || service.name}
                        </h3>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-sm font-bold text-emerald-300">
                      <IndianRupee size={14} />
                      {formatCurrency(service.price).replace("₹", "")}
                      {service.price_type === "hourly" ? " / hr" : ""}
                    </span>
                  </div>

                  {service.description && (
                    <p className="mt-3 text-sm text-[#94a3b8] line-clamp-3">
                      {service.description.replace(/<[^>]*>/g, '')}
                    </p>
                  )}

                  <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-300">
                    {service.duration && (
                      <span className="inline-flex items-center gap-1 rounded-lg bg-white/5 px-2.5 py-1">
                        <Clock size={13} />
                        {service.duration}
                      </span>
                    )}
                    {service.is_instant && (
                      <span className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-400/30 bg-indigo-500/10 px-2.5 py-1 text-xs font-bold text-indigo-300">
                        ⚡ Instant
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-bold text-emerald-300">
                      Active
                    </span>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-indigo-500/10 flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleEdit(service)}
                    className="inline-flex items-center gap-2 rounded-lg border border-indigo-400/30 bg-indigo-500/10 px-3.5 py-2 text-xs font-bold text-indigo-200 transition hover:bg-indigo-500/20 active:scale-95"
                  >
                    <Pencil size={13} />
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(service.id)}
                    className="inline-flex items-center gap-2 rounded-lg border border-red-400/30 bg-red-500/10 px-3.5 py-2 text-xs font-bold text-red-200 transition hover:bg-red-500/20 active:scale-95"
                  >
                    <Trash2 size={13} />
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {/* Wizard Modal Overlay */}
      {showWizard && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-xl bg-[#1a1830] rounded-2xl border border-[rgba(99,102,241,0.25)] shadow-2xl p-6 my-8">
            <button
              type="button"
              onClick={() => {
                setActiveOverlay(null);
                setEditingService(null);
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition text-lg font-bold p-1 bg-white/5 rounded-full hover:bg-white/10"
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
  const [step, setStep] = useState(1);
  const [categories, setCategories] = useState([]);
  const [loadingCats, setLoadingCats] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(null);

  // Step 2 (Price & type initialization)
  const [price, setPrice] = useState(editingService ? Number(editingService.price) : 500);
  const [priceType, setPriceType] = useState(editingService ? editingService.price_type : "fixed");

  // Step 3 (Notes & title initialization)
  const [title, setTitle] = useState(editingService ? (editingService.title || editingService.name) : "");
  const [description, setDescription] = useState(editingService ? editingService.description : "");

  // Step 4 (Submit state)
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [success, setSuccess] = useState(false);

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

  const handleCategorySelect = (cat) => {
    setSelectedCategory(cat);
    const catName = cat.name;
    let autoTitle = catName + " Service";
    if (catName.toLowerCase() === "plumber") autoTitle = "Plumbing Service";
    else if (catName.toLowerCase() === "electrician") autoTitle = "Electrical Service";
    else if (catName.toLowerCase() === "carpenter") autoTitle = "Carpentry Service";
    else if (catName.toLowerCase() === "painter") autoTitle = "Painting Service";
    else if (catName.toLowerCase() === "cleaner") autoTitle = "Cleaning Service";
    else if (catName.toLowerCase() === "ac technician") autoTitle = "AC Repair Service";
    else if (catName.toLowerCase() === "tutor") autoTitle = "Tuition Service";
    else if (catName.toLowerCase() === "beauty") autoTitle = "Beauty Service";
    else if (catName.toLowerCase() === "cook") autoTitle = "Cooking Service";
    else if (catName.toLowerCase() === "driver") autoTitle = "Driver Service";
    
    // Only set default autoTitle if we are NOT editing
    if (!editingService) {
      setTitle(autoTitle);
    }
    setStep(2);
  };

  const handlePriceTypeSelect = (type) => {
    setPriceType(type);
  };

  const handleNextStep3 = () => {
    setStep(4);
  };

  const handleSkipStep3 = () => {
    setDescription("");
    setStep(4);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError("");
    try {
      const payload = {
        category_id: selectedCategory.id,
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
    setPrice(500);
    setPriceType("fixed");
    setTitle("");
    setDescription("");
    setSuccess(false);
    setSubmitError("");
  };

  const priceTypeLabels = {
    fixed: "Fixed Price",
    hourly: "Per Hour",
    negotiable: "Can Discuss",
  };

  if (success) {
    return (
      <div className="text-center py-6 space-y-6 animate-fade-in">
        <div className="flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/20 border border-emerald-500/40 text-4xl text-emerald-400">
            ✓
          </div>
        </div>
        <div>
          <h2 className="text-2xl font-black text-white">
            {editingService ? "Service Updated!" : "Service Added!"}
          </h2>
          <p className="mt-2 text-slate-300 font-medium text-sm">
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
              className="rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-3 transition hover:scale-[1.01] active:scale-[0.99] text-sm"
            >
              Add Another Service
            </button>
          )}
          <button
            type="button"
            onClick={onSuccess}
            className="rounded-lg border border-indigo-400/30 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-200 font-bold px-6 py-3 transition hover:scale-[1.01] active:scale-[0.99] text-sm"
          >
            Go to My Services
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Step Progress Bar */}
      <div className="flex items-center justify-between mb-6">
        {[1, 2, 3, 4].map((s) => (
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
            {s < 4 && (
              <div
                className={`h-0.5 grow mx-2 transition-all ${
                  step > s ? "bg-emerald-500" : "bg-indigo-500/10"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {step === 1 && (
        <div className="space-y-6 animate-fade-in">
          <div className="text-center">
            <h2 className="text-2xl font-black text-white">What service do you provide?</h2>
            <p className="mt-1 text-sm text-slate-400">Select your service category below</p>
          </div>

          {loadingCats ? (
            <div className="text-center py-8 text-indigo-300 font-medium">Loading categories...</div>
          ) : categories.length === 0 ? (
            <div className="text-center py-8 text-red-300 font-medium">No categories found.</div>
          ) : (
            <div className="grid grid-cols-2 gap-4 max-h-[320px] overflow-y-auto pr-1">
              {categories.map((cat) => {
                const isSelected = selectedCategory?.id === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleCategorySelect(cat)}
                    className={`flex flex-col items-center justify-center gap-3 rounded-2xl border p-5 text-center transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] ${
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
              className="px-5 py-2.5 rounded-lg border border-slate-500/30 text-slate-300 hover:bg-white/5 font-bold transition text-sm active:scale-95"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6 animate-fade-in">
          <div className="text-center">
            <h2 className="text-2xl font-black text-white">What do you charge?</h2>
            <p className="mt-1 text-sm text-slate-400">Set your pricing details</p>
          </div>

          <div className="flex flex-col items-center justify-center gap-4 py-4">
            <span className="text-xs font-bold text-[#94a3b8] tracking-widest">PRICE</span>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setPrice((p) => Math.max(50, p - 50))}
                className="flex h-14 w-14 items-center justify-center rounded-xl bg-indigo-600 hover:bg-indigo-700 text-2xl font-black text-white transition hover:scale-105 active:scale-95 shadow-lg shadow-indigo-500/20"
              >
                -
              </button>
              <div className="flex items-center bg-[#0f0e1a] border border-indigo-500/20 rounded-xl px-4 py-2">
                <span className="text-2xl font-bold text-indigo-300 mr-1">₹</span>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(Math.max(1, parseInt(e.target.value) || 0))}
                  className="w-24 text-center text-3xl font-black bg-transparent text-white outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>
              <button
                type="button"
                onClick={() => setPrice((p) => p + 50)}
                className="flex h-14 w-14 items-center justify-center rounded-xl bg-indigo-600 hover:bg-indigo-700 text-2xl font-black text-white transition hover:scale-105 active:scale-95 shadow-lg shadow-indigo-500/20"
              >
                +
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <span className="block text-center text-xs font-bold text-[#94a3b8] tracking-widest">CHARGING METHOD</span>
            <div className="grid grid-cols-3 gap-3">
              {[
                { type: "fixed", label: "Fixed Price" },
                { type: "hourly", label: "Per Hour" },
                { type: "negotiable", label: "Can Discuss" },
              ].map((opt) => {
                const checked = priceType === opt.type;
                return (
                  <button
                    key={opt.type}
                    type="button"
                    onClick={() => handlePriceTypeSelect(opt.type)}
                    className={`rounded-xl border p-4 text-sm font-black transition-all duration-150 text-center flex flex-col items-center justify-center gap-1 active:scale-95 ${
                      checked
                        ? "border-indigo-400 bg-indigo-500/20 text-white shadow-lg shadow-indigo-500/10"
                        : "border-indigo-500/20 bg-[#0f0e1a] text-slate-400 hover:border-indigo-400/40"
                    }`}
                  >
                    <span>{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex justify-between pt-6 border-t border-indigo-500/10">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="px-5 py-2.5 rounded-lg border border-slate-500/30 text-slate-300 hover:bg-white/5 font-bold transition text-sm active:scale-95"
            >
              Back
            </button>
            <button
              type="button"
              onClick={() => setStep(3)}
              className="px-6 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition text-sm hover:scale-[1.01] active:scale-95"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-6 animate-fade-in">
          <div className="text-center">
            <h2 className="text-2xl font-black text-white">Add a short note</h2>
            <p className="mt-1 text-sm text-slate-400">Explain details of your service (optional)</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-300">Service Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="E.g. Plumbing Repair"
                className="w-full rounded-xl border border-indigo-500/20 bg-[#0f0e1a] px-4 py-3 text-sm text-white outline-none transition focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-300">Description (Optional)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="E.g. I repair leaking taps, fix bathrooms, and install new plumbing fixtures."
                rows="4"
                className="w-full rounded-xl border border-indigo-500/20 bg-[#0f0e1a] px-4 py-3 text-sm text-white outline-none transition focus:border-indigo-500 resize-none"
              />
            </div>
          </div>

          <div className="flex justify-between pt-6 border-t border-indigo-500/10">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="px-5 py-2.5 rounded-lg border border-slate-500/30 text-slate-300 hover:bg-white/5 font-bold transition text-sm active:scale-95"
            >
              Back
            </button>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleSkipStep3}
                className="px-5 py-2.5 rounded-lg border border-indigo-400/30 bg-indigo-500/10 text-indigo-200 font-bold transition text-sm hover:bg-indigo-500/20 active:scale-95"
              >
                Skip
              </button>
              <button
                type="button"
                onClick={handleNextStep3}
                className="px-6 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition text-sm hover:scale-[1.01] active:scale-95"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-6 animate-fade-in">
          <div className="text-center">
            <h2 className="text-2xl font-black text-white">Confirm & Submit</h2>
            <p className="mt-1 text-sm text-slate-400">Review your service offer</p>
          </div>

          <div className="rounded-2xl border border-indigo-400/30 bg-[#0f0e1a] p-6 space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-4xl bg-indigo-500/10 p-2.5 rounded-xl border border-indigo-500/20">
                {selectedCategory?.icon || "🔧"}
              </span>
              <div>
                <span className="text-xs font-bold text-indigo-400 block uppercase tracking-wider">
                  {selectedCategory?.name}
                </span>
                <span className="text-xl font-bold text-white block">
                  {title || (selectedCategory?.name + " Service")}
                </span>
              </div>
            </div>

            <div className="border-t border-indigo-500/10 pt-4 flex justify-between items-center">
              <span className="text-sm text-slate-400 font-medium">Price Details:</span>
              <span className="text-lg font-black text-white">
                ₹{price} ({priceTypeLabels[priceType]})
              </span>
            </div>

            {description && (
              <div className="border-t border-indigo-500/10 pt-4">
                <span className="text-xs font-bold text-slate-500 block uppercase mb-1">Details</span>
                <p className="text-sm text-slate-300 font-medium whitespace-pre-wrap">{description}</p>
              </div>
            )}
          </div>

          {submitError && (
            <div className="p-3 bg-red-500/15 border border-red-500/30 rounded-xl text-red-200 text-xs font-semibold">
              ⚠️ {submitError}
            </div>
          )}

          <div className="flex justify-between pt-6 border-t border-indigo-500/10">
            <button
              type="button"
              onClick={() => setStep(3)}
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-lg border border-slate-500/30 text-slate-300 hover:bg-white/5 font-bold transition text-sm disabled:opacity-50 active:scale-95"
            >
              Back
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-8 py-3 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-bold transition text-sm hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-indigo-500/20"
            >
              {isSubmitting 
                ? (editingService ? "Updating..." : "Adding...") 
                : (editingService ? "Update Service" : "Add Service")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
