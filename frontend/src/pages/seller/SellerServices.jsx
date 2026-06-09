import { useMemo, useState } from "react";

import { Clock, IndianRupee, Pencil, Plus, Trash2 } from "lucide-react";

import TimePicker from "react-time-picker";
import "react-time-picker/dist/TimePicker.css";
import "react-clock/dist/Clock.css";
import { Editor } from "@tinymce/tinymce-react";
import { Calendar } from "react-multi-date-picker";



// console.log("[SellerServices] Editor:", Editor);
// console.log("[SellerServices] TimePicker:", TimePicker);
// console.log("[SellerServices] Calendar:", Calendar);








import {
  days,
  formatCurrency,
  loadArray,
  mockServices,
  serviceOptions,
} from "./sellerData";
import {
  durationTextToMinutes,
  minutesToDurationText,
  ymdToDisplay,

} from "./SellerServicesUxs";

const emptyForm = {
  name: "AC Repair",
  description: "",
  price: "",
  duration: "",
  availability: [],
  unavailableDates: [], // yyyy-mm-dd strings
};

const inputClass =
  "w-full rounded-lg border border-indigo-500/20 bg-[#0f0e1a] px-3 py-2.5 text-sm font-medium text-white outline-none transition placeholder:text-slate-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20";

const labelClass = "mb-2 block text-sm font-semibold text-slate-300";






function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function getCurrentSellerIdentity() {
  const registeredSeller = readJson("registeredSeller", null);
  return {
    id: registeredSeller?.id,
    phone: registeredSeller?.mobileNumber,
    name: registeredSeller?.businessName,
  };
}

function syncSellerServices(nextServices) {
  const identity = getCurrentSellerIdentity();
  const sellers = readJson("sellers", []);
  if (!Array.isArray(sellers)) return;

  const updated = sellers.map((seller) => {
    const matches =
      seller.id === identity.id ||
      (identity.phone && seller.phone === identity.phone) ||
      (identity.name && seller.name === identity.name);

    if (!matches) return seller;

    return {
      ...seller,
      service: nextServices[0]?.name || seller.service,
      services: nextServices.map((service) => ({
        ...service,
        sellerId: seller.id,
      })),
    };
  });

  localStorage.setItem("sellers", JSON.stringify(updated));
}

export default function SellerServices() {
  const [services, setServices] = useState(() =>
    loadArray("sellerServices", mockServices),
  );
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);

  // Calendar state (unavailable dates)
  const [unavailableDates, setUnavailableDates] = useState([]);


  const [duration, setDuration] = useState(null);

  const durationMinutes = useMemo(
    () => durationTextToMinutes(form.duration),
    [form.duration],
  );

  // Keep existing durationMinutes logic but we will render a custom picker below.




  const persist = (nextServices) => {
    const identity = getCurrentSellerIdentity();
    const normalizedServices = nextServices.map((service) => ({
      ...service,
      sellerId: identity.id || service.sellerId,
    }));

    setServices(normalizedServices);
    localStorage.setItem("sellerServices", JSON.stringify(normalizedServices));
    syncSellerServices(normalizedServices);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleDescriptionChangeHtml = (html) => {
    setForm((prev) => ({ ...prev, description: html }));
  };

  const toggleDay = (day) => {
    setForm((prev) => {
      const set = new Set(prev.availability);
      if (set.has(day)) set.delete(day);
      else set.add(day);
      return { ...prev, availability: Array.from(set) };
    });
  };

  const clearUnavailableDates = () => {
    setUnavailableDates([]);
    setForm((prev) => ({ ...prev, unavailableDates: [] }));
  };





  const handleSubmit = (e) => {
    e.preventDefault();


    const service = {
      ...form,
      unavailableDates,
      id: editingId || Date.now(),
      price: Number(form.price || 0),
    };



    const nextServices = editingId
      ? services.map((item) => (item.id === editingId ? service : item))
      : [service, ...services];

    persist(nextServices);
    setForm(emptyForm);
    setEditingId(null);
  };

  const handleEdit = (service) => {
    setEditingId(service.id);

    setUnavailableDates(service.unavailableDates || []);

    setForm({
      name: service.name,
      description: service.description || "",
      price: service.price,
      duration: service.duration || "",
      availability: service.availability || [],
      unavailableDates: service.unavailableDates || [],
    });
  };




  const handleDelete = (id) => {
    persist(services.filter((service) => service.id !== id));
    if (editingId === id) {
      setEditingId(null);
      setForm(emptyForm);
    }
  };

  const previewHtml = form.description || "";
  const previewAvailableDays = form?.availability || [];
  const previewUnavailableDates = unavailableDates || [];





  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">My Services</h1>
        <p className="mt-1 text-[#94a3b8]">
          Add services customers can book from your seller profile.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="rounded-xl border border-[rgba(99,102,241,0.2)] bg-[#1a1830] p-6"
      >
        <h2 className="mb-5 text-xl font-bold text-white">
          {editingId ? "Edit Service" : "Add New Service"}
        </h2>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className={labelClass}>Service Name</label>
            <select
              name="name"
              value={form.name}
              onChange={handleChange}
              className={inputClass}
            >
              {serviceOptions.map((service) => (
                <option key={service}>{service}</option>
              ))}
              <option>AC Installation</option>
            </select>
            <p className="mt-1 text-xs font-semibold text-[#94a3b8]">
              Choose a name customers will understand.
            </p>
          </div>

          <div>
            <label className={labelClass}>Price (₹)</label>
            <input
              name="price"
              type="number"
              min="0"
              value={form.price}
              onChange={handleChange}
              className={inputClass}
              required
            />
            <p className="mt-1 text-xs font-semibold text-[#94a3b8]">
              Set the amount for the selected service.
            </p>
          </div>

          <div>
            <label className={labelClass}>⏱ Service Duration</label>

            <div className="mt-1 rounded-xl border border-[rgba(99,102,241,0.18)] bg-[#0f1024] p-4 shadow-[inset_0_0_0_1px_rgba(99,102,241,0.08)]">
              <TimePicker
                onChange={setDuration}
                value={duration}
                disableClock={true}
                clearIcon={null}
                format="HH:mm"
                className="custom-time-picker"
              />

              <style>{`
                .custom-time-picker .react-time-picker__wrapper {
                  background-color: #1e1e2e;
                  border: 1px solid #3a3a5c;
                  border-radius: 8px;
                  padding: 8px 12px;
                  color: white;
                }

                .custom-time-picker .react-time-picker__inputGroup__input {
                  color: white;
                  background: transparent;
                }
              `}</style>
              {/* Custom inline hour/minute picker (kept as fallback UI) */}
              <div className="mt-1 grid gap-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="mb-1 text-[11px] font-bold text-[#94a3b8]">
                      Hours
                    </div>
                    <select
                      value={(() => {
                        const n = Number(durationMinutes || 0);
                        if (!n) return "";
                        const h = Math.floor(n / 60);
                        return String(h);
                      })()}
                      onChange={(e) => {
                        const h = Number(e.target.value);
                        const currentMinutes = Number(durationMinutes || 0);
                        const minsPart = currentMinutes % 60;
                        const total = h * 60 + minsPart;
                        setForm((prev) => ({
                          ...prev,
                          duration: total > 0 ? minutesToDurationText(total) : "",
                        }));
                      }}
                      className="w-full rounded-lg border border-indigo-500/20 bg-[#0f0e1a] px-3 py-2.5 text-sm font-medium text-white outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                    >
                      <option value="" className="bg-[#0f0e1a]">
                        —
                      </option>
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
                        <option key={h} value={h} className="bg-[#0f0e1a]">
                          {h}
                        </option>
                      ))}
                      <option value="0" className="bg-[#0f0e1a]">
                        0
                      </option>
                    </select>
                  </div>

                  <div>
                    <div className="mb-1 text-[11px] font-bold text-[#94a3b8]">
                      Minutes
                    </div>
                    <select
                      value={(() => {
                        const n = Number(durationMinutes || 0);
                        if (!n) return "";
                        const m = n % 60;
                        // show only 00/15/30/45 options; otherwise snap to nearest 5
                        const steps = [0, 15, 30, 45];
                        const snapped = steps.includes(m) ? m : Math.round(m / 15) * 15;
                        const mm = Math.max(0, Math.min(45, snapped));
                        return String(mm).padStart(2, "0");
                      })()}
                      onChange={(e) => {
                        const m = Number(e.target.value);
                        const currentMinutes = Number(durationMinutes || 0);
                        const hoursPart = Math.floor(currentMinutes / 60);
                        const total = hoursPart * 60 + m;
                        setForm((prev) => ({
                          ...prev,
                          duration: total > 0 ? minutesToDurationText(total) : "",
                        }));
                      }}
                      className="w-full rounded-lg border border-indigo-500/20 bg-[#0f0e1a] px-3 py-2.5 text-sm font-medium text-white outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                    >
                      <option value="" className="bg-[#0f0e1a]">
                        —
                      </option>
                      {[0, 15, 30, 45].map((m) => (
                        <option key={m} value={m} className="bg-[#0f0e1a]">
                          {String(m).padStart(2, "0")}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="mt-1 flex items-center justify-between gap-3">
                  <div className="text-xs font-bold text-[#94a3b8]">
                    Selected:{" "}
                    <span className="text-white">{form.duration || "—"}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setForm((prev) => ({ ...prev, duration: "" }))
                    }
                    className="rounded-lg border border-indigo-400/30 bg-white/5 px-3 py-1.5 text-xs font-bold text-indigo-200 transition hover:bg-white/10"
                  >
                    Clear
                  </button>
                </div>

                <p className="text-xs font-semibold text-[#94a3b8]">
                  Pick an hour and a minute step (00/15/30/45).
                </p>
              </div>

            </div>
          </div>

          <div>
            <label className={labelClass}>
              Which days are you usually available?
            </label>
            <div className="flex flex-wrap gap-2">
              {days.map((day) => {
                const checked = form.availability.includes(day);
                return (
                  <label
                    key={day}
                    className={`cursor-pointer rounded-lg border px-3 py-2 text-xs font-bold transition ${
                      checked
                        ? "border-indigo-400 bg-indigo-500/20 text-white"
                        : "border-indigo-500/20 bg-[#0f0e1a] text-[#94a3b8]"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleDay(day)}
                      className="sr-only"
                    />
                    {day}
                  </label>
                );
              })}
            </div>
            <p className="mt-2 text-xs font-semibold text-[#94a3b8]">
              Customers will see these as your regular availability.
            </p>
          </div>

          <div className="md:col-span-2">
            <label className={labelClass}>Service Details</label>
            <p className="mb-2 text-xs font-semibold text-[#94a3b8]">
              Tell customers what is included in your service.
            </p>

            <div className="overflow-hidden rounded-xl border border-[rgba(99,102,241,0.18)]">
              <Editor
                apiKey="no-api-key"
                value={form.description}
                onEditorChange={handleDescriptionChangeHtml}
                init={{
                  height: 220,
                  menubar: false,
                  plugins:
                    "anchor autolink charmap codesample emoticons lists link media table code help wordcount",
                  toolbar:
                    "undo redo | formatselect | bold italic underline | forecolor | alignleft aligncenter alignright | bullist numlist | removeformat | link | headings",
                  branding: false,
                  skin: "oxide-dark",
                  content_css: "dark",
                  statusbar: false,
                  placeholder:
                    "Describe your service in detail. Explain what is included, requirements, pricing information, and any important notes.",
                }}
              />
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-xl border border-[rgba(99,102,241,0.18)] bg-[#0f1024] p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <label className="block text-sm font-semibold text-slate-300">
                📅 Dates I'm Not Available
              </label>
              <p className="mt-1 text-xs font-semibold text-[#94a3b8]">
                Select the days customers cannot book this service.
              </p>
            </div>

            {(unavailableDates || []).length > 0 && (
              <button
                type="button"
                onClick={clearUnavailableDates}
                className="rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-xs font-bold text-red-200 transition hover:bg-red-500/20"
              >
                Clear all
              </button>
            )}

          </div>

          <div className="mt-4">
            <Calendar
              multiple
              range
              value={unavailableDates.map((ymd) => {
                const [y, m, d] = ymd.split("-").map(Number);
                return new Date(y, m - 1, d);
              })}
              onChange={(next) => {
                const arr = Array.isArray(next) ? next : next ? [next] : [];

                const extractYMD = (dt) => {
                  if (!dt) return null;
                  if (!(dt instanceof Date)) return null;
                  const y = dt.getFullYear();
                  const m = String(dt.getMonth() + 1).padStart(2, "0");
                  const d = String(dt.getDate()).padStart(2, "0");
                  return `${y}-${m}-${d}`;
                };

                const toDateLocal = (ymd) => {
                  const [y, m, d] = ymd.split("-").map(Number);
                  return new Date(y, m - 1, d);
                };

                const addExpandedRange = (startYmd, endYmd, out) => {
                  const start = toDateLocal(startYmd);
                  const end = toDateLocal(endYmd);
                  if (isNaN(start.getTime()) || isNaN(end.getTime())) return;

                  const sign = start <= end ? 1 : -1;
                  const totalDays = Math.abs(
                    Math.round((end - start) / (24 * 60 * 60 * 1000)),
                  );

                  for (let i = 0; i <= totalDays; i++) {
                    const dt = new Date(
                      start.getFullYear(),
                      start.getMonth(),
                      start.getDate() + sign * i,
                    );
                    const y = dt.getFullYear();
                    const m = String(dt.getMonth() + 1).padStart(2, "0");
                    const d = String(dt.getDate()).padStart(2, "0");
                    out.add(`${y}-${m}-${d}`);
                  }
                };

                const out = new Set();

                // Expand if the library returns range-like objects, otherwise treat as individual dates
                for (const item of arr) {
                  if (item && typeof item === "object" && (item.start || item.end)) {
                    const startYmd = extractYMD(item.start);
                    const endYmd = extractYMD(item.end);
                    if (startYmd && endYmd) {
                      addExpandedRange(startYmd, endYmd, out);
                      continue;
                    }
                  }

                  const asYmd = extractYMD(item);
                  if (asYmd) out.add(asYmd);
                }

                const uniq = Array.from(out).sort();
                setUnavailableDates(uniq);
                setForm((prev) => ({ ...prev, unavailableDates: uniq }));
                console.log("Selected Dates:", uniq);
              }}
              className="qs-date-picker"
              calendarClassName="qs-date-picker__calendar"
              containerClassName="qs-date-picker__container"
              placeholder="Select unavailable dates"
            />

            <div className="mt-4">

              {(unavailableDates || []).length === 0 ? (
                <div className="rounded-lg border border-dashed border-indigo-400/30 bg-[#1a1830] px-4 py-3 text-xs font-semibold text-[#94a3b8]">
                  No unavailable dates added yet.
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="text-xs font-bold text-slate-300">
                    Unavailable Dates
                  </div>

                  <div className="space-y-2">
                    {unavailableDates
                      .slice()
                      .sort()
                      .map((ymd) => (
                        <div
                          key={ymd}
                          className="flex items-center justify-between gap-3 rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2"
                        >
                          <div className="text-xs font-bold text-red-200">
                            ❌ {ymdToDisplay(ymd)}
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              setUnavailableDates((prev) =>
                                (prev || []).filter((d) => d !== ymd),
                              )
                            }
                            className="rounded-lg border border-red-400/30 bg-red-500/10 px-2 py-1 text-[11px] font-bold text-red-200 transition hover:bg-red-500/20"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                  </div>

                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={clearUnavailableDates}
                      className="w-full rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-xs font-bold text-red-200 transition hover:bg-red-500/20"
                    >
                      Clear All Dates
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>

        <div className="mt-6">
          <div className="text-sm font-bold text-white">Live Service Preview</div>
          <div className="mt-3 rounded-xl border border-[rgba(99,102,241,0.2)] bg-[#1a1830] p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xl font-bold text-white">
                  {form.name || "—"}
                </div>
                <div className="mt-1 text-sm text-[#94a3b8]">
                  {Number(form.price || 0) > 0
                    ? `${formatCurrency(form.price).replace("₹", "")}`
                    : "₹0"}
                </div>
              </div>
              <span className="inline-flex items-center gap-1 rounded-lg bg-white/5 px-3 py-1.5 text-xs font-bold text-slate-200">
                <Clock size={15} />
                {form.duration || "—"}
              </span>
            </div>

            <div className="mt-3 text-sm text-[#94a3b8]">
              <div className="text-white font-bold">Service Details</div>
              <div
                className="mt-2 prose prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: previewHtml }}
              />
              {(!previewHtml || previewHtml === "<p></p>" || previewHtml === "") && (
                <p className="mt-2 text-xs font-semibold">Your description will appear here.</p>
              )}
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <div className="text-xs font-bold text-slate-300">Available days:</div>
              {(previewAvailableDays || []).length === 0 ? (
                <span className="rounded-lg border border-indigo-500/20 bg-indigo-500/10 px-2.5 py-1 text-[11px] font-bold text-indigo-200">
                  Not selected
                </span>
              ) : (
                previewAvailableDays.map((d) => (
                  <span
                    key={d}
                    className="rounded-lg border border-indigo-500/20 bg-indigo-500/10 px-2.5 py-1 text-[11px] font-bold text-indigo-200"
                  >
                    {d}
                  </span>
                ))
              )}
            </div>

            <div className="mt-4">
              <div className="text-xs font-bold text-slate-300">Unavailable dates:</div>
              {(previewUnavailableDates || []).length === 0 ? (
                <div className="mt-2 text-xs font-semibold text-[#94a3b8]">
                  None
                </div>
              ) : (
                <div className="mt-2 flex flex-wrap gap-2">
                  {previewUnavailableDates.map((d) => (
                    <span
                      key={d}
                      className="rounded-lg border border-red-400/30 bg-red-500/10 px-2.5 py-1 text-[11px] font-bold text-red-200"
                    >
                      ❌ {ymdToDisplay(d)}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-indigo-500/20"
        >
          <Plus size={17} />
          {editingId ? "Save Service" : "Add Service"}
        </button>
      </form>

      {services.length === 0 ? (
        <div className="rounded-xl border border-dashed border-indigo-400/30 bg-[#1a1830] p-8 text-center text-[#94a3b8]">
          No services added yet — add your first service above
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {services.map((service) => (
            <article
              key={service.id}
              className="rounded-xl border border-[rgba(99,102,241,0.2)] bg-[#1a1830] p-5"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white">{service.name}</h3>
                  <p className="mt-2 text-sm text-[#94a3b8]">{service.description}</p>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-sm font-bold text-emerald-300">
                  <IndianRupee size={14} />
                  {formatCurrency(service.price).replace("₹", "")}
                </span>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-slate-300">
                <span className="inline-flex items-center gap-1 rounded-lg bg-white/5 px-3 py-1.5">
                  <Clock size={15} />
                  {service.duration}
                </span>
                {(service.availability || []).map((day) => (
                  <span
                    key={day}
                    className="rounded-lg border border-indigo-500/20 bg-indigo-500/10 px-2.5 py-1 text-xs font-bold text-indigo-200"
                  >
                    {day}
                  </span>
                ))}
              </div>
              <div className="mt-5 flex gap-2">
                <button
                  type="button"
                  onClick={() => handleEdit(service)}
                  className="inline-flex items-center gap-2 rounded-lg border border-indigo-400/30 bg-indigo-500/10 px-3 py-2 text-sm font-bold text-indigo-200 transition hover:bg-indigo-500/20"
                >
                  <Pencil size={15} />
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(service.id)}
                  className="inline-flex items-center gap-2 rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm font-bold text-red-200 transition hover:bg-red-500/20"
                >
                  <Trash2 size={15} />
                  Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

