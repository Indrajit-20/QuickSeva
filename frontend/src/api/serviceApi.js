import apiClient from "./axiosConfig";
import { serviceService } from "../services/serviceService";

export const serviceApi = {
  // Seller-only
  create: serviceService.createService,
  listMyServices: serviceService.getMyServices,
  update: serviceService.updateService,
  delete: serviceService.deleteService,

  // Public
  getById: async (serviceId) => apiClient.get(`/services/${serviceId}`),
  listBySeller: async (sellerId) =>
    apiClient.get(`/services/seller/${sellerId}`),
  search: async (params) => apiClient.get("/services/search", { params }),
};

