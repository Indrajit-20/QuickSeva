import React, { useState, useEffect } from "react";
import { adminService } from "../api/adminService";
import {
  ShieldCheck,
  CheckCircle,
  XCircle,
  AlertTriangle,
  User,
  Store,
  DollarSign,
  Info,
} from "lucide-react";

const AdminDisputes = () => {
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Resolution Modal Confirmations
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedDispute, setSelectedDispute] = useState(null);
  const [resolutionAction, setResolutionAction] = useState(""); // 'refund' or 'complete'

  const fetchDisputes = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminService.getDisputes();
      if (res.success && res.data) {
        setDisputes(res.data.disputes || []);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to fetch disputed orders.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDisputes();
  }, []);

  const handleOpenConfirm = (dispute, action) => {
    setSelectedDispute(dispute);
    setResolutionAction(action);
    setShowConfirmModal(true);
  };

  const handleResolve = async () => {
    setActionLoading(true);
    try {
      const res = await adminService.resolveDispute(selectedDispute.id, resolutionAction);
      if (res.success) {
        alert(res.message || "Dispute resolved successfully!");
        setDisputes((prev) => prev.filter((d) => d.id !== selectedDispute.id));
        setShowConfirmModal(false);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to resolve dispute. Please check logs.");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6 text-left">
      <div>
        <h1 className="text-3xl font-bold text-slate-800 tracking-tight">
          Dispute Resolution Center
        </h1>
        <p className="text-slate-500 font-semibold text-sm mt-1">
          Arbitrate conflicts. Payout commissions to seller partners or issue full refunds back to buyers' wallets.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-750 rounded-xl p-4 text-xs font-semibold shadow-xs">
          ⚠️ {error}
        </div>
      )}

      {/* Disputes List */}
      <div className="space-y-6">
        {loading ? (
          <div className="py-12 text-center text-slate-400 text-xs animate-pulse font-bold bg-white rounded-2xl border border-slate-205">
            Scanning for active disputes...
          </div>
        ) : disputes.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs font-bold bg-white rounded-2xl border border-slate-200 shadow-sm">
            No disputed bookings found. System is fully operational.
          </div>
        ) : (
          disputes.map((dispute) => (
            <div
              key={dispute.id}
              className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6 shadow-sm hover:shadow-md transition duration-300"
            >
              {/* Dispute Metadata Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-red-50 text-red-700 border border-red-200 text-[10px] font-bold uppercase tracking-wider">
                      DISPUTED
                    </span>
                    <h3 className="font-bold text-slate-800 text-base">
                      Order #{dispute.order_number}
                    </h3>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1 font-bold">
                    Booked on: {new Date(dispute.created_at).toLocaleString()} • Last Update: {new Date(dispute.updated_at).toLocaleString()}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-left sm:text-right">
                    <p className="text-[10px] text-slate-405 font-bold uppercase tracking-wider">ORDER TOTAL</p>
                    <p className="text-slate-800 text-xl font-bold font-mono">₹{parseFloat(dispute.total_amount).toFixed(2)}</p>
                  </div>
                </div>
              </div>

              {/* Dispute Details Description Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-slate-600">
                {/* Buyer */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                  <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest flex items-center gap-1.5">
                    <User size={12} />
                    <span>Buyer Client</span>
                  </span>
                  <div>
                    <p className="font-bold text-slate-800 text-sm">{dispute.buyer_name}</p>
                    <p className="text-slate-500 font-semibold mt-0.5">{dispute.buyer_phone}</p>
                    <p className="text-slate-450 font-bold">Buyer ID: QS-USR-{dispute.buyer_id}</p>
                  </div>
                </div>

                {/* Seller */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                  <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest flex items-center gap-1.5">
                    <Store size={12} />
                    <span>Seller Partner</span>
                  </span>
                  <div>
                    <p className="font-bold text-slate-800 text-sm">{dispute.business_name}</p>
                    <p className="text-slate-500 font-semibold mt-0.5">Contact: {dispute.seller_name}</p>
                    <p className="text-slate-500 font-semibold">{dispute.seller_phone}</p>
                  </div>
                </div>

                {/* Transaction details */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                  <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest flex items-center gap-1.5">
                    <DollarSign size={12} />
                    <span>Payment Info</span>
                  </span>
                  <div className="space-y-1 font-bold text-slate-600">
                    <p>Method: <span className="text-slate-805 font-bold uppercase">{dispute.payment_method}</span></p>
                    <p>Payment: <span className="text-slate-805 font-bold uppercase">{dispute.payment_status}</span></p>
                    <p>Platform Fee: <span className="text-emerald-700">₹{parseFloat(dispute.platform_fee).toFixed(2)}</span></p>
                  </div>
                </div>
              </div>

              {/* Service & Dispute statement details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-450 font-bold block mb-1 uppercase tracking-wider">SERVICE BOOKED</span>
                  <p className="text-slate-800 font-bold text-sm bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">
                    {dispute.service_title || "Custom Service Job"}
                  </p>
                </div>
                <div>
                  <span className="text-slate-450 font-bold block mb-1 uppercase tracking-wider">DISPUTE STATEMENT</span>
                  <div className="bg-red-50 text-red-700 p-3 rounded-xl border border-red-200 italic font-semibold leading-relaxed">
                    "{dispute.cancel_reason || dispute.notes || "No cancellation reason provided."}"
                  </div>
                </div>
              </div>

              {/* Arbitration Actions */}
              <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
                <button
                  onClick={() => handleOpenConfirm(dispute, "refund")}
                  className="px-4 py-2.5 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 font-bold rounded-xl transition text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <XCircle size={14} />
                  <span>Refund Buyer</span>
                </button>
                <button
                  onClick={() => handleOpenConfirm(dispute, "complete")}
                  className="px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 font-bold rounded-xl transition text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle size={14} />
                  <span>Release Payout</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Confirmation Resolution Dialog */}
      {showConfirmModal && selectedDispute && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 text-slate-800">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl animate-fade-in">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <ShieldCheck className="text-blue-600" size={18} />
              <h3 className="text-base font-bold text-slate-800">Arbitration Confirmation</h3>
            </div>

            <div className="space-y-3 text-xs leading-relaxed text-slate-600 font-semibold">
              <p>
                You are about to resolve the dispute for <span className="font-bold text-slate-800">Order #{selectedDispute.order_number}</span>.
              </p>
              {resolutionAction === "refund" ? (
                <div className="bg-red-50 border border-red-250 text-red-700 p-3 rounded-xl flex gap-2">
                  <AlertTriangle size={16} className="shrink-0" />
                  <p>
                    <span className="font-bold">Refund Buyer:</span> This will cancel the booking and credit the full amount of <span className="font-bold text-slate-900">₹{parseFloat(selectedDispute.total_amount).toFixed(2)}</span> back to the buyer's wallet.
                  </p>
                </div>
              ) : (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-3 rounded-xl flex gap-2">
                  <Info size={16} className="shrink-0" />
                  <p>
                    <span className="font-bold">Release Payout:</span> This will complete the order and credit the payout of <span className="font-bold text-slate-900">₹{(parseFloat(selectedDispute.total_amount) - parseFloat(selectedDispute.platform_fee || 0)).toFixed(2)}</span> (Total minus platform fee) to the seller's wallet.
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                disabled={actionLoading}
                className="px-4 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold rounded-xl border border-slate-200 transition text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleResolve}
                disabled={actionLoading}
                className={`px-5 py-2.5 font-bold rounded-xl text-white transition text-xs cursor-pointer ${
                  resolutionAction === "refund"
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-emerald-600 hover:bg-emerald-700"
                }`}
              >
                {actionLoading ? "Resolving..." : "Confirm Resolution"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDisputes;
