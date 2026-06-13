const { successRes, errorRes } = require("../utils/helpers");
const { chargeSellerForLead } = require("../services/leadChargeService");

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
      return errorRes(res, "Insufficient wallet balance", 400);
    }
    return errorRes(res, "Failed to charge lead");
  }
};
