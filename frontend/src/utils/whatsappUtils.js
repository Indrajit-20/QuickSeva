/**
 * Utility functions for generating sanitized, pre-filled WhatsApp deep links across the Contractor module.
 */

const sanitizePhone = (phone) => {
  if (!phone) return "";
  let cleaned = String(phone).replace(/\D/g, "");
  if (cleaned.length === 10) {
    cleaned = `91${cleaned}`;
  }
  return cleaned;
};

/**
 * WhatsApp link for a worker/agency contacting contractor about a post
 */
export const getWhatsAppWorkerToContractorLink = ({ phone, title, postType, city }) => {
  const cleanedPhone = sanitizePhone(phone);
  if (!cleanedPhone) return "#";

  const typeText = postType === "supply_workers" ? "Worker Availability" : "Labor Requirement";
  const message = `Hi! I saw your ${typeText} post "${title || "Site Work"}" in ${city || "QuickSeva"}.\nI am interested in connecting regarding worker availability and rates.`;
  return `https://wa.me/${cleanedPhone}?text=${encodeURIComponent(message)}`;
};

/**
 * WhatsApp link for contractor contacting an applicant
 */
export const getWhatsAppContractorToApplicantLink = ({ phone, applicantName, postTitle, workersCount }) => {
  const cleanedPhone = sanitizePhone(phone);
  if (!cleanedPhone) return "#";

  const message = `Hi ${applicantName || "there"}, I am contacting you regarding your application for "${postTitle || "Site Work"}" on QuickSeva (${workersCount || 1} workers requested).\nLet's discuss details and next steps!`;
  return `https://wa.me/${cleanedPhone}?text=${encodeURIComponent(message)}`;
};

/**
 * WhatsApp link for customer contacting contractor profile
 */
export const getWhatsAppCustomerToContractorLink = ({ phone, contractorName, city, trade }) => {
  const cleanedPhone = sanitizePhone(phone);
  if (!cleanedPhone) return "#";

  const message = `Hi ${contractorName || "Contractor"}, I found your ${trade || "construction"} profile on QuickSeva in ${city || "your city"}.\nI would like to inquire about your availability for a project quote.`;
  return `https://wa.me/${cleanedPhone}?text=${encodeURIComponent(message)}`;
};
