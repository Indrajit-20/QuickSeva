import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  MessageSquare,
  Phone,
  PlusCircle,
  Users,
  MessageCircle,
  XCircle,
} from "lucide-react";
import { getMyPosts, getMyQuoteRequests, updatePostStatus, getPostApplications } from "../../api/contractorApi";
import { useAuth } from "../../context/AuthContext";

export default function ContractorDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState("quotes"); // "quotes" | "posts"
  const [posts, setPosts] = useState([]);
  const [quoteRequests, setQuoteRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  // Selected post applications modal
  const [selectedPostApps, setSelectedPostApps] = useState(null);
  const [appsList, setAppsList] = useState([]);
  const [loadingApps, setLoadingApps] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [postsRes, quotesRes] = await Promise.all([
        getMyPosts(),
        getMyQuoteRequests(),
      ]);
      setPosts(postsRes?.data?.posts || []);
      setQuoteRequests(quotesRes?.data?.quoteRequests || []);
    } catch (err) {
      console.error("Failed to fetch dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePostStatus = async (postId, currentStatus) => {
    const nextStatus = currentStatus === "active" ? "closed" : "active";
    try {
      await updatePostStatus(postId, nextStatus);
      fetchDashboardData();
    } catch (err) {
      alert("Failed to update status");
    }
  };

  const handleViewApps = async (post) => {
    setSelectedPostApps(post);
    setLoadingApps(true);
    try {
      const res = await getPostApplications(post.id);
      setAppsList(res?.data?.applications || []);
    } catch (err) {
      console.error("Failed to fetch applications:", err);
    } finally {
      setLoadingApps(false);
    }
  };

  const totalActive = posts.filter((p) => p.status === "active").length;
  const totalApps = posts.reduce((sum, p) => sum + (Number(p.applications_count) || 0), 0);

  return (
    <div className="max-w-6xl mx-auto py-6 px-4 sm:px-6 font-sans text-slate-800 pb-24">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <span className="text-xs font-black text-amber-600 uppercase tracking-wider">Work Master Control Panel</span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Contractor Dashboard
          </h1>
          <p className="text-xs font-semibold text-slate-500 mt-1">
            Welcome back, {user?.company_name || user?.name || "Contractor"}. Track customer leads and manage site job postings.
          </p>
        </div>

        <button
          onClick={() => navigate("/contractor/create-post")}
          className="flex items-center justify-center gap-2 px-5 py-3 bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs rounded-2xl shadow-lg shadow-amber-600/20 transition active:scale-95 shrink-0"
        >
          <PlusCircle size={18} />
          <span>Post Site Requirement</span>
        </button>
      </div>

      {/* Metrics Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-md flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-black text-xl shrink-0">
            <Building2 size={24} />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">{totalActive}</div>
            <div className="text-xs font-bold text-slate-500">Active Site Listings</div>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-md flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-black text-xl shrink-0">
            <MessageSquare size={24} />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">{quoteRequests.length}</div>
            <div className="text-xs font-bold text-slate-500">Customer Quote Leads</div>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-md flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black text-xl shrink-0">
            <Users size={24} />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">{totalApps}</div>
            <div className="text-xs font-bold text-slate-500">Agency / Worker Applicants</div>
          </div>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center gap-2 border-b border-slate-200 mb-6">
        <button
          onClick={() => setActiveTab("quotes")}
          className={`pb-3 px-4 font-black text-sm transition-all relative ${
            activeTab === "quotes" ? "text-amber-600" : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <span>Customer Leads ({quoteRequests.length})</span>
          {activeTab === "quotes" && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-amber-600 rounded-t-full" />
          )}
        </button>

        <button
          onClick={() => setActiveTab("posts")}
          className={`pb-3 px-4 font-black text-sm transition-all relative ${
            activeTab === "posts" ? "text-amber-600" : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <span>My Site Requirements ({posts.length})</span>
          {activeTab === "posts" && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-amber-600 rounded-t-full" />
          )}
        </button>
      </div>

      {/* TAB 1: CUSTOMER QUOTE LEADS */}
      {activeTab === "quotes" && (
        <div>
          {loading ? (
            <div className="py-12 text-center text-xs font-bold text-slate-500">Loading Customer Leads...</div>
          ) : quoteRequests.length === 0 ? (
            <div className="bg-white rounded-3xl p-10 text-center border border-slate-200 shadow-sm">
              <MessageSquare size={40} className="text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-black text-slate-900 mb-1">No Customer Leads Yet</h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Customers seeking painting, civil, electrical, or plumbing contracts will appear here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {quoteRequests.map((req) => (
                <div key={req.id} className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-md">
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-[10px] font-black uppercase">
                      {req.service_type || "General Contract"}
                    </span>
                    <span className="text-[11px] font-bold text-slate-400">
                      {new Date(req.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  <h3 className="font-extrabold text-slate-900 text-base mb-1">{req.customer_name}</h3>
                  <p className="text-xs font-bold text-slate-500 mb-3">📍 {req.city}</p>

                  {req.notes && (
                    <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 mb-4 italic">
                      "{req.notes}"
                    </p>
                  )}

                  <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                    <a
                      href={`tel:${req.customer_phone}`}
                      className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-extrabold rounded-xl flex items-center justify-center gap-1.5 transition active:scale-95"
                    >
                      <Phone size={14} />
                      <span>Call {req.customer_phone}</span>
                    </a>
                    <a
                      href={`https://wa.me/91${req.customer_phone}?text=${encodeURIComponent(
                        `Hi ${req.customer_name}, I received your quote request on QuickSeva for ${req.service_type} in ${req.city}.`
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                      className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold rounded-xl flex items-center justify-center gap-1.5 transition active:scale-95"
                    >
                      <MessageCircle size={14} />
                      <span>WhatsApp</span>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MY SITE REQUIREMENTS */}
      {activeTab === "posts" && (
        <div>
          {loading ? (
            <div className="py-12 text-center text-xs font-bold text-slate-500">Loading Site Posts...</div>
          ) : posts.length === 0 ? (
            <div className="bg-white rounded-3xl p-10 text-center border border-slate-200 shadow-sm">
              <Building2 size={40} className="text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-black text-slate-900 mb-1">No Site Posts Created</h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto mb-4">
                Post your site labor requirements to hire painters, masons, electricians, and helpers.
              </p>
              <button
                onClick={() => navigate("/contractor/create-post")}
                className="px-5 py-2.5 bg-amber-600 text-white font-bold text-xs rounded-xl shadow-md"
              >
                Post Site Requirement
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map((post) => (
                <div key={post.id} className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                        post.status === "active" ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-700"
                      }`}>
                        {post.status}
                      </span>
                      <span className="text-xs font-bold text-slate-500">
                        {post.start_date} to {post.end_date}
                      </span>
                    </div>
                    <h3 className="font-extrabold text-slate-900 text-base">{post.title}</h3>
                    <p className="text-xs text-slate-500 font-semibold">📍 {post.site_address}, {post.city}</p>
                  </div>

                  <div className="flex items-center gap-2 w-full md:w-auto">
                    <button
                      onClick={() => handleViewApps(post)}
                      className="flex-1 md:flex-none px-4 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5"
                    >
                      <Users size={14} />
                      <span>Applicants ({post.applications_count || 0})</span>
                    </button>

                    <button
                      onClick={() => handleTogglePostStatus(post.id, post.status)}
                      className={`px-4 py-2 text-xs font-bold rounded-xl border transition ${
                        post.status === "active"
                          ? "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100"
                          : "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                      }`}
                    >
                      {post.status === "active" ? "Mark Closed" : "Re-open Post"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Applications Drawer Modal */}
      {selectedPostApps && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 max-h-[85vh] flex flex-col">
            <div className="bg-amber-600 p-5 text-white flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-base font-black">Applications Received</h3>
                <p className="text-xs text-amber-100 font-medium truncate">{selectedPostApps.title}</p>
              </div>
              <button onClick={() => setSelectedPostApps(null)} className="text-white hover:opacity-80">
                <XCircle size={22} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              {loadingApps ? (
                <div className="py-8 text-center text-xs font-bold text-slate-500">Loading applicants...</div>
              ) : appsList.length === 0 ? (
                <div className="py-8 text-center text-xs font-semibold text-slate-500">
                  No agencies or workers have applied to this post yet.
                </div>
              ) : (
                appsList.map((app) => (
                  <div key={app.id} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <h4 className="font-extrabold text-slate-900 text-sm">{app.applicant_name}</h4>
                      <span className="px-2 py-0.5 rounded-full bg-slate-900 text-white text-[10px] font-black uppercase">
                        {app.applicant_type} ({app.workers_count} Workers)
                      </span>
                    </div>

                    {app.notes && <p className="text-xs text-slate-600 mb-3 italic">"{app.notes}"</p>}

                    <div className="flex items-center gap-2 pt-2 border-t border-slate-200">
                      <a
                        href={`tel:${app.applicant_phone}`}
                        className="flex-1 py-2 bg-slate-900 text-white text-xs font-extrabold rounded-xl flex items-center justify-center gap-1.5"
                      >
                        <Phone size={14} />
                        <span>Call {app.applicant_phone}</span>
                      </a>
                      <a
                        href={`https://wa.me/91${app.applicant_phone}?text=${encodeURIComponent(
                          `Hi ${app.applicant_name}, I saw your application on QuickSeva for site post: "${selectedPostApps.title}".`
                        )}`}
                        target="_blank"
                        rel="noreferrer"
                        className="py-2 px-3 bg-emerald-600 text-white text-xs font-extrabold rounded-xl flex items-center justify-center gap-1.5"
                      >
                        <MessageCircle size={14} />
                        <span>WhatsApp</span>
                      </a>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
