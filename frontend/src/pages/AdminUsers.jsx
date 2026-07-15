import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { adminService } from "../api/adminService";
import {
  Search,
  UserX,
  UserCheck,
  PlusCircle,
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

  const inputClass =
    "w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-805 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-xs font-semibold shadow-xs";

  return (
    <div className="space-y-6 text-left">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">
            {activeTab === "blocked" ? "Suspended Accounts" : "User Database"}
          </h1>
          <p className="text-slate-500 font-semibold text-sm mt-1">
            Manage roles, view balances, and suspend/reactivate client accounts.
          </p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="relative w-full sm:w-80">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
            <Search size={16} />
          </span>
          <input
            type="text"
            placeholder="Search by name, phone, email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={inputClass}
          />
        </div>

        <div className="text-xs text-slate-500 font-bold">
          Found {users.length} accounts
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-xs font-semibold">
          ⚠️ {error}
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 text-[10px] font-bold uppercase tracking-wider bg-slate-50">
                <th className="px-6 py-4">Name / Info</th>
                <th className="px-6 py-4">Contact</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4 text-right">Wallet Balance</th>
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
                    No accounts found matching query.
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
                      <div className="flex items-center justify-end gap-1.5 font-bold text-slate-850 font-mono">
                        <span>₹{parseFloat(user.wallet_balance).toFixed(2)}</span>
                        <button
                          onClick={() => handleOpenWalletModal(user)}
                          className="p-1 hover:text-blue-600 text-slate-400 transition-colors cursor-pointer"
                          title="Credit Wallet"
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
                            : "bg-red-50 text-red-750 border-red-200"
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
      </div>

      {/* Credit Wallet Dialog Modal */}
      {showWalletModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl animate-fade-in text-slate-800">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Wallet size={16} className="text-blue-600" />
                <span>Credit Wallet Payout</span>
              </h3>
              <button
                onClick={() => setShowWalletModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer p-1"
              >
                <X size={16} />
              </button>
            </div>

            <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200 leading-normal">
              Account Name: <span className="text-slate-900 font-bold">{selectedUser.name}</span> <br />
              Current Balance: <span className="text-blue-600 font-bold">₹{parseFloat(selectedUser.wallet_balance).toFixed(2)}</span>
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
                <label className="block text-slate-600 text-xs font-bold uppercase tracking-wider mb-2">Credit Amount (INR)</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 font-bold">
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
                    className="w-full pl-7 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 text-xs font-semibold shadow-xs"
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
