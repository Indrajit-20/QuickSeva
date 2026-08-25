import axiosInstance from "./axiosConfig";

export const getContractorPosts = async (params = {}) => {
  const res = await axiosInstance.get("/contractor/posts", { params });
  return res.data;
};

export const getContractorPostById = async (id) => {
  const res = await axiosInstance.get(`/contractor/posts/${id}`);
  return res.data;
};

export const getContractorsDirectory = async (params = {}) => {
  const res = await axiosInstance.get("/contractor/directory", { params });
  return res.data;
};

export const getContractorPublicProfile = async (id) => {
  const res = await axiosInstance.get(`/contractor/public/${id}`);
  return res.data;
};

export const createQuoteRequest = async (data) => {
  const res = await axiosInstance.post("/contractor/quote-request", data);
  return res.data;
};

export const createApplication = async (data) => {
  const res = await axiosInstance.post("/contractor/applications", data);
  return res.data;
};

export const createContractorPost = async (data) => {
  const res = await axiosInstance.post("/contractor/posts", data);
  return res.data;
};

export const registerContractor = async (data) => {
  const res = await axiosInstance.post("/contractor/register", data);
  return res.data;
};

export const getMyPosts = async () => {
  const res = await axiosInstance.get("/contractor/my-posts");
  return res.data;
};

export const updatePostStatus = async (id, status) => {
  const res = await axiosInstance.patch(`/contractor/posts/${id}/status`, { status });
  return res.data;
};

export const updateContractorPost = async (id, data) => {
  const res = await axiosInstance.put(`/contractor/posts/${id}`, data);
  return res.data;
};

export const deleteContractorPost = async (id) => {
  const res = await axiosInstance.delete(`/contractor/posts/${id}`);
  return res.data;
};

export const getPostApplications = async (id) => {
  const res = await axiosInstance.get(`/contractor/posts/${id}/applications`);
  return res.data;
};

export const getMyQuoteRequests = async () => {
  const res = await axiosInstance.get("/contractor/my-quote-requests");
  return res.data;
};

export const uploadContractorWorkImages = async (formData) => {
  const res = await axiosInstance.post("/contractor/work-images", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

export const deleteContractorWorkImage = async (id) => {
  const res = await axiosInstance.delete(`/contractor/work-images/${id}`);
  return res.data;
};

export const getMyContractorWorkImages = async () => {
  const res = await axiosInstance.get("/contractor/my-work-images");
  return res.data;
};

export const updateQuoteStatus = async (id, status) => {
  const res = await axiosInstance.patch(`/contractor/my-quote-requests/${id}/status`, { status });
  return res.data;
};

export const updateApplicationStatus = async (id, status) => {
  const res = await axiosInstance.patch(`/contractor/applications/${id}/status`, { status });
  return res.data;
};

export const submitContractorVerification = async (formData) => {
  const res = await axiosInstance.post("/contractor/verify", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

export const getAdminContractorVerifications = async (params = {}) => {
  const res = await axiosInstance.get("/admin/contractor-verifications", { params });
  return res.data;
};

export const reviewAdminContractorVerification = async (id, action, notes = "") => {
  const res = await axiosInstance.patch(`/admin/contractor-verifications/${id}`, { action, notes });
  return res.data;
};

export const getAdminContractorPosts = async (params = {}) => {
  const res = await axiosInstance.get("/admin/contractor-posts", { params });
  return res.data;
};

export const updateAdminContractorPostStatus = async (id, action) => {
  const res = await axiosInstance.patch(`/admin/contractor-posts/${id}/status`, { action });
  return res.data;
};

export const getAdminQuoteRequests = async (params = {}) => {
  const res = await axiosInstance.get("/admin/quote-requests", { params });
  return res.data;
};

export const updateAdminQuoteRequestStatus = async (id, status) => {
  const res = await axiosInstance.patch(`/admin/quote-requests/${id}/status`, { status });
  return res.data;
};

export const getAdminContractorAnalytics = async () => {
  const res = await axiosInstance.get("/admin/contractor-analytics");
  return res.data;
};
