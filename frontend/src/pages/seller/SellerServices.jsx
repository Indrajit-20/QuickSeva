import { useEffect, useMemo, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
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
import { getSystemSettings } from "../../api/policyService";

const inputClass =
  "seller-input";

const labelClass = "seller-label";

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
      <div className="seller-page animate-fade-in space-y-5">
        <div>
          <h1 className="seller-page-title">My Services</h1>
          <p className="seller-page-subtitle">Configure availability and manage services.</p>
        </div>
        <div className="seller-empty-state" style={{ padding: '32px 24px' }}>
          <div style={{
            width: 32, height: 32,
            border: '3px solid #eff6ff', borderTopColor: '#3b82f6',
            borderRadius: '50%', margin: '0 auto 12px',
            animation: 'spin 1s linear infinite',
          }} />
          <p className="seller-empty-text">Loading services / सेवाएं लोड हो रही हैं…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="seller-page space-y-6">
      {Number(user?.profile_completed ?? 0) === 1 && Number(user?.services_count ?? 0) === 0 && (
        <div className="seller-offline-banner" style={{ borderColor: '#fde68a', background: 'linear-gradient(135deg, #fffbeb, #fef3c7)' }}>
          <div className="seller-offline-icon" style={{ background: '#fef3c7', color: '#d97706' }}>
            <span style={{ fontSize: 22 }}>⚠️</span>
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: '#92400e' }}>Add Your First Service / अपनी पहली सेवा जोड़ें</p>
            <p style={{ fontSize: 12, color: '#b45309', marginTop: 2, fontWeight: 500 }}>
              Add at least one service to unlock Dashboard, Orders & Wallet.
            </p>
          </div>
        </div>
      )}

      {/* HEADER SECTION */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="seller-page-title">My Services / मेरी सेवाएं</h1>
          <p className="seller-page-subtitle">
            Manage your service list and configure availability days below.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setEditingService(null);
            setActiveOverlay('wizard');
          }}
          className="seller-action-btn seller-action-btn--primary seller-desktop-only"
        >
          <Plus size={18} />
          Add New Service / नया काम जोड़ें
        </button>
      </div>

      {/* FAB - Add New Service (mobile) */}
      <button
        type="button"
        onClick={() => {
          setEditingService(null);
          setActiveOverlay('wizard');
        }}
        className="seller-fab lg:hidden"
        aria-label="Add new service"
      >
        <Plus size={26} />
      </button>

      {/* 1. MY SERVICES LIST - PRIMARY COMPONENT */}
      <div className="space-y-6">
        {loadError && (
          <div className="p-4 rounded-xl border border-red-200 bg-red-50 text-red-700 text-sm font-semibold">
            ⚠️ {loadError}
          </div>
        )}

        {services.length === 0 ? (
          <div className="seller-empty-state">
            <div className="seller-empty-icon">
              <Plus size={28} />
            </div>
            <div className="seller-empty-title">No services added yet / कोई सेवा नहीं जोड़ी गई</div>
            <div className="seller-empty-text">
              Tap the + button to add your first service and start receiving bookings.
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {services.map((service) => {
              // Custom colors based on categories
              const catLower = service.category_name?.toLowerCase() || "";
              let catTheme = {
                badge: "bg-blue-50 text-blue-700 border-blue-100",
                iconBg: "bg-blue-500/10 text-blue-600 border-blue-500/20",
              };
              if (catLower.includes("ac")) {
                catTheme = {
                  badge: "bg-sky-50 text-sky-700 border-sky-100",
                  iconBg: "bg-sky-500/10 text-sky-655 border-sky-500/20",
                };
              } else if (catLower.includes("electr")) {
                catTheme = {
                  badge: "bg-amber-50 text-amber-700 border-amber-100",
                  iconBg: "bg-amber-500/10 text-amber-600 border-amber-500/20",
                };
              } else if (catLower.includes("clean")) {
                catTheme = {
                  badge: "bg-emerald-50 text-emerald-700 border-emerald-100",
                  iconBg: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
                };
              } else if (catLower.includes("plumb")) {
                catTheme = {
                  badge: "bg-teal-50 text-teal-700 border-teal-100",
                  iconBg: "bg-teal-500/10 text-teal-600 border-teal-500/20",
                };
              } else if (catLower.includes("carp")) {
                catTheme = {
                  badge: "bg-orange-50 text-orange-700 border-orange-100",
                  iconBg: "bg-orange-500/10 text-orange-600 border-orange-500/20",
                };
              }

              return (
                <div
                  key={service.id}
                  className="group relative flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:shadow-md hover:border-slate-300 animate-fade-in text-left"
                >
                  {/* Status Toggle Switch (Top Right) */}
                  <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-slate-50/80 pl-2.5 pr-2 py-1 rounded-full border border-slate-100">
                    <span className={`text-[9px] font-extrabold tracking-wide uppercase ${service.is_active !== 0 ? "text-emerald-700" : "text-slate-450"}`}>
                      {service.is_active !== 0 ? "Active" : "Inactive"}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(service)}
                      className={`relative inline-flex h-4 w-7 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-200 ease-in-out outline-none active:scale-95 ${
                        service.is_active !== 0 ? "bg-emerald-500" : "bg-slate-300"
                      }`}
                      title="Click to toggle status / चालू या बंद करें"
                    >
                      <span
                        className={`pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm transition duration-200 ease-in-out ${
                          service.is_active !== 0 ? "translate-x-3" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>

                  {/* Top info block */}
                  <div className="space-y-3 mt-4">
                    {/* Category icon and name */}
                    <div className="flex items-center gap-2">
                      <span className={`flex h-9 w-9 items-center justify-center rounded-xl border text-xl ${catTheme.iconBg}`}>
                        {service.category_icon || "🔧"}
                      </span>
                      <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${catTheme.badge}`}>
                        {service.category_name || "General"}
                      </span>
                    </div>

                    {/* Title */}
                    <div>
                      <h3 className="font-bold text-slate-800 text-base leading-snug group-hover:text-blue-600 transition-colors">
                        {service.title || service.name}
                      </h3>
                      {service.sub_service_name ? (
                        <span className="text-[10px] text-blue-650 font-bold block mt-1">
                          🎯 {service.sub_service_name.split("/")[0].trim()}
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-semibold block mt-1">
                          ✨ Custom Service / अन्य काम
                        </span>
                      )}
                    </div>

                    {/* Description */}
                    {service.description && (
                      <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                        {service.description.replace(/<[^>]*>/g, "")}
                      </p>
                    )}
                  </div>

                  {/* Divider */}
                  <div className="my-4 h-px bg-slate-100" />

                  {/* Bottom pricing and action block */}
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Starting Price / रेट</span>
                        <span className="text-lg font-extrabold text-slate-800 mt-0.5 block">
                          ₹{Number(service.price || 0).toLocaleString("en-IN")}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Visiting Charge / फीस</span>
                        <span className="text-lg font-extrabold text-slate-850 mt-0.5 block">
                          ₹{Number(service.visiting_charge) || 100}
                        </span>
                      </div>
                    </div>

                    {/* Actions buttons */}
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => handleEdit(service)}
                        className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 py-2 text-xs font-bold transition active:scale-95 cursor-pointer"
                      >
                        <Pencil size={11} />
                        Edit / बदलें
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(service.id)}
                        className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-755 py-2 text-xs font-bold transition active:scale-95 cursor-pointer"
                      >
                        <Trash2 size={11} />
                        Delete / हटाएं
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 2. WEEKLY AVAILABILITY & BLACKOUT DATES - SECONDARY COMPONENT (BELOW SERVICES) */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-6 shadow-sm">
        <div className="border-b border-slate-200 pb-4">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            📅 Weekly Availability & Leave Calendar / साप्ताहिक उपलब्धता और छुट्टियां
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Configure the days and dates you are available to take customer bookings.
          </p>
        </div>

        <div className="space-y-3">
          <label className="text-sm font-bold text-slate-700 block">
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
                  className={`seller-day-toggle ${checked ? "seller-day-toggle--active" : ""}`}
                >
                  <span className="text-sm font-bold">{day}</span>
                  <span className={`text-[10px] font-semibold mt-0.5 ${checked ? "text-blue-100" : "text-slate-400"}`}>{hindiDays[day]}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Date picker grid (moved below available days) */}
        <div className="grid gap-6 md:grid-cols-2 pt-2 border-t border-slate-100">
          <div className="space-y-3">
            <label className="text-sm font-bold text-slate-700 block">
              Mark Specific Holidays / छुट्टी के दिन चुनें:
            </label>

            {/* On Mobile (hidden on desktop) */}
            <div className="block md:hidden w-full">
              <button
                type="button"
                onClick={() => setActiveOverlay('calendar')}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-50 border border-blue-200 hover:bg-blue-100 text-blue-700 font-bold px-4 py-3.5 text-sm transition duration-200"
              >
                📅 Manage Leave Calendar ({blackoutDates.length} marked)
              </button>
            </div>

            {/* On Desktop (hidden on mobile) */}
            <div className="hidden md:flex bg-slate-50 p-4 rounded-xl border border-slate-200 justify-center" style={{ minHeight: "340px" }}>
              <Calendar
                ref={calendarRef}
                multiple
                value={blackoutDates.map((ymd) => {
                  const [y, m, d] = ymd.split("-").map(Number);
                  return new Date(y, m - 1, d);
                })}
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
                minDate={new Date()}
                maxDate={new Date(Date.now() + 15 * 86400000)}
                className="qs-date-picker"
                calendarClassName="qs-date-picker__calendar"
                containerClassName="qs-date-picker__container"
                placeholder="Select unavailable dates"
              />
            </div>
          </div>

          <div className="space-y-3 flex flex-col justify-between">
            <div>
              <label className="text-sm font-bold text-slate-700 block mb-1">
                Leave Calendar / छुट्टी की सूची:
              </label>
              {(blackoutDates || []).length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-5 text-center text-xs text-slate-400 font-semibold leading-relaxed">
                  No holidays marked yet. Tapping dates on the calendar will add leaves.
                  <br /><span className="text-[10px] text-slate-400">(कोई छुट्टी नहीं चुनी गई है। कैलेंडर पर तारीख दबाएं)</span>
                </div>
              ) : (
                <div className="max-h-[180px] overflow-y-auto no-scrollbar space-y-2 pr-1">
                  {blackoutDates.map((ymd) => (
                    <div
                      key={ymd}
                      className="flex items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2"
                    >
                      <span className="text-xs font-bold text-red-700">
                        ❌ {ymdToDisplay(ymd)}
                      </span>
                      <button
                        type="button"
                        onClick={() => setBlackoutDates(prev => prev.filter(d => d !== ymd))}
                        className="rounded-md border border-red-200 bg-red-100 px-2 py-1 text-[10px] font-bold text-red-700 transition hover:bg-red-200 cursor-pointer"
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
                className="w-full py-2 text-center rounded-lg border border-red-250 bg-red-50 hover:bg-red-100 text-xs font-bold text-red-700 transition duration-150 active:scale-95 cursor-pointer"
              >
                Clear All Leaves / सभी छुट्टियां हटाएं
              </button>
            )}
          </div>
        </div>

        {/* Save Availability Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-200">
          <div>
            {availError && (
              <p className="text-xs font-semibold text-red-655">⚠️ {availError}</p>
            )}
            {availSuccess && (
              <p className="text-xs font-semibold text-emerald-650">✓ Availability settings saved / उपलब्धता सुरक्षित की गई</p>
            )}
          </div>
          <button
            type="button"
            disabled={savingAvailability}
            onClick={handleSaveAvailability}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 text-sm transition-all duration-200 active:scale-95 disabled:opacity-50 shadow-sm cursor-pointer"
          >
            {savingAvailability ? "Saving Settings..." : "Save Availability / उपलब्धता सुरक्षित करें"}
          </button>
        </div>
      </div>

      {/* Wizard Modal Overlay */}
      {showWizard && createPortal(
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="relative w-full max-w-xl bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 max-h-[85vh] overflow-y-auto text-left">
            <button
              type="button"
              onClick={() => {
                setActiveOverlay(null);
                setEditingService(null);
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition text-lg font-bold p-1 bg-slate-100 rounded-full hover:bg-slate-200 w-8 h-8 flex items-center justify-center cursor-pointer"
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
        </div>,
        document.body
      )}

      {/* Calendar Bottom Sheet / Modal Overlay for Mobile */}
      {activeOverlay === 'calendar' && (
        <div className="qs-mobile-sheet-backdrop md:hidden" onClick={() => setActiveOverlay(null)}>
          <div className="qs-mobile-sheet-container bg-white" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-800">Select Leave Dates / छुट्टियां चुनें</h3>
                <p className="text-[10px] text-slate-500">Tap dates on the calendar to mark holidays</p>
              </div>
              <button
                type="button"
                onClick={() => setActiveOverlay(null)}
                className="text-blue-600 hover:text-blue-700 transition text-xs font-bold px-3 py-1.5 bg-blue-550 border border-blue-200 rounded-lg cursor-pointer"
              >
                Done / हो गया
              </button>
            </div>

            <div className="flex justify-center p-3 rounded-2xl bg-slate-50 border border-slate-200 min-h-[320px]">
              <Calendar
                ref={calendarRef}
                multiple
                value={blackoutDates.map((ymd) => {
                  const [y, m, d] = ymd.split("-").map(Number);
                  return new Date(y, m - 1, d);
                })}
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
                minDate={new Date()}
                maxDate={new Date(Date.now() + 15 * 86400000)}
                className="qs-date-picker"
                calendarClassName="qs-date-picker__calendar"
                containerClassName="qs-date-picker__container"
              />
            </div>

            <div className="mt-4 text-[10px] text-center text-slate-400 font-semibold">
              💡 Marked leave dates will prevent clients from booking on those days.
            </div>
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

  // Step 3 (Price & type & visiting charge)
  const [price, setPrice] = useState(editingService ? Number(editingService.price || 199) : 199);
  const [priceType, setPriceType] = useState("negotiable");
  const [visitingCharge, setVisitingCharge] = useState(editingService ? Math.max(100, Number(editingService.visiting_charge || 0)) : 100);
  const [isInspectionRequired, setIsInspectionRequired] = useState(editingService ? Boolean(editingService.is_inspection_required !== 0) : true);
  const [finalPriceAfterInspection, setFinalPriceAfterInspection] = useState(editingService ? Boolean(editingService.final_price_after_inspection !== 0) : true);

  const [platformSettings, setPlatformSettings] = useState({
    platform_fee_model: "seller",
    platform_fee_percentage: "5.00"
  });

  // Step 4 (Title & details)
  const [title, setTitle] = useState(editingService ? (editingService.title || editingService.name) : "");
  const [description, setDescription] = useState(editingService ? editingService.description || "" : "");

  // Step 5 (Submit state)
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await getSystemSettings();
        if (res?.data) {
          setPlatformSettings(res.data);
        }
      } catch (err) {
        console.error("Failed to load platform settings:", err);
      }
    };
    fetchSettings();
  }, []);

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
      } else {
        setPrice(199);
      }
    }
    setStep(3);
  };

  const handleCustomServiceSelect = () => {
    setSelectedSubService(null);
    if (!editingService) {
      setTitle(selectedCategory.name + " Service");
      setDescription("");
      setPrice(199);
    }
    setStep(3);
  };

  const handlePriceTypeSelect = (type) => {
    setPriceType(type);
    if (type === "negotiable") {
      setPrice(0);
    } else if (price === 0) {
      setPrice(500);
    }
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
        price: Math.max(1, Number(price || 199)),
        price_type: priceType,
        visiting_charge: Math.max(100, Number(visitingCharge || 100)),
        is_inspection_required: isInspectionRequired ? 1 : 0,
        final_price_after_inspection: finalPriceAfterInspection ? 1 : 0,
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
    setPrice(199);
    setPriceType("negotiable");
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
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 border-2 border-emerald-200 text-4xl text-emerald-600">
            ✓
          </div>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-800">
            {editingService ? "Service Updated! / काम अपडेट हुआ!" : "Service Added! / नया काम जुड़ गया!"}
          </h2>
          <p className="mt-2 text-slate-500 font-semibold text-sm">
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
              className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 transition hover:scale-[1.01] active:scale-95 text-sm cursor-pointer"
            >
              Add Another Service / दूसरा काम जोड़ें
            </button>
          )}
          <button
            type="button"
            onClick={onSuccess}
            className="rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold px-6 py-3 transition hover:scale-[1.01] active:scale-95 text-sm cursor-pointer"
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
              className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all ${step === s
                  ? "bg-blue-600 border border-blue-400 text-white ring-4 ring-blue-100"
                  : step > s
                    ? "bg-emerald-500 text-white"
                    : "bg-slate-50 border border-slate-200 text-slate-400"
                }`}
            >
              {step > s ? "✓" : s}
            </button>
            {s < 5 && (
              <div
                className={`h-0.5 grow mx-2 transition-all ${step > s ? "bg-emerald-500" : "bg-slate-100"
                  }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* STEP 1: CATEGORY SELECTION */}
      {step === 1 && (
        <div className="space-y-4 animate-fade-in text-left">
          <div className="text-center">
            <h2 className="text-xl font-bold text-slate-800">What service do you provide? / आपका मुख्य काम क्या है?</h2>
            <p className="mt-1 text-xs text-slate-500">Select your category below / नीचे अपनी काम की श्रेणी चुनें</p>
          </div>

          {loadingCats ? (
            <div className="text-center py-8 text-blue-600 font-bold animate-pulse">Loading categories / श्रेणियां लोड हो रही हैं...</div>
          ) : categories.length === 0 ? (
            <div className="text-center py-8 text-red-500 font-bold">No categories found / कोई श्रेणी नहीं मिली।</div>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {categories.map((cat) => {
                const isSelected = selectedCategory?.id === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleCategorySelect(cat)}
                    className={`flex flex-col items-center justify-center gap-1.5 rounded-2xl border p-3.5 text-center transition-all duration-155 hover:scale-[1.02] active:scale-[0.98] cursor-pointer ${isSelected
                        ? "border-blue-400 bg-blue-50 text-blue-700 ring-2 ring-blue-100"
                        : "border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-slate-100"
                      }`}
                  >
                    <span className="text-3xl">{cat.icon || "🔧"}</span>
                    <span className="text-xs font-bold truncate max-w-full">{cat.name}</span>
                  </button>
                );
              })}
            </div>
          )}

          <div className="flex justify-end pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-655 hover:bg-slate-50 font-bold transition text-xs active:scale-95 cursor-pointer"
            >
              Cancel / रद्द करें
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: SUB-SERVICE SELECTION */}
      {step === 2 && (
        <div className="space-y-4 animate-fade-in text-left">
          <div className="text-center">
            <h2 className="text-xl font-bold text-slate-800">Select Specific Work / काम का प्रकार चुनें</h2>
            <p className="mt-1 text-xs text-slate-500">Choose what specific service you are listing / आप क्या सेवा देना चाहते हैं</p>
          </div>

          {loadingSubServices ? (
            <div className="text-center py-8 text-blue-600 font-bold animate-pulse">Loading options...</div>
          ) : subServicesError ? (
            <div className="text-center py-6 text-red-500 font-bold">{subServicesError}</div>
          ) : (
            <div className="space-y-4">
              <div className="form-group text-left">
                <label className="text-xs font-bold text-slate-600 mb-1.5 block">Select Service / सेवा चुनें:</label>
                <select
                  value={selectedSubService?.id || ""}
                  onChange={(e) => {
                    const sub = subServices.find(s => s.id === parseInt(e.target.value));
                    if (sub) handleSubServiceSelect(sub);
                  }}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition shadow-sm"
                >
                  <option value="">-- Choose specific work / काम चुनें --</option>
                  {subServices.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name.split("/")[0].trim()} {sub.default_price ? `(₹${sub.default_price})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* Custom / General service option */}
              <div className="border-t border-slate-100 pt-3 flex flex-col gap-2">
                <p className="text-[10px] font-bold text-slate-400 text-center uppercase tracking-wider">Or list a custom service / या अन्य कोई नया काम:</p>
                <button
                  type="button"
                  onClick={handleCustomServiceSelect}
                  className="w-full py-2.5 px-4 rounded-xl border border-dashed border-blue-300 hover:border-blue-500 bg-blue-50/40 hover:bg-blue-50/75 transition text-center text-xs font-bold text-blue-600 active:scale-95 cursor-pointer"
                >
                  ➕ Create Custom Service / नया अन्य काम जोड़ें
                </button>
              </div>
            </div>
          )}

          <div className="flex justify-between pt-4 border-t border-slate-200">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 rounded-xl border border-red-250 text-red-655 hover:bg-red-50 font-bold transition text-xs active:scale-95 cursor-pointer"
              >
                Cancel / रद्द करें
              </button>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-5 py-2 rounded-xl border border-slate-200 text-slate-650 hover:bg-slate-50 font-bold transition text-xs active:scale-95 cursor-pointer"
              >
                Back / पीछे
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: PRICING DETAILS */}
      {step === 3 && (
        <div className="space-y-4 animate-fade-in text-left">
          <div className="text-center">
            <h2 className="text-xl font-bold text-slate-800">Pricing & Visit Fee / दाम और विजिटिंग चार्ज</h2>
            <p className="mt-1 text-xs text-slate-500">Set your baseline rates below / अपने काम का अनुमानित दाम तय करें</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Starting Price Box */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-slate-500 block mb-1.5 uppercase tracking-wide">Starting Price (Starts From) / शुरुआती दाम</span>
                <div className="relative flex items-center">
                  <span className="absolute text-lg font-bold text-slate-400" style={{ left: "12px" }}>₹</span>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => {
                      const val = e.target.value;
                      setPrice(val === "" ? "" : parseInt(val) || 0);
                    }}
                    onBlur={() => setPrice((p) => Math.max(1, Number(p || 199)))}
                    className="w-full rounded-xl border border-slate-200 bg-white pr-3.5 py-2 text-base font-bold text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition shadow-sm"
                    style={{ paddingLeft: "32px" }}
                    placeholder="e.g. 500"
                  />
                </div>
              </div>

              {/* Compact Presets */}
              <div className="mt-2.5 flex flex-wrap gap-1">
                {[100, 200, 350, 500, 1000].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setPrice(preset)}
                    className={`px-2 py-1 text-[10px] font-bold rounded-lg border transition duration-100 active:scale-95 cursor-pointer ${price === preset
                        ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                        : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"
                      }`}
                  >
                    ₹{preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Visiting Charge Box */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-slate-500 block mb-1.5 uppercase tracking-wide">Visiting Charge / विजिटिंग चार्ज</span>
                <div className="relative flex items-center">
                  <span className="absolute text-lg font-bold text-slate-400" style={{ left: "12px" }}>₹</span>
                  <input
                    type="number"
                    value={visitingCharge}
                    onChange={(e) => {
                      const val = e.target.value;
                      setVisitingCharge(val === "" ? "" : parseInt(val) || 0);
                    }}
                    onBlur={() => setVisitingCharge((v) => Math.max(100, Number(v || 100)))}
                    className="w-full rounded-xl border border-slate-200 bg-white pr-3.5 py-2 text-base font-bold text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition shadow-sm"
                    style={{ paddingLeft: "32px" }}
                    placeholder="e.g. 150"
                  />
                </div>
              </div>

              {/* Compact Presets */}
              <div className="mt-2.5 flex flex-wrap gap-1">
                {[100, 150, 200, 250, 300].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setVisitingCharge(preset)}
                    className={`px-2 py-1 text-[10px] font-bold rounded-lg border transition duration-100 active:scale-95 cursor-pointer ${visitingCharge === preset
                        ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                        : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"
                      }`}
                  >
                    ₹{preset}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="text-[10px] text-slate-400 font-semibold leading-relaxed px-1">
            💡 Starting rate is a reference. Final rates will be approved onsite after diagnostic inspection.
          </div>

          {/* Live Payout Badge (Single Row) */}
          {Number(visitingCharge || 0) > 0 && (() => {
            const activeVisitingCharge = Math.max(100, Number(visitingCharge || 100));
            const activeFee = Math.min(100.00, parseFloat((activeVisitingCharge * (parseFloat(platformSettings.platform_fee_percentage) / 100)).toFixed(2)));
            const isBuyerModel = platformSettings.platform_fee_model === "buyer";
            const payout = isBuyerModel ? activeVisitingCharge : activeVisitingCharge - activeFee;
            return (
              <div className="flex items-center justify-between p-3.5 bg-emerald-50 border border-emerald-250 rounded-xl text-xs">
                <span className="font-bold text-emerald-800 flex items-center gap-1.5">
                  🛡️ Payout: You receive ₹{payout} (Visiting Charge ₹{activeVisitingCharge} {isBuyerModel ? "" : `- platform fee ₹${activeFee}`})
                </span>
              </div>
            );
          })()}

          <div className="flex justify-between pt-4 border-t border-slate-200">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 rounded-xl border border-red-250 text-red-655 hover:bg-red-50 font-bold transition text-xs active:scale-95 cursor-pointer"
              >
                Cancel / रद्द करें
              </button>
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-5 py-2 rounded-xl border border-slate-200 text-slate-655 hover:bg-slate-50 font-bold transition text-xs active:scale-95 cursor-pointer"
              >
                Back / पीछे
              </button>
            </div>
            <button
              type="button"
              onClick={() => setStep(4)}
              className="px-6 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition text-xs hover:scale-[1.01] active:scale-95 cursor-pointer"
            >
              Next / आगे बढ़ें
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: TITLE & DESCRIPTION DETAILS */}
      {step === 4 && (
        <div className="space-y-4 animate-fade-in text-left">
          <div className="text-center">
            <h2 className="text-xl font-bold text-slate-800">Add details / काम की जानकारी दें</h2>
            <p className="mt-1 text-xs text-slate-500">Describe what you do for customers / ग्राहकों को समझाने के लिए विवरण लिखें</p>
          </div>

          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-bold text-slate-600">Service Title / काम का नाम</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="E.g. Tap repair / जैसे: नल रिपेयर"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 placeholder:text-slate-400 font-semibold"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold text-slate-600">Description / जानकारी विवरण</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Write service details here... / यहाँ काम की जानकारी लिखें..."
                rows="2"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 resize-none placeholder:text-slate-400 font-semibold"
              />
            </div>

            {/* Tap suggestions to auto-fill description */}
            <div className="space-y-1.5 text-left">
              <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">Quick Suggestions / विवरण चुनें:</span>
              <div className="flex flex-wrap gap-1.5 max-h-[80px] overflow-y-auto no-scrollbar">
                {suggestions.map((sug, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setDescription((prev) => {
                        const cleanStr = prev ? prev.trim() : "";
                        if (cleanStr.includes(sug)) return prev;
                        return cleanStr ? `${cleanStr}\n• ${sug}` : `• ${sug}`;
                      });
                    }}
                    className="text-[10px] font-semibold border border-blue-100 bg-blue-50 hover:bg-blue-100/50 text-blue-700 px-2.5 py-1 rounded-lg transition text-left cursor-pointer active:scale-95"
                  >
                    💡 {sug.split("/")[0].trim()}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-between pt-4 border-t border-slate-200">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 rounded-xl border border-red-250 text-red-650 hover:bg-red-50 font-bold transition text-xs active:scale-95 cursor-pointer"
              >
                Cancel / रद्द करें
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="px-5 py-2 rounded-xl border border-slate-200 text-slate-655 hover:bg-slate-50 font-bold transition text-xs active:scale-95 cursor-pointer"
              >
                Back / पीछे
              </button>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setDescription("");
                }}
                className="px-4 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-650 font-bold transition text-xs hover:bg-slate-100 active:scale-95 cursor-pointer"
              >
                Clear / साफ करें
              </button>
              <button
                type="button"
                onClick={() => setStep(5)}
                className="px-6 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition text-xs hover:scale-[1.01] active:scale-95 cursor-pointer"
              >
                Next / आगे बढ़ें
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 5: REVIEW & CONFIRM */}
      {step === 5 && (
        <div className="space-y-4 animate-fade-in text-left">
          <div className="text-center">
            <h2 className="text-xl font-bold text-slate-800">Confirm & Submit / पुष्टि करें</h2>
            <p className="mt-1 text-xs text-slate-500">Please review your service offer / अपनी सेवा की जांच करें</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-3.5 shadow-inner text-xs">
            <div className="flex items-center gap-3">
              <span className="text-3xl bg-white p-2 rounded-xl border border-slate-200 block">
                {selectedCategory?.icon || "🔧"}
              </span>
              <div>
                <span className="text-[10px] font-bold text-slate-450 block uppercase">
                  {selectedCategory?.name}
                </span>
                <span className="text-base font-bold text-slate-800 block mt-0.5">
                  {title || (selectedCategory?.name + " Service")}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 border-t border-slate-200 pt-3">
              <div>
                <span className="text-slate-400 block font-semibold">Service Type / सेवा का प्रकार:</span>
                <span className="font-bold text-slate-700">
                  {selectedSubService ? "Standard / स्टैंडर्ड" : "Custom / कस्टम"}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold">Price Type / रेट का प्रकार:</span>
                <span className="font-bold text-slate-700">{priceTypeLabels[priceType]}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold">Starting Rate / अनुमानित रेट:</span>
                <span className="font-bold text-emerald-700">₹{price}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold">Visiting Charge / विजिटिंग चार्ज:</span>
                <span className="font-bold text-slate-700">₹{visitingCharge}</span>
              </div>
            </div>

            {description && (
              <div className="border-t border-slate-200 pt-3">
                <span className="text-[10px] font-bold text-slate-400 block uppercase mb-1 tracking-wider">Details / सेवा का विवरण</span>
                <p className="text-xs text-slate-655 whitespace-pre-wrap leading-relaxed bg-white p-2.5 rounded-xl border border-slate-200 max-h-[80px] overflow-y-auto no-scrollbar font-medium">{description}</p>
              </div>
            )}
          </div>

          {submitError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-semibold">
              ⚠️ {submitError}
            </div>
          )}

          <div className="flex justify-between pt-6 border-t border-slate-200">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2.5 rounded-xl border border-red-250 text-red-650 hover:bg-red-50 font-bold transition text-xs active:scale-95 cursor-pointer"
              >
                Cancel / रद्द करें
              </button>
              <button
                type="button"
                onClick={() => setStep(4)}
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-650 hover:bg-slate-50 font-bold transition text-sm disabled:opacity-50 active:scale-95 cursor-pointer"
              >
                Back / पीछे
              </button>
            </div>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-8 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition text-sm hover:scale-[1.01] active:scale-95 disabled:opacity-50 flex items-center gap-2 shadow-sm cursor-pointer"
            >
              {isSubmitting
                ? (editingService ? "Updating..." : "Adding...")
                : (editingService ? "Update Service / सुरक्षित करें" : "Add Service / सेवा जोड़ें")}
            </button>
          </div>
        </div>
      )}
      <div className="h-8 md:hidden" />
    </div>
  );
}
