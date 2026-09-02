const { pool } = require("../config/db");
const { successRes, errorRes } = require("../utils/helpers");
const metaProviderService = require("../services/metaProviderService");

// Helper to get seller_id from logged-in user_id (creates one if user is a contractor/seller without a record)
async function getSellerIdFromUser(userId) {
  const [rows] = await pool.query("SELECT id FROM sellers WHERE user_id = ?", [userId]);
  if (rows.length) return rows[0].id;

  const [userRows] = await pool.query("SELECT name, company_name, phone FROM users WHERE id = ?", [userId]);
  if (userRows.length) {
    const bizName = userRows[0].company_name || userRows[0].name || "Contractor Business";
    const [res] = await pool.query(
      "INSERT INTO sellers (user_id, business_name, phone, is_verified) VALUES (?, ?, ?, 1)",
      [userId, bizName, userRows[0].phone || null]
    );
    return res.insertId;
  }
  return null;
}

// 1. Get Summary Stats
exports.getStats = async (req, res) => {
  try {
    const sellerId = await getSellerIdFromUser(req.user.id);
    if (!sellerId) return errorRes(res, "Seller profile not found", 404);

    // Auto seed demo leads if empty
    await metaProviderService.seedDemoSocialLeads(sellerId);

    const [statusCounts] = await pool.query(
      `SELECT status, COUNT(*) AS count 
       FROM social_conversations 
       WHERE seller_id = ? 
       GROUP BY status`,
      [sellerId]
    );

    const [platformCounts] = await pool.query(
      `SELECT platform, COUNT(*) AS count 
       FROM social_conversations 
       WHERE seller_id = ? 
       GROUP BY platform`,
      [sellerId]
    );

    const [unreadResult] = await pool.query(
      `SELECT SUM(unread_count) AS total_unread 
       FROM social_conversations 
       WHERE seller_id = ?`,
      [sellerId]
    );

    const stats = {
      total: 0,
      new: 0,
      contacted: 0,
      interested: 0,
      quoted: 0,
      converted: 0,
      lost: 0,
      unread: unreadResult[0]?.total_unread || 0,
      platforms: {
        quickseva: 0,
        instagram: 0,
        facebook: 0,
        whatsapp: 0,
      }
    };

    statusCounts.forEach(r => {
      stats[r.status] = Number(r.count);
      stats.total += Number(r.count);
    });

    platformCounts.forEach(r => {
      stats.platforms[r.platform] = Number(r.count);
    });

    return successRes(res, "Stats retrieved successfully", { stats });
  } catch (err) {
    console.error("Error in getStats:", err);
    return errorRes(res, "Failed to load social lead stats", 500);
  }
};

// 2. Get Conversations List with Filters
exports.getConversations = async (req, res) => {
  try {
    const sellerId = await getSellerIdFromUser(req.user.id);
    if (!sellerId) return errorRes(res, "Seller profile not found", 404);

    await metaProviderService.seedDemoSocialLeads(sellerId);

    const { platform = "all", status = "all", q = "" } = req.query;

    let query = `
      SELECT c.*, l.id AS lead_id, l.estimated_value, l.city, l.source_details
      FROM social_conversations c
      LEFT JOIN social_leads l ON c.id = l.conversation_id
      WHERE c.seller_id = ?
    `;
    const params = [sellerId];

    if (platform !== "all") {
      query += ` AND c.platform = ?`;
      params.push(platform);
    }

    if (status !== "all") {
      query += ` AND c.status = ?`;
      params.push(status);
    }

    if (q && q.trim()) {
      query += ` AND (c.customer_name LIKE ? OR c.service_interest LIKE ? OR c.customer_phone LIKE ? OR c.last_message LIKE ?)`;
      const searchTerm = `%${q.trim()}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    query += ` ORDER BY c.last_message_at DESC`;

    const [conversations] = await pool.query(query, params);

    return successRes(res, "Conversations retrieved successfully", { conversations });
  } catch (err) {
    console.error("Error in getConversations:", err);
    return errorRes(res, "Failed to load conversations", 500);
  }
};

// 3. Get Single Conversation Detail
exports.getConversationById = async (req, res) => {
  try {
    const sellerId = await getSellerIdFromUser(req.user.id);
    if (!sellerId) return errorRes(res, "Seller profile not found", 404);

    const { id } = req.params;

    // Verify conversation belongs to seller
    const [convRows] = await pool.query(
      `SELECT c.*, l.id AS lead_id, l.estimated_value, l.city, l.source_details, l.email AS lead_email
       FROM social_conversations c
       LEFT JOIN social_leads l ON c.id = l.conversation_id
       WHERE c.id = ? AND c.seller_id = ?`,
      [id, sellerId]
    );

    if (!convRows.length) {
      return errorRes(res, "Conversation not found", 404);
    }

    const conversation = convRows[0];

    // Reset unread count when opened
    await pool.query(
      "UPDATE social_conversations SET unread_count = 0 WHERE id = ?",
      [id]
    );
    conversation.unread_count = 0;

    // Fetch messages
    const [messages] = await pool.query(
      "SELECT * FROM social_messages WHERE conversation_id = ? ORDER BY sent_at ASC",
      [id]
    );

    // Fetch internal notes
    const [notes] = await pool.query(
      "SELECT * FROM lead_notes WHERE conversation_id = ? ORDER BY created_at DESC",
      [id]
    );

    // Fetch activity logs
    const [logs] = await pool.query(
      "SELECT * FROM lead_activity_logs WHERE conversation_id = ? ORDER BY created_at DESC",
      [id]
    );

    return successRes(res, "Conversation detail loaded", {
      conversation,
      messages,
      notes,
      logs
    });
  } catch (err) {
    console.error("Error in getConversationById:", err);
    return errorRes(res, "Failed to load conversation details", 500);
  }
};

// 4. Send Message (Reply to Customer)
exports.sendMessage = async (req, res) => {
  try {
    const sellerId = await getSellerIdFromUser(req.user.id);
    if (!sellerId) return errorRes(res, "Seller profile not found", 404);

    const { id } = req.params;
    const { message, media_url } = req.body;

    if (!message || !message.trim()) {
      return errorRes(res, "Message text cannot be empty", 400);
    }

    // Verify conversation
    const [convRows] = await pool.query(
      "SELECT * FROM social_conversations WHERE id = ? AND seller_id = ?",
      [id, sellerId]
    );

    if (!convRows.length) {
      return errorRes(res, "Conversation not found", 404);
    }

    const conversation = convRows[0];

    // Insert message
    const [msgRes] = await pool.query(
      `INSERT INTO social_messages (conversation_id, sender_type, sender_name, message, media_url, sent_at)
       VALUES (?, 'seller', 'You', ?, ?, NOW())`,
      [id, message.trim(), media_url || null]
    );

    // Update conversation status if it was new
    let newStatus = conversation.status;
    if (conversation.status === "new") {
      newStatus = "contacted";
    }

    await pool.query(
      `UPDATE social_conversations 
       SET last_message = ?, last_message_at = NOW(), status = ? 
       WHERE id = ?`,
      [message.trim(), newStatus, id]
    );

    // Also update lead status if linked
    await pool.query(
      `UPDATE social_leads SET status = ? WHERE conversation_id = ?`,
      [newStatus, id]
    );

    // Activity log
    await pool.query(
      `INSERT INTO lead_activity_logs (seller_id, conversation_id, action_type, description)
       VALUES (?, ?, 'message_sent', ?)`,
      [sellerId, id, `Sent message: "${message.trim().substring(0, 40)}..."`]
    );

    const [newMsgRows] = await pool.query(
      "SELECT * FROM social_messages WHERE id = ?",
      [msgRes.insertId]
    );

    return successRes(res, "Message sent successfully", { message: newMsgRows[0], status: newStatus });
  } catch (err) {
    console.error("Error in sendMessage:", err);
    return errorRes(res, "Failed to send message", 500);
  }
};

// 5. Update Status
exports.updateStatus = async (req, res) => {
  try {
    const sellerId = await getSellerIdFromUser(req.user.id);
    if (!sellerId) return errorRes(res, "Seller profile not found", 404);

    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['new', 'contacted', 'interested', 'quoted', 'converted', 'lost'];
    if (!validStatuses.includes(status)) {
      return errorRes(res, "Invalid status provided", 400);
    }

    await pool.query(
      "UPDATE social_conversations SET status = ? WHERE id = ? AND seller_id = ?",
      [status, id, sellerId]
    );

    await pool.query(
      "UPDATE social_leads SET status = ? WHERE conversation_id = ? AND seller_id = ?",
      [status, id, sellerId]
    );

    await pool.query(
      `INSERT INTO lead_activity_logs (seller_id, conversation_id, action_type, description)
       VALUES (?, ?, 'status_change', ?)`,
      [sellerId, id, `Lead status changed to ${status.toUpperCase()}`]
    );

    return successRes(res, "Lead status updated", { status });
  } catch (err) {
    console.error("Error in updateStatus:", err);
    return errorRes(res, "Failed to update lead status", 500);
  }
};

// 6. Add Internal Note
exports.addNote = async (req, res) => {
  try {
    const sellerId = await getSellerIdFromUser(req.user.id);
    if (!sellerId) return errorRes(res, "Seller profile not found", 404);

    const { id } = req.params;
    const { note_text } = req.body;

    if (!note_text || !note_text.trim()) {
      return errorRes(res, "Note text is required", 400);
    }

    const [convRows] = await pool.query(
      "SELECT * FROM social_conversations WHERE id = ? AND seller_id = ?",
      [id, sellerId]
    );

    if (!convRows.length) return errorRes(res, "Conversation not found", 404);

    const [noteRes] = await pool.query(
      `INSERT INTO lead_notes (conversation_id, seller_id, note_text) VALUES (?, ?, ?)`,
      [id, sellerId, note_text.trim()]
    );

    await pool.query(
      `INSERT INTO lead_activity_logs (seller_id, conversation_id, action_type, description)
       VALUES (?, ?, 'note_added', ?)`,
      [sellerId, id, `Added internal note: "${note_text.trim().substring(0, 30)}..."`]
    );

    const [newNotes] = await pool.query("SELECT * FROM lead_notes WHERE id = ?", [noteRes.insertId]);

    return successRes(res, "Note added successfully", { note: newNotes[0] });
  } catch (err) {
    console.error("Error in addNote:", err);
    return errorRes(res, "Failed to add internal note", 500);
  }
};

// 7. Convert Social Lead to QuickSeva Booking
exports.convertToBooking = async (req, res) => {
  try {
    const sellerId = await getSellerIdFromUser(req.user.id);
    if (!sellerId) return errorRes(res, "Seller profile not found", 404);

    const { id } = req.params;

    const [convRows] = await pool.query(
      `SELECT c.*, l.estimated_value 
       FROM social_conversations c
       LEFT JOIN social_leads l ON c.id = l.conversation_id
       WHERE c.id = ? AND c.seller_id = ?`,
      [id, sellerId]
    );

    if (!convRows.length) return errorRes(res, "Conversation not found", 404);

    const conversation = convRows[0];

    // Mark status as converted
    await pool.query("UPDATE social_conversations SET status = 'converted' WHERE id = ?", [id]);
    await pool.query("UPDATE social_leads SET status = 'converted' WHERE conversation_id = ?", [id]);

    await pool.query(
      `INSERT INTO lead_activity_logs (seller_id, conversation_id, action_type, description)
       VALUES (?, ?, 'converted', ?)`,
      [sellerId, id, `Social lead converted into QuickSeva direct booking`]
    );

    return successRes(res, "Lead converted into QuickSeva booking successfully!", {
      status: "converted",
      customer_name: conversation.customer_name,
      amount: conversation.estimated_value || 1500.00
    });
  } catch (err) {
    console.error("Error in convertToBooking:", err);
    return errorRes(res, "Failed to convert lead to booking", 500);
  }
};

// 8. Get Social Accounts
exports.getSocialAccounts = async (req, res) => {
  try {
    const sellerId = await getSellerIdFromUser(req.user.id);
    if (!sellerId) return errorRes(res, "Seller profile not found", 404);

    await metaProviderService.seedDemoSocialLeads(sellerId);

    const [accounts] = await pool.query(
      "SELECT id, platform, platform_account_id, account_name, is_connected, created_at FROM social_accounts WHERE seller_id = ?",
      [sellerId]
    );

    return successRes(res, "Social accounts retrieved", { accounts });
  } catch (err) {
    console.error("Error in getSocialAccounts:", err);
    return errorRes(res, "Failed to load social accounts", 500);
  }
};

// 9. Connect/Disconnect Account
exports.toggleSocialAccount = async (req, res) => {
  try {
    const sellerId = await getSellerIdFromUser(req.user.id);
    if (!sellerId) return errorRes(res, "Seller profile not found", 404);

    const { platform } = req.body;
    if (!platform) return errorRes(res, "Platform is required", 400);

    const [accs] = await pool.query(
      "SELECT * FROM social_accounts WHERE seller_id = ? AND platform = ?",
      [sellerId, platform]
    );

    if (accs.length) {
      const newStatus = accs[0].is_connected ? 0 : 1;
      await pool.query("UPDATE social_accounts SET is_connected = ? WHERE id = ?", [newStatus, accs[0].id]);
      return successRes(res, `Account connection updated for ${platform}`, { is_connected: newStatus });
    } else {
      const [resIns] = await pool.query(
        "INSERT INTO social_accounts (seller_id, platform, platform_account_id, account_name, is_connected) VALUES (?, ?, ?, ?, 1)",
        [sellerId, platform, `${platform}_demo_acc`, `${platform.toUpperCase()} Business Account`]
      );
      return successRes(res, `Account connected for ${platform}`, { is_connected: 1 });
    }
  } catch (err) {
    console.error("Error in toggleSocialAccount:", err);
    return errorRes(res, "Failed to toggle social account connection", 500);
  }
};

// 10. Initiate Meta OAuth Flow
exports.initiateMetaAuth = async (req, res) => {
  try {
    const sellerId = await getSellerIdFromUser(req.user.id);
    if (!sellerId) return errorRes(res, "Seller profile not found", 404);

    const { platform = "instagram" } = req.query;
    const url = metaProviderService.getMetaOAuthUrl(platform, sellerId);
    return successRes(res, "Meta OAuth URL generated", { url });
  } catch (err) {
    console.error("Error in initiateMetaAuth:", err);
    return errorRes(res, "Failed to initiate Meta auth", 500);
  }
};

// 11. Meta OAuth Callback Handler
exports.handleMetaCallback = async (req, res) => {
  try {
    const { code, state, error, error_description } = req.query;

    if (error) {
      return res.status(400).send(`<h3>Meta Authorization Error</h3><p>${error_description || error}</p>`);
    }

    const tokenData = await metaProviderService.exchangeCodeForToken(code, state);

    if (tokenData && tokenData.seller_id) {
      const platform = tokenData.platform || "instagram";
      const sellerId = tokenData.seller_id;
      const token = tokenData.access_token;

      // Upsert into social_accounts
      const [accs] = await pool.query(
        "SELECT id FROM social_accounts WHERE seller_id = ? AND platform = ?",
        [sellerId, platform]
      );

      if (accs.length) {
        await pool.query(
          "UPDATE social_accounts SET access_token = ?, is_connected = 1 WHERE id = ?",
          [token, accs[0].id]
        );
      } else {
        await pool.query(
          "INSERT INTO social_accounts (seller_id, platform, platform_account_id, account_name, access_token, is_connected) VALUES (?, ?, ?, ?, ?, 1)",
          [sellerId, platform, `${platform}_official`, `${platform.toUpperCase()} Account`, token]
        );
      }

      // Close OAuth popup window cleanly
      return res.send(`
        <html>
          <body>
            <h2>Successfully Connected ${platform.toUpperCase()} Channel!</h2>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'META_AUTH_SUCCESS', platform: '${platform}' }, '*');
                window.close();
              } else {
                window.location.href = '/seller/social-inbox';
              }
            </script>
          </body>
        </html>
      `);
    }

    return res.status(400).send("Invalid OAuth callback parameters.");
  } catch (err) {
    console.error("Error in handleMetaCallback:", err);
    return res.status(500).send(`<h3>Authentication Failed</h3><p>${err.message}</p>`);
  }
};

// 12. Verify Meta Webhook (GET Challenge)
exports.verifyMetaWebhook = (req, res) => {
  try {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    const verifyToken = process.env.META_WEBHOOK_VERIFY_TOKEN || "quickseva_social_crm_secret";

    if (mode && token) {
      if (mode === "subscribe" && token === verifyToken) {
        console.log("Meta Webhook Verified Successfully!");
        return res.status(200).send(challenge);
      } else {
        return res.sendStatus(403);
      }
    }

    return res.status(400).send("Missing verification parameters");
  } catch (err) {
    console.error("Error verifying Meta Webhook:", err);
    return res.sendStatus(500);
  }
};

// 13. Receive Live Meta Webhook Events (POST Event Receiver)
exports.receiveMetaWebhook = async (req, res) => {
  try {
    const body = req.body;

    // Acknowledge Meta immediately to avoid timeouts
    res.status(200).send("EVENT_RECEIVED");

    // Asynchronously process incoming message / lead payload
    const { getIO } = require("../utils/socketService");
    metaProviderService.handleWebhookPayload(body, getIO);
  } catch (err) {
    console.error("Error handling Meta Webhook Event:", err);
  }
};
