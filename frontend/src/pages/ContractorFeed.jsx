import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Building2,
  Calendar,
  CheckCircle2,
  Filter,
  MapPin,
  MessageCircle,
  Phone,
  PlusCircle,
  Search,
  ShieldCheck,
  Users,
} from "lucide-react";
import { getContractorPosts, getContractorsDirectory } from "../api/contractorApi";
import ContractorQuoteModal from "../components/ContractorQuoteModal";
import { useAuth } from "../context/AuthContext";

export default function ContractorFeed() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const getInitialTab = () => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get("tab");
    if (tabParam === "job_board" || location.pathname === "/work-site-requirements") {
      return "job_board";
    }
    return "job_board"; // Default to Work Site Requirements feed so published posts are immediately visible!
  };

  const [activeTab, setActiveTab] = useState(getInitialTab); // "job_board" | "contractors"

  // Contractors Directory state
  const [contractors, setContractors] = useState([]);
  const [loadingContractors, setLoadingContractors] = useState(true);
  const [selectedContractorForQuote, setSelectedContractorForQuote] = useState(null);

  // Job Board state
  const [posts, setPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);

  // Filters
  const [cityFilter, setCityFilter] = useState("All");
  const [tradeFilter, setTradeFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Rich Real Sample Data so page is always populated & vibrant
  const fallbackContractors = [
    {
      id: "demo-1",
      name: "Anil Kumar",
      company_name: "Apex Painting & Decorators",
      phone: "9876543210",
      city: "Pune",
      trade_specialization: "Painting Contractor",
      is_verified_contractor: 1,
    },
    {
      id: "demo-2",
      name: "Rajesh Sharma",
      company_name: "Sharma Civil & Masonry Works",
      phone: "9812345678",
      city: "Mumbai",
      trade_specialization: "Civil & Masonry Contractor",
      is_verified_contractor: 1,
    },
    {
      id: "demo-3",
      name: "Vikram Patil",
      company_name: "Patil Electrical Site Services",
      phone: "9988776655",
      city: "Pune",
      trade_specialization: "Electrical Site Contractor",
      is_verified_contractor: 1,
    },
    {
      id: "demo-4",
      name: "Suresh Interior",
      company_name: "Suresh Turnkey Interior & Renovation",
      phone: "9765432109",
      city: "Bengaluru",
      trade_specialization: "Interior & Renovation",
      is_verified_contractor: 1,
    },
  ];

  const fallbackPosts = [
    {
      id: "post-1",
      title: "Need 8 Experienced Painters for Commercial Site",
      site_address: "Baner Road, Near Datta Mandir",
      city: "Pune",
      start_date: "2026-08-15",
      end_date: "2026-08-25",
      contact_phone: "9876543210",
      whatsapp_phone: "9876543210",
      post_type: "demand_workers",
      requirements: [
        { role_title: "Painter", quantity: 5, wage_amount: 850, wage_type: "per_day" },
        { role_title: "Helper", quantity: 3, wage_amount: 550, wage_type: "per_day" },
      ],
      amenities: ["Food", "Accommodation / Stay", "Traveling Allowance"],
    },
    {
      id: "post-2",
      title: "Civil Site Masonry & Plastering Workforce Required",
      site_address: "Andheri East, MIDC Industrial Zone",
      city: "Mumbai",
      start_date: "2026-08-18",
      end_date: "2026-09-05",
      contact_phone: "9812345678",
      whatsapp_phone: "9812345678",
      post_type: "demand_workers",
      requirements: [
        { role_title: "Mason / Karigar", quantity: 10, wage_amount: 900, wage_type: "per_day" },
        { role_title: "Helper", quantity: 15, wage_amount: 550, wage_type: "per_day" },
      ],
      amenities: ["Food", "Accommodation / Stay", "PF & Insurance"],
    },
    {
      id: "post-3",
      title: "Need 5 Certified Site Electricians & Panel Technicians",
      site_address: "Whitefield Tech Park Zone",
      city: "Bengaluru",
      start_date: "2026-08-20",
      end_date: "2026-08-30",
      contact_phone: "9988776655",
      whatsapp_phone: "9988776655",
      post_type: "demand_workers",
      requirements: [
        { role_title: "Electrician", quantity: 5, wage_amount: 950, wage_type: "per_day" },
      ],
      amenities: ["Food", "Traveling Allowance", "Overtime Pay"],
    },
  ];

  useEffect(() => {
    fetchDirectory();
    fetchPosts();
  }, [cityFilter, tradeFilter, searchQuery]);

  const fetchDirectory = async () => {
    setLoadingContractors(true);
    try {
      const res = await getContractorsDirectory({
        city: cityFilter,
        trade: tradeFilter,
        search: searchQuery,
      });
      const fetched = res?.data?.contractors || [];
      setContractors(fetched);
    } catch (err) {
      console.error("Failed to fetch contractors directory:", err);
      setContractors([]);
    } finally {
      setLoadingContractors(false);
    }
  };

  const fetchPosts = async () => {
    setLoadingPosts(true);
    try {
      const res = await getContractorPosts({
        city: cityFilter,
        role: tradeFilter,
        search: searchQuery,
      });
      const fetched = res?.data?.posts || [];
      setPosts(fetched);
    } catch (err) {
      console.error("Failed to fetch contractor posts:", err);
      setPosts([]);
    } finally {
      setLoadingPosts(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans pb-24 bottom-nav-spacer">
      {/* ── Clean White Header ── */}
      <div className="bg-white border-b border-slate-200 py-6 px-4 sm:px-6 lg:px-8 shadow-xs">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 text-xs font-extrabold border border-amber-200 mb-2">
              <Building2 size={14} className="text-amber-600" />
              <span>Contractors & Site Work Portal</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Contractors & Site Workforce Hub
            </h1>
            <p className="text-xs sm:text-sm font-medium text-slate-500 mt-1 max-w-xl">
              Hire verified Painting, Civil & Electrical Contractors for home projects, or post site labor requirements for manpower agencies.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={() => navigate("/contractor/create-post")}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition active:scale-95"
            >
              <PlusCircle size={15} />
              <span>Post Site Requirement</span>
            </button>

            {user?.role === "contractor" ? (
              <button
                onClick={() => navigate("/contractor/dashboard")}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition active:scale-95"
              >
                <Users size={15} />
                <span>My Dashboard</span>
              </button>
            ) : (
              <button
                onClick={() => navigate("/become-contractor")}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl border border-slate-300 transition active:scale-95"
              >
                <Users size={15} />
                <span>Become Contractor</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Main Container ── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Sleek Search & Filter Bar without nested double borders */}
        <div className="mb-6 flex flex-col md:flex-row items-center gap-2.5">
          <div className="flex-1 w-full flex items-center gap-2 px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl shadow-xs focus-within:border-amber-600 transition">
            <Search className="text-slate-400 shrink-0" size={16} />
            <input
              type="text"
              placeholder="Search contractor, city, or skill (e.g. Painter, Pune, Mason)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent text-xs font-semibold text-slate-900 outline-none placeholder:text-slate-400"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
            <div className="flex items-center gap-2 px-3 py-2.5 bg-white border border-slate-200 rounded-xl shadow-xs flex-1 md:w-36 focus-within:border-amber-600 transition">
              <MapPin className="text-slate-400 shrink-0" size={15} />
              <select
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
                className="w-full bg-transparent text-xs font-bold text-slate-800 outline-none cursor-pointer"
              >
                <option value="All">All Cities</option>
                <option value="Pune">Pune</option>
                <option value="Mumbai">Mumbai</option>
                <option value="Delhi">Delhi</option>
                <option value="Bengaluru">Bengaluru</option>
                <option value="Hyderabad">Hyderabad</option>
              </select>
            </div>

            <div className="flex items-center gap-2 px-3 py-2.5 bg-white border border-slate-200 rounded-xl shadow-xs flex-1 md:w-44 focus-within:border-amber-600 transition">
              <Filter className="text-slate-400 shrink-0" size={15} />
              <select
                value={tradeFilter}
                onChange={(e) => setTradeFilter(e.target.value)}
                className="w-full bg-transparent text-xs font-bold text-slate-800 outline-none cursor-pointer"
              >
                <option value="">All Specializations</option>
                <option value="Painter">Painting Contractor</option>
                <option value="Mason">Civil & Masonry</option>
                <option value="Electrician">Electrical Site Work</option>
                <option value="Plumber">Plumbing Contractor</option>
                <option value="Helper">General Helper / Labor</option>
              </select>
            </div>
          </div>
        </div>

        {/* ── 2 Main Section Tabs ── */}
        <div className="flex items-center gap-2 border-b border-slate-200 mb-6 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab("contractors")}
            className={`pb-3 px-3.5 font-extrabold text-xs sm:text-sm transition-all relative shrink-0 ${activeTab === "contractors" ? "text-amber-600" : "text-slate-500 hover:text-slate-800"
              }`}
          >
            <div className="flex items-center gap-2">
              <Users size={16} />
              <span>Find Contractors</span>
              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-black">
                For Buyers ({contractors.length})
              </span>
            </div>
            {activeTab === "contractors" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-600 rounded-t-full" />
            )}
          </button>

          <button
            onClick={() => setActiveTab("job_board")}
            className={`pb-3 px-3.5 font-extrabold text-xs sm:text-sm transition-all relative shrink-0 ${activeTab === "job_board" ? "text-amber-600" : "text-slate-500 hover:text-slate-800"
              }`}
          >
            <div className="flex items-center gap-2">
              <Building2 size={16} />
              <span>Work Site Jobs</span>
              <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-800 text-[10px] font-black">
                For Agencies ({posts.length})
              </span>
            </div>
            {activeTab === "job_board" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-600 rounded-t-full" />
            )}
          </button>
        </div>

        {/* ── TAB 1: FIND CONTRACTORS (FOR BUYERS) ── */}
        {activeTab === "contractors" && (
          <div>
            {loadingContractors ? (
              <div className="py-12 text-center">
                <div className="w-8 h-8 border-3 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-400">Loading Contractors...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {contractors.map((c) => (
                  <div
                    key={c.id}
                    className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs hover:shadow-md transition flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center font-black text-base shadow-xs shrink-0">
                            {c.name?.[0]?.toUpperCase() || "C"}
                          </div>
                          <div>
                            <h3 className="font-extrabold text-slate-900 text-sm leading-snug flex items-center gap-1">
                              <span>{c.company_name || c.name}</span>
                              {c.is_verified_contractor === 1 && (
                                <ShieldCheck size={15} className="text-emerald-500 shrink-0" title="Verified Contractor" />
                              )}
                            </h3>
                            <p className="text-[11px] font-bold text-amber-700">
                              {c.trade_specialization || "General Contractor"}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1 text-xs font-semibold text-slate-600 mb-4 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <div className="flex items-center gap-2">
                          <MapPin size={13} className="text-slate-400" />
                          <span>{c.city || "Pune"}, India</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                      <a
                        href={`tel:${c.phone}`}
                        className="py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition active:scale-95"
                      >
                        <Phone size={13} />
                        <span>Call</span>
                      </a>
                      <button
                        onClick={() => setSelectedContractorForQuote(c)}
                        className="py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition shadow-xs active:scale-95"
                      >
                        <MessageCircle size={13} />
                        <span>Request Quote</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── TAB 2: WORK SITE JOBS (FOR AGENCIES) ── */}
        {activeTab === "job_board" && (
          <div>
            {loadingPosts ? (
              <div className="py-12 text-center">
                <div className="w-8 h-8 border-3 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-400">Loading Work Site Requirements...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {posts.map((post) => {
                  const isSupply = post.post_type === "supply_workers";
                  const accentColor = isSupply ? "border-l-sky-500" : "border-l-amber-500";

                  // Format dates nicely
                  const formatShortDate = (dateStr) => {
                    if (!dateStr) return "";
                    try {
                      const d = new Date(dateStr);
                      return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
                    } catch { return dateStr; }
                  };

                  const startFormatted = formatShortDate(post.start_date);
                  const endFormatted = formatShortDate(post.end_date);

                  // Simplified location
                  const locationLine = [post.pincode, post.city].filter(Boolean).join(" · ") || post.site_address || "India";

                  return (
                    <div
                      key={post.id}
                      className={`bg-white rounded-2xl border border-slate-200/80 border-l-4 ${accentColor} shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 flex flex-col overflow-hidden`}
                    >
                      {/* Card Header */}
                      <div className="px-5 pt-4 pb-3 flex items-center justify-between gap-3">
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wide ${
                          isSupply
                            ? "bg-sky-50 text-sky-800 border border-sky-200"
                            : "bg-amber-50 text-amber-800 border border-amber-200"
                        }`}>
                          {isSupply ? "Manpower Available" : "Labor Needed"}
                        </span>
                        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 bg-slate-50 px-2.5 py-1 rounded-lg">
                          <Calendar size={12} className="text-slate-400" />
                          <span>{startFormatted} — {endFormatted}</span>
                        </div>
                      </div>

                      {/* Card Body */}
                      <div className="px-5 pb-4 flex-1 space-y-3">
                        {/* Title */}
                        <h3 className="text-sm sm:text-base font-extrabold text-slate-900 leading-snug line-clamp-2">
                          {post.title}
                        </h3>

                        {/* Location */}
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                          <MapPin size={13} className="text-amber-600 shrink-0" />
                          <span className="truncate">{locationLine}</span>
                        </div>

                        {/* Workforce Requirements */}
                        <div className="space-y-2">
                          <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
                            Required Workforce
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {post.requirements && post.requirements.length > 0 ? (
                              post.requirements.map((req, idx) => (
                                <div
                                  key={idx}
                                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 hover:bg-slate-100 transition"
                                >
                                  <span className="w-5 h-5 rounded-md bg-amber-500 text-white flex items-center justify-center text-[10px] font-black shrink-0">
                                    {req.quantity}x
                                  </span>
                                  <span className="font-extrabold">{req.role_title}</span>
                                  <span className="text-slate-400 font-medium">@</span>
                                  <span className="text-amber-700 font-extrabold">₹{Number(req.wage_amount).toLocaleString("en-IN")}/day</span>
                                </div>
                              ))
                            ) : (
                              <span className="text-xs font-semibold text-slate-400 italic">Contact for role details</span>
                            )}
                          </div>
                        </div>

                        {/* Perks */}
                        {post.amenities && post.amenities.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {post.amenities.map((item, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-semibold border border-emerald-200/60"
                              >
                                <CheckCircle2 size={10} className="text-emerald-500" />
                                {item}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Card Footer — Action Buttons */}
                      <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center gap-2">
                        <a
                          href={`https://wa.me/91${post.whatsapp_phone || post.contact_phone}?text=${encodeURIComponent(
                            `Hi, I saw your site post on QuickSeva: "${post.title}" in ${post.city}. I have workers available.`
                          )}`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition active:scale-95 shadow-sm"
                        >
                          <MessageCircle size={14} />
                          <span>WhatsApp</span>
                        </a>

                        <a
                          href={`tel:${post.contact_phone}`}
                          className="py-2.5 px-4 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition active:scale-95"
                        >
                          <Phone size={14} />
                          <span>Call</span>
                        </a>

                        <button
                          onClick={() => navigate(`/contractor-posts/${post.id}`)}
                          className="py-2.5 px-3.5 bg-white hover:bg-amber-50 text-slate-800 text-xs font-bold rounded-xl border border-slate-200 hover:border-amber-300 transition active:scale-95"
                        >
                          Details
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Quote Modal */}
      <ContractorQuoteModal
        contractor={selectedContractorForQuote}
        isOpen={Boolean(selectedContractorForQuote)}
        onClose={() => setSelectedContractorForQuote(null)}
      />
    </div>
  );
}
