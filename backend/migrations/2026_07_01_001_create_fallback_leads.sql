CREATE TABLE IF NOT EXISTS fallback_leads (
  id INT AUTO_INCREMENT PRIMARY KEY,
  customer_name VARCHAR(120) NOT NULL,
  contact_number VARCHAR(20) NOT NULL,
  category VARCHAR(120) NOT NULL,
  pincode VARCHAR(10) NOT NULL,
  description TEXT,
  latitude DECIMAL(10, 8) NULL,
  longitude DECIMAL(11, 8) NULL,
  radius_km INT DEFAULT 5,
  status ENUM('OPEN', 'PENDING', 'CLOSED') DEFAULT 'OPEN',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_fallback_leads_category_pincode (category, pincode),
  INDEX idx_fallback_leads_status (status)
);

CREATE TABLE IF NOT EXISTS seller_lead_notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  lead_id INT NOT NULL,
  seller_id INT NOT NULL,
  user_id INT NOT NULL,
  status ENUM('NEW', 'VIEWED', 'CONTACTED', 'CLOSED') DEFAULT 'NEW',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_seller_lead_notification (lead_id, seller_id),
  INDEX idx_seller_lead_notifications_seller (seller_id, status, created_at),
  FOREIGN KEY (lead_id) REFERENCES fallback_leads(id) ON DELETE CASCADE,
  FOREIGN KEY (seller_id) REFERENCES sellers(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
