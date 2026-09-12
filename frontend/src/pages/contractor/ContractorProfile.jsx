import React, { useState, useEffect, useRef } from "react";
import {
  User,
  Building2,
  Phone,
  MapPin,
  Briefcase,
  Camera,
  Save,
  CheckCircle2,
  ShieldCheck,
  Check,
  Sparkles,
  Trash2,
  Upload,
  Image as ImageIcon,
  Edit3,
  X,
  ExternalLink,
  Plus,
  FileText,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { updateUserProfile } from "../../api/authService";
import {
  getMyContractorWorkImages,
  uploadContractorWorkImages,
  deleteContractorWorkImage,
  submitContractorVerification,
} from "../../api/contractorApi";
import SearchableCitySelect from "../../components/SearchableCitySelect";
import { getImageUrl } from "../../utils/imageUtils";

const AVAILABLE_TRADES = [
  { id: "Painting", label: "Painting & Decorating", icon: "🎨" },
  { id: "Civil", label: "Civil & Masonry", icon: "🏗️" },
  { id: "Electrical", label: "Electrical Contracting", icon: "⚡" },
  { id: "Plumbing", label: "Plumbing & Sanitary", icon: "🚰" },
  { id: "Carpentry", label: "Carpentry & Woodwork", icon: "🪚" },
  { id: "Flooring", label: "Tiles & Flooring", icon: "🧱" },
  { id: "HVAC", label: "HVAC & AC Service", icon: "❄️" },
  { id: "Waterproofing", label: "Roofing & Waterproofing", icon: "☔" },
  { id: "Multi-Skilled", label: "General Contracting", icon: "🏢" },
];

export default function ContractorProfile() {
  const { user, refreshAuth } = useAuth();
  const fileInputRef = useRef(null);

  // Profile View vs Edit Mode State
  const [isEditing, setIsEditing] = useState(false);
  const [verifyOpen, setVerifyOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: user?.name || "",
    company_name: user?.company_name || "",
    phone: user?.phone || "",
    city: user?.city || "",
    pincode: user?.pincode || "",
    address: user?.address || "",
    bio: user?.bio || "",
  });

  // Verification Form State
  const [verificationForm, setVerificationForm] = useState({
    gstin: user?.gstin || "",
    pan_number: user?.pan_number || "",
    license_number: user?.license_number || "",
  });
  const [verificationDoc, setVerificationDoc] = useState(null);
  const [submittingVerification, setSubmittingVerification] = useState(false);
  const [verificationMsg, setVerificationMsg] = useState(null);

  const [selectedTrades, setSelectedTrades] = useState(() => {
    const raw = user?.trade_specialization || "";
    if (Array.isArray(raw)) return raw;
    return raw ? raw.split(",").map((t) => t.trim()) : [];
  });

  const [previewPic, setPreviewPic] = useState(user?.profile_pic || "");
  const [selectedFile, setSelectedFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  // Work Portfolio Photos State
  const [workImages, setWorkImages] = useState([]);
  const [uploadingWorkPics, setUploadingWorkPics] = useState(false);
  const [lightboxIdx, setLightboxIdx] = useState(null);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        company_name: user.company_name || "",
        phone: user.phone || "",
        city: user.city || "",
        pincode: user.pincode || "",
        address: user.address || "",
        bio: user.bio || "",
      });

      setVerificationForm({
        gstin: user.gstin || "",
        pan_number: user.pan_number || "",
        license_number: user.license_number || "",
      });

      if (user.profile_pic) {
        setPreviewPic(user.profile_pic);
      }

      const raw = user.trade_specialization || "";
      const parsed = Array.isArray(raw)
        ? raw
        : raw
        ? raw.split(",").map((t) => t.trim())
        : [];
      setSelectedTrades(parsed);
      fetchWorkImages();
    }
  }, [user]);

  const handleVerifySubmit = async (e) => {
    e.preventDefault();
    setVerificationMsg(null);

    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i;
    const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/i;

    const pan = verificationForm.pan_number?.trim();
    const gstin = verificationForm.gstin?.trim();
    const license = verificationForm.license_number?.trim();

    if (!pan && !gstin && !license) {
      setVerificationMsg({
        type: "error",
        text: "Please fill out at least your PAN Card Number or Labor License Number.",
      });
      return;
    }

    if (pan && !panRegex.test(pan)) {
      setVerificationMsg({
        type: "error",
        text: "Invalid PAN Card Number format. (e.g. ABCDE1234F)",
      });
      return;
    }

    if (gstin && !gstinRegex.test(gstin)) {
      setVerificationMsg({
        type: "error",
        text: "Invalid GSTIN format. (e.g. 24AAAAA0000A1Z5)",
      });
      return;
    }

    if (!verificationDoc && !user?.verification_doc_url) {
      setVerificationMsg({
        type: "error",
        text: "Document proof required: Please upload your License or ID Proof photo.",
      });
      return;
    }

    setSubmittingVerification(true);

    try {
      const data = new FormData();
      if (gstin) data.append("gstin", gstin.toUpperCase());
      if (pan) data.append("pan_number", pan.toUpperCase());
      if (license) data.append("license_number", license);
      if (verificationDoc) data.append("document", verificationDoc);

      const res = await submitContractorVerification(data);
      if (res?.success) {
        setVerificationMsg({
          type: "success",
          text: "Verification details submitted successfully! Admin will review your application.",
        });
        refreshAuth();
      }
    } catch (err) {
      console.error("Failed to submit verification:", err);
      setVerificationMsg({
        type: "error",
        text: err?.response?.data?.message || "Failed to submit verification details",
      });
    } finally {
      setSubmittingVerification(false);
    }
  };

  const fetchWorkImages = async () => {
    try {
      const res = await getMyContractorWorkImages();
      if (res?.data?.work_images) {
        setWorkImages(res.data.work_images);
      }
    } catch (err) {
      console.error("Failed to fetch work images:", err);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewPic(url);
    }
  };

  const toggleTrade = (tradeId) => {
    if (selectedTrades.includes(tradeId)) {
      setSelectedTrades((prev) => prev.filter((t) => t !== tradeId));
    } else {
      setSelectedTrades((prev) => [...prev, tradeId]);
    }
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    setSaving(true);
    setSaveSuccess(false);
    setErrorMsg(null);

    try {
      let payload;
      if (selectedFile) {
        payload = new FormData();
        payload.append("name", formData.name);
        payload.append("company_name", formData.company_name);
        payload.append("city", formData.city);
        payload.append("pincode", formData.pincode);
        payload.append("address", formData.address);
        payload.append("bio", formData.bio);
        payload.append("trade_specialization", selectedTrades.join(", "));
        payload.append("profile_pic", selectedFile);
      } else {
        payload = {
          name: formData.name,
          company_name: formData.company_name,
          city: formData.city,
          pincode: formData.pincode,
          address: formData.address,
          bio: formData.bio,
          trade_specialization: selectedTrades.join(", "),
        };
      }

      const res = await updateUserProfile(payload);
      if (res?.data?.user) {
        setSaveSuccess(true);
        if (refreshAuth) await refreshAuth();
        setIsEditing(false);
        setSelectedFile(null);
        setTimeout(() => setSaveSuccess(false), 4000);
      }
    } catch (err) {
      console.error("Failed to update contractor profile:", err);
      setErrorMsg(err?.response?.data?.message || "Failed to update profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const getInitial = (name) => (name?.trim()?.[0] || "C").toUpperCase();

  const isVerified = user?.verification_status === "verified" || user?.is_verified_contractor === 1;
  const isPending = user?.verification_status === "pending";
  const isRejected = user?.verification_status === "rejected";

  const verificationStatusBadge = isVerified
    ? { label: "✓ Verified Contractor", cls: "bg-emerald-100 text-emerald-800 border-emerald-300" }
    : isPending
    ? { label: "⏳ Pending Review", cls: "bg-amber-100 text-amber-800 border-amber-300" }
    : isRejected
    ? { label: "❌ Rejected", cls: "bg-rose-100 text-rose-800 border-rose-300" }
    : { label: "Unverified", cls: "bg-slate-100 text-slate-600 border-slate-300" };

  return (
    <div className="max-w-5xl mx-auto py-3 px-3 sm:px-6 font-sans text-slate-800 pb-28">
      {/* Lightbox */}
      {lightboxIdx !== null && workImages[lightboxIdx] && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightboxIdx(null)}
        >
          <button
            className="absolute top-4 right-4 text-white bg-black/50 rounded-full p-2 hover:bg-black/80 cursor-pointer"
            onClick={() => setLightboxIdx(null)}
          >
            <X size={22} />
          </button>
          <img
            src={getImageUrl(workImages[lightboxIdx].image_url)}
            alt="Work"
            className="max-h-[85vh] max-w-full rounded-2xl shadow-2xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-3">
            {workImages.length > 1 && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); setLightboxIdx((i) => (i - 1 + workImages.length) % workImages.length); }}
                  className="bg-white/20 hover:bg-white/40 text-white font-bold px-4 py-2 rounded-full text-sm cursor-pointer"
                >← Prev</button>
                <span className="text-white/60 text-xs self-center">{lightboxIdx + 1} / {workImages.length}</span>
                <button
                  onClick={(e) => { e.stopPropagation(); setLightboxIdx((i) => (i + 1) % workImages.length); }}
                  className="bg-white/20 hover:bg-white/40 text-white font-bold px-4 py-2 rounded-full text-sm cursor-pointer"
                >Next →</button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Notifications */}
      {saveSuccess && (
        <div className="mb-3 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center gap-2 text-xs font-bold shadow-xs">
          <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
          <span>Contractor profile updated successfully!</span>
        </div>
      )}

      {errorMsg && (
        <div className="mb-3 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl flex items-center gap-2 text-xs font-bold shadow-xs">
          <span>⚠️</span>
          <span>{errorMsg}</span>
        </div>
      )}

      {/* ── COMPACT HORIZONTAL PROFILE HEADER ── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 mb-4 relative overflow-hidden">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="relative shrink-0">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-amber-500 text-white font-black text-2xl shadow-md overflow-hidden flex items-center justify-center relative border-2 border-slate-100">
              {previewPic ? (
                <img
                  src={getImageUrl(previewPic)}
                  alt="Contractor Logo"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.style.display = "none";
                  }}
                />
              ) : null}
              {(!previewPic || previewPic.includes("undefined")) && (
                <span>{getInitial(user?.name)}</span>
              )}
            </div>

            {isEditing && (
              <>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-1 -right-1 w-7 h-7 bg-slate-900 hover:bg-slate-800 text-white rounded-lg flex items-center justify-center shadow-md transition active:scale-95 cursor-pointer border border-white"
                  title="Upload profile picture / logo"
                >
                  <Camera size={12} />
                </button>
              </>
            )}
          </div>

          {/* Details beside avatar */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 mb-1">
              <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 text-[9px] font-black uppercase tracking-wider border border-amber-200">
                Verified Contractor Profile
              </span>
              <span className={`px-2 py-0.5 rounded-md text-[9px] font-extrabold border ${verificationStatusBadge.cls}`}>
                {verificationStatusBadge.label}
              </span>
            </div>

            <h1 className="text-sm sm:text-base font-black text-slate-900 tracking-tight leading-snug">
              {formData.company_name || formData.name || "Contractor Business"}
            </h1>

            <p className="text-[10px] font-bold text-slate-500 truncate">
              Contact: {formData.name || "N/A"}
            </p>

            <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-600 font-semibold mt-0.5">
              {formData.phone && (
                <span className="flex items-center gap-0.5">
                  <Phone size={11} className="text-amber-600" /> {formData.phone}
                </span>
              )}
              {formData.city && (
                <span className="flex items-center gap-0.5">
                  <MapPin size={11} className="text-amber-600" /> {formData.city}{formData.pincode ? ` (${formData.pincode})` : ""}
                </span>
              )}
            </div>

            {selectedTrades.length > 0 && (
              <div className="flex flex-wrap items-center gap-1 mt-1.5">
                {selectedTrades.map((t, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 text-[10px] font-extrabold border border-slate-200/80"
                  >
                    {t}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Action Button */}
          <div className="shrink-0">
            {isEditing ? (
              <div className="flex flex-col gap-1.5">
                <button
                  type="button"
                  onClick={() => { setIsEditing(false); setErrorMsg(null); setSelectedFile(null); setPreviewPic(user?.profile_pic || ""); }}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10px] rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={saving}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-[10px] rounded-xl shadow-md transition active:scale-95 flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  {saving ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Save size={12} /><span>Save</span></>}
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white font-black text-[10px] rounded-xl shadow-md transition active:scale-95 flex items-center gap-1.5 cursor-pointer"
              >
                <Edit3 size={13} />
                <span>Edit</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── MODE 1: CLEAN PROFILE DISPLAY VIEW (DEFAULT) ── */}
      {!isEditing ? (
        <div className="space-y-5">
          {/* Card 1: Business & Contact Information */}
          <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200/80 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h2 className="text-xs sm:text-sm font-black text-slate-900 flex items-center gap-2">
                <Building2 size={16} className="text-amber-600" />
                Business &amp; Contact Overview
              </h2>
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="text-[10px] font-bold text-amber-600 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Edit3 size={11} />
                <span>Edit</span>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {[
                { label: "Contact Person", val: formData.name },
                { label: "Company Name", val: formData.company_name },
                { label: "Mobile Number", val: formData.phone },
                { label: "Operating City", val: formData.city },
                { label: "Pincode", val: formData.pincode },
                { label: "Site Address", val: formData.address },
              ].map(({ label, val }) => (
                <div key={label} className="p-2.5 bg-slate-50/80 rounded-xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 block mb-0.5">{label}</span>
                  <span className="text-xs font-black text-slate-900">{val || "Not provided"}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Card 2: Specialized Trade Categories */}
          <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200/80 shadow-xs space-y-2.5">
            <h2 className="text-xs sm:text-sm font-black text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-100">
              <Briefcase size={16} className="text-amber-600" />
              Specialized Trade Categories
            </h2>

            {selectedTrades.length > 0 ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {selectedTrades.map((t, idx) => {
                  const tradeObj = AVAILABLE_TRADES.find((item) => item.id === t || item.label.includes(t));
                  return (
                    <div
                      key={idx}
                      className="p-2.5 bg-amber-50/50 rounded-xl border border-amber-200/70 flex flex-col items-center gap-1 text-center"
                    >
                      <span className="text-base">{tradeObj?.icon || "👷"}</span>
                      <span className="text-[10px] font-black text-slate-900 truncate w-full text-center">{t}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs font-semibold text-slate-500 py-1">
                No trades selected yet. Click <strong>Edit</strong> to add specializations.
              </p>
            )}
          </div>

          {/* Card 3: Business Overview & Bio */}
          <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200/80 shadow-xs space-y-2">
            <h2 className="text-xs sm:text-sm font-black text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-100">
              <Sparkles size={16} className="text-amber-600" />
              Business Overview &amp; Experience
            </h2>
            {formData.bio ? (
              <p className="text-xs font-medium text-slate-700 leading-relaxed whitespace-pre-line">{formData.bio}</p>
            ) : (
              <div className="flex flex-col items-start gap-2">
                <p className="text-xs font-semibold text-slate-500">No business description added yet.</p>
                <button onClick={() => setIsEditing(true)} className="text-xs font-bold text-amber-600 hover:underline flex items-center gap-1 cursor-pointer">
                  <Edit3 size={12} /> Add Overview
                </button>
              </div>
            )}
          </div>

          {/* Card 4: Work Portfolio Gallery (Read-Only Showcase) */}
          <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200/80 shadow-xs space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-slate-100">
              <div>
                <h2 className="text-xs sm:text-sm font-black text-slate-900 flex items-center gap-1.5">
                  <ImageIcon size={15} className="text-amber-600" />
                  Work Portfolio ({workImages.length})
                </h2>
                <p className="text-[10px] font-medium text-slate-500 mt-0.5">
                  Photos shown to clients on the public hub.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="text-[10px] font-bold text-amber-600 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Edit3 size={11} />
                <span>Manage Photos in Edit Mode</span>
              </button>
            </div>

            {workImages && workImages.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 pt-1">
                {workImages.map((img, idx) => (
                  <div
                    key={img.id}
                    className="relative aspect-video rounded-xl overflow-hidden bg-slate-100 border border-slate-200 group shadow-xs cursor-pointer"
                    onClick={() => setLightboxIdx(idx)}
                  >
                    <img
                      src={getImageUrl(img.image_url)}
                      alt={img.title || "Work Site"}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.style.display = "none";
                        e.target.parentNode.classList.add("bg-slate-200");
                      }}
                    />
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                      <span className="text-[10px] font-extrabold text-white bg-black/60 px-2.5 py-1 rounded-full flex items-center gap-1">
                        👁️ View Photo
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 bg-slate-50/80 rounded-2xl border border-dashed border-slate-200 text-center space-y-2">
                <ImageIcon size={28} className="text-slate-300 mx-auto" />
                <p className="text-xs font-bold text-slate-600">No work portfolio photos added yet</p>
                <p className="text-[10px] font-medium text-slate-400">
                  Showcase your completed projects and sites to attract more clients!
                </p>
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="mt-2 px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-extrabold rounded-xl shadow-xs transition active:scale-95 inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Edit3 size={12} />
                  <span>Edit Profile &amp; Upload Photos</span>
                </button>
              </div>
            )}
          </div>

          {/* Card 5: Verification Status — Smart Display */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-4 sm:p-6">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={18} className="text-amber-600" />
                  <div>
                    <h2 className="text-xs sm:text-sm font-black text-slate-900">Contractor Verification</h2>
                    <p className="text-[10px] text-slate-500 font-medium mt-0.5">GST, PAN, Trade License</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border ${verificationStatusBadge.cls}`}>
                    {verificationStatusBadge.label}
                  </span>
                  {!isVerified && (
                    <button
                      type="button"
                      onClick={() => setVerifyOpen(!verifyOpen)}
                      className="text-[10px] font-bold text-amber-600 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      {verifyOpen ? <X size={11} /> : <Edit3 size={11} />}
                      {verifyOpen ? "Close" : isPending ? "Update" : "Submit"}
                    </button>
                  )}
                  {isVerified && user?.verification_doc_url && (
                    <a
                      href={getImageUrl(user.verification_doc_url)}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[10px] font-bold text-amber-600 hover:underline flex items-center gap-1"
                    >
                      <ExternalLink size={11} /> View Doc
                    </a>
                  )}
                </div>
              </div>

              {/* Verified — show submitted info */}
              {isVerified && (
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {user?.gstin && (
                    <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-100">
                      <span className="text-[10px] font-bold text-emerald-600 block mb-0.5">GSTIN</span>
                      <span className="text-xs font-black text-slate-900">{user.gstin}</span>
                    </div>
                  )}
                  {user?.pan_number && (
                    <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-100">
                      <span className="text-[10px] font-bold text-emerald-600 block mb-0.5">PAN Number</span>
                      <span className="text-xs font-black text-slate-900">{user.pan_number}</span>
                    </div>
                  )}
                  {user?.license_number && (
                    <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-100">
                      <span className="text-[10px] font-bold text-emerald-600 block mb-0.5">License No.</span>
                      <span className="text-xs font-black text-slate-900">{user.license_number}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Pending — show what was submitted */}
              {isPending && (
                <div className="mt-3 p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs font-semibold text-amber-800">
                  ⏳ Your verification is under admin review. You'll be notified once approved.
                </div>
              )}

              {/* Rejected — reason */}
              {isRejected && (
                <div className="mt-3 p-3.5 bg-rose-50 border border-rose-200 rounded-xl space-y-1">
                  <div className="text-xs font-black text-rose-800">❌ Verification Rejected</div>
                  <p className="text-xs font-semibold text-rose-700">
                    Reason: "{user?.verification_notes || "Please re-upload a valid document."}"
                  </p>
                </div>
              )}
            </div>

            {/* Expandable Verification Form */}
            {verifyOpen && !isVerified && (
              <div className="border-t border-slate-100 p-4 sm:p-6 bg-slate-50/50">
                {verificationMsg && (
                  <div className={`mb-4 p-3 rounded-xl text-xs font-bold ${
                    verificationMsg.type === "success"
                      ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                      : "bg-rose-50 text-rose-800 border border-rose-200"
                  }`}>
                    {verificationMsg.text}
                  </div>
                )}

                <form onSubmit={handleVerifySubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-extrabold text-slate-700 mb-1">GSTIN (Optional)</label>
                      <input
                        type="text"
                        value={verificationForm.gstin}
                        onChange={(e) => setVerificationForm({ ...verificationForm, gstin: e.target.value })}
                        placeholder="e.g. 24AAAAA0000A1Z5"
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-amber-600 transition"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-extrabold text-slate-700 mb-1">PAN Card Number</label>
                      <input
                        type="text"
                        value={verificationForm.pan_number}
                        onChange={(e) => setVerificationForm({ ...verificationForm, pan_number: e.target.value })}
                        placeholder="e.g. ABCDE1234F"
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-amber-600 transition"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-extrabold text-slate-700 mb-1">Trade / Labor License No.</label>
                      <input
                        type="text"
                        value={verificationForm.license_number}
                        onChange={(e) => setVerificationForm({ ...verificationForm, license_number: e.target.value })}
                        placeholder="e.g. LIC/2026/99812"
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-amber-600 transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 mb-2">Upload ID / License Proof (JPEG, PNG, WEBP)</label>
                    <div className="flex flex-wrap items-center gap-3">
                      <label className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl hover:border-amber-400 hover:bg-amber-50 transition">
                        <FileText size={14} className="text-amber-600" />
                        <span className="text-xs font-bold text-slate-700">
                          {verificationDoc ? verificationDoc.name : "Choose File"}
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => setVerificationDoc(e.target.files?.[0] || null)}
                        />
                      </label>
                      {user?.verification_doc_url && (
                        <a
                          href={getImageUrl(user.verification_doc_url)}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-bold text-amber-700 underline flex items-center gap-1"
                        >
                          <ExternalLink size={12} /> View Previous Doc
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="submit"
                      disabled={submittingVerification}
                      className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-extrabold rounded-xl shadow-xs transition cursor-pointer active:scale-95 disabled:opacity-50 flex items-center gap-2"
                    >
                      {submittingVerification ? (
                        <><div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /><span>Submitting...</span></>
                      ) : (
                        <><ShieldCheck size={14} /><span>Submit Verification Proof</span></>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ── MODE 2: EDIT PROFILE FORM ── */
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Business & Contact Info */}
          <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200/80 shadow-xs">
            <h2 className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
              <Building2 size={18} className="text-amber-600" />
              Edit Business &amp; Contact Details
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1">Full Name / Contact Person *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Rajesh Sharma"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:bg-white focus:border-amber-600 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1">Company / Business Name</label>
                <input
                  type="text"
                  value={formData.company_name}
                  onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                  placeholder="e.g. Sharma Painting Contractor"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:bg-white focus:border-amber-600 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1">Primary Mobile Number</label>
                <input
                  type="tel"
                  disabled
                  value={formData.phone}
                  className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-500 cursor-not-allowed"
                />
                <span className="text-[10px] text-slate-400 font-medium">Registered account phone number</span>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1">Operating City *</label>
                <SearchableCitySelect
                  value={formData.city}
                  onChange={(val) => setFormData({ ...formData, city: val })}
                  placeholder="Search or type city (e.g. Kalol, Ahmedabad, Thane...)"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1">Postal Pincode</label>
                <input
                  type="text"
                  value={formData.pincode}
                  onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                  placeholder="e.g. 400053"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:bg-white focus:border-amber-600 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1">Site / Office Address</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="e.g. Andheri West, Mumbai, Maharashtra"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:bg-white focus:border-amber-600 transition"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Specialized Work Categories */}
          <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200/80 shadow-xs">
            <h2 className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-2 mb-3">
              <Briefcase size={18} className="text-amber-600" />
              Select Specialized Work Categories
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {AVAILABLE_TRADES.map((trade) => {
                const isSelected = selectedTrades.includes(trade.id);
                return (
                  <button
                    type="button"
                    key={trade.id}
                    onClick={() => toggleTrade(trade.id)}
                    className={`p-3 rounded-2xl border text-left flex items-center justify-between gap-2 transition cursor-pointer ${
                      isSelected
                        ? "bg-amber-50 border-amber-500 text-amber-950 font-black shadow-2xs"
                        : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 font-semibold"
                    }`}
                  >
                    <span className="text-xs flex items-center gap-2">
                      <span>{trade.icon}</span>
                      <span>{trade.label}</span>
                    </span>
                    {isSelected && <Check size={14} className="text-amber-600 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 3: Contractor Bio / About */}
          <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200/80 shadow-xs">
            <h2 className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-2 mb-3">
              <Sparkles size={18} className="text-amber-600" />
              Business Overview &amp; Experience
            </h2>

            <textarea
              rows={4}
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              placeholder="Describe your company background, years of experience, labor team capacity, completed projects..."
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-900 outline-none focus:bg-white focus:border-amber-600 transition"
            />
          </div>

          {/* Section 4: Work Portfolio Upload & Management (Edit Mode) */}
          <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-wrap gap-2">
              <div>
                <h2 className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-2">
                  <ImageIcon size={18} className="text-amber-600" />
                  Work Portfolio Management ({workImages.length})
                </h2>
                <p className="text-xs font-medium text-slate-500 mt-0.5">
                  Upload photos of completed project sites or remove old photos.
                </p>
              </div>
              <label className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-black rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1.5 active:scale-95">
                {uploadingWorkPics ? (
                  <><div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /><span>Uploading...</span></>
                ) : (
                  <><Upload size={14} /><span>Upload New Photos</span></>
                )}
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  disabled={uploadingWorkPics}
                  onChange={async (e) => {
                    const files = e.target.files;
                    if (!files || files.length === 0) return;
                    setUploadingWorkPics(true);
                    try {
                      const fd = new FormData();
                      Array.from(files).forEach((f) => fd.append("images", f));
                      await uploadContractorWorkImages(fd);
                      await fetchWorkImages();
                    } catch (err) {
                      alert("Failed to upload work images.");
                    } finally {
                      setUploadingWorkPics(false);
                      e.target.value = "";
                    }
                  }}
                />
              </label>
            </div>

            {workImages.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5">
                {workImages.map((img) => (
                  <div key={img.id} className="relative aspect-video rounded-xl overflow-hidden bg-slate-100 border border-slate-200 group shadow-xs">
                    <img
                      src={getImageUrl(img.image_url)}
                      alt={img.title || "Work Site"}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.style.display = "none";
                        e.target.parentNode.classList.add("bg-slate-200");
                      }}
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-start justify-end p-2">
                      <button
                        type="button"
                        onClick={async () => {
                          if (window.confirm("Remove this project photo?")) {
                            try {
                              await deleteContractorWorkImage(img.id);
                              setWorkImages((prev) => prev.filter((i) => i.id !== img.id));
                            } catch (err) {
                              alert("Failed to delete photo.");
                            }
                          }
                        }}
                        className="p-1.5 bg-rose-600 text-white rounded-lg transition shadow-md cursor-pointer hover:bg-rose-700 active:scale-90 flex items-center gap-1 text-[10px] font-bold"
                        title="Delete photo"
                      >
                        <Trash2 size={13} />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                ))}
                {/* Tile to add more photo */}
                <label className="aspect-video rounded-xl overflow-hidden bg-slate-50 border-2 border-dashed border-slate-300 flex flex-col items-center justify-center cursor-pointer hover:bg-amber-50 hover:border-amber-400 transition group">
                  <Plus size={22} className="text-slate-400 group-hover:text-amber-600 mb-1 transition" />
                  <span className="text-xs font-extrabold text-slate-500 group-hover:text-amber-700">Add Photo</span>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    disabled={uploadingWorkPics}
                    onChange={async (e) => {
                      const files = e.target.files;
                      if (!files || files.length === 0) return;
                      setUploadingWorkPics(true);
                      try {
                        const fd = new FormData();
                        Array.from(files).forEach((f) => fd.append("images", f));
                        await uploadContractorWorkImages(fd);
                        await fetchWorkImages();
                      } catch (err) {
                        alert("Failed to upload work images.");
                      } finally {
                        setUploadingWorkPics(false);
                        e.target.value = "";
                      }
                    }}
                  />
                </label>
              </div>
            ) : (
              <label className="block cursor-pointer">
                <div className="p-8 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-300 text-center hover:bg-amber-50 hover:border-amber-400 transition">
                  <Upload size={32} className="text-amber-600 mx-auto mb-2 opacity-80" />
                  <p className="text-xs font-black text-slate-700 mb-1">Click or drag images here to upload portfolio photos</p>
                  <p className="text-[10px] font-medium text-slate-400">PNG, JPG, WEBP formats supported</p>
                </div>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  disabled={uploadingWorkPics}
                  onChange={async (e) => {
                    const files = e.target.files;
                    if (!files || files.length === 0) return;
                    setUploadingWorkPics(true);
                    try {
                      const fd = new FormData();
                      Array.from(files).forEach((f) => fd.append("images", f));
                      await uploadContractorWorkImages(fd);
                      await fetchWorkImages();
                    } catch (err) {
                      alert("Failed to upload work images.");
                    } finally {
                      setUploadingWorkPics(false);
                      e.target.value = "";
                    }
                  }}
                />
              </label>
            )}
          </div>

          {/* Bottom Action Bar */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => { setIsEditing(false); setSelectedFile(null); setPreviewPic(user?.profile_pic || ""); }}
              className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs rounded-xl transition cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white font-black text-xs rounded-xl shadow-md transition active:scale-95 flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {saving ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <><Save size={16} /><span>Save Profile Settings</span></>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
