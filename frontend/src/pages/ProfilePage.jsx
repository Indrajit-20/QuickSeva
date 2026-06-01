import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";

const GENDER_OPTIONS = [
  "Male",
  "Female",
  "Non-binary",
  "Prefer not to say",
];

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

const normalizeUserFields = (u) => ({
  fullName: u?.name || "",
  email: u?.email || "",
  phone: u?.phone || "",
  gender: u?.gender || "",
  dob: u?.dob || "",
  address: u?.address || "",
  memberSince: u?.loginTime || "",
});

const validateField = (name, value) => {
  const text = String(value || "").trim();
  if (!text) return "";

  if (name === "fullName") {
    if (text.length < 2) return "Full name must be at least 2 characters.";
    if (!/^[A-Za-z\s'-]+$/.test(text)) {
      return "Use only letters, spaces, hyphens, and apostrophes.";
    }
  }

  if (name === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)) {
    return "Enter a valid email address, like name@domain.com.";
  }

  if (name === "phone") {
    if (!/^[\d\s+\-()]+$/.test(text)) {
      return "Phone can only include digits, spaces, dashes, +, and brackets.";
    }

    const digits = text.replace(/\D/g, "");
    if (digits.length < 7 || digits.length > 15) {
      return "Phone must contain 7 to 15 digits.";
    }
  }

  if (name === "gender" && !GENDER_OPTIONS.includes(text)) {
    return "Please select a valid gender option.";
  }

  if (name === "dob") {
    const selected = new Date(`${text}T00:00:00`);
    if (Number.isNaN(selected.getTime())) return "Enter a valid date.";

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const oldest = new Date(today);
    oldest.setFullYear(oldest.getFullYear() - 120);

    if (selected > today) return "Date of birth cannot be in the future.";
    if (selected < oldest) {
      return "Date of birth cannot be more than 120 years in the past.";
    }
  }

  return "";
};

const validateForm = (form) => ({
  fullName: validateField("fullName", form.fullName),
  email: validateField("email", form.email),
  phone: validateField("phone", form.phone),
  gender: validateField("gender", form.gender),
  dob: validateField("dob", form.dob),
  address: "",
});

const hasErrors = (errors) => Object.values(errors).some(Boolean);

export default function ProfilePage() {
  const { user, updateUser } = useAuth();

  const initial = useMemo(() => {
    const stored = readLoggedInUser();
    return normalizeUserFields(stored || user);
  }, [user]);

  const [toast, setToast] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState(initial);
  const [savedProfile, setSavedProfile] = useState(initial);
  const [errors, setErrors] = useState(() => validateForm(initial));
  const [touched, setTouched] = useState({});

  useEffect(() => {
    setForm(initial);
    setSavedProfile(initial);
    setErrors(validateForm(initial));
    setTouched({});
  }, [initial]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(""), 3200);
    return () => clearTimeout(timer);
  }, [toast]);

  const initials = useMemo(
    () => getInitials(savedProfile.fullName || user?.name),
    [savedProfile.fullName, user?.name],
  );

  const updateField = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: validateField(name, value) }));
    setTouched((prev) => ({ ...prev, [name]: true }));
  };

  const save = () => {
    const nextErrors = validateForm(form);
    setErrors(nextErrors);
    setTouched({
      fullName: true,
      email: true,
      phone: true,
      gender: true,
      dob: true,
      address: true,
    });

    if (hasErrors(nextErrors)) return;

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
      // Local profile persistence is best-effort.
    }

    setSavedProfile(normalizeUserFields(nextUser));
    setIsEditing(false);
    setToast("Profile updated successfully.");
  };

  const cancel = () => {
    setForm(savedProfile);
    setErrors(validateForm(savedProfile));
    setTouched({});
    setIsEditing(false);
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6">
          <p className="text-sm font-bold text-purple-600">QuickSeva</p>
          <h1 className="text-4xl font-black text-slate-950">My Profile</h1>
        </div>

        {toast && (
          <div className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-xl border border-emerald-200 bg-white px-5 py-3 text-sm font-bold text-emerald-700 shadow-lg">
            {toast}
          </div>
        )}

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-purple-600 text-2xl font-black text-white">
              {initials}
            </div>
            <div>
              <div className="text-2xl font-black text-slate-950">
                {savedProfile.fullName || "Your Name"}
              </div>
              <div className="mt-1 text-sm font-semibold text-purple-700">
                Member since:{" "}
                {savedProfile.memberSince
                  ? new Date(savedProfile.memberSince).toLocaleDateString(
                      "en-IN",
                    )
                  : "-"}
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-black text-slate-950">
              Profile details
            </h2>
            {!isEditing ? (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="rounded-xl bg-purple-600 px-4 py-2 text-sm font-black text-white hover:bg-purple-700"
              >
                Edit Profile
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={cancel}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={save}
                  className="rounded-xl bg-purple-600 px-4 py-2 text-sm font-black text-white hover:bg-purple-700"
                >
                  Save changes
                </button>
              </div>
            )}
          </div>

          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <Field
              label="Full Name"
              value={form.fullName}
              editing={isEditing}
              error={touched.fullName ? errors.fullName : ""}
              valid={Boolean(touched.fullName && form.fullName.trim() && !errors.fullName)}
              onChange={(value) => updateField("fullName", value)}
              placeholder="Your full name"
            />

            <Field
              label="Email"
              value={form.email}
              editing={isEditing}
              type="email"
              error={touched.email ? errors.email : ""}
              valid={Boolean(touched.email && form.email.trim() && !errors.email)}
              onChange={(value) => updateField("email", value)}
              placeholder="you@example.com"
            />

            <Field
              label="Phone"
              value={form.phone}
              editing={isEditing}
              error={touched.phone ? errors.phone : ""}
              valid={Boolean(touched.phone && form.phone.trim() && !errors.phone)}
              onChange={(value) => updateField("phone", value)}
              placeholder="+91 98765 43210"
            />

            <SelectField
              label="Gender"
              value={form.gender}
              editing={isEditing}
              options={GENDER_OPTIONS}
              error={touched.gender ? errors.gender : ""}
              valid={Boolean(touched.gender && form.gender.trim() && !errors.gender)}
              onChange={(value) => updateField("gender", value)}
            />

            <Field
              label="Date of Birth"
              value={form.dob}
              editing={isEditing}
              type="date"
              error={touched.dob ? errors.dob : ""}
              valid={Boolean(touched.dob && form.dob.trim() && !errors.dob)}
              onChange={(value) => updateField("dob", value)}
            />

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-black text-slate-700">
                Address
              </label>
              {!isEditing ? (
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-semibold text-slate-800">
                  {savedProfile.address || "-"}
                </div>
              ) : (
                <textarea
                  value={form.address}
                  onChange={(e) => updateField("address", e.target.value)}
                  rows={3}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-100"
                  placeholder="House no, street, area, city"
                />
              )}
            </div>
          </div>

          <div className="mt-6 text-xs font-bold text-slate-500">
            Data is stored locally in this frontend.
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
  error = "",
  valid = false,
  onChange,
  placeholder,
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-black text-slate-700">
        {label}
      </label>
      {!editing ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-semibold text-slate-800">
          {value || "-"}
        </div>
      ) : (
        <>
          <input
            type={type}
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            placeholder={placeholder}
            className={`w-full rounded-xl border bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 ${
              error
                ? "border-red-300 focus:border-red-500 focus:ring-red-100"
                : "border-slate-200 focus:border-purple-500 focus:ring-purple-100"
            }`}
          />
          <ValidationMessage error={error} valid={valid} />
        </>
      )}
    </div>
  );
}

function SelectField({ label, value, editing, options, error, valid, onChange }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-black text-slate-700">
        {label}
      </label>
      {!editing ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-semibold text-slate-800">
          {value || "-"}
        </div>
      ) : (
        <>
          <select
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            className={`w-full rounded-xl border bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 ${
              error
                ? "border-red-300 focus:border-red-500 focus:ring-red-100"
                : "border-slate-200 focus:border-purple-500 focus:ring-purple-100"
            }`}
          >
            <option value="">Select gender</option>
            {options.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <ValidationMessage error={error} valid={valid} />
        </>
      )}
    </div>
  );
}

function ValidationMessage({ error, valid }) {
  if (error) {
    return <p className="mt-2 text-xs font-bold text-red-600">{error}</p>;
  }

  if (valid) {
    return (
      <p className="mt-2 text-xs font-bold text-emerald-600">✓ Looks good</p>
    );
  }

  return null;
}
