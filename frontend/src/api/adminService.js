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

  getDisputes: async (params) => {
    const res = await apiClient.get("/admin/disputes", { params });
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

  exportUsersCSV: async (params) => {
    let endpoint = "/admin/export/users";
    if (params) {
      const cleanParams = Object.fromEntries(
        Object.entries(params).filter(([_, v]) => v !== undefined && v !== "" && v !== null)
      );
      const queryString = new URLSearchParams(cleanParams).toString();
      if (queryString) {
        endpoint += `?${queryString}`;
      }
    }
    return adminService.downloadExport(endpoint, "QuickSeva_Users_Report.csv");
  },

  exportSellersCSV: async (params) => {
    let endpoint = "/admin/export/sellers";
    if (params) {
      const cleanParams = Object.fromEntries(
        Object.entries(params).filter(([_, v]) => v !== undefined && v !== "" && v !== null)
      );
      const queryString = new URLSearchParams(cleanParams).toString();
      if (queryString) endpoint += `?${queryString}`;
    }
    return adminService.downloadExport(endpoint, "QuickSeva_Sellers_Report.csv");
  },

  exportBookingsCSV: async () => {
    return adminService.downloadExport("/admin/export/bookings", "QuickSeva_Bookings_Report.csv");
  },

  exportDisputesCSV: async (params) => {
    let endpoint = "/admin/export/disputes";
    if (params) {
      const cleanParams = Object.fromEntries(
        Object.entries(params).filter(([_, v]) => v !== undefined && v !== "" && v !== null)
      );
      const queryString = new URLSearchParams(cleanParams).toString();
      if (queryString) endpoint += `?${queryString}`;
    }
    return adminService.downloadExport(endpoint, "QuickSeva_Disputes_Report.csv");
  },

  bulkImportServices: async (items) => {
    const res = await apiClient.post("/admin/import/services", { items });
    return res.data;
  },
};
