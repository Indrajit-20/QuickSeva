import { createContext, useContext, useCallback, useMemo, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import { useSocket } from "./SocketContext";
import { getWalletApi, getTransactionsApi, topUpWalletApi } from "../api/walletApi";

const WalletContext = createContext(null);

export function WalletProvider({ children }) {
  const { isAuthenticated, user } = useAuth();
  const [walletBalance, setWalletBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);

  const refreshWallet = useCallback(async () => {
    if (!isAuthenticated || user?.role !== "seller") {
      return;
    }
    setLoading(true);
    try {
      const [walletRes, transRes] = await Promise.all([
        getWalletApi().catch((err) => {
          console.error("Failed to load wallet:", err);
          return null;
        }),
        getTransactionsApi(1, 100).catch((err) => {
          console.error("Failed to load transactions:", err);
          return null;
        }),
      ]);
      if (walletRes?.success) {
        setWalletBalance(Number(walletRes?.data?.balance || 0));
      }
      if (transRes?.success) {
        setTransactions(transRes?.data?.transactions || []);
      }
    } catch (err) {
      console.error("refreshWallet error:", err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  const addFundsToWallet = useCallback(async (amount) => {
    try {
      const res = await topUpWalletApi(amount);
      if (res?.success) {
        await refreshWallet();
        return res.data;
      }
      return null;
    } catch (err) {
      console.error("addFundsToWallet error:", err);
      throw err;
    }
  }, [refreshWallet]);

  useEffect(() => {
    if (isAuthenticated && user?.role === "seller") {
      refreshWallet();
    } else {
      setWalletBalance(0);
      setTransactions([]);
    }
  }, [isAuthenticated, user, refreshWallet]);

  const { socket } = useSocket();
  useEffect(() => {
    if (!socket) return;
    const handlePaymentUpdate = () => {
      refreshWallet();
    };
    socket.on("payment_updated", handlePaymentUpdate);
    return () => {
      socket.off("payment_updated", handlePaymentUpdate);
    };
  }, [socket, refreshWallet]);

  const value = useMemo(
    () => ({
      wallet: { balance: walletBalance, transactions },
      walletBalance,
      transactions,
      refreshWallet,
      addFundsToWallet,
      loading,
    }),
    [walletBalance, transactions, refreshWallet, addFundsToWallet, loading],
  );

  return (
    <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
  );
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used within a WalletProvider");
  return ctx;
}
