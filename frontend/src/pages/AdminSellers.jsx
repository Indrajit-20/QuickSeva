import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { adminService } from "../api/adminService";
import {
  Search,
  CheckCircle,
  FileText,
  UserCheck,
  UserX,
  X,
  MapPin,
  Briefcase,
  Star,
  Download,
} from "lucide-react";
import apiClient from "../api/axiosConfig";

const AdminSellers = () => {
  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "pending";

  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Detailed Modal State
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedSeller, setSelectedSeller] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchSellers = async () => {
    setLoading(true);
    setError(null);
    try {
      const is_verified_filter =
        activeTab === "pending" ? 0 : activeTab === "verified" ? 1 : undefined;

      const res = await adminService.getSellers({
        is_verified: is_verified_filter,
        search: searchQuery || undefined,
      });

      if (res.success && res.data) {
        let sellerList = res.data.sellers || [];

        // If tab is suspended, filter by user account active status (is_active === 0)
        if (activeTab === "suspended") {
          sellerList = sellerList.filter((s) => s.is_active === 0);
        } else {
          // Exclude suspended users from pending/verified tabs to keep listings clean
          sellerList = sellerList.filter((s) => s.is_active === 1);
        }

        setSellers(sellerList);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to fetch seller profiles.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSellers();
  }, [activeTab, searchQuery]);

  const handleVerifySeller = async (sellerId) => {
    setActionLoading(true);
    try {
      const res = await adminService.verifySeller(sellerId);
      if (res.success) {
        alert("Seller verified successfully!");
        setSellers((prev) => prev.filter((s) => s.id !== sellerId));
        setShowDetailModal(false);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to verify seller.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleSuspension = async (seller) => {
    setActionLoading(true);
    try {
      const res = await adminService.toggleUserStatus(seller.user_id);
      if (res.success) {
        alert(`Seller account ${seller.is_active ? "suspended" : "reactivated"} successfully!`);
        setSellers((prev) => prev.filter((s) => s.id !== seller.id));
        setShowDetailModal(false);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to update seller account status.");
    } finally {
      setActionLoading(false);
    }
  };

  const getDocUrl = (path) => {
    if (!path) return "#";
    if (path.startsWith("http")) return path;
    const base = apiClient.defaults.baseURL
      ? apiClient.defaults.baseURL.replace("/api", "")
      : "http://localhost:5000";
    return `${base}${path}`;
  };

  const handleOpenDetails = (seller) => {
    setSelectedSeller(seller);
    setShowDetailModal(true);
  };

  const inputClass =
    "w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-805 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-xs font-semibold shadow-xs";

  return (
    <div className="space-y-6 text-left">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">
            {activeTab === "pending"
              ? "Verification Requests"
              : activeTab === "verified"
              ? "Verified Seller Partners"
              : "Suspended Seller Partners"}
          </h1>
          <p className="text-slate-500 font-semibold text-sm mt-1">
            Review uploaded certificates, verify business compliance, or suspend accounts.
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
            placeholder="Search business name, contact..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={inputClass}
          />
        </div>

        <div className="text-xs text-slate-500 font-bold">
          Found {sellers.length} profiles
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-750 rounded-xl p-4 text-xs font-semibold shadow-xs">
          ⚠️ {error}
        </div>
      )}

      {/* Sellers Grid List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-12 text-center text-slate-400 text-xs animate-pulse font-bold">
            Loading partner profiles...
          </div>
        ) : sellers.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400 text-xs font-bold">
            No seller accounts in this category.
          </div>
        ) : (
          sellers.map((seller) => (
            <div
              key={seller.id}
              onClick={() => handleOpenDetails(seller)}
              className="bg-white border border-slate-200 rounded-2xl p-6 hover:border-blue-400 hover:shadow-md transition-all duration-300 cursor-pointer flex flex-col justify-between space-y-4 shadow-sm"
            >
              <div>
                <div className="flex justify-between items-start gap-2">
                  <h3 className="font-bold text-slate-800 text-base truncate">
                    {seller.business_name || "QuickSeva Partner"}
                  </h3>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${
                      seller.is_verified
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-amber-50 text-amber-705 border-amber-200"
                    }`}
                  >
                    {seller.is_verified ? "Verified" : "Pending"}
                  </span>
                </div>

                <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mt-1">
                  {seller.category_name || "General Services"}
                </p>

                <div className="mt-4 space-y-2 text-xs text-slate-500 font-semibold">
                  <div className="flex items-center gap-2">
                    <Briefcase size={12} className="text-slate-400" />
                    <span>Experience: {seller.experience_yrs} Yrs</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin size={12} className="text-slate-400 shrink-0" />
                    <span className="truncate">{seller.city || "Unknown City"}</span>
                  </div>
                  {seller.documents && seller.documents.length > 0 && (
                    <div className="flex items-center gap-2 text-emerald-700 font-bold text-[11px] mt-1 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 w-fit">
                      <FileText size={12} />
                      <span>{seller.documents.length} docs uploaded</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4 flex items-center justify-between text-xs text-slate-550">
                <span className="font-bold">By: {seller.name}</span>
                <span className="flex items-center gap-1 font-bold text-slate-700">
                  <Star size={12} className="text-amber-400 fill-amber-400" />
                  <span>{seller.avg_rating || "0.0"}</span>
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Verification Detailed Audit Modal */}
      {showDetailModal && selectedSeller && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full p-6 space-y-6 shadow-2xl animate-fade-in max-h-[90vh] overflow-y-auto text-slate-800">
            {/* Header */}
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-800">
                  {selectedSeller.business_name || "QuickSeva Partner"}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  ID: QS-SLR-{selectedSeller.id} • Registered: {selectedSeller.name}
                </p>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-slate-400 hover:text-slate-655 cursor-pointer p-1"
              >
                <X size={18} />
              </button>
            </div>

            {/* Profile Fields Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              <div className="space-y-4">
                <div>
                  <span className="text-slate-450 font-bold block mb-1 uppercase tracking-wider">OWNER CONTACT</span>
                  <p className="text-slate-800 font-bold">{selectedSeller.name}</p>
                  <p className="text-blue-600 font-bold">{selectedSeller.phone}</p>
                  <p className="text-slate-500 font-medium">{selectedSeller.email || "No email address"}</p>
                </div>

                <div>
                  <span className="text-slate-450 font-bold block mb-1 uppercase tracking-wider">BUSINESS DETAILS</span>
                  <p className="text-slate-700 font-semibold">Category: {selectedSeller.category_name || "General"}</p>
                  <p className="text-slate-700 font-semibold">Experience: {selectedSeller.experience_yrs} Years</p>
                  <p className="text-slate-700 font-semibold">Seller Type: {selectedSeller.seller_type || "individual"}</p>
                  <p className="text-slate-600 font-semibold">GST number: {selectedSeller.gst_number || "Not Registered"}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <span className="text-slate-450 font-bold block mb-1 uppercase tracking-wider">SERVICE LOCATION</span>
                  <p className="text-slate-800 font-bold">{selectedSeller.address || "No address listed"}</p>
                  <p className="text-slate-500 font-semibold mt-0.5">
                    {selectedSeller.city}, {selectedSeller.state} - {selectedSeller.pincode}
                  </p>
                </div>

                <div>
                  <span className="text-slate-450 font-bold block mb-1 uppercase tracking-wider">SHORT BIO</span>
                  <p className="text-slate-600 italic bg-slate-50 p-3 rounded-xl border border-slate-200 font-medium leading-relaxed">
                    {selectedSeller.bio || "No biography provided by partner."}
                  </p>
                </div>
              </div>
            </div>

            {/* Uploaded Documents List */}
            <div>
              <span className="text-slate-450 text-xs font-bold block mb-3 uppercase tracking-wider">SUBMITTED IDENTIFICATION/DOCUMENTS</span>
              {selectedSeller.documents && selectedSeller.documents.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {selectedSeller.documents.map((doc, idx) => (
                    <a
                      key={idx}
                      href={getDocUrl(doc)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 hover:border-blue-400 rounded-xl text-xs text-blue-600 hover:text-blue-700 transition-all font-bold shadow-2xs"
                    >
                      <div className="flex items-center gap-2">
                        <FileText size={14} className="text-slate-450" />
                        <span>Document_{idx + 1}.pdf</span>
                      </div>
                      <Download size={14} />
                    </a>
                  ))}
                </div>
              ) : (
                <div className="text-slate-500 italic text-xs bg-slate-50 p-4 rounded-xl border border-slate-200 text-center font-semibold">
                  ⚠️ No verification documents uploaded yet.
                </div>
              )}
            </div>

            {/* Actions Footer */}
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowDetailModal(false)}
                disabled={actionLoading}
                className="px-4 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold rounded-xl border border-slate-200 transition-all text-xs cursor-pointer"
              >
                Cancel
              </button>

              {selectedSeller.is_active === 1 && (
                <button
                  type="button"
                  onClick={() => handleToggleSuspension(selectedSeller)}
                  disabled={actionLoading}
                  className="px-4 py-2.5 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 font-bold rounded-xl transition-all text-xs flex items-center gap-1 cursor-pointer"
                >
                  <UserX size={14} />
                  <span>Suspend Account</span>
                </button>
              )}

              {selectedSeller.is_active === 0 && (
                <button
                  type="button"
                  onClick={() => handleToggleSuspension(selectedSeller)}
                  disabled={actionLoading}
                  className="px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 font-bold rounded-xl transition-all text-xs flex items-center gap-1 cursor-pointer"
                >
                  <UserCheck size={14} />
                  <span>Reactivate Account</span>
                </button>
              )}

              {!selectedSeller.is_verified && selectedSeller.is_active === 1 && (
                <button
                  type="button"
                  onClick={() => handleVerifySeller(selectedSeller.id)}
                  disabled={actionLoading}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <CheckCircle size={14} />
                  <span>Approve Partner</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSellers;
