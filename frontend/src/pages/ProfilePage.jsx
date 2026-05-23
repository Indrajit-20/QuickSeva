import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";

const getInitials = (name) => {
  if (!name) return "U";
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
};

const readLoggedInUser = () => {
  try {
    const raw = localStorage.getItem("loggedInUser");
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const normalizeUserFields = (u) => {
  return {
    fullName: u?.name || "",
    email: u?.email || "",
    phone: u?.phone || "",
    gender: u?.gender || "",
    dob: u?.dob || "",
    address: u?.address || "",
    memberSince: u?.loginTime || "",
  };
};

export default function ProfilePage() {
  const { user, updateUser } = useAuth();

  const [toast, setToast] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  const initial = useMemo(() => {
    const stored = readLoggedInUser();
    return normalizeUserFields(stored || user);
  }, [user]);

  const [form, setForm] = useState(initial);

  useEffect(() => {
    setForm(initial);
  }, [initial]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 3200);
    return () => clearTimeout(t);
  }, [toast]);

  const initials = useMemo(
    () => getInitials(form.fullName || user?.name),
    [form.fullName, user?.name],
  );

  const save = () => {
    const nextUser = {
      ...(user || {}),
      name: form.fullName?.trim() || user?.name,
      email: form.email?.trim() || user?.email,
      phone: form.phone?.trim() || user?.phone,
      gender: form.gender?.trim() || "",
      dob: form.dob?.trim() || "",
      address: form.address?.trim() || "",
    };

    updateUser?.(nextUser);

    try {
      localStorage.setItem("loggedInUser", JSON.stringify(nextUser));
    } catch {
      // ignore
    }

    setIsEditing(false);
    setToast("Profile updated successfully!");
  };

  const cancel = () => {
    setForm(initial);
    setIsEditing(false);
  };

  return (
    <main className="min-h-screen bg-brand-bg px-4 py-10">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6">
          <p className="text-sm font-bold text-indigo-600">QuickSeva</p>
          <h1 className="text-4xl font-black text-slate-900">My Profile</h1>
        </div>

        {toast && (
          <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-700 text-sm font-bold">
            {toast}
          </div>
        )}

        <section className="rounded-2xl bg-white border border-indigo-100 shadow-sm p-6 md:p-8">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-indigo-600 text-white flex items-center justify-center text-2xl font-black">
              {initials}
            </div>
            <div>
              <div className="text-slate-900 font-black text-2xl">
                {form.fullName || "Your Name"}
              </div>
              <div className="text-sm font-semibold text-indigo-700 mt-1">
                Member since:{" "}
                {form.memberSince
                  ? new Date(form.memberSince).toLocaleDateString("en-IN")
                  : "—"}
              </div>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between flex-wrap gap-3">
            <h2 className="text-xl font-black text-slate-900">
              Profile details
            </h2>
            {!isEditing ? (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-black text-white hover:bg-emerald-600"
              >
                Edit Profile
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={cancel}
                  className="rounded-xl bg-white border border-indigo-200 px-4 py-2 text-sm font-black text-indigo-700 hover:bg-indigo-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={save}
                  className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-black text-white hover:bg-emerald-600"
                >
                  Save
                </button>
              </div>
            )}
          </div>

          <div className="mt-6 grid gap-5 md:grid-cols-2">
            {/* Full Name */}
            <Field
              label="Full Name"
              value={form.fullName}
              editing={isEditing}
              type="text"
              onChange={(v) => setForm((p) => ({ ...p, fullName: v }))}
              placeholder="Your full name"
            />

            {/* Email */}
            <Field
              label="Email"
              value={form.email}
              editing={isEditing}
              type="email"
              onChange={(v) => setForm((p) => ({ ...p, email: v }))}
              placeholder="you@example.com"
            />

            {/* Phone */}
            <Field
              label="Phone"
              value={form.phone}
              editing={isEditing}
              type="text"
              onChange={(v) =>
                setForm((p) => ({
                  ...p,
                  phone: v.replace(/\D/g, "").slice(0, 10),
                }))
              }
              placeholder="9876543210"
            />

            {/* Gender */}
            <Field
              label="Gender"
              value={form.gender}
              editing={isEditing}
              type="text"
              onChange={(v) => setForm((p) => ({ ...p, gender: v }))}
              placeholder="Male / Female / Other"
            />

            {/* DOB */}
            <Field
              label="Date of Birth"
              value={form.dob}
              editing={isEditing}
              type="date"
              onChange={(v) => setForm((p) => ({ ...p, dob: v }))}
            />

            {/* Address */}
            <div className="md:col-span-2">
              <label className="block text-sm font-black text-slate-700 mb-2">
                Address
              </label>
              {!isEditing ? (
                <div className="rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-slate-800 font-semibold">
                  {form.address || "—"}
                </div>
              ) : (
                <textarea
                  value={form.address}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, address: e.target.value }))
                  }
                  rows={3}
                  className="w-full rounded-xl border border-indigo-200 bg-white px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none"
                  placeholder="House no, street, area, city"
                />
              )}
            </div>
          </div>

          <div className="mt-6 text-xs font-bold text-slate-500">
            Data is stored locally (frontend-only).
          </div>
        </section>
      </div>
    </main>
  );
}

function Field({
  label,
  value,
  editing,
  type = "text",
  onChange,
  placeholder,
}) {
  return (
    <div>
      <label className="block text-sm font-black text-slate-700 mb-2">
        {label}
      </label>
      {!editing ? (
        <div className="rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-slate-800 font-semibold">
          {value || "—"}
        </div>
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-xl border border-indigo-200 bg-white px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none"
        />
      )}
    </div>
  );
}
