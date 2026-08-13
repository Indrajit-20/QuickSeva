import apiClient from "./axiosConfig";

const unwrapSuccessData = (responseData) => {
  const { data, ...rest } = responseData || {};
  return { ...rest, data };
};

// Fetch policy content by its key (public)
// GET /api/policies/:key
export const getPolicy = async (key) => {
  
  const response = await apiClient.get(`/policies/${key}`);
  return unwrapSuccessData(response.data);
};

// Update policy content (admin only)
// PUT /api/policies/:key
// Payload: { title, content }
export const updatePolicy = async (key, { title, content }) => {
  const response = await apiClient.put(`/policies/${key}`, { title, content });
  return unwrapSuccessData(response.data);
};

// Fetch platform configuration (fee percentage and model)
// GET /api/policies/settings
export const getSystemSettings = async () => {
  const response = await apiClient.get("/policies/settings");
  return unwrapSuccessData(response.data);
};

