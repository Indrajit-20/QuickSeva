const Razorpay = require("razorpay");
const crypto = require("crypto");
const { pool } = require("../config/db");
const WalletModel = require("../models/walletModel");
const { successRes, errorRes } = require("../utils/helpers");

let razorpay = null;
if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
  try {
    razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  } catch (err) {
    console.error("Razorpay SDK initialization failed:", err.message);
  }
} else {
  console.warn("⚠️ Warning: RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET environment variable is missing. Razorpay payment functionality is disabled.");
}

// Create a Razorpay Order
exports.createOrder = async (req, res) => {
  try {
    if (!razorpay) {
      return errorRes(res, "Razorpay payment gateway is not configured on this server.", 503);
    }
    const { amount, purpose, planId } = req.body;
    if (!amount || parseFloat(amount) <= 0) {
      return errorRes(res, "Invalid amount", 400);
    }

    const options = {
      amount: Math.round(parseFloat(amount) * 100), // Razorpay expects amount in paise (1 INR = 100 paise)
      currency: "INR",
      receipt: `rcpt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      notes: {
        userId: req.user.id,
        purpose: purpose || "wallet_recharge", // "wallet_recharge" or "premium_package"
        planId: planId || "",
      },
    };

    const order = await razorpay.orders.create(options);
    return successRes(res, order, "Order created successfully");
  } catch (err) {
    console.error("Razorpay order creation error:", err);
    return errorRes(res, "Failed to create payment order");
  }
};

// Verify Payment Signature
exports.verifyPayment = async (req, res) => {
  if (!process.env.RAZORPAY_KEY_SECRET) {
    return errorRes(res, "Razorpay payment gateway is not configured on this server.", 503);
  }
  const conn = await pool.getConnection();
  try {
    const {
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
      purpose,
      planId,
      amount,
    } = req.body;

    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      return errorRes(res, "Missing payment details", 400);
    }

    // Verify signature using HMAC SHA256 with key_secret
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return errorRes(res, "Signature verification failed", 400);
    }

    await conn.beginTransaction();

    if (purpose === "wallet_recharge") {
      // 1. Credit wallet
      const balance = await WalletModel.credit(
        req.user.id,
        amount,
        "topup",
        razorpay_payment_id,
        "Credits purchased via Razorpay",
        conn
      );

      await conn.commit();
      return successRes(res, { balance }, "Wallet topped up successfully");
    } else if (purpose === "premium_package") {
      // 2. Premium package direct purchase:
      // We simulate a wallet credit-then-debit for logging purposes, but net wallet remains untouched.
      const planPrices = {
        basic: { price: 55, days: 7, name: "Basic" },
        standard: { price: 155, days: 15, name: "Standard" },
        pro: { price: 355, days: 30, name: "Pro" }
      };
      
      const plan = planPrices[planId];
      if (!plan) {
        await conn.rollback();
        return errorRes(res, "Invalid plan ID", 400);
      }

      // Check if price matches amount paid
      if (Math.round(plan.price) !== Math.round(amount)) {
        await conn.rollback();
        return errorRes(res, "Amount paid does not match plan price", 400);
      }

      // Get seller profile
      const [[seller]] = await conn.query(
        "SELECT * FROM sellers WHERE user_id = ? FOR UPDATE",
        [req.user.id]
      );
      
      if (!seller) {
        await conn.rollback();
        return errorRes(res, "Seller profile not found", 404);
      }

      // Calculate expiration date
      let purchaseType = "new";
      let expiresAt;
      let forfeitedDays = 0;
      const now = new Date();
      
      const currentExpiry = seller.premium_expires_at ? new Date(seller.premium_expires_at) : null;
      const isCurrentActive = currentExpiry && currentExpiry.getTime() > now.getTime();
      
      if (isCurrentActive && seller.plan) {
        const getPlanRank = (pid) => {
          if (pid === "basic") return 1;
          if (pid === "standard") return 2;
          if (pid === "pro") return 3;
          return 0;
        };
        
        const currentRank = getPlanRank(seller.plan);
        const selectedRank = getPlanRank(planId);
        
        if (selectedRank === currentRank) {
          purchaseType = "extend";
          expiresAt = new Date(currentExpiry.getTime() + plan.days * 24 * 60 * 60 * 1000);
        } else {
          if (selectedRank > currentRank) {
            purchaseType = "upgrade";
          } else {
            purchaseType = "downgrade";
          }
          forfeitedDays = Math.ceil((currentExpiry.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
          expiresAt = new Date(now.getTime() + plan.days * 24 * 60 * 60 * 1000);
        }
      } else {
        expiresAt = new Date(now.getTime() + plan.days * 24 * 60 * 60 * 1000);
      }

      // Fetch current wallet details
      const [[wallet]] = await conn.query(
        "SELECT id, balance FROM wallets WHERE user_id = ?",
        [req.user.id]
      );
      const currentBalance = wallet ? parseFloat(wallet.balance) : 0;

      // Update seller premium info
      await conn.query(
        `UPDATE sellers 
         SET is_premium = 1, plan = ?, premium_expires_at = ? 
         WHERE id = ?`,
        [planId, expiresAt, seller.id]
      );

      const descriptionObj = {
        planId: planId,
        expiresAt: expiresAt.toISOString(),
        purchaseType: purchaseType,
        price: plan.price,
        forfeitedDays: forfeitedDays
      };

      // Record a single debit transaction log for package purchase (without deducting wallet balance)
      const [txResult] = await conn.query(
        `INSERT INTO wallet_transactions (wallet_id, type, amount, balance_after, source, reference_id, description)
         VALUES (?, 'debit', ?, ?, 'package_purchase', ?, ?)`,
        [wallet.id, plan.price, currentBalance, planId, JSON.stringify(descriptionObj)]
      );

      await conn.commit();

      const [[transaction]] = await pool.query(
        "SELECT * FROM wallet_transactions WHERE id = ?",
        [txResult.insertId]
      );

      return successRes(res, {
        premium: {
          plan: planId,
          premium_expires_at: expiresAt.toISOString(),
          is_premium: 1
        },
        walletBalance: currentBalance,
        transaction: transaction
      }, "Plan purchased successfully");
    } else {
      await conn.rollback();
      return errorRes(res, "Invalid payment purpose", 400);
    }
  } catch (err) {
    await conn.rollback();
    console.error("Payment verification error:", err);
    return errorRes(res, "Payment verification and processing failed");
  } finally {
    conn.release();
  }
};
