import apiClient from "./axiosConfig";

export const sellerOrdersApi = {
  list: async ({ status } = {}) => {
    const params = {};
    if (status) params.status = status;
    const res = await apiClient.get("/orders/seller", { params });
    return res?.data;
  },

  accept: async (orderId) => apiClient.patch(`/orders/${orderId}/accept`),
  start: async (orderId) => apiClient.patch(`/orders/${orderId}/start`),
  complete: async (orderId) => apiClient.patch(`/orders/${orderId}/complete`),
  cancel: async (orderId, payload = {}) =>
    apiClient.patch(`/orders/${orderId}/cancel`, payload),
};

export const buyerOrdersApi = {
  list: async ({ status } = {}) => {
    const params = {};
    if (status) params.status = status;
    const res = await apiClient.get("/orders/my", { params });
    return res?.data;
  },

  // Note: backend has PATCH /orders/:id/cancel that allows buyer cancel
  cancel: async (orderId, payload = {}) =>
    apiClient.patch(`/orders/${orderId}/cancel`, payload),
};
