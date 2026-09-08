const Razorpay = require("razorpay");
const crypto = require("crypto");
const { pool } = require("../config/db");
const WalletModel = require("../models/walletModel");
const { successRes, errorRes } = require("../utils/helpers");
const { emitToUser } = require("../utils/socketService");

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
      return errorRes(res, "Razorpay payment gateway is not configured on this server. Please contact support.", 503);
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
    console.error("Razorpay order creation error:", err?.message || err);

    // Classify the error for a useful user-facing message
    const errMsg = (err?.message || "").toLowerCase();
    const errCode = err?.code || err?.statusCode || "";

    // Network / DNS errors — server cannot reach Razorpay API
    if (
      errCode === "ENOTFOUND" ||
      errCode === "ECONNREFUSED" ||
      errCode === "ECONNRESET" ||
      errCode === "ETIMEDOUT" ||
      errCode === "EAI_AGAIN" ||
      errMsg.includes("getaddrinfo") ||
      errMsg.includes("network") ||
      errMsg.includes("timeout") ||
      errMsg.includes("socket hang up") ||
      errMsg.includes("econnrefused")
    ) {
      return errorRes(
        res,
        "Cannot reach Razorpay payment servers. This is a temporary network issue — please try again in a few seconds.",
        502
      );
    }

    // Razorpay authentication / key errors
    if (
      err?.statusCode === 401 ||
      errMsg.includes("unauthorized") ||
      errMsg.includes("authentication")
    ) {
      return errorRes(
        res,
        "Razorpay API key is invalid or expired. Please contact support.",
        502
      );
    }

    // Razorpay API returned a bad request (e.g. invalid params)
    if (err?.statusCode === 400) {
      return errorRes(
        res,
        err?.error?.description || "Invalid payment request. Please try again.",
        400
      );
    }

    // Generic fallback
    return errorRes(res, "Failed to create payment order. Please try again later.");
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

    // ── Step 1: Signature Verification ──────────────────────────────────────
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      console.warn(`[Payment] Signature mismatch for payment_id=${razorpay_payment_id} user_id=${req.user.id}`);
      return errorRes(res, "Signature verification failed", 400);
    }

    await conn.beginTransaction();

    // ── Step 2: Idempotency — reject duplicate payment_id ───────────────────
    const [existingTx] = await conn.query(
      "SELECT id FROM wallet_transactions WHERE reference_id = ? LIMIT 1 FOR UPDATE",
      [razorpay_payment_id]
    );

    if (existingTx.length > 0) {
      await conn.rollback();
      const wallet = await WalletModel.findByUserId(req.user.id);
      return successRes(res, { balance: wallet ? wallet.balance : 0 }, "Payment already processed");
    }

    // ── Step 3: Validate amount from Razorpay server ────────────────────────
    let verifiedAmount = parseFloat(amount);
    if (razorpay) {
      try {
        const rzpOrder = await razorpay.orders.fetch(razorpay_order_id);
        if (rzpOrder && rzpOrder.amount) {
          verifiedAmount = rzpOrder.amount / 100;
        }
      } catch (fetchErr) {
        // Non-fatal: use client-supplied amount as fallback
        console.warn(`[Payment] Razorpay order fetch failed, using client amount. payment_id=${razorpay_payment_id}:`, fetchErr.message);
      }
    }

    if (!verifiedAmount || verifiedAmount <= 0) {
      await conn.rollback();
      return errorRes(res, "Invalid payment amount", 400);
    }

    // ── Step 4: Process by purpose ──────────────────────────────────────────
    if (purpose === "wallet_recharge") {
      // Credit wallet — WalletModel.credit auto-creates wallet row if missing
      let balance;
      try {
        balance = await WalletModel.credit(
          req.user.id,
          verifiedAmount,
          "topup",
          razorpay_payment_id,
          "Credits purchased via Razorpay",
          conn
        );
      } catch (creditErr) {
        // CRITICAL: payment was captured but wallet credit failed
        // Log full details so support can manually credit
        console.error(
          `[Payment][CRITICAL] Wallet credit failed after successful payment capture.` +
          ` payment_id=${razorpay_payment_id} order_id=${razorpay_order_id}` +
          ` user_id=${req.user.id} amount=${verifiedAmount}`,
          creditErr
        );
        await conn.rollback();
        return errorRes(
          res,
          `Payment was received but could not be credited to your wallet. Please contact support with your Payment ID: ${razorpay_payment_id}`,
          500
        );
      }

      await conn.commit();
      emitToUser(req.user.id, "payment_updated", { balance, purpose: "wallet_recharge" });
      return successRes(res, { balance }, "Wallet topped up successfully");

    } else if (purpose === "premium_package") {
      const planPrices = {
        basic:    { price: 55,  days: 7,  name: "Basic" },
        standard: { price: 155, days: 15, name: "Standard" },
        pro:      { price: 355, days: 30, name: "Pro" }
      };

      const plan = planPrices[planId];
      if (!plan) {
        await conn.rollback();
        return errorRes(res, "Invalid plan ID", 400);
      }

      if (Math.round(plan.price) !== Math.round(verifiedAmount)) {
        await conn.rollback();
        console.warn(`[Payment] Amount mismatch: expected=${plan.price} got=${verifiedAmount} payment_id=${razorpay_payment_id}`);
        return errorRes(res, "Amount paid does not match plan price", 400);
      }

      const [[seller]] = await conn.query(
        "SELECT * FROM sellers WHERE user_id = ? FOR UPDATE",
        [req.user.id]
      );

      if (!seller) {
        await conn.rollback();
        console.error(`[Payment] Seller not found for user_id=${req.user.id} payment_id=${razorpay_payment_id}`);
        return errorRes(res, `Seller profile not found. Please contact support with Payment ID: ${razorpay_payment_id}`, 404);
      }

      let purchaseType = "new";
      let expiresAt;
      let forfeitedDays = 0;
      const now = new Date();

      const currentExpiry = seller.premium_expires_at ? new Date(seller.premium_expires_at) : null;
      const isCurrentActive = currentExpiry && currentExpiry.getTime() > now.getTime();

      if (isCurrentActive && seller.plan) {
        const getPlanRank = (pid) => ({ basic: 1, standard: 2, pro: 3 }[pid] || 0);
        const currentRank = getPlanRank(seller.plan);
        const selectedRank = getPlanRank(planId);

        if (selectedRank === currentRank) {
          purchaseType = "extend";
          expiresAt = new Date(currentExpiry.getTime() + plan.days * 86400000);
        } else {
          purchaseType = selectedRank > currentRank ? "upgrade" : "downgrade";
          forfeitedDays = Math.ceil((currentExpiry.getTime() - now.getTime()) / 86400000);
          expiresAt = new Date(now.getTime() + plan.days * 86400000);
        }
      } else {
        expiresAt = new Date(now.getTime() + plan.days * 86400000);
      }

      const [[wallet]] = await conn.query(
        "SELECT id, balance FROM wallets WHERE user_id = ?",
        [req.user.id]
      );
      const currentBalance = wallet ? parseFloat(wallet.balance) : 0;
      const walletId = wallet ? wallet.id : null;

      await conn.query(
        `UPDATE sellers SET is_premium = 1, plan = ?, premium_expires_at = ? WHERE id = ?`,
        [planId, expiresAt, seller.id]
      );

      const descriptionObj = {
        planId, expiresAt: expiresAt.toISOString(), purchaseType, price: plan.price, forfeitedDays
      };

      if (walletId) {
        await conn.query(
          `INSERT INTO wallet_transactions (wallet_id, type, amount, balance_after, source, reference_id, description)
           VALUES (?, 'debit', ?, ?, 'package_purchase', ?, ?)`,
          [walletId, plan.price, currentBalance, razorpay_payment_id, JSON.stringify(descriptionObj)]
        );
      }

      await conn.commit();

      return successRes(res, {
        premium: {
          plan: planId,
          premium_expires_at: expiresAt.toISOString(),
          is_premium: 1
        },
        walletBalance: currentBalance,
        transaction: {
          id: razorpay_payment_id,
          created_at: new Date().toISOString()
        }
      }, "Plan purchased successfully");

    } else {
      await conn.rollback();
      return errorRes(res, "Invalid payment purpose", 400);
    }

  } catch (err) {
    await conn.rollback();
    // Log full context so support can recover if money was deducted
    const { razorpay_payment_id, razorpay_order_id } = req.body || {};
    console.error(
      `[Payment][ERROR] verifyPayment crash.` +
      ` payment_id=${razorpay_payment_id || 'unknown'} order_id=${razorpay_order_id || 'unknown'}` +
      ` user_id=${req.user?.id || 'unknown'}`,
      err
    );
    return errorRes(
      res,
      razorpay_payment_id
        ? `Payment verification failed. If money was deducted, contact support with Payment ID: ${razorpay_payment_id}`
        : "Payment verification failed. Please contact support if amount was deducted.",
      500
    );
  } finally {
    conn.release();
  }
};
