const { pool } = require("../config/db");
const WalletModel = require("../models/walletModel");
const LeadChargeModel = require("../models/leadChargeModel");
const SellerModel = require("../models/sellerModel");

// Reusable service to charge seller ₹1 once per buyer->seller->service.
async function chargeSellerForLead(sellerId, buyerId, serviceId, source) {
  const amount = 1;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 1) Fetch seller profile and lock it to get user_id
    const [sellers] = await conn.query(
      "SELECT user_id FROM sellers WHERE id = ? FOR UPDATE",
      [sellerId]
    );
    if (sellers.length === 0) {
      throw new Error("Seller not found");
    }
    const sellerUserId = sellers[0].user_id;

    // 2) Prevent duplicate charge by checking existing lead record with lock
    const [existingRows] = await conn.query(
      "SELECT id FROM lead_charges WHERE buyer_id = ? AND seller_id = ? AND service_id = ? LIMIT 1 FOR UPDATE",
      [buyerId, sellerId, serviceId]
    );

    if (existingRows.length > 0) {
      await conn.commit();
      return { charged: false };
    }

    const UserModel = require("../models/userModel");
    const Service = require("../models/Service");

    const buyer = await UserModel.findById(buyerId);
    const serviceDetail = await Service.findById(serviceId);
    const buyerName = buyer ? buyer.name : "Unknown Customer";
    const serviceName = serviceDetail ? serviceDetail.title : "Service";

    // 3) Deduct ₹1 only once from the seller's wallet inside transaction.
    // If wallet is insufficient, propagate error.
    await WalletModel.debit(
      sellerUserId,
      amount,
      "lead_charge",
      null,
      `Contact viewed by ${buyerName} - ${serviceName}`,
      conn
    );

    // 4) Insert lead record.
    await conn.query(
      `INSERT INTO lead_charges (buyer_id, seller_id, service_id, lead_source, amount)
       VALUES (?, ?, ?, ?, ?)`,
      [buyerId, sellerId, serviceId, source, amount.toFixed(2)]
    );

    await conn.commit();
    return { charged: true };
  } catch (err) {
    await conn.rollback();
    if (String(err?.code || "").includes("ER_DUP_ENTRY") || String(err?.message || "").includes("Duplicate entry")) {
      return { charged: false };
    }
    throw err;
  } finally {
    conn.release();
  }
}

module.exports = { chargeSellerForLead };
