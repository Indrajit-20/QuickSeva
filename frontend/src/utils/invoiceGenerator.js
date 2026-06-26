import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

function safeString(v) {
  return v === null || v === undefined ? "" : String(v);
}

function formatINR(amount) {
  const num = Number(amount || 0);
  return `Rs. ${num.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(dateLike) {
  if (!dateLike) return "";
  const d = new Date(dateLike);
  if (Number.isNaN(d.getTime())) return safeString(dateLike);
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function generateInvoicePDF(order) {
  if (!order) return;

  const doc = new jsPDF();

  const customerName = safeString(order.customer_name || order.buyer_name || "Customer");
  const customerPhone = safeString(order.customer_phone || order.buyer_phone || "—");
  const serviceName = safeString(order.service_name || order.service_title || "Service");
  const sellerBusiness = safeString(order.seller_business || order.business_name || "QuickSeva Partner");
  const total = order.total_amount !== undefined ? order.total_amount : order.amount;
  const orderId = safeString(order.order_id || order.orderId || order.id);
  const statusLabel = safeString(order.status || "").toUpperCase();
  const payment = safeString(order.payment_method || "");

  // 1. Accent Top Header Bar
  doc.setFillColor(79, 70, 229); // Premium Indigo
  doc.rect(0, 0, 210, 8, "F");

  // 2. Main Title & Company Brand
  doc.setFont("helvetica", "bold");
  doc.setFontSize(24);
  doc.setTextColor(79, 70, 229);
  doc.text("QuickSeva", 14, 25);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(107, 114, 128);
  doc.text("Your Trusted Doorstep Service Platform", 14, 30);

  // 3. Invoice Header Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(31, 41, 55); // Dark Charcoal
  doc.text("INVOICE", 196, 25, { align: "right" });

  // Divider Line
  doc.setDrawColor(229, 231, 235);
  doc.setLineWidth(0.5);
  doc.line(14, 36, 196, 36);

  // 4. Metadata Details Grid (Billed To vs Invoice Details)
  // Left Column - Billed To
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(79, 70, 229);
  doc.text("BILLED TO", 14, 46);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(31, 41, 55);
  doc.text(customerName, 14, 53);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(75, 85, 99);
  doc.text(`Phone: ${customerPhone}`, 14, 59);

  if (order.address) {
    const splitAddress = doc.splitTextToSize(`Address: ${order.address}`, 90);
    doc.text(splitAddress, 14, 65);
  }

  // Right Column - Invoice Details
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(79, 70, 229);
  doc.text("INVOICE DETAILS", 120, 46);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(75, 85, 99);
  doc.text(`Invoice No:     ${orderId}`, 120, 53);
  doc.text(`Order ID:       ${orderId}`, 120, 59);
  doc.text(`Date:            ${formatDate(order.date || order.scheduled_at || order.created_at)}`, 120, 65);
  if (statusLabel) {
    doc.text(`Status:          ${statusLabel}`, 120, 71);
  }

  // 5. Line Items Table
  const startY = 85;
  autoTable(doc, {
    startY,
    head: [["Service Description", "Qty", "Unit Price", "Total Price"]],
    body: [[serviceName, "1", formatINR(total), formatINR(total)]],
    headStyles: {
      fillColor: [79, 70, 229],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 9.5,
    },
    styles: {
      fontSize: 9,
      textColor: [55, 65, 81],
    },
    columnStyles: {
      0: { cellWidth: 100 },
      1: { cellWidth: 20, halign: "center" },
      2: { cellWidth: 31, halign: "right" },
      3: { cellWidth: 31, halign: "right" },
    },
    theme: "striped",
    margin: { left: 14, right: 14 },
  });

  const finalY = doc.lastAutoTable.finalY + 12;

  // 6. Totals Box block
  doc.setFillColor(249, 250, 251); // Light warm gray background
  doc.setDrawColor(229, 231, 235);
  doc.rect(120, finalY - 4, 76, 16, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(79, 70, 229);
  doc.text("GRAND TOTAL:", 124, finalY + 6);
  doc.setTextColor(31, 41, 55);
  doc.text(formatINR(total), 192, finalY + 6, { align: "right" });

  // 7. Payment Information Block
  if (payment) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(79, 70, 229);
    doc.text("PAYMENT INFORMATION", 14, finalY + 4);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(75, 85, 99);
    doc.text(`Payment Method: ${payment.toUpperCase()}`, 14, finalY + 10);
  }

  // 8. Footer Line and Text
  doc.setDrawColor(243, 244, 246);
  doc.line(14, finalY + 28, 196, finalY + 28);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(75, 85, 99);
  doc.text(`Fulfillment Partner: ${sellerBusiness}`, 14, finalY + 35);

  doc.setFont("helvetica", "italic");
  doc.setFontSize(8.5);
  doc.setTextColor(156, 163, 175);
  doc.text("Thank you for using QuickSeva! For any billing queries, email support@quickseva.com.", 14, finalY + 41);

  doc.save(`Invoice_${orderId}.pdf`);
}

export function openWhatsAppInvoice(order) {
  if (!order) return;

  const phoneRaw = safeString(order.customer_phone || order.buyer_phone || "");
  if (!phoneRaw) return;

  const phoneDigits = phoneRaw.replace(/\D/g, "");
  const indiaPhone = phoneDigits.startsWith("91")
    ? phoneDigits
    : phoneDigits.length > 0
      ? `91${phoneDigits}`
      : "";

  if (!indiaPhone) return;

  const customerName = safeString(order.customer_name || order.buyer_name || "Customer");
  const orderId = safeString(order.order_id || order.orderId || order.id);
  const serviceName = safeString(order.service_name || order.service_title || "Service");
  const total = order.total_amount !== undefined ? order.total_amount : order.amount;
  const payment = safeString(order.payment_method || "");
  const sellerBusiness = safeString(order.seller_business || order.business_name || "QuickSeva Partner");

  const message = encodeURIComponent(
    `Hello ${customerName},\n\n` +
      `Invoice Details\n\n` +
      `Order ID: ${orderId}\n` +
      `Service: ${serviceName}\n` +
      `Amount: ${formatINR(total)}\n` +
      `Payment: ${payment}\n\n` +
      `Thank you for choosing ${sellerBusiness}.`,
  );

  window.open(`https://wa.me/${indiaPhone}?text=${message}`, "_blank");
}
