import { createContext, useContext, useCallback, useMemo, useState, useEffect } from "react";

import { addFunds, getTransactions, initWallet } from "../utils/wallet";

const WalletContext = createContext(null);

export function WalletProvider({ children }) {
  const [wallet, setWallet] = useState(() => initWallet());
  const [transactions, setTransactions] = useState(() => getTransactions());

  const refreshWallet = useCallback(() => {
    const w = initWallet();
    setWallet(w);
    setTransactions(Array.isArray(w?.transactions) ? w.transactions : []);
  }, []);

  const addFundsToWallet = useCallback((amount) => {
    const nextWallet = addFunds(amount);
    setWallet(nextWallet);
    setTransactions(
      Array.isArray(nextWallet?.transactions) ? nextWallet.transactions : [],
    );
    return nextWallet;
  }, []);

  useEffect(() => {
    const handleStorageChange = (event) => {
      if (event.key === "sellerWallet" && event.newValue) {
        try {
          refreshWallet();
        } catch {
          // error
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [refreshWallet]);

  const value = useMemo(
    () => ({
      wallet,
      walletBalance: Number(wallet?.balance || 0),
      transactions,
      refreshWallet,
      addFundsToWallet,
    }),
    [wallet, transactions],
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
