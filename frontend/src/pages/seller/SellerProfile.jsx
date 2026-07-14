import { useState, useEffect, useRef } from "react";
import { Save, Pencil, Trash2, Camera, UploadCloud, X, Eye, ShieldCheck, Clock, MapPin, CheckCircle2 } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import apiClient from "../../api/axiosConfig";
import LocationPicker from "../../components/LocationPicker";

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 shadow-sm";

const labelClass = "mb-2 block text-sm font-semibold text-slate-600";

export default function SellerProfile() {
  const { user, updateUser } = useAuth();
  const fileInputRef = useRef(null);
  const workFileInputRef = useRef(null);

  const [profile, setProfile] = useState({
    fullName: user?.name || "",
    phoneNumber: user?.phone || "",
    gstnumber: "",
    serviceType: "AC Repair",
    bio: "",
    experience: "",
    serviceMode: "online",
    serviceModeLabel: "Online Only",
    instantService: false,
    lat: null,
    lng: null,
    address: "",
    profilePictureUrl: "",
    sellerType: "individual",
    pincode: "",
  });

  const [workImages, setWorkImages] = useState([]);
  const [saved, setSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUploadingWork, setIsUploadingWork] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  // Lightbox state for portfolio preview
  const [lightboxImage, setLightboxImage] = useState(null);

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
            profilePictureUrl: seller.profile_picture_url || "",
            sellerType: seller.seller_type || "individual",
            pincode: seller.pincode || "",
          }));
          setWorkImages(seller.work_images || []);
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
      const resp = await apiClient.post("/sellers/me/profile-pic", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (resp?.data?.success) {
        const newUrl = resp.data.data.profile_picture_url;
        setProfile((prev) => ({ ...prev, profilePictureUrl: newUrl }));
        updateUser({
          ...user,
          profile_pic: newUrl,
        });
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (err) {
      console.error("Failed to upload profile picture:", err);
      alert("Failed to upload profile picture.");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleWorkFilesChange = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    await uploadPortfolioFiles(files);
  };

  const uploadPortfolioFiles = async (files) => {
    const validFiles = [];
    for (const file of files) {
      if (file.size > 5 * 1024 * 1024) {
        alert(`File ${file.name} exceeds 5MB limit and was skipped.`);
      } else {
        validFiles.push(file);
      }
    }

    if (validFiles.length === 0) return;

    const formData = new FormData();
    validFiles.forEach((file) => {
      formData.append("work_images", file);
    });

    setIsUploadingWork(true);
    try {
      const resp = await apiClient.post("/sellers/me/work-images", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (resp?.data?.success) {
        const newImages = resp.data.data.work_images;
        setWorkImages((prev) => [...prev, ...newImages]);
      }
    } catch (err) {
      console.error("Failed to upload work images:", err);
      alert("Failed to upload portfolio images.");
    } finally {
      setIsUploadingWork(false);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const files = Array.from(e.dataTransfer.files);
      await uploadPortfolioFiles(files);
    }
  };

  const handleDeleteWorkImage = async (imageId) => {
    if (!window.confirm("Are you sure you want to delete this portfolio image?")) return;

    try {
      const resp = await apiClient.delete(`/sellers/me/work-images/${imageId}`);
      if (resp?.data?.success) {
        setWorkImages((prev) => prev.filter((img) => img.id !== imageId));
      }
    } catch (err) {
      console.error("Failed to delete portfolio image:", err);
      alert("Failed to delete portfolio image.");
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const gst = profile.gstnumber?.trim();
    const gstRegex = /^(\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}Z[A-Z\d]{1})$/;
    if (gst && !gstRegex.test(profile.gstnumber)) {
      setSaved(false);
      alert("Invalid GSTIN format. Example: 27ABCDE1234F2Z5");
      return;
    }

    setIsSaving(true);
    try {
      await apiClient.put("/users/profile", {
        name: profile.fullName,
      });

      await apiClient.put("/sellers/me/profile", {
        bio: profile.bio,
        experience_yrs: Number(profile.experience || 0),
        gst_number: profile.gstnumber,
        profile_completed: 1,
        seller_type: profile.sellerType,
        lat: profile.lat,
        lng: profile.lng,
        address: profile.address,
        pincode: profile.pincode,
      });

      updateUser({
        ...user,
        name: profile.fullName,
        phone: profile.phoneNumber,
        profile_completed: 1,
      });

      setSaved(true);
      setIsEditing(false);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error("Failed to save profile:", err);
      alert("Failed to save profile. Please check connection and try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="animate-fade-in space-y-6 max-w-4xl mx-auto pb-12">
      {saved && (
        <div className="fixed right-4 top-4 z-50 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800 shadow-xl">
          Profile updated successfully!
        </div>
      )}

      {Number(user?.profile_completed ?? 0) === 0 && (
        <div className="p-4 rounded-xl border border-amber-200 bg-amber-50 text-amber-800 text-sm font-semibold flex items-center gap-3 animate-pulse">
          <span className="text-xl">⚠️</span>
          <div>
            <p className="font-bold text-amber-900">Complete Your Profile</p>
            <p className="text-xs font-normal text-amber-800/80 mt-0.5">
              Please fill in your details and click "Save Profile" below to unlock the Seller Dashboard, Services, and Orders pages.
            </p>
          </div>
        </div>
      )}

      {/* Redesigned Centered Header Card */}
      <section className="relative rounded-xl border border-slate-200 bg-white p-8 text-center flex flex-col items-center shadow-sm">
        {/* Elegant Edit Profile Toggle Button */}
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="absolute right-4 top-4 flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 hover:text-slate-900 active:scale-95 transition"
        >
          {isEditing ? (
            <>
              <Eye size={14} />
              <span>View Profile</span>
            </>
          ) : (
            <>
              <Pencil size={14} />
              <span>Edit Profile</span>
            </>
          )}
        </button>

        {/* Profile Avatar with Camera Upload Picker */}
        <div
          className="relative group cursor-pointer"
          onClick={isEditing ? handleAvatarClick : () => {
            const pic = profile.profilePictureUrl || user?.profile_pic;
            if (pic) setLightboxImage(pic);
          }}
        >
          {isEditing && (
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleAvatarChange}
              accept="image/*"
              className="hidden"
            />
          )}
          {profile.profilePictureUrl || user?.profile_pic ? (
            <img
              src={getImageUrl(profile.profilePictureUrl || user?.profile_pic)}
              alt="Profile"
              className={`h-28 w-28 rounded-full border-4 border-indigo-500/10 object-cover shadow-xl transition duration-200 ${isEditing ? "group-hover:brightness-75" : ""}`}
            />
          ) : (
            <div className={`flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 text-4xl font-black text-white force-text-white shadow-xl transition duration-200 ${isEditing ? "group-hover:brightness-75" : ""}`}>
              {(profile.fullName?.[0] || user?.name?.[0] || "S").toUpperCase()}
            </div>
          )}

          {/* Overlay Cam Icon - ONLY SHOW IN EDIT MODE */}
          {isEditing && (
            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition duration-200 group-hover:opacity-100">
              <Camera className="text-white" size={24} />
            </div>
          )}

          {isUploadingAvatar && (
            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/60">
              <span className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
            </div>
          )}
        </div>

        {/* User Centered Details */}
        <h1 className="mt-4 text-3xl font-extrabold text-slate-800 flex items-center gap-2">
          {profile.fullName || "Seller"}
          {Number(user?.profile_completed ?? 0) === 1 && (
            <ShieldCheck className="text-[#0284c7] fill-[#0284c7]/10" size={24} />
          )}
        </h1>
        <p className="mt-1.5 text-sm font-medium text-slate-500 flex flex-wrap items-center justify-center gap-1.5">
          <span>{profile.serviceType || "Service Provider"}</span>
          <span>•</span>
          <span>{profile.phoneNumber || user?.phone || ""}</span>
          <span>•</span>
          <span className="capitalize font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 rounded-full text-[11px] shadow-sm">
            {profile.sellerType === "agency" ? "Contractor / Agency" : profile.sellerType}
          </span>
        </p>

        {/* Badges */}
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <span className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
            {user?.type === "email" ? "Email Login" : "OTP Login"}
          </span>
          <span className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
            Member since {memberSince}
          </span>
          {Number(user?.profile_completed ?? 0) === 1 && (
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 flex items-center gap-1">
              <CheckCircle2 size={12} /> Verified Partner
            </span>
          )}
        </div>
      </section>

      {/* Profile Content View / Edit Mode */}
      {!isEditing ? (
        /* READ-ONLY VIEW MODE */
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            {/* Quick Metrics */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 flex flex-col justify-between shadow-sm">
              <div className="text-slate-500 text-xs font-bold uppercase tracking-wider">Experience</div>
              <div className="mt-2 text-2xl font-black text-slate-800">{profile.experience || 0} Years</div>
              <div className="text-indigo-600 text-xs font-medium mt-1">Professional background</div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 flex flex-col justify-between shadow-sm">
              <div className="text-slate-500 text-xs font-bold uppercase tracking-wider">Service Mode</div>
              <div className="mt-2 text-2xl font-black text-slate-800 capitalize">{profile.serviceModeLabel || "Online"}</div>
              <div className="text-indigo-600 text-xs font-medium mt-1">Availability configuration</div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 flex flex-col justify-between shadow-sm">
              <div className="text-slate-500 text-xs font-bold uppercase tracking-wider">Instant Service</div>
              <div className="mt-2 text-2xl font-black text-slate-800">
                {profile.instantService ? "⚡ Enabled" : "Disabled"}
              </div>
              <div className="text-indigo-600 text-xs font-medium mt-1">Real-time dispatcher</div>
            </div>
          </div>

          {/* About & GST */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-4 shadow-sm">
            <div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">About / Bio</h3>
              <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">
                {profile.bio || "No description provided yet. Click 'Edit Profile' to write a bio!"}
              </p>
            </div>

            {profile.gstnumber && (
              <div className="pt-4 border-t border-slate-100 flex justify-between items-center text-sm">
                <span className="text-slate-500 font-semibold">GSTIN:</span>
                <span className="text-slate-800 font-mono bg-slate-50 px-2.5 py-1 rounded border border-slate-200">
                  {profile.gstnumber}
                </span>
              </div>
            )}

            {profile.address && (
              <div className="pt-4 border-t border-slate-100 flex flex-col gap-1 text-sm text-left">
                <span className="text-slate-500 font-semibold flex items-center gap-1.5">
                  <MapPin size={16} className="text-slate-400" />
                  <span>Service Location / सेवा का स्थान:</span>
                </span>
                <span className="text-slate-700 bg-slate-50 px-3 py-2.5 rounded-lg border border-slate-200 mt-1 font-medium text-xs leading-relaxed">
                  {profile.address} {profile.pincode ? `(Pincode: ${profile.pincode})` : ""}
                </span>
              </div>
            )}
          </div>

          {/* Work Portfolio Section (Read-Only) */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Work Portfolio</h3>
            {workImages.length === 0 ? (
              <div className="text-center py-8 text-slate-400 border border-dashed border-slate-200 rounded-lg">
                No portfolio images uploaded. Toggle Edit mode to showcase your work!
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {workImages.map((img) => (
                  <div
                    key={img.id}
                    className="relative aspect-square rounded-lg overflow-hidden border border-slate-200 cursor-pointer group shadow-md"
                    onClick={() => setLightboxImage(img.image_url)}
                  >
                    <img
                      src={getImageUrl(img.image_url)}
                      alt="Portfolio item"
                      className="w-full h-full object-cover transition duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition duration-200">
                      <Eye size={20} className="text-white" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* EDIT PROFILE FORM MODE */
        <form
          onSubmit={handleSubmit}
          className="rounded-xl border border-slate-200 bg-white p-6 space-y-6 shadow-sm"
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h2 className="text-xl font-bold text-slate-800">Edit Profile Details</h2>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="text-sm font-semibold text-slate-500 hover:text-slate-700 transition"
            >
              Cancel
            </button>
          </div>
          {/* Service Settings */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="text-lg font-black text-slate-800">Service Settings</h3>
              <span className="rounded-full border border-slate-200 bg-slate-200/50 px-3 py-1 text-[11px] font-bold text-slate-700">
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
                          ? "qs-selected-active shadow-sm"
                          : "border-slate-200 bg-white hover:border-slate-300"
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
                          <div className="text-sm font-black text-slate-800">
                            {opt.label}
                          </div>
                          <div className="mt-1 text-xs font-semibold text-slate-500">
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
                    ? "border-emerald-200 bg-emerald-50"
                    : "border-slate-200 bg-white hover:border-slate-300"
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
                      <div className="text-sm font-black text-slate-800">
                        Instant Service Available
                      </div>
                      <div className="mt-1 text-xs font-semibold text-slate-500">
                        Show ⚡ Instant Service badge
                      </div>
                    </div>
                  </div>
                  <span
                    className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-black ${profile.instantService
                      ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                      : "bg-slate-100 text-slate-600 border border-slate-200"
                      }`}
                  >
                    {profile.instantService ? "Enabled" : "Disabled"}
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Form Inputs */}
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
                disabled
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
                  <div className="mt-1 text-xs font-semibold text-red-500">
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

            {/* Partner Type Selection */}
            <div className="md:col-span-2 space-y-3">
              <label className={labelClass}>Partner Type / पार्टनर का प्रकार</label>
              <div className="grid gap-4 sm:grid-cols-3">
                {[
                  { value: "individual", label: "Individual / व्यक्तिगत", desc: "I work as a sole professional" },
                  { value: "agency", label: "Contractor / Agency / ठेकेदार या एजेंसी", desc: "I have a team of workers" },
                  { value: "business", label: "Business / व्यवसाय या दुकान", desc: "I have a business or shop" }
                ].map((opt) => {
                  const checked = profile.sellerType === opt.value;
                  return (
                    <label
                      key={opt.value}
                      className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition duration-150 ${checked
                          ? "border-[#0284c7] bg-[#0284c7]/5 shadow-sm"
                          : "border-slate-200 bg-white hover:border-slate-300"
                        }`}
                    >
                      <input
                        type="radio"
                        name="sellerType"
                        value={opt.value}
                        checked={checked}
                        onChange={() =>
                          setProfile((prev) => ({
                            ...prev,
                            sellerType: opt.value,
                          }))
                        }
                        className="mt-1 accent-indigo-500"
                      />
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-slate-800 leading-tight">
                          {opt.label}
                        </div>
                        <div className="mt-1 text-xs text-slate-500 leading-normal">
                          {opt.desc}
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
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

          {/* Service Location Settings */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-4">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <MapPin className="text-[#0284c7]" size={20} />
              <span>Service Location / सेवा का स्थान</span>
            </h3>
            <p className="text-xs text-slate-500">
              Update your service coverage area using your current location, pincode, or search query.
            </p>

            <LocationPicker
              hideMap={true}
              initialLocation={{
                lat: profile.lat,
                lng: profile.lng,
                address: profile.address,
                pincode: profile.pincode,
              }}
              onChange={({ lat, lng, address, pincode }) => {
                setProfile((prev) => ({
                  ...prev,
                  lat,
                  lng,
                  address,
                  pincode,
                }));
              }}
            />
          </div>

          {/* Redesigned Drag & Drop Multi-file Work Portfolio Section */}
          <div className="space-y-4 border-t border-slate-100 pt-6">
            <div>
              <h3 className="text-lg font-bold text-slate-800">Work Portfolio / Images of Your Work</h3>
              <p className="text-xs text-slate-500 mt-0.5">Showcase your skills and past projects to users.</p>
            </div>

            {/* Drag & Drop Upload Zone */}
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={() => workFileInputRef.current?.click()}
              className={`flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-6 transition duration-200 cursor-pointer ${dragActive
                ? "border-[#0284c7] bg-[#0284c7]/5"
                : "border-slate-200 bg-slate-50 hover:border-slate-300"
                }`}
            >
              <input
                type="file"
                ref={workFileInputRef}
                onChange={handleWorkFilesChange}
                accept="image/*"
                multiple
                className="hidden"
              />
              <UploadCloud className="text-slate-400 mb-2" size={36} />
              <p className="text-sm font-semibold text-slate-700">Drag & drop images here, or click to browse</p>
              <p className="text-xs text-slate-400 mt-1">Supports JPEG, PNG, WEBP (Max 5MB each)</p>

              {isUploadingWork && (
                <div className="mt-3 flex items-center gap-2 text-indigo-600 text-xs font-bold">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
                  <span>Uploading files...</span>
                </div>
              )}
            </div>

            {/* Grid preview with Delete */}
            {workImages.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-bold text-slate-600">Portfolio Previews ({workImages.length})</h4>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                  {workImages.map((img) => (
                    <div
                      key={img.id}
                      className="group relative aspect-square rounded-lg overflow-hidden border border-slate-200 bg-white"
                    >
                      <img
                        src={getImageUrl(img.image_url)}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => handleDeleteWorkImage(img.id)}
                        className="absolute top-1.5 right-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-red-600/90 text-white opacity-0 transition duration-150 shadow group-hover:opacity-100 hover:bg-red-700"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Form Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-slate-100">
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white force-text-white shadow-lg transition duration-150 hover:bg-indigo-700 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <Save size={17} />
              )}
              {isSaving ? "Saving..." : "Save Profile"}
            </button>

            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="rounded-lg border border-slate-200 bg-slate-50 px-5 py-2.5 text-sm font-bold text-slate-700 transition duration-150 hover:bg-slate-100 hover:text-slate-900 active:scale-[0.98]"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Lightbox Modal */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setLightboxImage(null)}
        >
          <button
            className="absolute top-4 right-4 text-white hover:text-slate-300"
            onClick={() => setLightboxImage(null)}
          >
            <X size={28} />
          </button>
          <img
            src={getImageUrl(lightboxImage)}
            alt="Portfolio Lightbox"
            className="max-w-full max-h-[90vh] object-contain rounded shadow-2xl"
          />
        </div>
      )}
    </div>
  );
}
