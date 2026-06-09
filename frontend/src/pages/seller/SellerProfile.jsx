import { useState } from "react";
import { Save } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { serviceOptions } from "./sellerData";

const inputClass =
  "w-full rounded-lg border border-indigo-500/20 bg-[#0f0e1a] px-3 py-2.5 text-sm font-medium text-white outline-none transition placeholder:text-slate-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20";

const labelClass = "mb-2 block text-sm font-semibold text-slate-300";

export default function SellerProfile() {
  const { user, updateUser, getUserIdentifier } = useAuth();
  const savedProfile = (() => {
    try {
      return JSON.parse(localStorage.getItem("sellerProfile") || "{}");
    } catch {
      return {};
    }
  })();

  const [profile, setProfile] = useState({
    fullName: savedProfile.fullName || user?.name || "",
    phoneNumber: savedProfile.phoneNumber || user?.phone || "",
    serviceType: savedProfile.serviceType || "AC Repair",
    bio: savedProfile.bio || "",
    experience: savedProfile.experience || "",

    // New: Service Availability (mock marketplace fields)
    serviceMode: savedProfile.serviceMode || "online",
    serviceModeLabel: savedProfile.serviceModeLabel || "Online Only",
    instantService: Boolean(savedProfile.instantService),
  });

  const [saved, setSaved] = useState(false);

  const memberSince = user?.loginTime
    ? new Intl.DateTimeFormat("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(new Date(user.loginTime))
    : "Today";

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    localStorage.setItem("sellerProfile", JSON.stringify(profile));
    updateUser({ name: profile.fullName, phone: profile.phoneNumber });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="animate-fade-in space-y-6">
      {saved && (
        <div className="fixed right-4 top-4 z-50 rounded-lg border border-emerald-400/30 bg-emerald-500/15 px-4 py-3 text-sm font-bold text-emerald-200 shadow-xl">
          Profile updated successfully!
        </div>
      )}

      <section className="rounded-xl border border-[rgba(99,102,241,0.2)] bg-[#1a1830] p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-4xl font-black text-white">
            {(profile.fullName?.[0] || user?.name?.[0] || "S").toUpperCase()}
          </div>
          <div className="min-w-0">
            <h1 className="text-3xl font-bold text-white">
              {profile.fullName || "Seller"}
            </h1>
            <p className="mt-1 text-[#94a3b8]">{getUserIdentifier()}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="rounded-full border border-indigo-400/30 bg-indigo-500/10 px-3 py-1 text-xs font-bold text-indigo-200">
                {user?.type === "email" ? "Email Login" : "OTP Login"}
              </span>
              <span className="rounded-full border border-slate-500/30 bg-white/5 px-3 py-1 text-xs font-bold text-slate-300">
                Member since {memberSince}
              </span>
            </div>
          </div>
        </div>
      </section>

      <form
        onSubmit={handleSubmit}
        className="rounded-xl border border-[rgba(99,102,241,0.2)] bg-[#1a1830] p-6"
      >
        <h2 className="mb-5 text-xl font-bold text-white">Edit Profile</h2>

        {/* Service Settings (new, frontend-only) */}
        <div className="mb-5 rounded-xl border border-[rgba(99,102,241,0.18)] bg-[#0f1024] p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className="text-lg font-black text-white">Service Settings</h3>
            <span className="rounded-full border border-indigo-400/30 bg-indigo-500/10 px-3 py-1 text-[11px] font-bold text-indigo-200">
              {profile.serviceModeLabel || "Service Availability"}
            </span>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className={labelClass}>Service Mode</label>
              <div className="space-y-2">
                {[
                  { value: "online", label: "Online Only", hint: "Remote work" },
                  { value: "offline", label: "Offline Only", hint: "Visit customer location" },
                  { value: "both", label: "Both Online & Offline", hint: "Hybrid" },
                ].map((opt) => {
                  const checked = profile.serviceMode === opt.value;
                  return (
                    <label
                      key={opt.value}
                      className={`flex cursor-pointer items-start gap-3 rounded-xl border px-3 py-3 transition ${checked
                        ? "border-indigo-400/60 bg-indigo-500/10"
                        : "border-indigo-500/20 bg-[#0f0e1a] hover:border-indigo-400/40"
                      }`}
                    >
                      <input
                        type="radio"
                        name="serviceMode"
                        value={opt.value}
                        checked={checked}
                        onChange={() =>
                          setProfile((prev) => ({
                            ...prev,
                            serviceMode: opt.value,
                            serviceModeLabel: opt.label,
                          }))
                        }
                        className="mt-0.5 accent-indigo-500"
                      />
                      <div className="min-w-0">
                        <div className="text-sm font-black text-white">
                          {opt.label}
                        </div>
                        <div className="mt-1 text-xs font-semibold text-[#94a3b8]">
                          {opt.hint}
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            <div>
              <label className={labelClass}>Availability</label>
              <label
                className={`flex cursor-pointer items-center justify-between gap-3 rounded-xl border px-3 py-3 transition ${profile.instantService
                  ? "border-emerald-400/50 bg-emerald-500/10"
                  : "border-indigo-500/20 bg-[#0f0e1a] hover:border-emerald-400/30"
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={Boolean(profile.instantService)}
                    onChange={(e) =>
                      setProfile((prev) => ({
                        ...prev,
                        instantService: e.target.checked,
                      }))
                    }
                    className="h-4 w-4 accent-emerald-400"
                  />
                  <div>
                    <div className="text-sm font-black text-white">
                      Instant Service Available
                    </div>
                    <div className="mt-1 text-xs font-semibold text-[#94a3b8]">
                      Show ⚡ Instant Service badge
                    </div>
                  </div>
                </div>
                <span
                  className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-black ${profile.instantService
                    ? "bg-emerald-500/15 text-emerald-200 border border-emerald-400/40"
                    : "bg-white/5 text-slate-300 border border-indigo-400/20"
                  }`}
                >
                  {profile.instantService ? "Enabled" : "Disabled"}
                </span>
              </label>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">

          <div>
            <label className={labelClass}>Full Name</label>
            <input
              name="fullName"
              value={profile.fullName}
              onChange={handleChange}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Phone Number</label>
            <input
              name="phoneNumber"
              value={profile.phoneNumber}
              onChange={handleChange}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Service Type</label>
            <select
              name="serviceType"
              value={profile.serviceType}
              onChange={handleChange}
              className={inputClass}
            >
              {serviceOptions.map((service) => (
                <option key={service}>{service}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Years of Experience</label>
            <input
              name="experience"
              type="number"
              min="0"
              value={profile.experience}
              onChange={handleChange}
              className={inputClass}
            />
          </div>
          <div className="md:col-span-2">
            <label className={labelClass}>About/Bio</label>
            <textarea
              name="bio"
              rows="4"
              value={profile.bio}
              onChange={handleChange}
              className={inputClass}
              placeholder="Tell customers about your work and experience"
            />
          </div>
        </div>
        <button type="submit" className="mt-6 inline-flex items-center gap-2 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-indigo-500/20">
          <Save size={17} />
          Save Profile
        </button>
      </form>
    </div>
  );
}
