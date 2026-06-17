import apiClient from "../api/axiosConfig";

export const serviceService = {
  createService: async (payload) => {
    const res = await apiClient.post("/services", payload);
    return res;
  },

  getMyServices: async () => {
    const res = await apiClient.get("/services/my-services");
    return res;
  },

  updateService: async (id, payload) => {
    const res = await apiClient.put(`/services/${id}`, payload);
    return res;
  },

  deleteService: async (id) => {
    const res = await apiClient.delete(`/services/${id}`);
    return res;
  }
};

export default serviceService;
