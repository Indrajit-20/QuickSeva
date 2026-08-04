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

  downloadExport: async (endpoint, defaultFilename) => {
    const res = await apiClient.get(endpoint, { responseType: "blob" });
    const url = window.URL.createObjectURL(new Blob([res.data], { type: "text/csv;charset=utf-8;" }));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", defaultFilename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  exportUsersCSV: async () => {
    return adminService.downloadExport("/admin/export/users", "QuickSeva_Users_Report.csv");
  },

  exportSellersCSV: async () => {
    return adminService.downloadExport("/admin/export/sellers", "QuickSeva_Sellers_Report.csv");
  },

  exportBookingsCSV: async () => {
    return adminService.downloadExport("/admin/export/bookings", "QuickSeva_Bookings_Report.csv");
  },

  bulkImportServices: async (items) => {
    const res = await apiClient.post("/admin/import/services", { items });
    return res.data;
  },
};
