import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { adminService } from "../api/adminService";
import {
  Search,
  UserX,
  UserCheck,
  PlusCircle,
  TrendingUp,
  X,
  Wallet,
} from "lucide-react";

const AdminUsers = () => {
  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "all";

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Wallet Modal State
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [creditAmount, setCreditAmount] = useState("");
  const [creditDesc, setCreditDesc] = useState("Admin Bonus");
  const [walletLoading, setWalletLoading] = useState(false);
  const [walletSuccess, setWalletSuccess] = useState(null);
  const [walletError, setWalletError] = useState(null);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const is_active_filter = activeTab === "blocked" ? 0 : undefined;
      const res = await adminService.getUsers({
        is_active: is_active_filter,
        search: searchQuery || undefined,
      });
      if (res.success && res.data) {
        setUsers(res.data.users || []);
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
  }, [activeTab, searchQuery]);

  const handleToggleStatus = async (user) => {
    try {
      const res = await adminService.toggleUserStatus(user.id);
      if (res.success) {
        // Refresh local items
        setUsers((prev) =>
          prev
            .map((u) => (u.id === user.id ? { ...u, is_active: u.is_active ? 0 : 1 } : u))
            .filter((u) => (activeTab === "blocked" ? u.is_active === 0 : true))
        );
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
        // Update user balance locally
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            {activeTab === "blocked" ? "Suspended Accounts" : "User Database"}
          </h1>
          <p className="text-slate-400 mt-1">
            Manage roles, view balances, and suspend/reactivate client accounts.
          </p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-slate-900/40 p-4 rounded-2xl border border-indigo-950/40 backdrop-blur-md">
        <div className="relative w-full sm:w-80">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
            <Search size={16} />
          </span>
          <input
            type="text"
            placeholder="Search by name, phone, email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-indigo-900/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-xs font-semibold"
          />
        </div>

        <div className="text-xs text-slate-500 font-bold">
          Found {users.length} accounts
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl p-4 text-xs">
          ⚠️ {error}
        </div>
      )}

      {/* Users Table */}
      <div className="bg-slate-900/40 border border-indigo-950/40 rounded-2xl overflow-hidden backdrop-blur-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-indigo-950 text-slate-400 text-[10px] font-extrabold uppercase tracking-widest bg-slate-950/40">
                <th className="px-6 py-4">Name / Info</th>
                <th className="px-6 py-4">Contact</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4 text-right">Wallet Balance</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-indigo-950/50 text-xs">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-slate-500 animate-pulse font-medium">
                    Loading accounts database...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-slate-500 font-medium">
                    No accounts found matching query.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-indigo-950/10 transition-colors">
                    {/* Name */}
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-extrabold text-white text-sm">{user.name}</p>
                        <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                          ID: QS-USR-{user.id} • Joined: {new Date(user.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </td>

                    {/* Contact */}
                    <td className="px-6 py-4 space-y-0.5">
                      <p className="text-slate-300 font-semibold">{user.phone}</p>
                      <p className="text-slate-500 font-medium">{user.email || "No email"}</p>
                    </td>

                    {/* Role */}
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                          user.role === "seller"
                            ? "bg-purple-500/10 text-purple-400 border border-purple-500/25"
                            : user.role === "admin"
                            ? "bg-rose-500/10 text-rose-400 border border-rose-500/25"
                            : "bg-blue-500/10 text-blue-400 border border-blue-500/25"
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>

                    {/* Wallet */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5 font-bold text-slate-200">
                        <span>₹{parseFloat(user.wallet_balance).toFixed(2)}</span>
                        <button
                          onClick={() => handleOpenWalletModal(user)}
                          className="p-1 hover:text-indigo-400 text-slate-500 transition-colors"
                          title="Credit Wallet"
                        >
                          <PlusCircle size={14} />
                        </button>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          user.is_active
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/25"
                            : "bg-red-500/10 text-red-400 border border-red-500/25"
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
                        className={`p-2 rounded-lg border text-xs font-bold transition-all ${
                          user.is_active
                            ? "bg-red-950/30 border-red-500/20 text-red-400 hover:bg-red-900/40 hover:text-white"
                            : "bg-emerald-950/30 border-emerald-500/20 text-emerald-400 hover:bg-emerald-900/40 hover:text-white"
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
      </div>

      {/* Credit Wallet Dialog Modal */}
      {showWalletModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-slate-900 border border-indigo-900/40 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl animate-fade-in">
            <div className="flex justify-between items-center border-b border-indigo-950 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Wallet size={16} className="text-indigo-400" />
                <span>Credit Wallet Payout</span>
              </h3>
              <button
                onClick={() => setShowWalletModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            <div className="text-xs text-slate-400 bg-slate-950/50 p-3 rounded-lg border border-indigo-950">
              Account Name: <span className="text-slate-200 font-bold">{selectedUser.name}</span> <br />
              Current Balance: <span className="text-indigo-400 font-bold">₹{parseFloat(selectedUser.wallet_balance).toFixed(2)}</span>
            </div>

            {walletError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl p-3 text-xs">
                ⚠️ {walletError}
              </div>
            )}

            {walletSuccess && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl p-3 text-xs">
                ✅ {walletSuccess}
              </div>
            )}

            <form onSubmit={handleCreditWallet} className="space-y-4">
              <div>
                <label className="block text-slate-400 text-xs font-semibold mb-2">Credit Amount (INR)</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 font-bold">
                    ₹
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Enter amount, e.g. 500"
                    value={creditAmount}
                    onChange={(e) => setCreditAmount(e.target.value)}
                    required
                    disabled={walletLoading}
                    className="w-full pl-7 pr-4 py-2.5 bg-slate-950 border border-indigo-900/50 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 text-xs font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 text-xs font-semibold mb-2">Transaction Description</label>
                <input
                  type="text"
                  placeholder="e.g. Admin Bonus/Loyalty Refund"
                  value={creditDesc}
                  onChange={(e) => setCreditDesc(e.target.value)}
                  required
                  disabled={walletLoading}
                  className="w-full px-3 py-2.5 bg-slate-950 border border-indigo-900/50 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 text-xs font-semibold"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-indigo-950">
                <button
                  type="button"
                  onClick={() => setShowWalletModal(false)}
                  disabled={walletLoading}
                  className="px-4 py-2 bg-slate-950 text-slate-400 font-semibold rounded-xl border border-slate-900 transition-all text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={walletLoading || !creditAmount}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white font-bold rounded-xl transition-all text-xs flex items-center gap-1.5"
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
