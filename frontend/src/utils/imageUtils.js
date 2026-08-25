import { API_BASE_URL } from "../config/api";

export const getProfilePicUrl = (url) => {
  if (!url) return null;
  if (url.startsWith("blob:") || url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  const backendHost = API_BASE_URL.replace(/\/api\/?$/, "");
  const cleanPath = url.startsWith("/") ? url : `/${url}`;
  return `${backendHost}${cleanPath}`;
};
