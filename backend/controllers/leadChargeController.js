const { successRes, errorRes } = require("../utils/helpers");
const { chargeSellerForLead } = require("../services/leadChargeService");
const LeadChargeModel = require("../models/leadChargeModel");

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

    return successRes(res, { charged }, "Lead charge processed");
  } catch (err) {
    if (String(err?.message || "").includes("Insufficient wallet balance")) {
      return errorRes(res, "This service provider is temporarily unable to receive new leads.", 400);
    }
    return errorRes(res, "Failed to charge lead");
  }
};

exports.checkLeadCharge = async (req, res) => {
  try {
    const { sellerId, serviceId } = req.query;

    if (!sellerId || !serviceId) {
      return errorRes(res, "sellerId and serviceId are required", 400);
    }

    const buyerId = req.user.id;

    const existing = await LeadChargeModel.existsFor({
      buyer_id: buyerId,
      seller_id: sellerId,
      service_id: serviceId,
    });

    return successRes(res, { exists: !!existing }, "Lead check processed");
  } catch (err) {
    console.error("checkLeadCharge error:", err);
    return errorRes(res, "Failed to check lead status");
  }
};
