const { pool } = require("../config/db");

/**
 * Meta Provider Service (Instagram & Facebook API Integration Layer)
 * Handles Meta Graph API OAuth token management, webhook payload processing,
 * and demo/mock data seeding for development environments.
 */

class MetaProviderService {
  /**
   * Seed realistic sample social conversations & leads for newly connected sellers
   * so they can immediately test the CRM dashboard functionality.
   */
  async seedDemoSocialLeads(sellerId) {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      // 1. Ensure mock accounts exist
      const [existingAccounts] = await conn.query(
        "SELECT id, platform FROM social_accounts WHERE seller_id = ?",
        [sellerId]
      );

      let instaAccountId = existingAccounts.find(a => a.platform === 'instagram')?.id;
      let fbAccountId = existingAccounts.find(a => a.platform === 'facebook')?.id;
      let qsAccountId = existingAccounts.find(a => a.platform === 'quickseva')?.id;

      if (!qsAccountId) {
        const [res] = await conn.query(
          "INSERT INTO social_accounts (seller_id, platform, platform_account_id, account_name, is_connected) VALUES (?, 'quickseva', 'qs_official', 'QuickSeva Storefront', 1)",
          [sellerId]
        );
        qsAccountId = res.insertId;
      }

      if (!instaAccountId) {
        const [res] = await conn.query(
          "INSERT INTO social_accounts (seller_id, platform, platform_account_id, account_name, is_connected) VALUES (?, 'instagram', 'ig_pro_101', 'Instagram Business Page', 1)",
          [sellerId]
        );
        instaAccountId = res.insertId;
      }

      if (!fbAccountId) {
        const [res] = await conn.query(
          "INSERT INTO social_accounts (seller_id, platform, platform_account_id, account_name, is_connected) VALUES (?, 'facebook', 'fb_page_202', 'Facebook Service Page', 1)",
          [sellerId]
        );
        fbAccountId = res.insertId;
      }

      // 2. Check if seller already has conversations
      const [existingConvs] = await conn.query(
        "SELECT COUNT(*) AS cnt FROM social_conversations WHERE seller_id = ?",
        [sellerId]
      );

      if (existingConvs[0].cnt === 0) {
        // Seed Lead 1: Instagram DM Lead (New)
        const [c1] = await conn.query(
          `INSERT INTO social_conversations 
          (seller_id, social_account_id, platform, platform_conversation_id, customer_name, customer_phone, customer_email, customer_avatar, service_interest, last_message, last_message_at, status, unread_count)
          VALUES (?, ?, 'instagram', 'ig_conv_01', 'Ravi Patel', '9876543210', 'ravi.patel@example.com', 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150', 'Plumbing Service', 'Hi, I need urgent plumbing work in Navrangpura, Ahmedabad.', NOW() - INTERVAL 15 MINUTE, 'new', 1)`,
          [sellerId, instaAccountId]
        );
        const conv1Id = c1.insertId;

        await conn.query(
          `INSERT INTO social_messages (conversation_id, sender_type, sender_name, message, sent_at) VALUES 
          (?, 'customer', 'Ravi Patel', 'Hello! Found your profile on Instagram. Do you provide pipe leakage repair near Navrangpura?', NOW() - INTERVAL 20 MINUTE),
          (?, 'customer', 'Ravi Patel', 'Hi, I need urgent plumbing work in Navrangpura, Ahmedabad.', NOW() - INTERVAL 15 MINUTE)`,
          [conv1Id, conv1Id]
        );

        const [l1] = await conn.query(
          `INSERT INTO social_leads (seller_id, conversation_id, platform, customer_name, phone, email, city, service_interest, estimated_value, status, source_details)
          VALUES (?, ?, 'instagram', 'Ravi Patel', '9876543210', 'ravi.patel@example.com', 'Ahmedabad', 'Plumbing Service', 1200.00, 'new', 'Instagram Direct Message')`,
          [sellerId, conv1Id]
        );

        await conn.query(
          `INSERT INTO lead_notes (conversation_id, lead_id, seller_id, note_text)
          VALUES (?, ?, ?, 'Customer requested urgent visit before evening.')`,
          [conv1Id, l1.insertId, sellerId]
        );

        await conn.query(
          `INSERT INTO lead_activity_logs (seller_id, conversation_id, lead_id, action_type, description)
          VALUES (?, ?, ?, 'lead_created', 'New Instagram DM lead received')`,
          [sellerId, conv1Id, l1.insertId]
        );

        // Seed Lead 2: Facebook Lead Ad Form (Contacted)
        const [c2] = await conn.query(
          `INSERT INTO social_conversations 
          (seller_id, social_account_id, platform, platform_conversation_id, customer_name, customer_phone, customer_email, customer_avatar, service_interest, last_message, last_message_at, status, unread_count)
          VALUES (?, ?, 'facebook', 'fb_conv_02', 'Priya Shah', '9825012345', 'priya.shah@example.com', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150', 'AC Deep Cleaning', 'Shared contact details via Facebook Lead Form', NOW() - INTERVAL 2 HOUR, 'contacted', 0)`,
          [sellerId, fbAccountId]
        );
        const conv2Id = c2.insertId;

        await conn.query(
          `INSERT INTO social_messages (conversation_id, sender_type, sender_name, message, sent_at) VALUES 
          (?, 'system', 'Meta Lead Ads', 'Lead Submitted: Priya Shah requested AC Deep Cleaning quote.', NOW() - INTERVAL 2 HOUR),
          (?, 'seller', 'Seller', 'Hello Priya, thank you for reaching out via our Facebook Ad! We offer AC servicing starting at ₹599.', NOW() - INTERVAL 1 HOUR)`,
          [conv2Id, conv2Id]
        );

        const [l2] = await conn.query(
          `INSERT INTO social_leads (seller_id, conversation_id, platform, customer_name, phone, email, city, service_interest, estimated_value, status, source_details)
          VALUES (?, ?, 'facebook', 'Priya Shah', '9825012345', 'priya.shah@example.com', 'Ahmedabad', 'AC Deep Cleaning', 1800.00, 'contacted', 'Facebook Lead Ad Form #4092')`,
          [sellerId, conv2Id]
        );

        await conn.query(
          `INSERT INTO lead_activity_logs (seller_id, conversation_id, lead_id, action_type, description)
          VALUES (?, ?, ?, 'status_change', 'Status updated to Contacted')`,
          [sellerId, conv2Id, l2.insertId]
        );

        // Seed Lead 3: QuickSeva Direct Lead (Interested)
        const [c3] = await conn.query(
          `INSERT INTO social_conversations 
          (seller_id, social_account_id, platform, platform_conversation_id, customer_name, customer_phone, customer_email, customer_avatar, service_interest, last_message, last_message_at, status, unread_count)
          VALUES (?, ?, 'quickseva', 'qs_conv_03', 'Amit Kumar', '9909988776', 'amit.k@example.com', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', 'Electrical Wiring', 'I want to schedule the booking for tomorrow 10 AM.', NOW() - INTERVAL 1 DAY, 'interested', 0)`,
          [sellerId, qsAccountId]
        );
        const conv3Id = c3.insertId;

        await conn.query(
          `INSERT INTO social_messages (conversation_id, sender_type, sender_name, message, sent_at) VALUES 
          (?, 'customer', 'Amit Kumar', 'Hello, can you inspect house wiring in Satellite area?', NOW() - INTERVAL 1 DAY),
          (?, 'seller', 'Seller', 'Yes sure Amit, we can inspect and provide complete estimate.', NOW() - INTERVAL 22 HOUR),
          (?, 'customer', 'Amit Kumar', 'I want to schedule the booking for tomorrow 10 AM.', NOW() - INTERVAL 1 DAY)`,
          [conv3Id, conv3Id, conv3Id]
        );

        await conn.query(
          `INSERT INTO social_leads (seller_id, conversation_id, platform, customer_name, phone, email, city, service_interest, estimated_value, status, source_details)
          VALUES (?, ?, 'quickseva', 'Amit Kumar', '9909988776', 'amit.k@example.com', 'Ahmedabad', 'Electrical Wiring', 2500.00, 'interested', 'QuickSeva Marketplace')`,
          [sellerId, conv3Id]
        );
      }

      await conn.commit();
    } catch (err) {
      await conn.rollback();
      console.error("Error seeding demo social leads:", err);
    } finally {
      conn.release();
    }
  }

  /**
   * Meta OAuth URL generator (for future live App connection)
   */
  getMetaOAuthUrl(platform, sellerId) {
    const appId = process.env.META_APP_ID || "DEMO_META_APP_ID";
    const redirectUri = encodeURIComponent(`${process.env.BACKEND_URL || "http://localhost:5000"}/api/seller/social-inbox/meta/callback`);
    const scopes = encodeURIComponent("instagram_basic,instagram_manage_messages,pages_messaging,pages_show_list,leads_retrieval");
    return `https://www.facebook.com/v18.0/dialog/oauth?client_id=${appId}&redirect_uri=${redirectUri}&scope=${scopes}&state=${platform}_${sellerId}`;
  }
}

module.exports = new MetaProviderService();
