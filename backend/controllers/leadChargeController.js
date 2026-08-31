const { successRes, errorRes } = require("../utils/helpers");
const { chargeSellerForLead } = require("../services/leadChargeService");
const LeadChargeModel = require("../models/leadChargeModel");
const { pool } = require("../config/db");

exports.chargeLead = async (req, res) => {
  try {
    const { sellerId, serviceId, source } = req.body;

    if (!sellerId || !serviceId || !source) {
      return errorRes(res, "sellerId, serviceId, and source are required", 400);
    }

    const buyerId = req.user.id;

    const { charged } = await chargeSellerForLead(
      sellerId,
      buyerId,
      serviceId,
      source,
    );

    const [sellerRows] = await pool.query(
      "SELECT COALESCE(NULLIF(s.phone, ''), u.phone) AS phone FROM sellers s JOIN users u ON s.user_id = u.id WHERE s.id = ?",
      [sellerId]
    );
    const phone = sellerRows.length > 0 ? sellerRows[0].phone : null;

    return successRes(res, { charged, phone }, "Lead charge processed");
  } catch (err) {
    if (String(err?.message || "").includes("Insufficient wallet balance")) {
      return errorRes(res, "This service provider is temporarily unable to receive new leads.", 400);
    }
    return errorRes(res, "Failed to charge lead");
  }
};

exports.checkLeadCharge = async (req, res) => {
  try {
    const { sellerId } = req.query;

    if (!sellerId) {
      return errorRes(res, "sellerId is required", 400);
    }

    const buyerId = req.user.id;

    const existing = await LeadChargeModel.existsFor({
      buyer_id: buyerId,
      seller_id: sellerId,
    });

    let phone = null;
    if (existing) {
      const [sellerRows] = await pool.query(
        "SELECT COALESCE(NULLIF(s.phone, ''), u.phone) AS phone FROM sellers s JOIN users u ON s.user_id = u.id WHERE s.id = ?",
        [sellerId]
      );
      if (sellerRows.length > 0) {
        phone = sellerRows[0].phone;
      }
    }

    return successRes(res, { exists: !!existing, phone }, "Lead check processed");
  } catch (err) {
    console.error("checkLeadCharge error:", err);
    return errorRes(res, "Failed to check lead status");
  }
};
