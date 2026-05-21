import { useState } from "react";
import { Clock, IndianRupee, Pencil, Plus, Trash2 } from "lucide-react";
import { days, formatCurrency, loadArray, mockServices, serviceOptions } from "./sellerData";

const emptyForm = {
  name: "AC Repair",
  description: "",
  price: "",
  duration: "",
  availability: [],
};

const inputClass =
  "w-full rounded-lg border border-indigo-500/20 bg-[#0f0e1a] px-3 py-2.5 text-sm font-medium text-white outline-none transition placeholder:text-slate-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20";

const labelClass = "mb-2 block text-sm font-semibold text-slate-300";

export default function SellerServices() {
  const [services, setServices] = useState(() =>
    loadArray("sellerServices", mockServices),
  );
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);

  const persist = (nextServices) => {
    setServices(nextServices);
    localStorage.setItem("sellerServices", JSON.stringify(nextServices));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const toggleDay = (day) => {
    setForm((prev) => {
      const set = new Set(prev.availability);
      if (set.has(day)) set.delete(day);
      else set.add(day);
      return { ...prev, availability: Array.from(set) };
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const service = {
      ...form,
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
    setForm({
      name: service.name,
      description: service.description,
      price: service.price,
      duration: service.duration,
      availability: service.availability || [],
    });
  };

  const handleDelete = (id) => {
    persist(services.filter((service) => service.id !== id));
    if (editingId === id) {
      setEditingId(null);
      setForm(emptyForm);
    }
  };

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
          </div>
          <div>
            <label className={labelClass}>Duration</label>
            <input
              name="duration"
              value={form.duration}
              onChange={handleChange}
              className={inputClass}
              placeholder="2 hours"
              required
            />
          </div>
          <div>
            <label className={labelClass}>Availability</label>
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
          </div>
          <div className="md:col-span-2">
            <label className={labelClass}>Description</label>
            <textarea
              name="description"
              rows="3"
              value={form.description}
              onChange={handleChange}
              className={inputClass}
              required
            />
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
                  <p className="mt-2 text-sm text-[#94a3b8]">
                    {service.description}
                  </p>
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
