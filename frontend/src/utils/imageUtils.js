import { API_BASE_URL } from "../config/api";

export const getImageUrl = (url) => {
  if (!url) return "";
  if (url.startsWith("blob:") || url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:")) {
    return url;
  }
  const backendHost = API_BASE_URL ? API_BASE_URL.replace(/\/api\/?$/, "") : "";
  const cleanPath = url.startsWith("/") ? url : `/${url}`;
  return `${backendHost}${cleanPath}`;
};

export const getProfilePicUrl = getImageUrl;
