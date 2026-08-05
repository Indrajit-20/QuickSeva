import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Save, Pencil, Trash2, Camera, UploadCloud, X, Eye, ShieldCheck, Clock, MapPin, CheckCircle2, ChevronLeft, ChevronRight } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import apiClient from "../../api/axiosConfig";
import LocationPicker from "../../components/LocationPicker";

const inputClass =
  "seller-input";

const labelClass = "seller-label";

export default function SellerProfile() {
  const { user, updateUser } = useAuth();
  const fileInputRef = useRef(null);
  const workFileInputRef = useRef(null);

  const [profile, setProfile] = useState({
    fullName: user?.name || "",
    businessName: "",
    phoneNumber: user?.phone || "",
    gstnumber: "",
    serviceType: "AC Repair",
    bio: "",
    experience: "",
    serviceMode: "offline",
    serviceModeLabel: "Offline Only",
    instantService: false,
    lat: null,
    lng: null,
    address: "",
    profilePictureUrl: "",
    sellerType: "individual",
    accountType: "individual",
    slotCapacity: 1,
    slotDurationMins: 60,
    workingHoursStart: "09:00",
    workingHoursEnd: "19:00",
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
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [lightboxImages, setLightboxImages] = useState([]);

  const handlePrevImage = (e) => {
    e.stopPropagation();
    setLightboxIndex((prev) => (prev > 0 ? prev - 1 : lightboxImages.length - 1));
  };

  const handleNextImage = (e) => {
    e.stopPropagation();
    setLightboxIndex((prev) => (prev < lightboxImages.length - 1 ? prev + 1 : 0));
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (lightboxIndex === null) return;
      if (e.key === "ArrowLeft") {
        setLightboxIndex((prev) => (prev > 0 ? prev - 1 : lightboxImages.length - 1));
      } else if (e.key === "ArrowRight") {
        setLightboxIndex((prev) => (prev < lightboxImages.length - 1 ? prev + 1 : 0));
      } else if (e.key === "Escape") {
        setLightboxIndex(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxIndex, lightboxImages]);

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
            businessName: seller.business_name || "",
            phoneNumber: user?.phone || prev.phoneNumber,
            gstnumber: seller.gst_number || prev.gstnumber,
            bio: seller.bio || prev.bio,
            experience: seller.experience_yrs !== undefined ? seller.experience_yrs : prev.experience,
            serviceMode: seller.service_mode || "offline",
            serviceModeLabel: seller.service_mode === "online" ? "Online Only" : seller.service_mode === "both" ? "Both Online & Offline" : "Offline Only",
            lat: seller.lat || seller.latitude || null,
            lng: seller.lng || seller.longitude || null,
            address: seller.location_address || seller.address || "",
            profilePictureUrl: seller.profile_picture_url || "",
            sellerType: seller.seller_type || "individual",
            accountType: seller.account_type || seller.seller_type || "individual",
            slotCapacity: seller.slot_capacity || 1,
            slotDurationMins: seller.slot_duration_mins || 60,
            workingHoursStart: seller.working_hours_start || "09:00",
            workingHoursEnd: seller.working_hours_end || "19:00",
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

  const memberSince = (user?.created_at || user?.createdAt)
    ? new Intl.DateTimeFormat("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date(user.created_at || user.createdAt))
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
        business_name: profile.businessName,
        bio: profile.bio,
        experience_yrs: Number(profile.experience || 0),
        gst_number: profile.gstnumber,
        profile_completed: 1,
        seller_type: profile.sellerType,
        service_mode: profile.serviceMode,
        lat: profile.lat,
        lng: profile.lng,
        address: profile.address,
        pincode: profile.pincode,
        account_type: profile.accountType,
        slot_capacity: Number(profile.slotCapacity || 1),
        slot_duration_mins: Number(profile.slotDurationMins || 60),
        working_hours_start: profile.workingHoursStart,
        working_hours_end: profile.workingHoursEnd,
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
    <div className="seller-page animate-fade-in space-y-5 max-w-4xl mx-auto">
      {saved && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-bold text-emerald-800 shadow-xl animate-fade-in" style={{ maxWidth: 'calc(100% - 32px)' }}>
          ✓ Profile updated successfully!
        </div>
      )}

      {Number(user?.profile_completed ?? 0) === 0 && (
        <div className="seller-offline-banner" style={{ borderColor: '#fde68a', background: 'linear-gradient(135deg, #fffbeb, #fef3c7)' }}>
          <div className="seller-offline-icon" style={{ background: '#fef3c7', color: '#d97706' }}>
            <span style={{ fontSize: 22 }}>⚠️</span>
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: '#92400e' }}>Complete Your Profile</p>
            <p style={{ fontSize: 12, color: '#b45309', marginTop: 2, fontWeight: 500 }}>
              Fill in your details and save to unlock Dashboard, Services & Orders.
            </p>
          </div>
        </div>
      )}

      {/* Profile Hero Card */}
      <section className="seller-profile-hero relative flex flex-col items-center">
        {/* Elegant Edit Profile Toggle Button */}
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="seller-action-btn seller-action-btn--outline absolute right-4 top-4"
          style={{ padding: '8px 14px', minHeight: 36, fontSize: 12 }}
        >
          {isEditing ? (
            <>
              <Eye size={14} />
              <span>View</span>
            </>
          ) : (
            <>
              <Pencil size={14} />
              <span>Edit</span>
            </>
          )}
        </button>

        {/* Profile Avatar with Camera Upload Picker */}
        <div
          className="relative group cursor-pointer"
          onClick={isEditing ? handleAvatarClick : () => {
            const pic = profile.profilePictureUrl || user?.profile_pic;
            if (pic) {
              setLightboxImages([pic]);
              setLightboxIndex(0);
            }
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
              className={`seller-profile-avatar ${isEditing ? "group-hover:brightness-75" : ""}`}
            />
          ) : (
            <div className={`seller-profile-avatar-placeholder ${isEditing ? "group-hover:brightness-75" : ""}`}>
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
        <h1 style={{ marginTop: 14, fontSize: 22, fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
          {profile.businessName || profile.fullName || "Seller"}
          {Number(user?.profile_completed ?? 0) === 1 && (
            <ShieldCheck className="text-[#0284c7] fill-[#0284c7]/10" size={20} />
          )}
        </h1>
        {profile.businessName && (
          <p style={{ marginTop: 2, fontSize: 13, fontWeight: 700, color: '#475569' }}>
            Owner: {profile.fullName}
          </p>
        )}
        <p style={{ marginTop: 6, fontSize: 13, fontWeight: 500, color: '#64748b', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          <span>{profile.serviceType || "Service Provider"}</span>
          <span>•</span>
          <span>{profile.phoneNumber || user?.phone || ""}</span>
        </p>
        <div style={{ marginTop: 8, display: 'flex', justifyContent: 'center' }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#4338ca', background: '#eef2ff', border: '1px solid #c7d2fe', padding: '4px 12px', borderRadius: 20, textTransform: 'capitalize' }}>
            {profile.sellerType === "agency" ? "Contractor / Agency" : profile.sellerType}
          </span>
        </div>

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
          <div className="grid gap-4 md:grid-cols-4">
            {/* Quick Metrics */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 flex flex-col justify-between shadow-sm">
              <div className="text-slate-500 text-xs font-bold uppercase tracking-wider">Experience</div>
              <div className="mt-2 text-2xl font-black text-slate-800">{profile.experience || 0} Years</div>
              <div className="text-indigo-600 text-xs font-medium mt-1">Professional experience</div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4 flex flex-col justify-between shadow-sm">
              <div className="text-slate-500 text-xs font-bold uppercase tracking-wider">Account & Capacity</div>
              <div className="mt-2 text-xl font-black text-slate-800 capitalize">
                {profile.accountType === "agency" ? `🏢 Agency (${profile.slotCapacity} Slots)` : "👤 Individual"}
              </div>
              <div className="text-indigo-600 text-xs font-medium mt-1">Concurrent slot capacity</div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4 flex flex-col justify-between shadow-sm">
              <div className="text-slate-500 text-xs font-bold uppercase tracking-wider">Working Hours</div>
              <div className="mt-2 text-lg font-black text-slate-800">
                {profile.workingHoursStart || "09:00"} - {profile.workingHoursEnd || "19:00"}
              </div>
              <div className="text-indigo-600 text-xs font-medium mt-1">{profile.slotDurationMins || 60}m Slot Duration</div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4 flex flex-col justify-between shadow-sm">
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
                {workImages.map((img, idx) => (
                  <div
                    key={img.id}
                    className="relative aspect-square rounded-lg overflow-hidden border border-slate-200 cursor-pointer group shadow-md"
                    onClick={() => {
                      setLightboxImages(workImages.map((w) => w.image_url));
                      setLightboxIndex(idx);
                    }}
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

          {/* Work Schedule & Team Capacity */}
          <div className="rounded-xl border border-indigo-200 bg-indigo-50/40 p-4 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                <span>⏱️</span> Work Schedule & Capacity Settings
              </h3>
              <span className="rounded-full border border-indigo-200 bg-indigo-100 px-3 py-1 text-[11px] font-bold text-indigo-800">
                {profile.accountType === "agency" ? `Agency (${profile.slotCapacity} Team Slots)` : "Individual Provider"}
              </span>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className={labelClass}>Provider Type & Capacity Model</label>
                <div className="space-y-2">
                  {[
                    { value: "individual", label: "👤 Individual Provider", hint: "Single technician (1 booking per time slot)" },
                    { value: "agency", label: "🏢 Agency / Business Team", hint: "Multiple technicians (Shared time slot capacity)" },
                  ].map((opt) => {
                    const checked = profile.accountType === opt.value;
                    return (
                      <label
                        key={opt.value}
                        className={`flex cursor-pointer items-start gap-3 rounded-xl border px-3 py-3 transition ${checked
                          ? "qs-selected-active shadow-sm border-indigo-500 bg-white"
                          : "border-slate-200 bg-white hover:border-slate-300"
                        }`}
                      >
                        <input
                          type="radio"
                          name="accountType"
                          value={opt.value}
                          checked={checked}
                          onChange={() =>
                            setProfile((prev) => ({
                              ...prev,
                              accountType: opt.value,
                              slotCapacity: opt.value === "agency" ? Math.max(prev.slotCapacity, 2) : 1,
                            }))
                          }
                          className="mt-0.5 accent-indigo-600"
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

              <div className="space-y-4">
                {profile.accountType === "agency" && (
                  <div>
                    <label className={labelClass}>Agency Team Capacity (Simultaneous Jobs per Slot)</label>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      name="slotCapacity"
                      value={profile.slotCapacity}
                      onChange={(e) =>
                        setProfile((prev) => ({
                          ...prev,
                          slotCapacity: Math.max(1, parseInt(e.target.value) || 1),
                        }))
                      }
                      className={inputClass}
                      placeholder="e.g. 5 team members"
                    />
                    <p className="text-xs text-slate-500 mt-1 font-medium">
                      Time slots remain open for customers until {profile.slotCapacity} bookings are placed.
                    </p>
                  </div>
                )}

                <div>
                  <label className={labelClass}>Time Slot Duration</label>
                  <select
                    name="slotDurationMins"
                    value={profile.slotDurationMins}
                    onChange={(e) =>
                      setProfile((prev) => ({
                        ...prev,
                        slotDurationMins: Number(e.target.value),
                      }))
                    }
                    className={inputClass}
                  >
                    <option value={30}>30 Minutes</option>
                    <option value={45}>45 Minutes</option>
                    <option value={60}>60 Minutes (1 Hour)</option>
                    <option value={90}>90 Minutes (1.5 Hours)</option>
                    <option value={120}>120 Minutes (2 Hours)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 pt-2 border-t border-indigo-100">
              <div>
                <label className={labelClass}>Work Start Time (Daily)</label>
                <input
                  type="time"
                  name="workingHoursStart"
                  value={profile.workingHoursStart || "09:00"}
                  onChange={(e) =>
                    setProfile((prev) => ({
                      ...prev,
                      workingHoursStart: e.target.value,
                    }))
                  }
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Work End Time (Daily)</label>
                <input
                  type="time"
                  name="workingHoursEnd"
                  value={profile.workingHoursEnd || "19:00"}
                  onChange={(e) =>
                    setProfile((prev) => ({
                      ...prev,
                      workingHoursEnd: e.target.value,
                    }))
                  }
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          {/* Form Inputs */}
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className={labelClass}>Full Name (Owner)</label>
              <input
                name="fullName"
                value={profile.fullName}
                onChange={handleChange}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Business / Company Name (व्यापार या कंपनी का नाम)</label>
              <input
                name="businessName"
                value={profile.businessName}
                onChange={handleChange}
                className={inputClass}
                placeholder="Enter Business Name"
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
          <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-600 hover:bg-slate-50 active:scale-95 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="btn btn-primary px-6 py-2.5 flex items-center justify-center gap-2 active:scale-95 transition"
            >
              {isSaving ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <Save size={17} />
              )}
              {isSaving ? "Saving..." : "Save Profile"}
            </button>
          </div>
        </form>
      )}

      {/* Lightbox Modal */}
      {lightboxIndex !== null && lightboxImages.length > 0 && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-100/90 backdrop-blur-xl p-4 animate-fade-in select-none"
          onClick={() => setLightboxIndex(null)}
        >
          {/* Close button */}
          <button
            type="button"
            className="absolute top-4 right-4 z-50 p-2.5 rounded-full bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 hover:text-slate-900 shadow-sm backdrop-blur-sm transition-all focus:outline-none hover:scale-105 active:scale-95"
            onClick={() => setLightboxIndex(null)}
            title="Close / बंद करें"
          >
            <X size={24} />
          </button>

          {/* Prev button (only show if multiple images) */}
          {lightboxImages.length > 1 && (
            <button
              type="button"
              className="absolute left-4 top-1/2 -translate-y-1/2 z-50 p-3 rounded-full bg-white/80 hover:bg-white border border-slate-200 text-slate-700 hover:text-blue-600 shadow-md backdrop-blur-sm transition-all focus:outline-none hover:scale-105 active:scale-95"
              onClick={handlePrevImage}
              title="Previous / पिछला"
            >
              <ChevronLeft size={28} />
            </button>
          )}

          {/* Next button (only show if multiple images) */}
          {lightboxImages.length > 1 && (
            <button
              type="button"
              className="absolute right-4 top-1/2 -translate-y-1/2 z-50 p-3 rounded-full bg-white/80 hover:bg-white border border-slate-200 text-slate-700 hover:text-blue-600 shadow-md backdrop-blur-sm transition-all focus:outline-none hover:scale-105 active:scale-95"
              onClick={handleNextImage}
              title="Next / अगला"
            >
              <ChevronRight size={28} />
            </button>
          )}

          {/* Counter (only show if multiple images) */}
          {lightboxImages.length > 1 && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-1.5 rounded-full bg-white/90 border border-slate-200 text-slate-800 text-xs font-bold shadow-sm">
              {lightboxIndex + 1} / {lightboxImages.length}
            </div>
          )}

          {/* Image container with clean white frame and beautiful shadow */}
          <div 
            className="relative max-w-full max-h-[75vh] flex items-center justify-center bg-white p-2.5 sm:p-3.5 rounded-2xl border border-slate-200/80 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.15)]"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={getImageUrl(lightboxImages[lightboxIndex])}
              alt={`Portfolio Image ${lightboxIndex + 1}`}
              className="max-w-full max-h-[70vh] object-contain rounded-xl transition-all duration-300 ease-out animate-scale-in"
            />
          </div>

          {/* Thumbnail list (only show if multiple images) */}
          {lightboxImages.length > 1 && (
            <div 
              className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 overflow-x-auto max-w-[90vw] p-2 bg-white/95 rounded-2xl border border-slate-200 shadow-xl backdrop-blur-sm scrollbar-none"
              onClick={(e) => e.stopPropagation()}
            >
              {lightboxImages.map((imgUrl, idx) => (
                <img
                  key={idx}
                  src={getImageUrl(imgUrl)}
                  alt={`Thumbnail ${idx + 1}`}
                  className={`w-12 h-12 rounded-lg object-cover cursor-pointer border-2 transition-all duration-200 ${
                    idx === lightboxIndex 
                      ? "border-blue-500 scale-110 shadow-md opacity-100" 
                      : "border-slate-200 opacity-60 hover:opacity-100"
                  }`}
                  onClick={() => setLightboxIndex(idx)}
                />
              ))}
            </div>
          )}
        </div>,
        document.body
      )}
    </div>
  );
}
