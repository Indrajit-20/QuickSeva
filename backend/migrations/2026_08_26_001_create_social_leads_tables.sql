-- Migration: Create Social Lead Manager / Unified Inbox Tables
-- Date: 2026-08-26

CREATE TABLE IF NOT EXISTS social_accounts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  seller_id INT NOT NULL,
  platform ENUM('instagram', 'facebook', 'quickseva', 'whatsapp', 'google') NOT NULL,
  platform_account_id VARCHAR(255) DEFAULT NULL,
  account_name VARCHAR(255) NOT NULL,
  access_token TEXT DEFAULT NULL,
  token_expires_at DATETIME DEFAULT NULL,
  is_connected TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (seller_id) REFERENCES sellers(id) ON DELETE CASCADE,
  INDEX idx_seller_platform (seller_id, platform)
);

CREATE TABLE IF NOT EXISTS social_conversations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  seller_id INT NOT NULL,
  social_account_id INT DEFAULT NULL,
  platform ENUM('instagram', 'facebook', 'quickseva', 'whatsapp', 'google') NOT NULL,
  platform_conversation_id VARCHAR(255) DEFAULT NULL,
  customer_name VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(50) DEFAULT NULL,
  customer_email VARCHAR(150) DEFAULT NULL,
  customer_avatar VARCHAR(500) DEFAULT NULL,
  customer_platform_id VARCHAR(255) DEFAULT NULL,
  service_interest VARCHAR(255) DEFAULT NULL,
  last_message TEXT DEFAULT NULL,
  last_message_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status ENUM('new', 'contacted', 'interested', 'quoted', 'converted', 'lost') DEFAULT 'new',
  unread_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (seller_id) REFERENCES sellers(id) ON DELETE CASCADE,
  FOREIGN KEY (social_account_id) REFERENCES social_accounts(id) ON DELETE SET NULL,
  INDEX idx_seller_status (seller_id, status),
  INDEX idx_seller_platform (seller_id, platform)
);

CREATE TABLE IF NOT EXISTS social_messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  conversation_id INT NOT NULL,
  platform_message_id VARCHAR(255) DEFAULT NULL,
  sender_type ENUM('customer', 'seller', 'system') NOT NULL,
  sender_name VARCHAR(255) DEFAULT NULL,
  message TEXT NOT NULL,
  media_url VARCHAR(500) DEFAULT NULL,
  media_type VARCHAR(50) DEFAULT NULL,
  sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (conversation_id) REFERENCES social_conversations(id) ON DELETE CASCADE,
  INDEX idx_conv_sent (conversation_id, sent_at)
);

CREATE TABLE IF NOT EXISTS social_leads (
  id INT AUTO_INCREMENT PRIMARY KEY,
  seller_id INT NOT NULL,
  conversation_id INT DEFAULT NULL,
  platform ENUM('instagram', 'facebook', 'quickseva', 'whatsapp', 'google') NOT NULL,
  platform_lead_id VARCHAR(255) DEFAULT NULL,
  customer_name VARCHAR(255) NOT NULL,
  phone VARCHAR(50) DEFAULT NULL,
  email VARCHAR(150) DEFAULT NULL,
  city VARCHAR(100) DEFAULT NULL,
  service_interest VARCHAR(255) DEFAULT NULL,
  estimated_value DECIMAL(10,2) DEFAULT NULL,
  status ENUM('new', 'contacted', 'interested', 'quoted', 'converted', 'lost') DEFAULT 'new',
  source_details VARCHAR(255) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (seller_id) REFERENCES sellers(id) ON DELETE CASCADE,
  FOREIGN KEY (conversation_id) REFERENCES social_conversations(id) ON DELETE SET NULL,
  INDEX idx_seller_lead_status (seller_id, status)
);

CREATE TABLE IF NOT EXISTS lead_notes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  conversation_id INT DEFAULT NULL,
  lead_id INT DEFAULT NULL,
  seller_id INT NOT NULL,
  note_text TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (seller_id) REFERENCES sellers(id) ON DELETE CASCADE,
  FOREIGN KEY (conversation_id) REFERENCES social_conversations(id) ON DELETE CASCADE,
  FOREIGN KEY (lead_id) REFERENCES social_leads(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS lead_activity_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  seller_id INT NOT NULL,
  conversation_id INT DEFAULT NULL,
  lead_id INT DEFAULT NULL,
  action_type VARCHAR(50) NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (seller_id) REFERENCES sellers(id) ON DELETE CASCADE,
  FOREIGN KEY (conversation_id) REFERENCES social_conversations(id) ON DELETE CASCADE,
  FOREIGN KEY (lead_id) REFERENCES social_leads(id) ON DELETE CASCADE
);
