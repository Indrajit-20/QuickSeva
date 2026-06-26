import { useState, useEffect } from "react";
import { Save } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import apiClient from "../../api/axiosConfig";
import LocationPicker from "../../components/LocationPicker";

const inputClass =
  "w-full rounded-lg border border-indigo-500/20 bg-[#0f0e1a] px-3 py-2.5 text-sm font-medium text-white outline-none transition placeholder:text-slate-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20";

const labelClass = "mb-2 block text-sm font-semibold text-slate-300";

export default function SellerProfile() {
  const { user, updateUser } = useAuth();

  const [profile, setProfile] = useState({
    fullName: user?.name || "",
    phoneNumber: user?.phone || "",
    gstnumber: "",
    serviceType: "AC Repair",
    bio: "",
    experience: "",

    // New: Service Availability (mock marketplace fields)
    serviceMode: "online",
    serviceModeLabel: "Online Only",
    instantService: false,

    lat: null,
    lng: null,
    address: "",
  });

  const [saved, setSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchProfile = async () => {
      try {
        const resp = await apiClient.get("/sellers/me/profile");
        if (resp?.data?.success && isMounted) {
          const seller = resp.data.data.seller;
          setProfile((prev) => ({
            ...prev,
            fullName: user?.name || prev.fullName,
            phoneNumber: user?.phone || prev.phoneNumber,
            gstnumber: seller.gst_number || prev.gstnumber,
            bio: seller.bio || prev.bio,
            experience: seller.experience_yrs !== undefined ? seller.experience_yrs : prev.experience,
            lat: seller.lat || seller.latitude || null,
            lng: seller.lng || seller.longitude || null,
            address: seller.location_address || seller.address || "",
          }));
        }
      } catch (err) {
        console.error("Failed to load seller profile from backend:", err);
      }
    };
    fetchProfile();
    return () => {
      isMounted = false;
    };
  }, [user]);

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

  const handleSubmit = async (e) => {
    e.preventDefault();

    // GST is optional; validate only if user typed something.
    const gst = profile.gstnumber?.trim();
    const gstRegex = /^(\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}Z[A-Z\d]{1})$/;
    if (gst && !gstRegex.test(profile.gstnumber)) {
      setSaved(false);
      alert("Invalid GSTIN format. Example: 27ABCDE1234F2Z5");
      return;
    }

    setIsSaving(true);
    try {
      // 1. Update user profile (name)
      await apiClient.put("/users/profile", {
        name: profile.fullName,
      });

      // 2. Update seller profile (bio, experience, gst_number, profile_completed)
      await apiClient.put("/sellers/me/profile", {
        bio: profile.bio,
        experience_yrs: Number(profile.experience || 0),
        gst_number: profile.gstnumber,
        profile_completed: 1,
      });

      // 3. Update context
      updateUser({
        name: profile.fullName,
        phone: profile.phoneNumber,
        profile_completed: 1,
      });

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error("Failed to save profile:", err);
      alert("Failed to save profile. Please check connection and try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="animate-fade-in space-y-6">
      {saved && (
        <div className="fixed right-4 top-4 z-50 rounded-lg border border-emerald-400/30 bg-emerald-500/15 px-4 py-3 text-sm font-bold text-emerald-200 shadow-xl">
          Profile updated successfully!
        </div>
      )}

      {Number(user?.profile_completed ?? 0) === 0 && (
        <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-200 text-sm font-semibold flex items-center gap-3 animate-pulse">
          <span className="text-xl">⚠️</span>
          <div>
            <p className="font-bold text-amber-300">Complete Your Profile</p>
            <p className="text-xs font-normal text-amber-200/80 mt-0.5">
              Please fill in your details and click "Save Profile" below to unlock the Seller Dashboard, Services, and Orders pages.
            </p>
          </div>
        </div>
      )}

      {Number(user?.profile_completed ?? 0) === 1 && Number(user?.services_count ?? 0) === 0 && (
        <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-200 text-sm font-semibold flex items-center gap-3 animate-pulse">
          <span className="text-xl">⚠️</span>
          <div>
            <p className="font-bold text-amber-300">Add Your First Service</p>
            <p className="text-xs font-normal text-amber-200/80 mt-0.5">
              Please go to "My Services" and add at least one service to unlock the Seller Dashboard, Orders, and Wallet pages.
            </p>
          </div>
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
            <p className="mt-1 text-[#94a3b8]">{user?.phone || user?.email || ""}</p>

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
            <label className={labelClass}>GST Number (Optional)</label>
            <input
              name="gstnumber"
              value={profile.gstnumber}
              onChange={(e) => {
                const raw = e.target.value;
                const next = raw
                  .toUpperCase()
                  // GSTIN is alphanumeric; keep only A-Z / 0-9
                  .replace(/[^A-Z0-9]/g, "");
                setProfile((prev) => ({ ...prev, gstnumber: next }));
              }}
              className={
                profile.gstnumber
                  ? /^(\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}Z[A-Z\d]{1})$/.test(
                      profile.gstnumber
                    )
                    ? inputClass
                    : `${inputClass} border-red-500/60 focus:border-red-500 focus:ring-red-500/20`
                  : inputClass
              }
              placeholder="Eg: 27ABCDE1234F2Z5"
              inputMode="text"
              autoComplete="off"
            />
            {profile.gstnumber &&
              !/^(\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}Z[A-Z\d]{1})$/.test(
                profile.gstnumber
              ) && (
                <div className="mt-1 text-xs font-semibold text-red-300">
                  Invalid GSTIN format. Example: 27ABCDE1234F2Z5
                </div>
              )}
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
