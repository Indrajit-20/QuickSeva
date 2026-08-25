import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Briefcase,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  HardHat,
  IndianRupee,
  MapPin,
  Send,
  ShieldCheck,
  Sparkles,
  User,
  Phone,
  Users,
  X,
  FileText,
} from "lucide-react";
import { getContractorPostById, createApplication } from "../api/contractorApi";
import { useAuth } from "../context/AuthContext";

const getImageUrl = (url) => {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:")) {
    return url;
  }
  const cleanPath = url.startsWith("/") ? url : `/${url}`;
  return `http://localhost:5000${cleanPath}`;
};

export default function ContractorPostDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [imgError, setImgError] = useState(false);

  const handleBack = () => {
    const params = new URLSearchParams(location.search);
    const fromPage = params.get("fromPage");
    if (fromPage) {
      navigate(fromPage);
      return;
    }
    const fromTab = params.get("fromTab") || "job_board";
    navigate(`/contractor-hub?tab=${fromTab}`);
  };

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showAppModal, setShowAppModal] = useState(false);
  const [appForm, setAppForm] = useState({
    applicant_name: user?.name || "",
    applicant_phone: user?.phone || "",
    applicant_type: "agency",
    workers_count: 1,
    notes: "",
  });
  const [submittingApp, setSubmittingApp] = useState(false);
  const [appSuccess, setAppSuccess] = useState(false);

  useEffect(() => {
    fetchDetail();
  }, [id]);

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const res = await getContractorPostById(id);
      if (res?.data?.post) {
        setPost(res.data.post);
      } else {
        setError("Post not found");
      }
    } catch (err) {
      setError("Failed to load post details");
    } finally {
      setLoading(false);
    }
  };

  const handleApplySubmit = async (e) => {
    e.preventDefault();
    if (!appForm.applicant_name || !appForm.applicant_phone) {
      alert("Name and phone number are required");
      return;
    }

    setSubmittingApp(true);
    try {
      await createApplication({
        post_id: post.id,
        applicant_name: appForm.applicant_name,
        applicant_phone: appForm.applicant_phone,
        applicant_type: appForm.applicant_type,
        workers_count: appForm.workers_count,
        notes: appForm.notes,
      });
      setAppSuccess(true);
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to submit application");
    } finally {
      setSubmittingApp(false);
    }
  };

  const handleVisitProfile = () => {
    if (post?.contractor_id) {
      navigate(`/contractors/${post.contractor_id}?fromTab=job_board`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-slate-800">
        <div className="flex flex-col items-center gap-3">
          <div className="w-9 h-9 border-3 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Loading Requirement...</p>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 flex flex-col items-center justify-center text-slate-800">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center max-w-sm w-full shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto mb-3 text-amber-600">
            <Building2 size={28} />
          </div>
          <h3 className="text-base font-black text-slate-900 mb-1">Requirement Not Found</h3>
          <p className="text-xs font-semibold text-slate-500 mb-5">This site requirement post may have expired or been removed.</p>
          <button
            onClick={handleBack}
            className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-black rounded-xl text-xs shadow-md shadow-amber-500/20 transition active:scale-[0.98] cursor-pointer"
          >
            Back to Contractor Hub
          </button>
        </div>
      </div>
    );
  }

  const isSupply = post.post_type === "supply_workers";
  const totalWorkers = post.requirements ? post.requirements.reduce((sum, r) => sum + (Number(r.quantity) || 0), 0) : 0;
  const isValidName = (name) => name && name.trim() && name.toLowerCase() !== "ass" && name.toLowerCase() !== "test";
  const posterName =
    (isValidName(post.user_company_name) ? post.user_company_name : null) ||
    (isValidName(post.contractor_user_name) ? post.contractor_user_name : null) ||
    (isValidName(post.company_name) ? post.company_name : null) ||
    (isValidName(post.contact_name) ? post.contact_name : null) ||
    "Contractor";
  const posterInitial = posterName.charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans pb-28">
      {/* ─── Clean Top Navigation Bar ─── */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3 flex items-center justify-between gap-3">
          <button
            onClick={handleBack}
            className="px-2.5 sm:px-3.5 py-1.5 rounded-lg sm:rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 flex items-center gap-1.5 text-[11px] sm:text-xs font-extrabold text-slate-700 transition active:scale-95 cursor-pointer"
          >
            <ArrowLeft size={14} />
            <span className="hidden sm:inline">{new URLSearchParams(location.search).get("fromPage") ? "Back to My Site Listings" : "Back to Job Board"}</span>
            <span className="sm:hidden">Back</span>
          </button>

          <div className="hidden sm:flex items-center gap-2 text-xs font-extrabold text-slate-500">
            <span>Job Board</span>
            <span>/</span>
            <span>Site Requirement</span>
            <span>/</span>
            <span className="text-amber-600 font-black uppercase">{post.city}</span>
          </div>
        </div>
      </div>

      {/* ─── Main Content Grid ─── */}
      <div className="max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* ── LEFT COLUMN: Hero Header & Scope ── */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-6">

            {/* 1. Main Hero Header Card (Light & Spacious) */}
            <div className="bg-white rounded-2xl p-4 sm:p-7 border border-slate-200/90 shadow-sm space-y-3 sm:space-y-4">
              
              {/* Badges Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-900 border border-amber-200 text-xs font-extrabold uppercase tracking-wider">
                    {isSupply ? "Manpower Available" : "Labor Needed for Site"}
                  </span>

                  {totalWorkers > 0 && !isSupply && (
                    <span className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 text-xs font-extrabold flex items-center gap-1">
                      <Users size={12} />
                      <span>{totalWorkers} Workers Required</span>
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1 text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                  <Calendar size={12} className="text-amber-600 shrink-0" />
                  <span>{post.start_date} → {post.end_date}</span>
                </div>
              </div>

              {/* Title & Site Address */}
              <div>
                <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight leading-tight">
                  {post.title}
                </h1>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 mt-1.5">
                  <MapPin size={14} className="text-amber-600 shrink-0" />
                  <span>{post.site_address}, {post.city} {post.pincode ? `(${post.pincode})` : ""}</span>
                </div>
              </div>
            </div>

            {/* 2. Site Overview & Work Notes */}
            {post.description && (
              <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200/90 shadow-sm space-y-1">
                <div className="flex items-center gap-1">
                  <FileText size={13} className="text-amber-600" />
                  <h3 className="text-[11px] sm:text-xs font-bold text-slate-900 uppercase tracking-wide">
                    Site Overview &amp; Work Scope
                  </h3>
                </div>
                <p className="text-xs font-normal text-slate-600 leading-relaxed whitespace-pre-line">
                  {post.description}
                </p>
              </div>
            )}

            {/* 3. Workforce Breakdown & Daily Wages */}
            <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200/90 shadow-sm space-y-3 sm:space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-[11px] sm:text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1">
                  <Users size={13} className="text-amber-600" />
                  <span>Workforce Breakdown &amp; Daily Wages</span>
                </h3>
                <span className="text-[11px] font-semibold text-slate-400">
                  {post.requirements?.length || 0} Trade Roles
                </span>
              </div>

              <div className="rounded-2xl border border-slate-200 overflow-hidden bg-slate-50/50 divide-y divide-slate-200/70">
                {post.requirements && post.requirements.length > 0 ? (
                  post.requirements.map((req, idx) => (
                    <div
                      key={idx}
                      className="p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 bg-white hover:bg-amber-50/30 transition"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-900 font-black text-xs flex items-center justify-center shrink-0 border border-amber-200">
                          {req.quantity}x
                        </div>
                        <div>
                          <div className="font-extrabold text-sm text-slate-900">{req.role_title}</div>
                          {req.skills_required && (
                            <div className="text-xs font-medium text-slate-500 mt-0.5">{req.skills_required}</div>
                          )}
                        </div>
                      </div>

                      <div className="self-start sm:self-auto pl-12 sm:pl-0">
                        <span className="inline-flex items-center px-3.5 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-black shadow-2xs">
                          ₹{Number(req.wage_amount).toLocaleString("en-IN")} / {req.wage_type?.replace("_", " ") || "day"}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-5 text-xs font-medium text-slate-500 text-center">
                    Direct site requirement — contact contractor for detailed role breakdown.
                  </div>
                )}
              </div>
            </div>

            {/* 4. Perks & Site Facilities */}
            {post.amenities && post.amenities.length > 0 && (
              <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200/90 shadow-sm space-y-3">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Sparkles size={16} className="text-amber-600" />
                  <span>Perks & Site Facilities Provided</span>
                </h3>
                <div className="flex flex-wrap gap-2">
                  {post.amenities.map((item, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-900 border border-emerald-200 text-xs font-extrabold shadow-2xs"
                    >
                      <CheckCircle2 size={14} className="text-emerald-600" />
                      <span>{item}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* ── RIGHT COLUMN: Poster Info & Direct Action Card ── */}
          <div className="lg:col-span-5 xl:col-span-4">
            <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200/90 shadow-sm sticky top-16 sm:top-20 space-y-4 sm:space-y-5">
              
              {/* Poster Info Header */}
              <div className="space-y-3">
                <span className="px-2.5 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-wider rounded-md">
                  Requirement Poster
                </span>

                <div className="flex items-center gap-3.5">
                  {post.contractor_pic && !imgError ? (
                    <img
                      src={getImageUrl(post.contractor_pic)}
                      alt={posterName}
                      onError={() => setImgError(true)}
                      className="w-14 h-14 rounded-2xl object-cover border border-slate-200 shadow-xs shrink-0"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 text-white font-black text-xl flex items-center justify-center shadow-md shadow-amber-500/20 shrink-0">
                      {posterInitial}
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <h3 className="font-black text-base text-slate-900 truncate">
                        {posterName}
                      </h3>
                      <ShieldCheck size={16} className="text-emerald-600 shrink-0" title="Verified Contractor" />
                    </div>
                    <p className="text-xs font-semibold text-slate-500 truncate">
                      Verified Poster • {post.city} Site
                    </p>
                  </div>
                </div>

                {post.contractor_id && (
                  <button
                    onClick={handleVisitProfile}
                    className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-extrabold rounded-xl border border-slate-200 transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                  >
                    <span>View Contractor Profile</span>
                    <ExternalLink size={13} />
                  </button>
                )}
              </div>

              <hr className="border-slate-100" />

              {/* Primary Application CTA */}
              <div className="space-y-3">
                <div>
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                    Supply Labor for this Site
                  </h4>
                  <p className="text-xs font-medium text-slate-500 mt-1 leading-relaxed">
                    Have workers or an agency crew? Submit your availability directly to <strong className="text-slate-900">{posterName}</strong>.
                  </p>
                </div>

                <button
                  onClick={() => {
                    setAppForm({
                      applicant_name: user?.name || "",
                      applicant_phone: user?.phone || "",
                      applicant_type: "agency",
                      workers_count: 1,
                      notes: "",
                    });
                    setAppSuccess(false);
                    setShowAppModal(true);
                  }}
                  className="w-full py-3.5 bg-amber-600 hover:bg-amber-700 text-white font-black text-xs rounded-xl shadow-md shadow-amber-600/15 transition active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                >
                  <Send size={15} />
                  <span>Submit Labor Application</span>
                </button>
              </div>

            </div>
          </div>

        </div>
      </div>

      {/* ─── Clean Application Modal (z-[9999] completely covers bottom nav bar) ─── */}
      {showAppModal && (
        <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/70 backdrop-blur-md">
          <div className="relative w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-3xl shadow-2xl overflow-hidden border border-slate-100 max-h-[90vh]">
            
            {/* Modal Header (Clean Light Theme) */}
            <div className="bg-white border-b border-slate-200/90 p-4 sm:p-5 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest block mb-0.5">
                  Application Form
                </span>
                <h3 className="text-base font-black text-slate-900 tracking-tight leading-snug">
                  Apply for Site Requirement
                </h3>
                <p className="text-xs text-slate-500 font-semibold truncate max-w-[280px] mt-0.5">
                  {post.title}
                </p>
              </div>
              <button
                onClick={() => setShowAppModal(false)}
                className="w-8 h-8 rounded-full bg-slate-900 border border-slate-700 hover:bg-rose-600 flex items-center justify-center text-white transition active:scale-95 cursor-pointer shrink-0 shadow-md"
                title="Close"
              >
                <X size={18} strokeWidth={2.5} />
              </button>
            </div>

            <div className="p-4 sm:p-6 max-h-[75vh] overflow-y-auto">
              {appSuccess ? (
                <div className="text-center py-6 space-y-4">
                  <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto shadow-xs font-black">
                    <CheckCircle2 size={30} />
                  </div>
                  <div>
                    <h4 className="text-base font-black text-slate-900 mb-1">Application Submitted! 🎉</h4>
                    <p className="text-xs font-medium text-slate-600 leading-relaxed max-w-xs mx-auto">
                      Contractor <span className="font-bold text-slate-900">{posterName}</span> received your manpower application and will review it via QuickSeva.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowAppModal(false)}
                    className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs rounded-xl shadow-md transition active:scale-95 cursor-pointer"
                  >
                    Done & Close
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplySubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 mb-1.5">Your Full Name / Agency Name *</label>
                    <div className="relative flex items-center">
                      <User className="absolute left-3.5 text-slate-400 pointer-events-none z-10" size={16} />
                      <input
                        type="text"
                        required
                        placeholder="e.g. Ramesh Manpower Agency"
                        value={appForm.applicant_name}
                        onChange={(e) => setAppForm({ ...appForm, applicant_name: e.target.value })}
                        style={{ paddingLeft: "42px" }}
                        className="w-full pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 outline-none focus:bg-white focus:border-amber-600 focus:ring-2 focus:ring-amber-600/20 transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 mb-1.5">Phone Number (For Callback) *</label>
                    <div className="relative flex items-center">
                      <Phone className="absolute left-3.5 text-slate-400 pointer-events-none z-10" size={16} />
                      <input
                        type="tel"
                        required
                        placeholder="e.g. 9876543210"
                        value={appForm.applicant_phone}
                        onChange={(e) => setAppForm({ ...appForm, applicant_phone: e.target.value })}
                        style={{ paddingLeft: "42px" }}
                        className="w-full pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 outline-none focus:bg-white focus:border-amber-600 focus:ring-2 focus:ring-amber-600/20 transition"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-extrabold text-slate-700 mb-1.5">Applicant Role</label>
                      <select
                        value={appForm.applicant_type}
                        onChange={(e) => setAppForm({ ...appForm, applicant_type: e.target.value })}
                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 outline-none focus:bg-white focus:border-amber-600 cursor-pointer transition"
                      >
                        <option value="agency">Manpower Agency</option>
                        <option value="group_leader">Group Leader (Thekedar)</option>
                        <option value="individual">Individual Worker</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-extrabold text-slate-700 mb-1.5">Workers Count</label>
                      <input
                        type="number"
                        min="1"
                        value={appForm.workers_count}
                        onChange={(e) => setAppForm({ ...appForm, workers_count: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 outline-none focus:bg-white focus:border-amber-600 transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 mb-1.5">Additional Notes</label>
                    <textarea
                      rows={2}
                      placeholder="e.g. 10 experienced civil workers ready for immediate site deployment."
                      value={appForm.notes}
                      onChange={(e) => setAppForm({ ...appForm, notes: e.target.value })}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 outline-none focus:bg-white focus:border-amber-600 transition resize-none"
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={submittingApp}
                      className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
                    >
                      {submittingApp ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <Send size={15} />
                          <span>Submit Application</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
