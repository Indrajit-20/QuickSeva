import apiClient from "./axiosConfig";

export const reviewApi = {
  submit: async ({ order_id, rating, comment, images = [] }) => {
    // Backend expects multipart/form-data because of upload middleware.
    const form = new FormData();
    form.append("order_id", order_id);
    form.append("rating", rating);
    form.append("comment", comment || "");

    images.forEach((file) => {
      form.append("images", file);
    });

    return apiClient.post("/reviews", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  listSellerReviews: async (sellerId, { page = 1, limit = 10 } = {}) => {
    const res = await apiClient.get(`/reviews/seller/${sellerId}`, {
      params: { page, limit },
    });
    return res?.data;
  },

  reply: async (reviewId, payload) =>
    apiClient.patch(`/reviews/${reviewId}/reply`, payload),
};
