const { pool } = require("../config/db");

const startAvailabilitySafetyCheck = () => {
  console.log("⏰ Starting availability safety check background service...");

  const checkAndCleanup = async () => {
    try {
      console.log("⏰ Running availability safety check: checking for stale active sellers (12+ hours)...");
      // Bypassed automatic seller deactivation for testing/fake payment flow
      /*
      const [result] = await pool.query(`
        UPDATE sellers
        SET is_available = 0
        WHERE is_available = 1
          AND availability_last_updated_at < NOW() - INTERVAL 12 HOUR
      `);
      if (result.affectedRows > 0) {
        console.log(`⏰ Safety check complete: Automatically deactivated ${result.affectedRows} stale active seller(s).`);
      } else {
        console.log("⏰ Safety check complete: No stale active sellers found.");
      }
      */
      console.log("⏰ Safety check: Bypassed automatic deactivation.");

      // === 1. Auto-expiry of Pending bookings ===
      console.log("⏰ Running safety check: Checking for expired pending bookings...");
      const [pendingOrders] = await pool.query(
        `SELECT id, order_number, buyer_id, visiting_charge_amount, visiting_platform_fee, payment_method, visiting_payment_status 
         FROM orders 
         WHERE status = 'pending' AND scheduled_at < NOW()`
      );

      for (const order of pendingOrders) {
        console.log(`⏰ Safety check: Auto-cancelling pending order #${order.order_number} (overdue slot)`);
        
        await pool.query(
          "UPDATE orders SET status = 'cancelled', cancel_reason = ? WHERE id = ?",
          ["Expired: Slot passed without provider acceptance", order.id]
        );

        let expiredMsg = `Your booking #${order.order_number} has expired because it was not accepted by the provider in time.`;

        if (order.payment_method === "online" && order.visiting_payment_status === "paid") {
          const [feeRows] = await pool.query("SELECT `value` FROM system_settings WHERE `key` = 'platform_fee_model'");
          const feeModel = feeRows[0]?.value || "seller";

          const visiting_charge = parseFloat(order.visiting_charge_amount || 0);
          const visiting_fee = parseFloat(order.visiting_platform_fee || 0);
          const refundAmount = visiting_charge + (feeModel === "buyer" ? visiting_fee : 0);

          if (refundAmount > 0) {
            await pool.query("UPDATE orders SET visiting_payment_status = 'refunded' WHERE id = ?", [order.id]);
            expiredMsg += ` A refund of ₹${refundAmount.toFixed(2)} has been initiated directly to your bank account/UPI.`;
          }
        }

        await pool.query(
          `INSERT INTO notifications (user_id, title, message, type, ref_id) VALUES (?, ?, ?, 'order', ?)`,
          [
            order.buyer_id,
            "Order Expired",
            expiredMsg,
            order.id
          ]
        );
      }

      // === 2. Auto-completion of Accepted/In-progress/Quoted bookings after 48 hours ===
      console.log("⏰ Running safety check: Checking for overdue confirmed bookings (48h grace)...");
      const [overdueOrders] = await pool.query(
        `SELECT o.id, o.order_number, o.buyer_id, o.seller_id, o.payment_method, 
                o.visiting_charge_amount, o.visiting_platform_fee, o.visiting_payment_status,
                o.service_charge_amount, o.parts_cost_amount, o.discount_amount, 
                o.final_platform_fee, o.final_payment_status,
                s.user_id as seller_user_id
         FROM orders o
         JOIN sellers s ON o.seller_id = s.id
         WHERE o.status IN ('accepted', 'in_progress', 'quoted') 
           AND o.scheduled_at < NOW() - INTERVAL 48 HOUR`
      );

      for (const order of overdueOrders) {
        console.log(`⏰ Safety check: Auto-completing accepted order #${order.order_number} (overdue by 48+ hours)`);

        await pool.query(
          "UPDATE orders SET status = 'completed', completed_at = NOW() WHERE id = ?",
          [order.id]
        );

        // Auto-payout is handled directly/offline now, no wallet credit logic

        await pool.query(
          `UPDATE sellers SET total_orders = total_orders + 1 WHERE id = ?`,
          [order.seller_id]
        );

        await pool.query(
          `INSERT INTO notifications (user_id, title, message, type, ref_id) VALUES (?, ?, ?, 'order', ?)`,
          [
            order.buyer_id,
            "Order Auto-Completed",
            `Your booking #${order.order_number} was auto-completed because the slot passed and no dispute was raised.`,
            order.id
          ]
        );

        await pool.query(
          `INSERT INTO notifications (user_id, title, message, type, ref_id) VALUES (?, ?, ?, 'order', ?)`,
          [
            order.seller_user_id,
            "Order Auto-Completed",
            `Booking #${order.order_number} has been auto-completed and earnings have been credited to your wallet.`,
            order.id
          ]
        );
      }

    } catch (error) {
      console.error("❌ Error running availability safety check:", error);
    }
  };

  // Run once immediately on startup
  checkAndCleanup();

  // Run every 1 hour
  setInterval(checkAndCleanup, 60 * 60 * 1000);
};

module.exports = { startAvailabilitySafetyCheck };
