import React, { useState, useEffect, useRef, useMemo } from "react";
import { Save, Pencil, Camera, Eye, ShieldCheck, CheckCircle2, User, Mail, Phone, Calendar, MapPin, Heart } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import apiClient from "../api/axiosConfig";
import { scrollToFirstError } from "../utils/scrollUtils";
import { buyerOrdersApi } from "../api/orderApi";

const GENDER_OPTIONS = [
  "Male",
  "Female",
  "Non-binary",
  "Prefer not to say",
];

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 shadow-sm";

const labelClass = "mb-2 block text-sm font-semibold text-slate-600";

const cardBase = "rounded-xl border border-slate-200 bg-white p-5 flex flex-col justify-between shadow-sm";

export default function ProfilePage() {
  const { user, updateUser, refreshAuth, activeRole } = useAuth();
  const fileInputRef = useRef(null);

  // Profile Form State
  const [profile, setProfile] = useState({
    fullName: user?.name || "",
    email: user?.email || "",
    phoneNumber: user?.phone || "",
    gender: user?.gender || "",
    dob: user?.dob ? user.dob.split("T")[0] : "",
    address: user?.address || "",
  });

  const [bookingsCount, setBookingsCount] = useState({ total: 0, completed: 0, pending: 0 });
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [toast, setToast] = useState("");
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // Sync profile details when user loads from context
  useEffect(() => {
    if (user) {
      setProfile({
        fullName: user.name || "",
        email: user.email || "",
        phoneNumber: user.phone || "",
        gender: user.gender || "",
        dob: user.dob ? user.dob.split("T")[0] : "",
        address: user.address || "",
      });
    }
  }, [user]);

  // Load customer statistics (bookings) on mount
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await buyerOrdersApi.list();
        const list = res?.data?.orders || res?.orders || [];
        if (Array.isArray(list)) {
          const completed = list.filter((b) => b.status === "completed").length;
          const pending = list.filter((b) => b.status === "pending" || b.status === "accepted" || b.status === "in_progress").length;
          setBookingsCount({
            total: list.length,
            completed,
            pending,
          });
        }
      } catch (err) {
        console.error("Failed to load booking stats:", err);
      }
    };
    fetchStats();
  }, []);

  // Toast Auto-cleanup
  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(""), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  const memberSince = useMemo(() => {
    if (user?.created_at) {
      return new Intl.DateTimeFormat("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(new Date(user.created_at));
    }
    return "Today";
  }, [user?.created_at]);

  const getImageUrl = (url) => {
    if (!url) return "";
    if (url.startsWith("http")) return url;
    const base = apiClient.defaults.baseURL ? apiClient.defaults.baseURL.replace("/api", "") : "http://localhost:5000";
    return `${base}${url}`;
  };

  const handleAvatarClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("File size exceeds 5MB limit.");
      return;
    }

    const formData = new FormData();
    formData.append("profile_pic", file);

    setIsUploadingAvatar(true);
    try {
      const resp = await apiClient.put("/users/profile", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (resp?.data?.success) {
        const updatedUser = resp.data.data.user;
        updateUser(updatedUser);
        setToast("Profile picture updated successfully!");
      }
    } catch (err) {
      console.error("Failed to upload profile picture:", err);
      alert("Failed to upload profile picture.");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const validateField = (name, value) => {
    const text = String(value || "").trim();
    if (!text) return "";

    if (name === "fullName") {
      if (text.length < 2) return "Full name must be at least 2 characters.";
    }

    if (name === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)) {
      return "Enter a valid email address.";
    }

    if (name === "dob") {
      const selected = new Date(text);
      if (Number.isNaN(selected.getTime())) return "Enter a valid date.";
      const today = new Date();
      if (selected > today) return "Date of birth cannot be in the future.";
    }

    return "";
  };

  const validateAll = () => {
    const nextErrors = {
      fullName: validateField("fullName", profile.fullName),
      email: validateField("email", profile.email),
      dob: validateField("dob", profile.dob),
    };
    setErrors(nextErrors);
    setTouched({
      fullName: true,
      email: true,
      gender: true,
      dob: true,
      address: true,
    });
    return !Object.values(nextErrors).some(Boolean);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
    if (touched[name]) {
      setErrors((prev) => ({ ...prev, [name]: validateField(name, value) }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    setErrors((prev) => ({ ...prev, [name]: validateField(name, value) }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!validateAll()) {
      scrollToFirstError(errors);
      return;
    }

    setIsSaving(true);
    try {
      const resp = await apiClient.put("/users/profile", {
        name: profile.fullName,
        email: profile.email,
        gender: profile.gender,
        dob: profile.dob || null,
        address: profile.address,
      });

      if (resp?.data?.success) {
        const updatedUser = resp.data.data.user;
        updateUser(updatedUser);
        setToast("Profile details updated successfully.");
        setIsEditing(false);
      }
    } catch (err) {
      console.error("Failed to update profile:", err);
      alert("Failed to save changes. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 px-3 py-4 sm:px-4 sm:py-8 pb-20 animate-fade-in">
      <div className="mx-auto max-w-4xl space-y-4">
        
        {/* Title */}
        <div className="flex justify-between items-end border-b border-slate-200 pb-3">
          <div>
            <p className="text-xs font-black tracking-widest text-indigo-600 uppercase">QuickSeva</p>
            <h1 className="text-xl font-black text-slate-900 mt-0.5">My Profile</h1>
          </div>
        </div>

        {toast && (
          <div className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-xl border border-emerald-200 bg-white px-4 py-2.5 text-xs font-bold text-emerald-700 shadow-lg animate-fade-in">
            ✓ {toast}
          </div>
        )}

        {/* Compact Profile Card Header */}
        <section className="relative rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
          {/* Edit Profile Toggle Button */}
          <button
            type="button"
            onClick={() => {
              if (isEditing) {
                setProfile({
                  fullName: user?.name || "",
                  email: user?.email || "",
                  phoneNumber: user?.phone || "",
                  gender: user?.gender || "",
                  dob: user?.dob ? user.dob.split("T")[0] : "",
                  address: user?.address || "",
                });
                setErrors({});
                setTouched({});
              }
              setIsEditing(!isEditing);
            }}
            className="absolute right-3 top-3 flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition cursor-pointer z-10"
          >
            {isEditing ? (
              <><Eye size={12} /><span>View</span></>
            ) : (
              <><Pencil size={12} /><span>Edit Profile</span></>
            )}
          </button>

          {/* Horizontal Avatar + Info Row */}
          <div className="flex items-center gap-3 p-4">
            {/* Profile Avatar */}
            <div
              className={`relative shrink-0 ${isEditing ? "group cursor-pointer" : "cursor-default"}`}
              onClick={isEditing ? handleAvatarClick : undefined}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleAvatarChange}
                accept="image/*"
                className="hidden"
              />
              {user?.profile_pic ? (
                <img
                  src={getImageUrl(user.profile_pic)}
                  alt="Profile"
                  className={`h-16 w-16 rounded-xl border-2 border-indigo-500/10 object-cover shadow-md transition duration-200 ${isEditing ? "group-hover:brightness-75" : ""}`}
                />
              ) : (
                <div className={`flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 text-2xl font-black text-white shadow-md transition duration-200 ${isEditing ? "group-hover:brightness-75" : ""}`}>
                  {(profile.fullName?.[0] || user?.name?.[0] || "U").toUpperCase()}
                </div>
              )}

              {isEditing && (
                <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/40 opacity-0 transition duration-200 group-hover:opacity-100">
                  <Camera className="text-white" size={18} />
                </div>
              )}
              {isUploadingAvatar && (
                <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/60">
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                </div>
              )}
            </div>

            {/* User Details — beside avatar */}
            <div className="flex-1 min-w-0 pr-16">
              <h1 className="text-base font-extrabold text-slate-800 flex items-center gap-1.5 truncate">
                {profile.fullName || "User"}
                {user?.is_verified === 1 && (
                  <ShieldCheck className="text-indigo-600 fill-indigo-50 shrink-0" size={16} />
                )}
              </h1>
              <p className="mt-0.5 text-[11px] font-medium text-slate-500 truncate">
                Customer • {profile.phoneNumber || "No phone linked"}
                {activeRole && activeRole !== "user" && (
                  <span className="ml-1 capitalize font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded-full text-xs">
                    {activeRole}
                  </span>
                )}
              </p>
              {/* Badges inline */}
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                <span className="rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-600">
                  Member since {memberSince}
                </span>
                {user?.is_verified === 1 && (
                  <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-700 flex items-center gap-0.5">
                    <CheckCircle2 size={10} /> Verified
                  </span>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Profile Content View / Edit Mode */}
        {!isEditing ? (
          /* READ-ONLY VIEW MODE */
          <div className="space-y-4">
            
            {/* Compact Stats Row */}
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm text-center">
                <div className="text-[10px] sm:text-xs text-slate-400 font-bold uppercase tracking-wider">Total</div>
                <div className="mt-1 text-xl font-black text-slate-800">{bookingsCount.total}</div>
                <div className="text-indigo-600 text-xs font-medium">Bookings</div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm text-center">
                <div className="text-[10px] sm:text-xs text-slate-400 font-bold uppercase tracking-wider">Active</div>
                <div className="mt-1 text-xl font-black text-slate-800">{bookingsCount.pending}</div>
                <div className="text-indigo-600 text-xs font-medium">Pending</div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm text-center">
                <div className="text-[10px] sm:text-xs text-slate-400 font-bold uppercase tracking-wider">Done</div>
                <div className="mt-1 text-xl font-black text-slate-800">{bookingsCount.completed}</div>
                <div className="text-indigo-600 text-xs font-medium">Completed</div>
              </div>
            </div>

            {/* Profile Info Details Grid */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-4 shadow-sm">
              <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                <div>
                  <span className="block text-xs text-slate-400 font-bold uppercase tracking-wider mb-0.5">Full Name</span>
                  <span className="text-slate-800 font-semibold text-sm">{profile.fullName || "—"}</span>
                </div>
                <div>
                  <span className="block text-xs text-slate-400 font-bold uppercase tracking-wider mb-0.5">Email Address</span>
                  <span className="text-slate-800 font-semibold text-xs break-all">{profile.email || "—"}</span>
                </div>
                <div>
                  <span className="block text-xs text-slate-400 font-bold uppercase tracking-wider mb-0.5">Gender</span>
                  <span className="text-slate-800 font-semibold text-sm">{profile.gender || "—"}</span>
                </div>
                <div>
                  <span className="block text-xs text-slate-400 font-bold uppercase tracking-wider mb-0.5">Date of Birth</span>
                  <span className="text-slate-800 font-semibold text-xs">
                    {profile.dob ? new Date(profile.dob).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                  </span>
                </div>
              </div>

              {profile.address && (
                <div className="pt-3 border-t border-slate-100">
                  <span className="text-slate-500 font-semibold flex items-center gap-1.5 mb-1 text-xs uppercase tracking-wider">
                    <MapPin size={13} className="text-slate-400" />
                    <span>Saved Delivery Address</span>
                  </span>
                  <span className="text-slate-700 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200 font-medium text-xs leading-relaxed block">
                    {profile.address}
                  </span>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* EDIT PROFILE FORM MODE */
          <form onSubmit={handleSave} className="rounded-xl border border-slate-200 bg-white p-6 space-y-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h2 className="text-xl font-bold text-slate-800">Edit Profile Details</h2>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="text-sm font-semibold text-slate-500 hover:text-slate-700 transition cursor-pointer"
              >
                Cancel
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {/* Full Name */}
              <div>
                <label className={labelClass}>Full Name</label>
                <input
                  name="fullName"
                  value={profile.fullName}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`${inputClass} ${errors.fullName ? "border-red-400 focus:border-red-500 focus:ring-red-100" : ""}`}
                />
                {errors.fullName && touched.fullName && (
                  <p className="mt-1.5 text-xs font-semibold text-red-500">⚠ {errors.fullName}</p>
                )}
              </div>

              {/* Email Address */}
              <div>
                <label className={labelClass}>Email Address</label>
                <input
                  type="email"
                  name="email"
                  value={profile.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`${inputClass} ${errors.email ? "border-red-400 focus:border-red-500 focus:ring-red-100" : ""}`}
                />
                {errors.email && touched.email && (
                  <p className="mt-1.5 text-xs font-semibold text-red-500">⚠ {errors.email}</p>
                )}
              </div>

              {/* Phone Number (Disabled) */}
              <div>
                <label className={labelClass}>Phone Number</label>
                <input
                  name="phoneNumber"
                  value={profile.phoneNumber}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-400 outline-none cursor-not-allowed shadow-sm"
                  disabled
                />
                <p className="mt-1 text-[10px] text-slate-400">Phone number cannot be modified.</p>
              </div>

              {/* Gender */}
              <div>
                <label className={labelClass}>Gender</label>
                <select
                  name="gender"
                  value={profile.gender}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={inputClass}
                >
                  <option value="">Select Gender</option>
                  {GENDER_OPTIONS.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>

              {/* Date of Birth */}
              <div>
                <label className={labelClass}>Date of Birth</label>
                <input
                  type="date"
                  name="dob"
                  value={profile.dob}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`${inputClass} ${errors.dob ? "border-red-400 focus:border-red-500 focus:ring-red-100" : ""}`}
                />
                {errors.dob && touched.dob && (
                  <p className="mt-1.5 text-xs font-semibold text-red-500">⚠ {errors.dob}</p>
                )}
              </div>
            </div>

            {/* Address */}
            <div>
              <label className={labelClass}>Address</label>
              <textarea
                name="address"
                value={profile.address}
                onChange={handleChange}
                onBlur={handleBlur}
                rows={3}
                placeholder="House number, street name, city, landmark"
                className={inputClass}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setProfile({
                    fullName: user?.name || "",
                    email: user?.email || "",
                    phoneNumber: user?.phone || "",
                    gender: user?.gender || "",
                    dob: user?.dob ? user.dob.split("T")[0] : "",
                    address: user?.address || "",
                  });
                  setErrors({});
                  setTouched({});
                  setIsEditing(false);
                }}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
              >
                {isSaving ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}
