import apiClient from "./axiosConfig";

export const adminService = {
  getStats: async () => {
    const res = await apiClient.get("/admin/stats");
    return res.data;
  },

  getUsers: async (params) => {
    const res = await apiClient.get("/admin/users", { params });
    return res.data;
  },

  getSellers: async (params) => {
    const res = await apiClient.get("/admin/sellers", { params });
    return res.data;
  },

  getDisputes: async () => {
    const res = await apiClient.get("/admin/disputes");
    return res.data;
  },

  resolveDispute: async (orderId, action) => {
    const res = await apiClient.post(`/admin/disputes/${orderId}/resolve`, { action });
    return res.data;
  },

  getCategories: async () => {
    const res = await apiClient.get("/admin/categories");
    return res.data;
  },

  createCategory: async (data) => {
    const res = await apiClient.post("/admin/categories", data);
    return res.data;
  },

  toggleCategory: async (id) => {
    const res = await apiClient.patch(`/admin/categories/${id}/toggle`);
    return res.data;
  },

  toggleUserStatus: async (id) => {
    const res = await apiClient.patch(`/users/${id}/toggle`);
    return res.data;
  },

  verifySeller: async (id) => {
    const res = await apiClient.patch(`/sellers/${id}/verify`);
    return res.data;
  },

  adminCreditWallet: async (data) => {
    const res = await apiClient.post("/wallet/admin/credit", data);
    return res.data;
  },
};
