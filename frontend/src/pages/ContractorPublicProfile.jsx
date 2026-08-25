import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import ContractorProfileSkeleton from "../components/ContractorProfileSkeleton";
import {
  Building2,
  MapPin,
  ShieldCheck,
  Briefcase,
  Star,
  CheckCircle2,
  Send,
  ArrowLeft,
  Share2,
  Users,
  MessageCircle,
  ExternalLink,
  Camera,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { getContractorPublicProfile, createQuoteRequest } from "../api/contractorApi";
import ContractorQuoteModal from "../components/ContractorQuoteModal";
import { useAuth } from "../context/AuthContext";
import { getWhatsAppCustomerToContractorLink } from "../utils/whatsappUtils";

const getImageUrl = (url) => {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:")) {
    return url;
  }
  const cleanPath = url.startsWith("/") ? url : `/${url}`;
  return `http://localhost:5000${cleanPath}`;
};

export default function ContractorPublicProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const quoteFormRef = useRef(null);

  const handleBack = () => {
    const params = new URLSearchParams(location.search);
    const fromTab = params.get("fromTab") || "contractors";
    navigate(`/contractor-hub?tab=${fromTab}`);
  };

  const [contractor, setContractor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [profileImgError, setProfileImgError] = useState(false);

  // Quote Modal State
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [showAllPosts, setShowAllPosts] = useState(false);

  const handleQuoteClick = () => {
    if (window.innerWidth >= 1024 && quoteFormRef.current) {
      quoteFormRef.current.scrollIntoView({ behavior: "smooth" });
    } else {
      setShowQuoteModal(true);
    }
  };

  // Inline Quote Form State
  const [quoteData, setQuoteData] = useState({
    customer_name: user?.name || "",
    customer_phone: user?.phone || "",
    city: "",
    service_type: "",
    notes: "",
  });
  const [submittingQuote, setSubmittingQuote] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [quoteSuccess, setQuoteSuccess] = useState(false);
  const [submittedLead, setSubmittedLead] = useState(null);
  const [quoteError, setQuoteError] = useState(null);

  useEffect(() => {
    fetchContractorProfile();
  }, [id]);

  const fetchContractorProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getContractorPublicProfile(id);
      const data = res?.data?.contractor;
      if (data) {
        setContractor(data);
        setQuoteData((prev) => ({
          ...prev,
          city: data.city || "",
          service_type: data.trade_specialization || "General Work Contract",
        }));
      } else {
        setError("Contractor profile not found.");
      }
    } catch (err) {
      console.error("Failed to fetch contractor public profile:", err);
      setError("Unable to load contractor profile. Please check the link.");
    } finally {
      setLoading(false);
    }
  };

  const handleInlineQuoteSubmit = (e) => {
    e.preventDefault();
    if (!quoteData.customer_name || !quoteData.customer_phone || !quoteData.city) {
      setQuoteError("Please enter your Name, Phone Number, and City.");
      return;
    }
    setQuoteError(null);
    setShowConfirmModal(true);
  };

  const executeSubmitQuote = async () => {
    setSubmittingQuote(true);
    setQuoteError(null);

    try {
      const res = await createQuoteRequest({
        contractor_id: id,
        customer_name: quoteData.customer_name,
        customer_phone: quoteData.customer_phone,
        city: quoteData.city,
        service_type: quoteData.service_type || contractor?.trade_specialization || "General Work Contract",
        notes: quoteData.notes,
      });

      setSubmittedLead(res?.data || null);
      setQuoteSuccess(true);
      setShowConfirmModal(false);
    } catch (err) {
      setQuoteError(err?.response?.data?.message || "Failed to submit quote request. Please try again.");
      setShowConfirmModal(false);
    } finally {
      setSubmittingQuote(false);
    }
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      alert("📋 Profile link copied to clipboard!");
    }
  };

  if (loading) {
    return <ContractorProfileSkeleton />;
  }

  if (error || !contractor) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-slate-800 font-sans">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200 shadow-xl text-center">
          <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-3 font-black text-xl">
            ⚠️
          </div>
          <h2 className="text-lg font-black text-slate-900 mb-2">{error || "Profile Not Found"}</h2>
          <p className="text-xs font-medium text-slate-500 mb-6">
            The contractor profile you are looking for may have been updated or removed.
          </p>
          <button
            onClick={handleBack}
            className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs rounded-xl transition shadow-sm cursor-pointer"
          >
            Return to Contractor Hub
          </button>
        </div>
      </div>
    );
  }

  const profileImg = getImageUrl(contractor.profile_pic);
  const displayName = contractor.company_name || contractor.name;
  const tradeName = contractor.trade_specialization || "General Work Contractor";
  const visiblePosts = showAllPosts
    ? contractor.active_posts || []
    : (contractor.active_posts || []).slice(0, 2);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans pb-24 bottom-nav-spacer">
      {/* ── Compact Navigation Bar ── */}
      <div className="bg-white border-b border-slate-200/80 shadow-2xs sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3 flex items-center justify-between gap-3">
          <button
            onClick={handleBack}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] sm:text-xs font-bold rounded-lg sm:rounded-xl transition active:scale-95 cursor-pointer"
          >
            <ArrowLeft size={13} />
            <span className="hidden sm:inline">Back to Contractor Hub</span>
            <span className="sm:hidden">Back</span>
          </button>

          <button
            onClick={handleShare}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] sm:text-xs font-bold rounded-lg sm:rounded-xl transition active:scale-95 cursor-pointer"
          >
            <Share2 size={13} />
            <span className="hidden sm:inline">Share Profile</span>
            <span className="sm:hidden">Share</span>
          </button>
        </div>
      </div>

      {/* ── Main Profile Container ── */}
      <div className="max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-start">

          {/* ── LEFT COLUMN: Unified Contractor Business Profile ── */}
          <div className="lg:col-span-7 xl:col-span-8 bg-white rounded-2xl p-4 sm:p-7 border border-slate-200/90 shadow-sm space-y-5 sm:space-y-6">

            {/* 1. Header Identity Section */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4 pb-4 sm:pb-5 border-b border-slate-100">
              <div className="flex items-start gap-3 min-w-0">
                {profileImg && !profileImgError ? (
                  <img
                    src={profileImg}
                    alt={displayName}
                    onError={() => setProfileImgError(true)}
                    className="w-14 h-14 sm:w-20 sm:h-20 rounded-xl sm:rounded-2xl object-cover border border-slate-200 shadow-sm shrink-0"
                  />
                ) : (
                  <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-xl sm:rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 text-white flex items-center justify-center font-black text-xl sm:text-2xl shadow-sm shrink-0">
                    {displayName[0]?.toUpperCase() || "C"}
                  </div>
                )}

                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight leading-snug">
                      {displayName}
                    </h1>
                    {contractor.is_verified_contractor === 1 && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                        <ShieldCheck size={13} className="text-emerald-500" />
                        Verified Contractor
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-800 flex-wrap">
                    <span className="px-2.5 py-0.5 bg-amber-50 rounded-md border border-amber-200/80">
                      {tradeName}
                    </span>
                    {contractor.city && (
                      <span className="px-2.5 py-0.5 bg-slate-100 text-slate-700 rounded-md border border-slate-200 font-semibold">
                        📍 {contractor.city}, India
                      </span>
                    )}
                    <span className="px-2.5 py-0.5 bg-amber-50/80 text-amber-900 rounded-md border border-amber-200/60 font-bold flex items-center gap-1">
                      <Star size={12} className="fill-amber-400 text-amber-400" />
                      4.9 (Verified Rating)
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Business Bio / Summary */}
            <div className="space-y-1">
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wide">Business Overview</h2>
              <p className="text-xs font-normal text-slate-600 leading-relaxed whitespace-pre-line">
                {contractor.bio ||
                  `${displayName} is a verified ${tradeName} operating out of ${contractor.city || "India"}. Specialized in executing high-quality residential, commercial, and industrial turnkey site contracting work with professional labor management.`}
              </p>
            </div>

            {/* 3. Verified Perks & Standards (Clean Flex Badges) */}
            <div className="space-y-1.5 pt-2.5 border-t border-slate-100">
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wide">Contractor Standards &amp; Perks</h2>
              <div className="flex flex-wrap gap-1 text-xs font-medium text-slate-700">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50/70 text-amber-900 rounded-md border border-amber-200/80">
                  <CheckCircle2 size={11} className="text-amber-600 shrink-0" />
                  Food 🍱 &amp; Stay 🛖 Provided
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50/70 text-amber-900 rounded-md border border-amber-200/80">
                  <CheckCircle2 size={11} className="text-amber-600 shrink-0" />
                  Licensed Site Masons &amp; Skilled Crew
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50/70 text-amber-900 rounded-md border border-amber-200/80">
                  <CheckCircle2 size={11} className="text-amber-600 shrink-0" />
                  Material + Labor Turnkey Contracts
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50/70 text-amber-900 rounded-md border border-amber-200/80">
                  <CheckCircle2 size={11} className="text-amber-600 shrink-0" />
                  On-Time Project Delivery
                </span>
              </div>
            </div>

            {/* 4. Active Site Work Posts (Compact Grid + Show All Toggle) */}
            {contractor.active_posts && contractor.active_posts.length > 0 && (
              <div className="space-y-2 pt-2.5 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1">
                    <Users size={12} className="text-amber-600" />
                    <span>Active Work Site Requirements ({contractor.active_posts.length})</span>
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {visiblePosts.map((post) => (
                    <div
                      key={post.id}
                      onClick={() => navigate(`/contractor-posts/${post.id}?fromTab=contractors`)}
                      className="p-3.5 bg-slate-50 hover:bg-amber-50/60 rounded-2xl border border-slate-200/80 hover:border-amber-300 transition cursor-pointer flex flex-col justify-between gap-2 group"
                    >
                      <div>
                        <h3 className="text-xs font-extrabold text-slate-900 group-hover:text-amber-800 transition line-clamp-2 leading-snug">
                          {post.title}
                        </h3>
                        <p className="text-xs font-semibold text-slate-500 mt-1">
                          📍 {post.city} • {new Date(post.created_at).toLocaleDateString("en-IN")}
                        </p>
                      </div>
                      <span className="text-xs font-extrabold text-amber-700 group-hover:translate-x-0.5 transition flex items-center gap-1 self-end mt-1">
                        View Details <ExternalLink size={11} />
                      </span>
                    </div>
                  ))}
                </div>

                {contractor.active_posts.length > 2 && (
                  <button
                    type="button"
                    onClick={() => setShowAllPosts(!showAllPosts)}
                    className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1 cursor-pointer"
                  >
                    {showAllPosts ? (
                      <>
                        <span>Show Less</span>
                        <ChevronUp size={14} />
                      </>
                    ) : (
                      <>
                        <span>Show All ({contractor.active_posts.length}) Work Requirements</span>
                        <ChevronDown size={14} />
                      </>
                    )}
                  </button>
                )}
              </div>
            )}

            {/* 5. Completed Projects & Work Site Gallery */}
            {contractor.work_images && contractor.work_images.length > 0 && (
              <div className="space-y-2 pt-2.5 border-t border-slate-100">
                <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1">
                  <Camera size={12} className="text-amber-600" />
                  <span>Completed Projects ({contractor.work_images.length})</span>
                </h2>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {contractor.work_images.map((img, idx) => (
                    <div
                      key={img.id || idx}
                      onClick={() => setLightboxIndex(idx)}
                      className="relative aspect-4/3 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 cursor-pointer group shadow-xs"
                    >
                      <img
                        src={getImageUrl(img.image_url)}
                        alt={img.title || "Project site photo"}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      />
                      <div className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-xs font-bold gap-1 backdrop-blur-xs">
                        <span>View Photo</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* ── RIGHT COLUMN: Embedded Direct Lead Request Form ── */}
          <div className="lg:col-span-5 xl:col-span-4" ref={quoteFormRef}>
            <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200/90 shadow-sm sticky top-16 sm:top-20 space-y-3 sm:space-y-4">
              <div>
                <span className="px-2.5 py-0.5 bg-amber-100 text-amber-900 text-xs font-black uppercase tracking-wider rounded-md">
                  For Homeowners & Property Clients
                </span>
                <h3 className="text-base font-black text-slate-900 tracking-tight mt-1.5">
                  Request Work Quote
                </h3>
                <p className="text-xs font-medium text-slate-500 mt-0.5 leading-relaxed">
                  Are you hiring <strong className="text-slate-900">{displayName}</strong> for a project? Submit site details below to get a price estimate.
                </p>
              </div>

              {quoteSuccess ? (
                <div className="bg-emerald-50/80 rounded-2xl p-4 sm:p-5 border border-emerald-200 text-center space-y-3.5">
                  <div className="w-11 h-11 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto shadow-2xs font-black">
                    <CheckCircle2 size={22} />
                  </div>

                  <div>
                    <h4 className="text-sm font-black text-slate-900">Lead Saved Successfully! 🎉</h4>
                    <p className="text-xs font-semibold text-emerald-800 mt-0.5">
                      Request Registered for <span className="font-bold">{displayName}</span>
                    </p>
                  </div>

                  {submittedLead?.quoteId && (
                    <span className="inline-block px-3 py-1 bg-white text-amber-900 text-xs font-black rounded-xl border border-emerald-300 shadow-2xs">
                      Lead Reference ID: #{submittedLead.quoteId}
                    </span>
                  )}

                  {/* Clear Real-World "What Happens Next?" Flow Breakdown */}
                  <div className="bg-white rounded-xl p-3 border border-emerald-200 text-left space-y-2 text-xs font-medium text-slate-700 shadow-2xs">
                    <p className="font-black uppercase tracking-wider text-xs text-emerald-800 flex items-center gap-1">
                      <span>⚡ What Happens Next?</span>
                    </p>
                    <div className="flex items-start gap-2">
                      <span className="font-bold text-amber-600">1.</span>
                      <span><strong className="text-slate-900">Direct Callback:</strong> <strong className="text-slate-900">{displayName}</strong> gets notified and will call your provided number (<strong className="text-slate-900">{quoteData.customer_phone}</strong>) for a price estimate.</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-bold text-amber-600">2.</span>
                      <span><strong className="text-slate-900">Site Assessment:</strong> The contractor will schedule a site visit in <strong className="text-slate-900">{quoteData.city}</strong> to provide an accurate estimate.</span>
                    </div>
                  </div>

                  {submittedLead?.contractor_phone && (
                    <a
                      href={`https://wa.me/${submittedLead.contractor_phone.startsWith("+") ? submittedLead.contractor_phone.replace(/[^0-9]/g, "") : `91${submittedLead.contractor_phone.replace(/[^0-9]/g, "")}`}?text=${encodeURIComponent(submittedLead.whatsapp_msg || "Hi, I submitted a project quote request on QuickSeva.")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 active:scale-95 cursor-pointer decoration-none"
                    >
                      <MessageCircle size={15} />
                      <span>Chat Directly on WhatsApp</span>
                    </a>
                  )}

                  <button
                    onClick={() => {
                      setQuoteSuccess(false);
                      setQuoteData((prev) => ({ ...prev, notes: "" }));
                    }}
                    className="w-full py-2 bg-white hover:bg-slate-100 text-slate-800 font-extrabold text-xs rounded-xl border border-slate-200 shadow-2xs transition active:scale-95 cursor-pointer"
                  >
                    Submit Another Work Request
                  </button>
                </div>
              ) : (
                <form onSubmit={handleInlineQuoteSubmit} className="space-y-3">
                  {quoteError && (
                    <div className="p-2.5 bg-rose-50 text-rose-700 text-xs font-semibold rounded-xl border border-rose-200">
                      {quoteError}
                    </div>
                  )}

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Your Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Indrajeit Sharma"
                      value={quoteData.customer_name}
                      onChange={(e) => setQuoteData({ ...quoteData, customer_name: e.target.value })}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-amber-600 outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Phone Number (For Callback) *</label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. 9876543210"
                      value={quoteData.customer_phone}
                      onChange={(e) => setQuoteData({ ...quoteData, customer_phone: e.target.value })}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-amber-600 outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Work Site City *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Pune / Mumbai"
                      value={quoteData.city}
                      onChange={(e) => setQuoteData({ ...quoteData, city: e.target.value })}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-amber-600 outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Project Details</label>
                    <textarea
                      rows={3}
                      placeholder="Describe work needed (e.g. 2000 sq.ft painting)..."
                      value={quoteData.notes}
                      onChange={(e) => setQuoteData({ ...quoteData, notes: e.target.value })}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-amber-600 outline-none transition resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submittingQuote}
                    className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white font-black text-xs rounded-xl shadow-md transition flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    {submittingQuote ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Send size={14} />
                        <span>Submit Project Lead Request</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* ── Fullscreen Lightbox Modal ── */}
      {lightboxIndex !== null && contractor.work_images && contractor.work_images[lightboxIndex] && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
          <button
            onClick={() => setLightboxIndex(null)}
            className="absolute top-4 right-4 h-10 w-10 flex items-center justify-center bg-slate-900 border border-slate-700 hover:bg-rose-600 text-white rounded-full transition cursor-pointer shadow-xl active:scale-95 z-50"
            title="Close"
          >
            <X size={20} strokeWidth={2.5} />
          </button>

          <div className="relative max-w-4xl max-h-[85vh] flex items-center justify-center">
            <img
              src={getImageUrl(contractor.work_images[lightboxIndex].image_url)}
              alt="Project Site Photo"
              className="max-w-full max-h-[80vh] rounded-2xl object-contain shadow-2xl"
            />

            {contractor.work_images.length > 1 && (
              <>
                <button
                  onClick={() => setLightboxIndex((prev) => (prev > 0 ? prev - 1 : contractor.work_images.length - 1))}
                  className="absolute left-2 p-2 bg-slate-900/80 hover:bg-slate-900 text-white rounded-full border border-white/20 backdrop-blur-xs transition cursor-pointer"
                >
                  <ChevronLeft size={22} />
                </button>
                <button
                  onClick={() => setLightboxIndex((prev) => (prev < contractor.work_images.length - 1 ? prev + 1 : 0))}
                  className="absolute right-2 p-2 bg-slate-900/80 hover:bg-slate-900 text-white rounded-full border border-white/20 backdrop-blur-xs transition cursor-pointer"
                >
                  <ChevronRight size={22} />
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Sleek "Are you sure?" Confirmation Dialog */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="relative w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 text-center space-y-4 animate-scale-up">
            {/* Icon Badge */}
            <div className="w-14 h-14 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mx-auto shadow-xs border border-amber-200">
              <Send size={26} />
            </div>

            <div>
              <h3 className="text-base font-black text-slate-900">Are you sure?</h3>
              <p className="text-xs text-slate-600 font-medium mt-1 leading-relaxed">
                Do you want to send this project lead request to{" "}
                <span className="font-bold text-slate-900">
                  {contractor?.company_name || contractor?.name}
                </span>
                ?
              </p>
              <p className="text-[11px] text-amber-800 bg-amber-50 rounded-xl p-2.5 mt-2.5 border border-amber-200 font-semibold">
                📞 Contractor will call you back at <span className="font-black text-amber-900">{quoteData.customer_phone}</span>.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeSubmitQuote}
                disabled={submittingQuote}
                className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-black text-xs rounded-xl shadow-md transition flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {submittingQuote ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span>Yes, Send Request</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quote Request Modal */}
      <ContractorQuoteModal
        contractor={contractor}
        isOpen={showQuoteModal}
        onClose={() => setShowQuoteModal(false)}
      />
    </div>
  );
}
