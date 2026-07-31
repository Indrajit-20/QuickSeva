import { useEffect, useMemo, useState } from "react";
import { History, Wallet, Plus, RefreshCw, Rocket, ArrowUpRight, ArrowDownLeft, Crown } from "lucide-react";
import { useAuth } from "../../../src/context/AuthContext";
import { isWalletSufficient } from "../../utils/wallet";
import AddFundsModal from "../../components/AddFundsModal";
import { useWallet } from "../../context/WalletContext";
import { Link } from "react-router-dom";
import { isPremiumActive } from "../../utils/premium";

function formatDateShort(iso) {
  try {
    return new Intl.DateTimeFormat("en-IN", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).format(new Date(iso));
  } catch {
    return "";
  }
}

function getWalletTier(balance) {
  if (balance <= 0) return "red";
  if (balance < 20) return "amber";
  return "green";
}

function formatDescription(desc) {
  if (!desc) return "";
  const trimmed = desc.trim();
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    try {
      const data = JSON.parse(trimmed);
      
      const plans = {
        basic: { eng: "Basic Plan", hin: "बेसिक प्लान" },
        standard: { eng: "Standard Plan", hin: "स्टैंडर्ड प्लान" },
        pro: { eng: "Pro Plan", hin: "प्रो प्लान" }
      };

      const planInfo = plans[data.planId?.toLowerCase()] || { eng: `${data.planId || 'Premium'} Plan`, hin: "प्रीमियम प्लान" };

      const types = {
        new: { eng: "Purchased", hin: "खरीदा गया" },
        upgrade: { eng: "Upgraded to", hin: "अपग्रेड किया गया" },
        downgrade: { eng: "Downgraded to", hin: "डाउनग्रेड किया गया" },
        extend: { eng: "Extended", hin: "समय बढ़ाया गया" }
      };

      const typeInfo = types[data.purchaseType] || { eng: "Activated", hin: "चालू किया गया" };

      return {
        title: `${typeInfo.eng} ${planInfo.eng}`,
        subtitle: `${typeInfo.hin} ${planInfo.hin}`,
        isPremium: true,
      };
    } catch (e) {
      return { title: desc, subtitle: "", isPremium: false };
    }
  }
  
  if (trimmed.toLowerCase() === "wallet top-up") {
    return { title: "Wallet Top-up", subtitle: "वॉलेट में पैसे जोड़े", isPremium: false };
  }

  return { title: desc, subtitle: "", isPremium: false };
}

export default function SellerWallet() {
  const { user } = useAuth();
  const { walletBalance, transactions, refreshWallet, addFundsToWallet } =
    useWallet();

  const [rechargeOpen, setRechargeOpen] = useState(false);
  const sufficient = isWalletSufficient();

  const [hasPremium, setHasPremium] = useState(true);

  useEffect(() => {
    setHasPremium(isPremiumActive(user) || isPremiumActive());
  }, [user]);

  const balance = Number(walletBalance || 0);
  const tier = getWalletTier(balance);

  return (
    <div className="seller-page space-y-5 animate-fade-in">

      {/* ── Page Header ── */}
      <div>
        <h1 className="seller-page-title">Lead Credits</h1>
        <p className="seller-page-subtitle">Manage your search credits / सर्च क्रेडिट प्रबंधित करें</p>
      </div>

      {/* ── Professional Wallet Balance Card (Clean Light Theme) ── */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-sm relative overflow-hidden transition-all">
        {/* Subtle accent border at top */}
        <div
          className={`absolute top-0 left-0 right-0 h-1.5 ${
            balance <= 0
              ? "bg-gradient-to-r from-red-500 via-rose-500 to-red-600"
              : "bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500"
          }`}
        />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div className="flex items-center gap-3.5">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                balance <= 0
                  ? "bg-red-50 text-red-600 border border-red-100"
                  : "bg-blue-50 text-blue-600 border border-blue-100"
              }`}
            >
              <Wallet size={24} strokeWidth={2.2} />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Available Credits</span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span
                  className={`text-3xl sm:text-4xl font-black tracking-tight ${
                    balance <= 0 ? "text-red-600" : "text-slate-900"
                  }`}
                >
                  {balance}
                </span>
                <span className="text-base font-bold text-slate-500">Credits</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {balance <= 0 ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-extrabold bg-red-50 text-red-700 border border-red-200 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /> Out of Credits
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Active Wallet
              </span>
            )}
          </div>
        </div>

        {/* Zero Credits Alert Banner */}
        {balance <= 0 && (
          <div className="mt-4 p-3.5 rounded-2xl bg-red-50 border border-red-200/80 text-xs font-semibold text-red-800 flex items-center gap-2.5">
            <span className="text-base leading-none">⚠️</span>
            <div>
              <span className="font-bold">Zero Credits Alert:</span> Your balance is 0. Top up credits now to receive new customer bookings & lead alerts!
            </div>
          </div>
        )}

        {/* Action Row */}
        <div className="flex items-center gap-3 pt-4">
          <button
            onClick={() => setRechargeOpen(true)}
            className="flex-1 flex items-center justify-center gap-2 py-3 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm shadow-md shadow-blue-500/20 active:scale-95 transition-all cursor-pointer border-0"
          >
            <Plus size={18} strokeWidth={2.5} /> Buy Credits
          </button>
          <div className="py-3 px-4 rounded-xl bg-slate-100 border border-slate-200 text-xs font-extrabold text-slate-700 whitespace-nowrap">
            Free Listing ✓
          </div>
        </div>
      </div>

      {/* ── Premium Banner ── */}
      {!hasPremium && (
        <div className="seller-card" style={{ overflow: 'hidden' }}>
          <div style={{
            background: 'linear-gradient(135deg, #8b5cf6 0%, #a78bfa 50%, #7c3aed 100%)',
            padding: '16px 14px', color: 'white',
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <div style={{
              width: 42, height: 42, borderRadius: 12,
              background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(6px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              border: '1px solid rgba(255,255,255,0.15)',
            }}>
              <Rocket size={20} style={{ transform: 'rotate(45deg)' }} />
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: 13, fontWeight: 800, color: '#ffffff' }}>Boost with Premium</h3>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.9)', marginTop: 2, lineHeight: 1.4 }}>
                Lead Alerts • Top results • Gold badge
              </p>
            </div>
            <Link
              to="/seller/packages"
              style={{
                background: '#ffffff', borderRadius: 10,
                padding: '8px 14px', fontSize: 11, fontWeight: 700,
                border: 'none', color: '#7c3aed',
                textDecoration: 'none', whiteSpace: 'nowrap',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              }}
            >
              Upgrade →
            </Link>
          </div>
        </div>
      )}

      {/* ── Transaction History ── */}
      <div className="seller-card">
        <div className="seller-card-body">
          <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
              <History size={18} style={{ color: '#64748b' }} />
              Transactions
            </h2>
            <span style={{
              fontSize: 11, fontWeight: 700, color: '#3b82f6',
              background: '#eff6ff', padding: '4px 10px', borderRadius: 20,
              border: '1px solid #bfdbfe',
            }}>
              {transactions.length} total
            </span>
          </div>

          {transactions.length === 0 ? (
            <div className="seller-empty-state" style={{ padding: '32px 20px', border: 'none' }}>
              <div className="seller-empty-icon">
                <History size={24} />
              </div>
              <div className="seller-empty-title">No transactions yet</div>
              <div className="seller-empty-text">Your transaction history will appear here</div>
            </div>
          ) : (
            <div>
              {transactions.slice(0, 20).map((tx) => {
                const desc = formatDescription(tx.description);
                const isCredit = tx.type !== "debit";
                return (
                  <div key={tx.id} className="seller-tx-item">
                    <div className="seller-tx-icon" style={{
                      background: isCredit ? '#ecfdf5' : '#fef2f2',
                      color: isCredit ? '#059669' : '#dc2626',
                    }}>
                      {desc.isPremium ? (
                        <Crown size={18} />
                      ) : isCredit ? (
                        <ArrowDownLeft size={18} />
                      ) : (
                        <ArrowUpRight size={18} />
                      )}
                    </div>
                    <div className="seller-tx-info">
                      <div className="seller-tx-title">{desc.title}</div>
                      {desc.subtitle && (
                        <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 500 }}>{desc.subtitle}</div>
                      )}
                      <div className="seller-tx-date">
                        {formatDateShort(tx.created_at || tx.timestamp)}
                      </div>
                    </div>
                    <div className={`seller-tx-amount ${isCredit ? 'seller-tx-amount--credit' : 'seller-tx-amount--debit'}`}>
                      {isCredit ? "+" : "-"}{Number(tx.amount || 0)} Credits
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <AddFundsModal
        open={rechargeOpen}
        onClose={() => setRechargeOpen(false)}
        prefillAmount={100}
        successMessage={"Credits added successfully!"}
        continueButtonLabel={"Done"}
        onSuccess={() => {
          refreshWallet();
          setRechargeOpen(false);
        }}
        closeOnSuccess={true}
      />
    </div>
  );
}
