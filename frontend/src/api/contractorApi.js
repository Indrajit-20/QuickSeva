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
