import apiClient from "./axiosConfig";

export const getWalletApi = async () => {
  const response = await apiClient.get("/wallet");
  return response.data;
};

export const getTransactionsApi = async (page = 1, limit = 20) => {
  const response = await apiClient.get(`/wallet/transactions?page=${page}&limit=${limit}`);
  return response.data;
};

export const topUpWalletApi = async (amount, description = "Wallet top-up") => {
  const response = await apiClient.post("/wallet/topup", { amount, description });
  return response.data;
};
