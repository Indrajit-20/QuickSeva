import { jsPDF } from "jspdf";

const STORAGE_KEYS = {
  invoices: "sellerInvoices",
};

function safeParseArray(raw) {
  try {
    const parsed = JSON.parse(raw || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function getAllInvoices() {
  const raw = localStorage.getItem(STORAGE_KEYS.invoices);
  return safeParseArray(raw);
}

function saveInvoices(invoices) {
  localStorage.setItem(STORAGE_KEYS.invoices, JSON.stringify(invoices));
}

function formatINR(n) {
  const num = Number(n || 0);
  return num.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatCurrency(n) {
  return `Rs. ${formatINR(n)}`;
}

function formatDate(date) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function generateInvoice(sellerData, planData) {
  const now = new Date();
  const purchasedAtDate = sellerData?.purchasedAt
    ? new Date(sellerData.purchasedAt)
    : now;
  const expiresAtDate = planData?.expiresAt
    ? new Date(planData.expiresAt)
    : new Date(purchasedAtDate.getTime() + (planData?.days || 0) * 86400000);

  const invoiceId = `INV-${Date.now()}`;
  const pricePaid = Number(planData?.price || 0);
  const gstRate = 0.18;
  const gst18 = Math.round(pricePaid * gstRate * 100) / 100;
  const grandTotal = Math.round((pricePaid + gst18) * 100) / 100;

  const invoice = {
    id: invoiceId,
    receiptId: `QS-${Date.now()}`,
    seller: {
      name: sellerData?.name || "",
      phone: sellerData?.phone || "",
    },
    plan: {
      name: planData?.name || "",
      price: pricePaid,
      days: planData?.days || 0,
      planId: planData?.id || "",
      expiresAt: expiresAtDate.toISOString(),
    },
    pricing: {
      subtotal: pricePaid,
      gstRate: 18,
      gstAmount: gst18,
      grandTotal,
    },
    meta: {
      date: purchasedAtDate.toISOString(),
      purchasedAt: purchasedAtDate.toISOString(),
      validFrom: purchasedAtDate.toISOString(),
      validUntil: expiresAtDate.toISOString(),
    },
    payment: {
      method: "UPI (Fake)",
      status: "PAID",
    },
    createdAt: now.toISOString(),
    rawPlanDays: planData?.days || 0,
  };

  const existing = getAllInvoices();
  saveInvoices([invoice, ...existing]);
  return invoice;
}

export function downloadInvoice(invoiceId) {
  const invoices = getAllInvoices();
  const invoice = invoices.find(
    (i) => i.id === invoiceId || i.receiptId === invoiceId,
  );
  if (!invoice) return;

  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const marginX = 40;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let y = 50;

  const invoiceDate = new Date(invoice.meta.purchasedAt || invoice.meta.date);
  const validFromDate = new Date(
    invoice.meta.validFrom || invoice.meta.purchasedAt || invoice.meta.date,
  );
  const validUntilDate = new Date(
    invoice.meta.validUntil || invoice.plan.expiresAt,
  );

  doc.setFillColor(15, 23, 42);
  doc.roundedRect(marginX, y - 20, pageWidth - marginX * 2, 90, 10, 10, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("QuickSeva", marginX + 16, y + 4);

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text("Premium Seller Invoice", marginX + 16, y + 24);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("Invoice", pageWidth - marginX - 16, y + 24, { align: "right" });

  y += 90;
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");

  doc.text(`Invoice #: ${invoice.id}`, marginX, y);
  doc.text(`Date: ${formatDate(invoiceDate)}`, pageWidth - marginX, y, {
    align: "right",
  });

  y += 18;
  doc.setDrawColor(200);
  doc.line(marginX, y, pageWidth - marginX, y);

  y += 18;
  const leftBlockX = marginX;
  const rightBlockX = pageWidth / 2 + 10;

  doc.setFont("helvetica", "bold");
  doc.text("Seller Details", leftBlockX, y);
  doc.setFont("helvetica", "normal");
  doc.text(`Name: ${invoice.seller.name}`, leftBlockX, y + 16);
  doc.text(`Phone: ${invoice.seller.phone}`, leftBlockX, y + 32);

  doc.setFont("helvetica", "bold");
  doc.text("Payment Status", rightBlockX, y);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(0, 128, 0);
  doc.text(invoice.payment.status, rightBlockX, y + 16);

  doc.setTextColor(0, 0, 0);
  y += 50;
  doc.line(marginX, y, pageWidth - marginX, y);

  y += 20;
  doc.setFont("helvetica", "bold");
  doc.text("Package Details", marginX, y);
  doc.setFont("helvetica", "normal");
  y += 18;

  const packageRows = [
    ["Package", `${invoice.plan.name} Plan`],
    ["Amount Paid", formatCurrency(invoice.pricing.subtotal)],
    ["Duration", `${invoice.plan.days} days`],
    ["Valid From", formatDate(validFromDate)],
    ["Valid Until", formatDate(validUntilDate)],
    ["Payment Method", invoice.payment.method],
  ];

  packageRows.forEach(([label, value]) => {
    doc.setFont("helvetica", "bold");
    doc.text(`${label}:`, marginX, y);
    doc.setFont("helvetica", "normal");
    doc.text(value, rightBlockX, y);
    y += 16;
  });

  y += 8;
  doc.setDrawColor(200);
  doc.line(marginX, y, pageWidth - marginX, y);

  y += 22;
  doc.setFont("helvetica", "bold");
  doc.text("Amount Summary", marginX, y);
  y += 18;
  doc.setFont("helvetica", "normal");
  doc.text(`Subtotal: ${formatCurrency(invoice.pricing.subtotal)}`, marginX, y);
  y += 16;
  doc.text(
    `GST (${invoice.pricing.gstRate}%): ${formatCurrency(invoice.pricing.gstAmount)}`,
    marginX,
    y,
  );
  y += 16;
  doc.setFont("helvetica", "bold");
  doc.text(`Total Paid: ${formatCurrency(invoice.pricing.grandTotal)}`, marginX, y);

  const footerY = pageHeight - 40;
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100);
  doc.text(`Receipt ID: ${invoice.receiptId}`, marginX, footerY);
  doc.text("Generated by QuickSeva", pageWidth - marginX, footerY, {
    align: "right",
  });

  doc.save(`${invoice.id}.pdf`);
}
