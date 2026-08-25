import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import FeedSkeleton from "../components/FeedSkeleton";
import {
  ArrowRight,
  Briefcase,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronDown,
  Clock,
  Filter,
  Globe,
  HardHat,
  MapPin,
  PlusCircle,
  Search,
  SearchX,
  ShieldCheck,
  Users,
} from "lucide-react";
import { getContractorPosts, getContractorsDirectory } from "../api/contractorApi";
import { useAuth } from "../context/AuthContext";
import { INDIAN_LOCATIONS_MASTER } from "../data/indiaLocationsData";

// Helper: Relative time ago string
const timeAgo = (dateStr) => {
  if (!dateStr) return "";
  try {
    const now = new Date();
    const past = new Date(dateStr);
    const diffMs = now - past;
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHrs = Math.floor(diffMins / 60);
    if (diffHrs < 24) return `${diffHrs}h ago`;
    const diffDays = Math.floor(diffHrs / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
    return past.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  } catch {
    return "";
  }
};

// Helper: Format short date
const formatShortDate = (dateStr) => {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  } catch {
    return dateStr;
  }
};

// Helper: Format image URL
const getImageUrl = (url) => {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:")) {
    return url;
  }
  const cleanPath = url.startsWith("/") ? url : `/${url}`;
  return `http://localhost:5000${cleanPath}`;
};

// Helper: Smart Avatar
const ContractorAvatar = ({ src, name, companyName }) => {
  const [imgError, setImgError] = useState(false);
  const displayName = companyName || name || "Contractor";
  const initial = displayName[0]?.toUpperCase() || "C";
  const formattedUrl = getImageUrl(src);

  if (formattedUrl && !imgError) {
    return (
      <img
        src={formattedUrl}
        alt={displayName}
        onError={() => setImgError(true)}
        className="w-12 h-12 rounded-2xl object-cover border border-slate-200 shadow-xs shrink-0"
      />
    );
  }

  return (
    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 text-white flex items-center justify-center font-black text-lg shadow-sm shrink-0">
      {initial}
    </div>
  );
};

export default function ContractorFeed() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const getTabFromUrl = () => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get("tab");
    if (tabParam === "job_board") return "job_board";
    return "contractors";
  };

  const [activeTab, setActiveTab] = useState(getTabFromUrl);

  // Sync activeTab whenever URL query changes
  useEffect(() => {
    const tabInUrl = getTabFromUrl();
    if (tabInUrl !== activeTab) {
      setActiveTab(tabInUrl);
    }
  }, [location.search]);

  const handleTabSwitch = (newTab) => {
    setActiveTab(newTab);
    navigate(`?tab=${newTab}`, { replace: true });
  };

  // Contractors Directory state
  const [contractors, setContractors] = useState([]);
  const [loadingContractors, setLoadingContractors] = useState(true);
  const [visibleContractorsCount, setVisibleContractorsCount] = useState(6);

  // Job Board state
  const [posts, setPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [visiblePostsCount, setVisiblePostsCount] = useState(6);

  // Filters State
  const [stateFilter, setStateFilter] = useState("All States");
  const [cityFilter, setCityFilter] = useState("All");
  const [tradeFilter, setTradeFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const handleStateChange = (newState) => {
    setStateFilter(newState);
    setCityFilter("All");
  };

  const handleResetFilters = () => {
    setStateFilter("All States");
    setCityFilter("All");
    setTradeFilter("");
    setSearchQuery("");
  };

  useEffect(() => {
    setVisibleContractorsCount(6);
    setVisiblePostsCount(6);
    fetchDirectory();
    fetchPosts();
  }, [stateFilter, cityFilter, tradeFilter, searchQuery]);

  const fetchDirectory = async () => {
    setLoadingContractors(true);
    try {
      const activeCityParam = cityFilter.startsWith("All Cities") ? "All" : cityFilter;
      const res = await getContractorsDirectory({
        city: activeCityParam,
        trade: tradeFilter,
        search: searchQuery,
        limit: 100,
      });
      let fetched = res?.data?.contractors || [];

      // Client side state filtering if a specific state is picked but all cities in state
      if (stateFilter !== "All States" && activeCityParam === "All") {
        const stateCities = INDIAN_LOCATIONS_MASTER[stateFilter] || [];
        fetched = fetched.filter((c) =>
          stateCities.some((sc) => c.city && c.city.toLowerCase().includes(sc.toLowerCase()))
        );
      }

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
      const activeCityParam = cityFilter.startsWith("All Cities") ? "All" : cityFilter;
      const res = await getContractorPosts({
        city: activeCityParam,
        role: tradeFilter,
        search: searchQuery,
      });
      let fetched = res?.data?.posts || [];

      // Client side state filtering if a specific state is picked but all cities in state
      if (stateFilter !== "All States" && activeCityParam === "All") {
        const stateCities = INDIAN_LOCATIONS_MASTER[stateFilter] || [];
        fetched = fetched.filter((p) =>
          stateCities.some((sc) => p.city && p.city.toLowerCase().includes(sc.toLowerCase()))
        );
      }

      setPosts(fetched);
    } catch (err) {
      console.error("Failed to fetch contractor posts:", err);
      setPosts([]);
    } finally {
      setLoadingPosts(false);
    }
  };

  const getTotalWorkers = (requirements) => {
    if (!requirements || requirements.length === 0) return 0;
    return requirements.reduce((sum, r) => sum + (Number(r.quantity) || 0), 0);
  };

  // Compute available cities dynamically based on selected state
  const availableCities = stateFilter === "All States" || !INDIAN_LOCATIONS_MASTER[stateFilter]
    ? ["All Cities", ...new Set(Object.values(INDIAN_LOCATIONS_MASTER).flat())]
    : [`All Cities (${stateFilter})`, ...INDIAN_LOCATIONS_MASTER[stateFilter]];

  const isFilterActive = stateFilter !== "All States" || cityFilter !== "All" || tradeFilter !== "" || searchQuery !== "";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans pb-24 bottom-nav-spacer">
      {/* ── Ultra-Compact Integrated Header & Navigation Toolbar ── */}
      <div className="bg-white border-b border-slate-200/90 shadow-2xs sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3.5">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 sm:gap-3">
            
            {/* Title & Brand */}
            <div className="flex items-center justify-between">
              <h1 className="text-base sm:text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-amber-500/15 text-amber-600 flex items-center justify-center shrink-0 border border-amber-500/20">
                  <Building2 size={16} />
                </div>
                <span>Contractor Hub</span>
              </h1>

              {/* Mobile Action Button */}
              <div className="flex items-center gap-2 lg:hidden">
                <button
                  onClick={() => navigate("/contractor/create-post")}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition active:scale-95 cursor-pointer flex items-center gap-1.5"
                >
                  <PlusCircle size={14} />
                  <span>Post</span>
                </button>
              </div>
            </div>

            {/* Compact Tab Switcher */}
            <div className="bg-slate-100 p-0.5 sm:p-1 rounded-lg sm:rounded-xl flex items-center gap-0.5 sm:gap-1 border border-slate-200/80">
              <button
                onClick={() => handleTabSwitch("contractors")}
                className={`flex-1 lg:flex-none flex items-center justify-center gap-1.5 py-1.5 px-2.5 sm:px-3.5 rounded-md sm:rounded-lg text-[11px] sm:text-xs font-black transition-all cursor-pointer ${
                  activeTab === "contractors"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <Users size={13} className={activeTab === "contractors" ? "text-amber-600" : ""} />
                <span className="hidden sm:inline">Hire Contractors</span>
                <span className="sm:hidden">Contractors</span>
                {!loadingContractors && contractors.length > 0 && (
                  <span className={`px-1.5 py-0.2 rounded text-[10px] font-black ${
                    activeTab === "contractors" ? "bg-amber-100 text-amber-800" : "bg-slate-200 text-slate-600"
                  }`}>
                    {contractors.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => handleTabSwitch("job_board")}
                className={`flex-1 lg:flex-none flex items-center justify-center gap-1.5 py-1.5 px-2.5 sm:px-3.5 rounded-md sm:rounded-lg text-[11px] sm:text-xs font-black transition-all cursor-pointer ${
                  activeTab === "job_board"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <Building2 size={13} className={activeTab === "job_board" ? "text-amber-600" : ""} />
                <span className="hidden sm:inline">Labor Requirements</span>
                <span className="sm:hidden">Requirements</span>
                {!loadingPosts && posts.length > 0 && (
                  <span className={`px-1.5 py-0.2 rounded text-[10px] font-black ${
                    activeTab === "job_board" ? "bg-amber-100 text-amber-800" : "bg-slate-200 text-slate-600"
                  }`}>
                    {posts.length}
                  </span>
                )}
              </button>
            </div>

            {/* Desktop Action Buttons */}
            <div className="hidden lg:flex items-center gap-2 shrink-0">
              <button
                onClick={() => navigate("/contractor/create-post")}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition active:scale-95 cursor-pointer"
              >
                <PlusCircle size={15} />
                <span>Post Requirement</span>
              </button>

              {user?.role === "contractor" || user?.is_verified_contractor === 1 ? (
                <button
                  onClick={() => navigate("/contractor/dashboard")}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition active:scale-95 cursor-pointer"
                >
                  <Briefcase size={14} />
                  <span>Dashboard</span>
                </button>
              ) : (
                <button
                  onClick={() => navigate("/become-contractor")}
                  className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl border border-slate-300 transition active:scale-95 cursor-pointer"
                >
                  <Users size={14} />
                  <span>Become Contractor</span>
                </button>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* ── Main Content Container ── */}
      <div className="max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-4">
        {/* ── Filter Controls ── */}
        <div className="mb-3 sm:mb-4">
          <div className="grid grid-cols-2 md:flex md:flex-row items-center gap-1.5 sm:gap-2">
            
            {/* 1. Search Query Input */}
            <div className="col-span-2 flex-1 w-full flex items-center gap-1.5 px-2.5 py-1.5 sm:py-2 bg-white border border-slate-200 rounded-lg shadow-2xs focus-within:border-amber-500 transition">
              <Search className="text-slate-400 shrink-0" size={14} />
              <input
                type="text"
                placeholder="Search contractor, company..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent text-[11px] sm:text-xs font-semibold text-slate-900 outline-none border-none focus:outline-none focus:ring-0 placeholder:text-slate-400"
              />
            </div>

            {/* 2. Select State Dropdown */}
            <div className="w-full md:w-44 flex items-center justify-between gap-1 px-2.5 py-1.5 sm:py-2 bg-white border border-slate-200 rounded-lg shadow-2xs focus-within:border-amber-500 transition">
              <div className="flex items-center gap-1.5 flex-1 min-w-0">
                <Globe className="text-amber-600 shrink-0" size={14} />
                <select
                  value={stateFilter}
                  onChange={(e) => handleStateChange(e.target.value)}
                  className="w-full bg-transparent text-[11px] sm:text-xs font-bold text-slate-800 outline-none border-none focus:outline-none focus:ring-0 appearance-none shadow-none cursor-pointer truncate"
                >
                  <option value="All States">All States</option>
                  {Object.keys(INDIAN_LOCATIONS_MASTER).map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>
              <ChevronDown size={13} className="text-slate-400 pointer-events-none shrink-0" />
            </div>

            {/* 3. Dynamic Select City Dropdown */}
            <div className="w-full md:w-44 flex items-center justify-between gap-1 px-2.5 py-1.5 sm:py-2 bg-white border border-slate-200 rounded-lg shadow-2xs focus-within:border-amber-500 transition">
              <div className="flex items-center gap-1.5 flex-1 min-w-0">
                <MapPin className="text-amber-600 shrink-0" size={14} />
                <select
                  value={cityFilter}
                  onChange={(e) => setCityFilter(e.target.value)}
                  className="w-full bg-transparent text-[11px] sm:text-xs font-bold text-slate-800 outline-none border-none focus:outline-none focus:ring-0 appearance-none shadow-none cursor-pointer truncate"
                >
                  {availableCities.map((ct) => (
                    <option key={ct} value={ct}>
                      {ct}
                    </option>
                  ))}
                </select>
              </div>
              <ChevronDown size={13} className="text-slate-400 pointer-events-none shrink-0" />
            </div>

            {/* 4. Select Trade Dropdown */}
            <div className="col-span-2 md:w-40 flex items-center justify-between gap-1 px-2.5 py-1.5 sm:py-2 bg-white border border-slate-200 rounded-lg shadow-2xs focus-within:border-amber-500 transition">
              <div className="flex items-center gap-1.5 flex-1 min-w-0">
                <Filter className="text-slate-400 shrink-0" size={14} />
                <select
                  value={tradeFilter}
                  onChange={(e) => setTradeFilter(e.target.value)}
                  className="w-full bg-transparent text-[11px] sm:text-xs font-bold text-slate-800 outline-none border-none focus:outline-none focus:ring-0 appearance-none shadow-none cursor-pointer truncate"
                >
                  <option value="">All Trades</option>
                  <option value="Painting">Painting</option>
                  <option value="Mason">Civil & Masonry</option>
                  <option value="Electrical">Electrical</option>
                  <option value="Plumbing">Plumbing</option>
                  <option value="Carpentry">Carpentry</option>
                  <option value="Tile">Tile & Marble</option>
                  <option value="Waterproofing">Waterproofing</option>
                  <option value="HVAC">HVAC & AC</option>
                </select>
              </div>
              <ChevronDown size={13} className="text-slate-400 pointer-events-none shrink-0" />
            </div>

          </div>

          {/* Active Filter Tags */}
          {isFilterActive && (
            <div className="flex items-center justify-between mt-2 px-1 text-xs">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="font-bold text-slate-400 text-[10px] uppercase tracking-wider">Active:</span>
                {stateFilter !== "All States" && (
                  <span className="px-2 py-0.5 bg-amber-50 text-amber-900 border border-amber-200 rounded-md font-extrabold text-[11px]">
                    State: {stateFilter}
                  </span>
                )}
                {cityFilter !== "All" && (
                  <span className="px-2 py-0.5 bg-amber-50 text-amber-900 border border-amber-200 rounded-md font-extrabold text-[11px]">
                    City: {cityFilter}
                  </span>
                )}
                {tradeFilter && (
                  <span className="px-2 py-0.5 bg-amber-50 text-amber-900 border border-amber-200 rounded-md font-extrabold text-[11px]">
                    Trade: {tradeFilter}
                  </span>
                )}
                {searchQuery && (
                  <span className="px-2 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 rounded-md font-extrabold text-[11px]">
                    Search: "{searchQuery}"
                  </span>
                )}
              </div>

              <button
                onClick={handleResetFilters}
                className="text-[11px] font-extrabold text-rose-600 hover:text-rose-700 hover:underline cursor-pointer shrink-0"
              >
                Clear All
              </button>
            </div>
          )}
        </div>

        {/* ══════════════════════════════════════════════ */}
        {/* TAB 1: HIRE CONTRACTORS                       */}
        {/* ══════════════════════════════════════════════ */}
        {activeTab === "contractors" && (
          <div>
            {loadingContractors ? (
              <FeedSkeleton />
            ) : contractors.length === 0 ? (
              /* Empty State */
              <div className="py-16 text-center bg-white rounded-3xl border border-slate-200/80 p-8 shadow-xs">
                <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto mb-4">
                  <SearchX size={28} className="text-amber-500" />
                </div>
                <h3 className="text-sm font-black text-slate-800 mb-1">No Contractors Found</h3>
                <p className="text-xs font-semibold text-slate-400 max-w-sm mx-auto mb-5">
                  {searchQuery || cityFilter !== "All" || tradeFilter
                    ? "No contractors match your selected city or trade filters."
                    : "No contractors have registered yet. Register your business to start receiving direct client project leads!"}
                </p>
                <button
                  onClick={() => navigate("/become-contractor")}
                  className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-extrabold rounded-xl shadow-md shadow-amber-600/20 transition active:scale-95 cursor-pointer"
                >
                  Register as Contractor
                </button>
              </div>
            ) : (
              <div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5">
                  {contractors.slice(0, visibleContractorsCount).map((c) => (
                    <div
                      key={c.id}
                      onClick={() => navigate(`/contractors/${c.id}?fromTab=contractors`)}
                      className="bg-white rounded-2xl border border-slate-200/80 p-3.5 sm:p-5 shadow-xs hover:shadow-xl hover:-translate-y-1 hover:border-amber-400 transition-all duration-200 flex flex-col justify-between cursor-pointer group"
                    >
                      <div>
                        {/* Header Row */}
                        <div className="flex items-start gap-3 mb-3">
                          <ContractorAvatar src={c.profile_pic} name={c.name} companyName={c.company_name} />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <h3 className="font-extrabold text-slate-900 text-sm leading-snug truncate group-hover:text-amber-700 transition">
                                {c.company_name || c.name}
                              </h3>
                              {c.is_verified_contractor === 1 && (
                                <ShieldCheck size={16} className="text-emerald-500 shrink-0" title="Verified Contractor" />
                              )}
                            </div>
                            <span className="inline-block px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200/70 text-[11px] font-extrabold">
                              {c.trade_specialization || "General Work Contractor"}
                            </span>
                          </div>
                        </div>

                        {/* Details Card Box */}
                        <div className="space-y-1.5 bg-slate-50/80 p-2.5 sm:p-3.5 rounded-xl border border-slate-100 mb-2.5">
                          <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                            <MapPin size={14} className="text-amber-600 shrink-0" />
                            <span>{c.city || "All India"}, India</span>
                          </div>
                          {c.experience_years && (
                            <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                              <Briefcase size={14} className="text-slate-400 shrink-0" />
                              <span>{c.experience_years}+ Years Experience</span>
                            </div>
                          )}
                          {c.bio && (
                            <p className="text-[11px] font-medium text-slate-500 line-clamp-2 pt-1 border-t border-slate-200/50">
                              "{c.bio}"
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Clean Footer Link (No Action Buttons Inside Card) */}
                      <div className="pt-2 flex items-center justify-between text-xs font-bold text-slate-700 group-hover:text-amber-700 transition border-t border-slate-100">
                        <span>View Contractor Profile</span>
                        <ArrowRight size={14} className="group-hover:translate-x-1 transition text-amber-600" />
                      </div>
                    </div>
                  ))}
                </div>

                {visibleContractorsCount < contractors.length && (
                  <div className="mt-8 text-center">
                    <button
                      onClick={() => setVisibleContractorsCount((prev) => prev + 6)}
                      className="px-6 py-3 bg-white hover:bg-amber-50 text-slate-800 hover:text-amber-700 font-extrabold text-xs rounded-2xl border border-slate-300 shadow-xs hover:border-amber-500 transition active:scale-95 inline-flex items-center gap-2 cursor-pointer"
                    >
                      <ChevronDown size={15} />
                      <span>Load More Contractors</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════ */}
        {/* TAB 2: LABOR REQUIREMENTS                    */}
        {/* ══════════════════════════════════════════════ */}
        {activeTab === "job_board" && (
          <div>
            {loadingPosts ? (
              <div className="py-20 text-center">
                <div className="w-9 h-9 border-3 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-xs font-bold text-slate-400">Loading site workforce requirements...</p>
              </div>
            ) : posts.length === 0 ? (
              /* Empty State */
              <div className="py-16 text-center bg-white rounded-3xl border border-slate-200/80 p-8 shadow-xs">
                <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto mb-4">
                  <HardHat size={28} className="text-amber-500" />
                </div>
                <h3 className="text-sm font-black text-slate-800 mb-1">No Requirements Posted</h3>
                <p className="text-xs font-semibold text-slate-400 max-w-sm mx-auto mb-5">
                  {searchQuery || cityFilter !== "All" || tradeFilter
                    ? "No posts match your active search filters."
                    : "No site requirements have been posted yet. Be the first contractor to list site work!"}
                </p>
                <button
                  onClick={() => navigate("/contractor/create-post")}
                  className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-extrabold rounded-xl shadow-md shadow-amber-600/20 transition active:scale-95 cursor-pointer"
                >
                  Post Site Requirement
                </button>
              </div>
            ) : (
              <div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-5">
                  {posts.slice(0, visiblePostsCount).map((post) => {
                    const isSupply = post.post_type === "supply_workers";
                    const totalWorkers = getTotalWorkers(post.requirements);
                    const locationLine = [post.pincode, post.city].filter(Boolean).join(" · ") || post.site_address || "India";
                    const startFormatted = formatShortDate(post.start_date);
                    const endFormatted = formatShortDate(post.end_date);
                    const postedAgo = timeAgo(post.created_at);

                    return (
                      <div
                        key={post.id}
                        onClick={() => navigate(`/contractor-posts/${post.id}?fromTab=job_board`)}
                        className="bg-white rounded-xl border border-slate-200 shadow-xs hover:shadow-md hover:border-amber-300 transition-all duration-200 cursor-pointer group"
                      >
                        <div className="p-3 sm:p-5">
                          {/* Top row: badge + time */}
                          <div className="flex items-center justify-between gap-2 mb-3">
                            <div className="flex items-center gap-2 flex-wrap">
                              {post.is_featured === 1 && (
                                <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wide bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-2xs flex items-center gap-1">
                                  ⭐ URGENT SITE
                                </span>
                              )}
                              <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide ${isSupply
                                  ? "bg-sky-50 text-sky-700 border border-sky-200"
                                  : "bg-amber-50 text-amber-800 border border-amber-200"
                                }`}>
                                {isSupply ? "Available" : "Needed"}
                              </span>
                              {totalWorkers > 0 && (
                                <span className="text-[11px] font-bold text-slate-500">
                                  {totalWorkers} Workers
                                </span>
                              )}
                            </div>
                            {postedAgo && (
                              <span className="text-[10px] font-medium text-slate-400">{postedAgo}</span>
                            )}
                          </div>

                          {/* Title */}
                          <h3 className="text-sm font-bold text-slate-900 leading-snug mb-2 group-hover:text-amber-700 transition line-clamp-2">
                            {post.title}
                          </h3>

                          {/* Location & Date — single compact line */}
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 mb-2">
                            <span className="flex items-center gap-1">
                              <MapPin size={12} className="text-amber-500 shrink-0" />
                              {locationLine}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar size={12} className="text-slate-400 shrink-0" />
                              {startFormatted} — {endFormatted}
                            </span>
                          </div>

                          {/* Role tags — what's needed at a glance */}
                          {post.requirements && post.requirements.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mb-3">
                              {post.requirements.map((req, idx) => (
                                <span
                                  key={idx}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-[11px] font-semibold text-slate-600"
                                >
                                  <span className="font-bold text-amber-700">{req.quantity}×</span>
                                  {req.role_title}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Footer: posted by + arrow */}
                          <div className="flex items-center justify-between pt-2.5 border-t border-slate-100">
                            {post.company_name ? (
                              <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1 truncate">
                                <Building2 size={12} />
                                {post.company_name}
                              </span>
                            ) : (
                              <span />
                            )}
                            <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-600 group-hover:text-amber-700 transition">
                              View & Apply
                              <ArrowRight size={13} className="group-hover:translate-x-0.5 transition" />
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {visiblePostsCount < posts.length && (
                  <div className="mt-8 text-center">
                    <button
                      onClick={() => setVisiblePostsCount((prev) => prev + 6)}
                      className="px-6 py-3 bg-white hover:bg-amber-50 text-slate-800 hover:text-amber-700 font-extrabold text-xs rounded-2xl border border-slate-300 shadow-xs hover:border-amber-500 transition active:scale-95 inline-flex items-center gap-2 cursor-pointer"
                    >
                      <ChevronDown size={15} />
                      <span>Load More Requirements</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
