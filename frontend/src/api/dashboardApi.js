import apiClient from "./axiosConfig";

// Seller dashboard currently not available as a dedicated endpoint in backend.
// We'll compute it from /orders/seller.

export const sellerDashboardApi = {
  listOrders: async (params) =>
    apiClient.get("/orders/seller", { params }).then((r) => r?.data),
};
