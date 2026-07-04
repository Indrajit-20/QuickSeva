const { pool } = require("../config/db");

const startAvailabilitySafetyCheck = () => {
  console.log("⏰ Starting availability safety check background service...");

  const checkAndCleanup = async () => {
    try {
      console.log("⏰ Running availability safety check: checking for stale active sellers (12+ hours)...");
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
