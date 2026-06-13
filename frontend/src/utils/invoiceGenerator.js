import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Safely attach autoTable in browser runtime
if (typeof window !== "undefined") {
  try {
    jsPDF.API = jsPDF.API || jsPDF.prototype;
    jsPDF.prototype.autoTable = autoTable(jsPDF);
  } catch (e) {
    // keep silent; generateInvoicePDF will fail gracefully
    console.error("autoTable init failed", e);
  }
}

function safeString(v) {
  return v === null || v === undefined ? "" : String(v);
}

function formatINR(amount) {
  const num = Number(amount || 0);
  return `₹${num.toLocaleString("en-IN")}`;
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

  // Header
  doc.setFontSize(22);
  doc.setTextColor(99, 102, 241);
  doc.text("QuickSeva", 14, 20);

  doc.setFontSize(10);
  doc.setTextColor(120, 120, 140);
  doc.text("quickseva.com | Your Trusted Service Platform", 14, 27);

  doc.setFontSize(18);
  doc.setTextColor(30, 30, 50);
  doc.text("INVOICE", 160, 20);

  // Divider
  doc.setDrawColor(200, 200, 220);
  doc.line(14, 32, 196, 32);

  // Invoice Meta
  doc.setFontSize(10);
  doc.setTextColor(60, 60, 80);
  const orderId = safeString(order.order_id || order.orderId || order.id);
  doc.text(`Invoice No: ${orderId}`, 14, 42);
  doc.text(`Order ID: ${orderId}`, 14, 49);
  doc.text(`Date: ${formatDate(order.date)}`, 14, 56);
  const statusLabel = safeString(order.status || "").toUpperCase();
  if (statusLabel) doc.text(`Status: ${statusLabel}`, 14, 63);

  const customerName = safeString(order.customer_name || "");
  const customerPhone = safeString(order.customer_phone || "");
  const serviceName = safeString(order.service_name || "");
  const sellerBusiness = safeString(order.seller_business || "");
  const total =
    order.total_amount !== undefined ? order.total_amount : order.amount;

  // Billed To
  doc.setFontSize(11);
  doc.setTextColor(99, 102, 241);
  doc.text("BILLED TO", 14, 72);
  doc.setTextColor(30, 30, 50);
  doc.setFontSize(10);
  doc.text(customerName || "—", 14, 79);
  doc.text(`📞 ${customerPhone || "—"}`, 14, 86);

  // Service Table
  const startY = 98;
  doc.autoTable({
    startY,
    head: [["Service", "Qty", "Unit Price", "Total"]],
    body: [[serviceName || "—", "1", formatINR(total), formatINR(total)]],
    headStyles: {
      fillColor: [99, 102, 241],
      textColor: 255,
      fontStyle: "bold",
    },
    styles: { fontSize: 10 },
    columnStyles: {
      0: { cellWidth: 80 },
      1: { cellWidth: 20, halign: "center" },
      2: { cellWidth: 35, halign: "right" },
      3: { cellWidth: 35, halign: "right" },
    },
    theme: "striped",
  });

  const finalY = doc.lastAutoTable.finalY + 10;

  // Totals + Payment
  doc.setFontSize(12);
  doc.setTextColor(30, 30, 50);
  doc.text(`TOTAL: ${formatINR(total)}`, 140, finalY, { align: "left" });
  const payment = safeString(order.payment_method || "");
  if (payment) {
    doc.setFontSize(10);
    doc.setTextColor(60, 60, 80);
    doc.text(`Payment Method: ${payment}`, 14, finalY + 18);
  }

  // Footer
  doc.setFontSize(9);
  doc.setTextColor(120, 120, 140);
  doc.text(`Provided by: ${sellerBusiness || "QuickSeva"}`, 14, finalY + 26);
  doc.text("Thank you for your business!", 14, finalY + 33);

  doc.save(`Invoice_${orderId}.pdf`);
}

export function openWhatsAppInvoice(order) {
  if (!order) return;

  const phoneRaw = safeString(order.customer_phone || "");
  if (!phoneRaw) return;

  const phoneDigits = phoneRaw.replace(/\D/g, "");
  const indiaPhone = phoneDigits.startsWith("91")
    ? phoneDigits
    : phoneDigits.length > 0
      ? `91${phoneDigits}`
      : "";

  if (!indiaPhone) return;

  const customerName = safeString(order.customer_name || "");
  const orderId = safeString(order.order_id || order.orderId || order.id);
  const serviceName = safeString(order.service_name || "");
  const total =
    order.total_amount !== undefined ? order.total_amount : order.amount;
  const payment = safeString(order.payment_method || "");
  const sellerBusiness = safeString(order.seller_business || "QuickSeva");

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
