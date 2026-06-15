import apiClient from "./axiosConfig";

export const serviceApi = {
  // Seller-only
  create: async (payload) => apiClient.post("/services", payload),
  listMyServices: async () => apiClient.get("/services/me/my"),
  update: async (serviceId, payload) =>
    apiClient.put(`/services/${serviceId}`, payload),
  delete: async (serviceId) => apiClient.delete(`/services/${serviceId}`),

  // Public
  getById: async (serviceId) => apiClient.get(`/services/${serviceId}`),
  listBySeller: async (sellerId) =>
    apiClient.get(`/services/seller/${sellerId}`),
  search: async (params) => apiClient.get("/services/search", { params }),
};
