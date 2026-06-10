const { pool } = require("../config/db");
const { successRes, errorRes, paginate } = require("../utils/helpers");

// Get user's notifications
exports.getNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const { limit: lim, offset } = paginate(page, limit);

    const [rows] = await pool.query(
      `SELECT * FROM notifications WHERE user_id = ?
       ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [req.user.id, lim, offset]
    );

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) as total FROM notifications WHERE user_id = ?`,
      [req.user.id]
    );

    const [[{ unread }]] = await pool.query(
      `SELECT COUNT(*) as unread FROM notifications WHERE user_id = ? AND is_read = 0`,
      [req.user.id]
    );

    return successRes(res, { notifications: rows, total, unread, page: parseInt(page) });
  } catch (err) {
    return errorRes(res, "Failed to fetch notifications");
  }
};

// Mark a notification as read
exports.markAsRead = async (req, res) => {
  try {
    await pool.query(
      `UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?`,
      [req.params.id, req.user.id]
    );
    return successRes(res, null, "Marked as read");
  } catch (err) {
    return errorRes(res, "Failed to mark notification");
  }
};

// Mark all as read
exports.markAllAsRead = async (req, res) => {
  try {
    await pool.query(
      `UPDATE notifications SET is_read = 1 WHERE user_id = ?`,
      [req.user.id]
    );
    return successRes(res, null, "All notifications marked as read");
  } catch (err) {
    return errorRes(res, "Failed to mark notifications");
  }
};

// Delete a notification
exports.deleteNotification = async (req, res) => {
  try {
    await pool.query(
      `DELETE FROM notifications WHERE id = ? AND user_id = ?`,
      [req.params.id, req.user.id]
    );
    return successRes(res, null, "Notification deleted");
  } catch (err) {
    return errorRes(res, "Failed to delete notification");
  }
};
