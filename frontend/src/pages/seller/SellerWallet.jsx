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

      {/* ── Balance Hero Card ── */}
      <div className={`seller-wallet-hero seller-wallet-hero--${tier}`}>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div className="flex items-center gap-3" style={{ marginBottom: 16 }}>
            <div style={{
              width: 48, height: 48, borderRadius: 14,
              background: 'rgba(255,255,255,0.18)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Wallet size={24} />
            </div>
            <div>
              <p style={{ fontSize: 12, fontWeight: 600, opacity: 0.75 }}>Available Credits</p>
              <p style={{ fontSize: 36, fontWeight: 900, letterSpacing: '-0.02em', lineHeight: 1 }}>
                {balance} Credits
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setRechargeOpen(true)}
              style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                padding: '14px 20px', borderRadius: 14,
                background: 'rgba(255,255,255,0.2)',
                border: '1px solid rgba(255,255,255,0.3)',
                color: 'white', fontSize: 14, fontWeight: 700,
                cursor: 'pointer', transition: 'all 0.2s ease',
                backdropFilter: 'blur(8px)',
              }}
              className="active:scale-95"
            >
              <Plus size={18} /> Buy Credits
            </button>
            <div style={{
              padding: '14px 16px', borderRadius: 14,
              background: 'rgba(255,255,255,0.15)',
              border: '1px solid rgba(255,255,255,0.2)',
              fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap',
            }}>
              Free Listing ✓
            </div>
          </div>
        </div>
      </div>

      {/* ── Premium Banner ── */}
      {!hasPremium && (
        <div className="seller-card" style={{ overflow: 'hidden' }}>
          <div style={{
            background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
            padding: 18, color: 'white',
            display: 'flex', alignItems: 'center', gap: 14,
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: 'rgba(255,255,255,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <Rocket size={22} style={{ transform: 'rotate(45deg)' }} />
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: 14, fontWeight: 800 }}>Boost with Premium</h3>
              <p style={{ fontSize: 11, opacity: 0.8, marginTop: 2 }}>
                Top search results, highlighted pin & gold badge
              </p>
            </div>
            <Link
              to="/seller/packages"
              style={{
                background: 'rgba(255,255,255,0.2)', borderRadius: 10,
                padding: '8px 14px', fontSize: 11, fontWeight: 700,
                border: '1px solid rgba(255,255,255,0.3)', color: 'white',
                textDecoration: 'none', whiteSpace: 'nowrap',
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
