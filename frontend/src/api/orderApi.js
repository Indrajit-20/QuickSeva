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
  complete: async (orderId, payload = {}) => apiClient.patch(`/orders/${orderId}/complete`, payload),
  cancel: async (orderId, payload = {}) =>
    apiClient.patch(`/orders/${orderId}/cancel`, payload),
  submitQuotation: async (orderId, payload) =>
    apiClient.patch(`/orders/${orderId}/quotation`, payload),
  verifyStartCode: async (orderId, otp) =>
    apiClient.post(`/orders/${orderId}/verify-start-code`, { otp }),
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
  approveQuotation: async (orderId) =>
    apiClient.patch(`/orders/${orderId}/approve-quotation`),
  rejectQuotation: async (orderId, reason = "") =>
    apiClient.patch(`/orders/${orderId}/reject-quotation`, { reason }),
  switchPaymentMethod: async (orderId, payment_method) =>
    apiClient.patch(`/orders/${orderId}/switch-payment-method`, { payment_method }),
  dispute: async (orderId, payload = {}) =>
    apiClient.patch(`/orders/${orderId}/dispute`, payload),
};
