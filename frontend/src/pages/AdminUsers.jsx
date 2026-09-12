import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { adminService } from "../api/adminService";
import {
  Search,
  UserX,
  UserCheck,
  PlusCircle,
  X,
  FileSpreadsheet,
  Calendar,
  Filter,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const AdminUsers = () => {
  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "all";

  // Data & Loading state
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [exporting, setExporting] = useState(false);

  // Filters State
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Pagination State
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 15,
    totalPages: 1,
  });

  // Wallet Modal State
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [creditAmount, setCreditAmount] = useState("");
  const [creditDesc, setCreditDesc] = useState("Admin Bonus");
  const [walletLoading, setWalletLoading] = useState(false);
  const [walletSuccess, setWalletSuccess] = useState(null);
  const [walletError, setWalletError] = useState(null);

  // Debounce search input (350ms delay) to prevent typing lag
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput);
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Sync tab with status filter
  useEffect(() => {
    if (activeTab === "blocked") {
      setStatusFilter("0");
    }
  }, [activeTab]);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const activeStatusParam = activeTab === "blocked" ? "0" : (statusFilter !== "all" ? statusFilter : undefined);
      const res = await adminService.getUsers({
        page,
        limit,
        search: searchQuery || undefined,
        role: roleFilter !== "all" ? roleFilter : undefined,
        is_active: activeStatusParam,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });

      if (res.success && res.data) {
        setUsers(res.data.users || []);
        if (res.data.pagination) {
          setPagination(res.data.pagination);
        }
      }
    } catch (err) {
      console.error(err);
      setError("Failed to retrieve user accounts.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [activeTab, page, limit, searchQuery, roleFilter, statusFilter, startDate, endDate]);

  const handleResetFilters = () => {
    setSearchInput("");
    setSearchQuery("");
    setRoleFilter("all");
    setStatusFilter(activeTab === "blocked" ? "0" : "all");
    setStartDate("");
    setEndDate("");
    setPage(1);
  };

  const handleExportCSV = async () => {
    try {
      setExporting(true);
      const activeStatusParam = activeTab === "blocked" ? "0" : (statusFilter !== "all" ? statusFilter : undefined);
      await adminService.exportUsersCSV({
        search: searchQuery || undefined,
        role: roleFilter !== "all" ? roleFilter : undefined,
        is_active: activeStatusParam,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
    } catch (err) {
      console.error("Export failed:", err);
      alert("Failed to download Excel report. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  const handleToggleStatus = async (user) => {
    try {
      const res = await adminService.toggleUserStatus(user.id);
      if (res.success) {
        fetchUsers();
      }
    } catch (err) {
      console.error(err);
      alert("Failed to toggle user status.");
    }
  };

  const handleOpenWalletModal = (user) => {
    setSelectedUser(user);
    setCreditAmount("");
    setCreditDesc("Admin Bonus Payout");
    setWalletSuccess(null);
    setWalletError(null);
    setShowWalletModal(true);
  };

  const handleCreditWallet = async (e) => {
    e.preventDefault();
    if (!creditAmount || parseFloat(creditAmount) <= 0) {
      setWalletError("Please enter a valid credit amount.");
      return;
    }

    setWalletLoading(true);
    setWalletError(null);
    setWalletSuccess(null);

    try {
      const res = await adminService.adminCreditWallet({
        user_id: selectedUser.id,
        amount: parseFloat(creditAmount),
        description: creditDesc,
      });

      if (res.success) {
        setWalletSuccess(`Wallet credited successfully! New Balance: ₹${res.data.balance}`);
        setUsers((prev) =>
          prev.map((u) =>
            u.id === selectedUser.id
              ? { ...u, wallet_balance: parseFloat(res.data.balance) }
              : u
          )
        );
        setTimeout(() => setShowWalletModal(false), 1500);
      }
    } catch (err) {
      console.error(err);
      setWalletError(err?.response?.data?.message || "Failed to credit wallet.");
    } finally {
      setWalletLoading(false);
    }
  };

  const hasActiveFilters = Boolean(
    searchInput || searchQuery || roleFilter !== "all" || (activeTab !== "blocked" && statusFilter !== "all") || startDate || endDate
  );

  const inputBaseClass =
    "w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-xs font-semibold shadow-xs transition-all";

  return (
    <div className="space-y-6 text-left">
      {/* Header & Export Action */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">
            {activeTab === "blocked" ? "Suspended Accounts" : "User Database"}
          </h1>
          <p className="text-slate-500 font-semibold text-sm mt-1">
            Manage roles, view balances, filter joined dates, and suspend/reactivate client accounts.
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportCSV}
          disabled={exporting}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-sm transition cursor-pointer disabled:opacity-50"
        >
          <FileSpreadsheet className="h-4 w-4" />
          {exporting
            ? "Generating Excel..."
            : hasActiveFilters
            ? `⬇ Export ${pagination.total} Filtered Users (.CSV)`
            : `⬇ Export All ${pagination.total} Users (.CSV)`}
        </button>
      </div>

      {/* Advanced Filters Toolbar */}
      <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
            <Filter size={14} className="text-blue-600" />
            <span>Filter Accounts</span>
            {hasActiveFilters && (
              <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full text-[10px] font-bold border border-blue-200">
                Active
              </span>
            )}
          </div>

          {hasActiveFilters && (
            <button
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-700 transition cursor-pointer"
            >
              <RotateCcw size={12} />
              <span>Reset Filters</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 pt-5">
          {/* Search Box with non-overlapping icon */}
          <div className="sm:col-span-2 relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 z-10">
              <Search size={15} />
            </div>
            <input
              type="text"
              placeholder="Search by name, phone, email..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className={`${inputBaseClass} !pl-10 !pr-3`}
            />
          </div>

          {/* Role Filter */}
          <div>
                      <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPage(1);
            }}
            className={inputBaseClass}
          >
            <option value="all">All Roles</option>
            <option value="buyer">Buyer</option>
            <option value="seller">Seller</option>
            <option value="contractor">Contractor</option>
            <option value="admin">Admin</option>
          </select>
          </div>

          {/* Status Filter */}
          {activeTab !== "blocked" ? (
            <div>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className={inputBaseClass}
              >
                <option value="all">All Statuses</option>
                <option value="1">Active Only</option>
                <option value="0">Blocked Only</option>
              </select>
            </div>
          ) : (
            <div>
              <input
                type="text"
                disabled
                value="Blocked Only"
                className={`${inputBaseClass} bg-slate-50 text-slate-400`}
              />
            </div>
          )}

          {/* Joined Date From */}
          <div className="relative">
            <label className="absolute -top-[18px] left-0.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              📅 Joined From
            </label>
            <input
              type="date"
              title="Filter users who joined FROM this date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPage(1);
              }}
              className={inputBaseClass}
            />
          </div>

          {/* Joined Date To */}
          <div className="relative">
            <label className="absolute -top-[18px] left-0.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              📅 Joined To
            </label>
            <input
              type="date"
              title="Filter users who joined UP TO this date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPage(1);
              }}
              className={inputBaseClass}
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-xs font-semibold">
          ⚠️ {error}
        </div>
      )}

      {/* Summary Count & Rows per Page Selector */}
      <div className="flex items-center justify-between text-xs text-slate-500 font-semibold px-1">
        <div>
          Showing <span className="font-bold text-slate-800">{users.length}</span> of{" "}
          <span className="font-bold text-slate-800">{pagination.total}</span> accounts
        </div>

        <div className="flex items-center gap-2">
          <span>Rows per page:</span>
          <select
            value={limit}
            onChange={(e) => {
              setLimit(Number(e.target.value));
              setPage(1);
            }}
            className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 focus:outline-none focus:border-blue-500"
          >
            <option value={10}>10</option>
            <option value={15}>15</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 text-[10px] font-bold uppercase tracking-wider bg-slate-50">
                <th className="px-6 py-4">Name / Info</th>
                <th className="px-6 py-4">Contact</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4 text-right">Lead Credits</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-slate-400 animate-pulse font-bold">
                    Loading accounts database...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-slate-400 font-bold">
                    No accounts found matching filter criteria.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                    {/* Name */}
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-bold text-slate-800 text-sm">{user.name}</p>
                        <p className="text-[10px] text-slate-450 font-bold mt-0.5">
                          ID: QS-USR-{user.id} • Joined: {new Date(user.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </td>

                    {/* Contact */}
                    <td className="px-6 py-4 space-y-0.5">
                      <p className="text-slate-700 font-semibold">{user.phone}</p>
                      <p className="text-slate-500 font-medium">{user.email || "No email"}</p>
                    </td>

                    {/* Role */}
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${
                          user.role === "seller"
                            ? "bg-purple-50 text-purple-700 border-purple-200"
                            : user.role === "contractor"
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : user.role === "admin"
                            ? "bg-red-50 text-red-700 border-red-200"
                            : "bg-blue-50 text-blue-700 border-blue-200"
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>

                    {/* Wallet */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5 font-bold text-slate-800 font-mono">
                        <span>{parseFloat(user.wallet_balance).toFixed(0)} Credits</span>
                        <button
                          onClick={() => handleOpenWalletModal(user)}
                          className="p-1 hover:text-blue-600 text-slate-400 transition-colors cursor-pointer"
                          title="Credit Lead Credits"
                        >
                          <PlusCircle size={14} />
                        </button>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          user.is_active
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-red-50 text-red-700 border-red-200"
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${user.is_active ? "bg-emerald-500" : "bg-red-500"}`} />
                        <span>{user.is_active ? "Active" : "Blocked"}</span>
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleToggleStatus(user)}
                        className={`p-2 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                          user.is_active
                            ? "bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
                            : "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100"
                        }`}
                        title={user.is_active ? "Suspend User" : "Activate User"}
                      >
                        {user.is_active ? <UserX size={14} /> : <UserCheck size={14} />}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Server-Side Pagination Bar */}
        {pagination.totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-t border-slate-200 bg-slate-50 gap-4">
            <div className="text-xs text-slate-500 font-semibold">
              Page <span className="font-bold text-slate-800">{page}</span> of{" "}
              <span className="font-bold text-slate-800">{pagination.totalPages}</span>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={page <= 1 || loading}
                className="p-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white transition cursor-pointer"
                title="Previous Page"
              >
                <ChevronLeft size={16} />
              </button>

              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                let pageNum = page;
                if (pagination.totalPages <= 5) {
                  pageNum = i + 1;
                } else if (page <= 3) {
                  pageNum = i + 1;
                } else if (page >= pagination.totalPages - 2) {
                  pageNum = pagination.totalPages - 4 + i;
                } else {
                  pageNum = page - 2 + i;
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    disabled={loading}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                      page === pageNum
                        ? "bg-blue-600 text-white shadow-xs"
                        : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                onClick={() => setPage((prev) => Math.min(pagination.totalPages, prev + 1))}
                disabled={page >= pagination.totalPages || loading}
                className="p-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white transition cursor-pointer"
                title="Next Page"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Credit Wallet Dialog Modal */}
      {showWalletModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl animate-fade-in text-slate-800">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">
                Credit Lead Credits
              </h3>
              <button
                onClick={() => setShowWalletModal(false)}
                className="h-7 w-7 rounded-full bg-slate-900 border border-slate-700 hover:bg-rose-600 text-white flex items-center justify-center transition cursor-pointer shadow-sm active:scale-95"
                title="Close"
              >
                <X size={14} strokeWidth={2.5} />
              </button>
            </div>

            <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200 leading-normal">
              Account Name: <span className="text-slate-900 font-bold">{selectedUser.name}</span> <br />
              Current Balance: <span className="text-blue-600 font-bold">{parseFloat(selectedUser.wallet_balance).toFixed(0)} Credits</span>
            </div>

            {walletError && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-xs font-semibold">
                ⚠️ {walletError}
              </div>
            )}

            {walletSuccess && (
              <div className="bg-emerald-50 border border-emerald-250 text-emerald-700 rounded-xl p-3 text-xs font-semibold">
                ✅ {walletSuccess}
              </div>
            )}

            <form onSubmit={handleCreditWallet} className="space-y-4">
              <div>
                <label className="block text-slate-600 text-xs font-bold uppercase tracking-wider mb-2">Number of Credits</label>
                <div className="relative">
                  <input
                    type="number"
                    step="1"
                    placeholder="Enter credits count, e.g. 100"
                    value={creditAmount}
                    onChange={(e) => setCreditAmount(e.target.value)}
                    required
                    disabled={walletLoading}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 text-xs font-semibold shadow-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 text-xs font-bold uppercase tracking-wider mb-2">Transaction Description</label>
                <input
                  type="text"
                  placeholder="e.g. Admin Bonus/Loyalty Refund"
                  value={creditDesc}
                  onChange={(e) => setCreditDesc(e.target.value)}
                  required
                  disabled={walletLoading}
                  className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 text-xs font-semibold shadow-xs"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowWalletModal(false)}
                  disabled={walletLoading}
                  className="px-4 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold rounded-xl border border-slate-200 transition-all text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={walletLoading || !creditAmount}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-xl transition-all text-xs flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  {walletLoading ? "Crediting..." : "Confirm Payout"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
