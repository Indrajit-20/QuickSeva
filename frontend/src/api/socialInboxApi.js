import apiClient from "./axiosConfig";

export const socialInboxApi = {
  getStats: async () => {
    const res = await apiClient.get("/seller/social-inbox/stats");
    return res?.data;
  },

  getConversations: async ({ platform = "all", status = "all", q = "" } = {}) => {
    const params = {};
    if (platform) params.platform = platform;
    if (status) params.status = status;
    if (q) params.q = q;
    const res = await apiClient.get("/seller/social-inbox/conversations", { params });
    return res?.data;
  },

  getConversationById: async (id) => {
    const res = await apiClient.get(`/seller/social-inbox/conversations/${id}`);
    return res?.data;
  },

  sendMessage: async (id, { message, media_url }) => {
    const res = await apiClient.post(`/seller/social-inbox/conversations/${id}/messages`, { message, media_url });
    return res?.data;
  },

  updateStatus: async (id, status) => {
    const res = await apiClient.patch(`/seller/social-inbox/conversations/${id}/status`, { status });
    return res?.data;
  },

  addNote: async (id, note_text) => {
    const res = await apiClient.post(`/seller/social-inbox/conversations/${id}/notes`, { note_text });
    return res?.data;
  },

  convertToBooking: async (id) => {
    const res = await apiClient.post(`/seller/social-inbox/conversations/${id}/convert`);
    return res?.data;
  },

  getAccounts: async () => {
    const res = await apiClient.get("/seller/social-inbox/accounts");
    return res?.data;
  },

  toggleAccount: async (platform) => {
    const res = await apiClient.post("/seller/social-inbox/accounts/toggle", { platform });
    return res?.data;
  },

  getMetaAuthUrl: async (platform = "instagram") => {
    const res = await apiClient.get("/seller/social-inbox/meta/connect", { params: { platform } });
    return res?.data;
  }
};
