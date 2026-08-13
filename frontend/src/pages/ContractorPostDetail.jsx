import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Building2,
  Calendar,
  CheckCircle2,
  MapPin,
  MessageCircle,
  Phone,
  Send,
  ShieldCheck,
  User,
  Users,
  X,
} from "lucide-react";
import { getContractorPostById, createApplication } from "../api/contractorApi";

export default function ContractorPostDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Application modal state
  const [showAppModal, setShowAppModal] = useState(false);
  const [appForm, setAppForm] = useState({
    applicant_name: "",
    applicant_phone: "",
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

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-slate-800">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-amber-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Loading Site Requirements...</p>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 flex flex-col items-center justify-center text-slate-800">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center max-w-sm w-full">
          <Building2 size={48} className="text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-black text-slate-900 mb-2">Requirement Not Found</h3>
          <p className="text-xs text-slate-500 mb-6">This site requirement post may have expired or been removed.</p>
          <button
            onClick={() => navigate("/contractor-hub")}
            className="w-full py-3 bg-amber-600 text-white font-bold rounded-2xl text-xs"
          >
            Back to Contractor Hub
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans pb-24">
      {/* Top Header */}
      <div className="bg-slate-900 text-white py-6 px-4 sm:px-6 lg:px-8 border-b border-slate-800">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <button
            onClick={() => navigate("/contractor-hub")}
            className="w-10 h-10 rounded-2xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition active:scale-95 shrink-0"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <span className="text-[10px] font-extrabold text-amber-400 uppercase tracking-wider">Work Site Details</span>
            <h1 className="text-xl sm:text-2xl font-black text-white leading-tight truncate">
              {post.title}
            </h1>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Main Info Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-lg">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <span className="px-3.5 py-1.5 rounded-full bg-amber-100 text-amber-800 font-extrabold text-xs uppercase tracking-wide">
              {post.post_type === "supply_workers" ? "Manpower Available" : "Labor Needed"}
            </span>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-600 bg-slate-100 px-4 py-2 rounded-2xl">
              <Calendar size={15} className="text-amber-600" />
              <span>Duration: {post.start_date} to {post.end_date}</span>
            </div>
          </div>

          <h2 className="text-2xl font-black text-slate-900 mb-2">{post.title}</h2>
          <p className="text-sm font-bold text-slate-600 flex items-center gap-1.5 mb-6">
            <MapPin size={16} className="text-amber-600 shrink-0" />
            <span>{post.site_address}, {post.city} ({post.pincode || "India"})</span>
          </p>

          {/* Description */}
          {post.description && (
            <div className="mb-6 p-4 bg-slate-50 rounded-2xl border border-slate-100 text-xs font-medium text-slate-700 leading-relaxed">
              <h4 className="font-extrabold text-slate-900 mb-1">Site Overview & Work Notes:</h4>
              <p>{post.description}</p>
            </div>
          )}

          {/* Requirements Table */}
          <div className="mb-8">
            <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Users size={18} className="text-amber-600" />
              <span>Workforce Breakdown & Daily Wages</span>
            </h3>

            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 font-black uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="p-3.5">Role / Trade</th>
                    <th className="p-3.5 text-center">Quantity</th>
                    <th className="p-3.5">Wage Rate</th>
                    <th className="p-3.5">Skills Required</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-semibold text-slate-800">
                  {post.requirements && post.requirements.length > 0 ? (
                    post.requirements.map((req, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/80 transition">
                        <td className="p-3.5 font-extrabold text-slate-900">{req.role_title}</td>
                        <td className="p-3.5 text-center font-black text-amber-600">{req.quantity} Workers</td>
                        <td className="p-3.5 font-bold text-emerald-700">₹{req.wage_amount} / {req.wage_type}</td>
                        <td className="p-3.5 text-slate-500">{req.skills_required || "Standard site trade work"}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="p-4 text-center text-slate-500">Contact contractor for exact roles</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Perks Provided */}
          {post.amenities && post.amenities.length > 0 && (
            <div className="mb-8">
              <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider mb-3">Provided Perks & Facilities</h3>
              <div className="flex flex-wrap gap-2">
                {post.amenities.map((item, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-2 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center gap-1.5 shadow-xs"
                  >
                    <CheckCircle2 size={15} className="text-emerald-600" />
                    <span>{item}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Contractor Details */}
          <div className="p-5 bg-gradient-to-r from-slate-900 to-amber-950 text-white rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500 text-slate-950 font-black text-xl flex items-center justify-center shadow-md shrink-0">
                {post.contact_name?.[0]?.toUpperCase() || "C"}
              </div>
              <div>
                <h4 className="font-extrabold text-base text-white">{post.company_name || post.contact_name}</h4>
                <p className="text-xs text-amber-300 font-semibold">Contractor / Work Master in {post.city}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <a
                href={`https://wa.me/91${post.whatsapp_phone || post.contact_phone}?text=${encodeURIComponent(
                  `Hi, I am interested in your site requirement on QuickSeva: "${post.title}".`
                )}`}
                target="_blank"
                rel="noreferrer"
                className="flex-1 sm:flex-none px-5 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs rounded-2xl flex items-center justify-center gap-2 transition active:scale-95 shadow-md"
              >
                <MessageCircle size={16} />
                <span>WhatsApp</span>
              </a>

              <a
                href={`tel:${post.contact_phone}`}
                className="flex-1 sm:flex-none px-5 py-3 bg-white hover:bg-slate-100 text-slate-900 font-extrabold text-xs rounded-2xl flex items-center justify-center gap-2 transition active:scale-95"
              >
                <Phone size={16} />
                <span>Call</span>
              </a>
            </div>
          </div>
        </div>

        {/* Action Button to Open Application Modal */}
        <div className="text-center">
          <button
            onClick={() => setShowAppModal(true)}
            className="w-full sm:w-auto px-8 py-4 bg-amber-600 hover:bg-amber-700 text-white font-black text-sm rounded-2xl transition shadow-xl shadow-amber-600/25 active:scale-95"
          >
            Submit Team / Labor Application to Contractor
          </button>
        </div>
      </div>

      {/* Application Modal */}
      {showAppModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100">
            <div className="bg-amber-600 p-5 text-white flex items-center justify-between">
              <h3 className="text-lg font-black">Apply for Site Requirement</h3>
              <button onClick={() => setShowAppModal(false)} className="text-white hover:opacity-80">
                <X size={20} />
              </button>
            </div>

            <div className="p-6">
              {appSuccess ? (
                <div className="text-center py-6">
                  <CheckCircle2 size={48} className="text-emerald-500 mx-auto mb-3 animate-bounce" />
                  <h4 className="text-xl font-black text-slate-900 mb-2">Application Submitted!</h4>
                  <p className="text-xs text-slate-600 mb-6">
                    Contractor {post.contact_name} has received your application and will contact you directly.
                  </p>
                  <button
                    onClick={() => setShowAppModal(false)}
                    className="w-full py-3 bg-slate-900 text-white font-bold rounded-2xl text-xs"
                  >
                    Close
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplySubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Your Name / Agency Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Suresh Agency / Suresh Kumar"
                      value={appForm.applicant_name}
                      onChange={(e) => setAppForm({ ...appForm, applicant_name: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 outline-none focus:bg-white focus:border-amber-600 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number *</label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. 9876543210"
                      value={appForm.applicant_phone}
                      onChange={(e) => setAppForm({ ...appForm, applicant_phone: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 outline-none focus:bg-white focus:border-amber-600 transition"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Applicant Type</label>
                      <select
                        value={appForm.applicant_type}
                        onChange={(e) => setAppForm({ ...appForm, applicant_type: e.target.value })}
                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 outline-none focus:bg-white focus:border-amber-600 transition"
                      >
                        <option value="agency">Manpower Agency</option>
                        <option value="group_leader">Group Leader (Thekedar)</option>
                        <option value="individual">Individual Worker</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Workers Count Available</label>
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
                    <label className="block text-xs font-bold text-slate-700 mb-1">Additional Notes</label>
                    <textarea
                      rows={3}
                      placeholder="e.g. We have 10 experienced painters ready for site deployment with stay requirement."
                      value={appForm.notes}
                      onChange={(e) => setAppForm({ ...appForm, notes: e.target.value })}
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 outline-none focus:bg-white focus:border-amber-600 transition resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submittingApp}
                    className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs rounded-2xl transition shadow-md flex items-center justify-center gap-2"
                  >
                    {submittingApp ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Send size={16} />
                        <span>Send Application</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
