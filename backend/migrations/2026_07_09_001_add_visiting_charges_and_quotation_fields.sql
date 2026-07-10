CREATE TABLE IF NOT EXISTS system_settings (
  `key` VARCHAR(50) PRIMARY KEY,
  `value` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT INTO system_settings (`key`, `value`, `description`) VALUES
('platform_fee_model', 'buyer', 'Who pays the platform fee: "buyer" (Option A) or "seller" (Option B)')
ON DUPLICATE KEY UPDATE `description` = VALUES(`description`);

INSERT INTO system_settings (`key`, `value`, `description`) VALUES
('platform_fee_percentage', '5.00', 'Percentage of service cost charged as platform fee')
ON DUPLICATE KEY UPDATE `description` = VALUES(`description`);

-- Modify columns in services table
ALTER TABLE services ADD COLUMN visiting_charge DECIMAL(10,2) DEFAULT 0.00;
ALTER TABLE services ADD COLUMN is_inspection_required TINYINT(1) DEFAULT 1;
ALTER TABLE services ADD COLUMN final_price_after_inspection TINYINT(1) DEFAULT 1;

-- Modify columns in orders table
ALTER TABLE orders ADD COLUMN visiting_charge_amount DECIMAL(10,2) DEFAULT 0.00;
ALTER TABLE orders ADD COLUMN visiting_platform_fee DECIMAL(10,2) DEFAULT 0.00;
ALTER TABLE orders ADD COLUMN visiting_payment_status ENUM('pending', 'paid', 'refunded') DEFAULT 'pending';
ALTER TABLE orders ADD COLUMN service_charge_amount DECIMAL(10,2) DEFAULT 0.00;
ALTER TABLE orders ADD COLUMN parts_cost_amount DECIMAL(10,2) DEFAULT 0.00;
ALTER TABLE orders ADD COLUMN discount_amount DECIMAL(10,2) DEFAULT 0.00;
ALTER TABLE orders ADD COLUMN final_platform_fee DECIMAL(10,2) DEFAULT 0.00;
ALTER TABLE orders ADD COLUMN final_payment_status ENUM('pending', 'paid', 'refunded') DEFAULT 'pending';
ALTER TABLE orders ADD COLUMN quotation_notes TEXT;
ALTER TABLE orders ADD COLUMN start_otp_code VARCHAR(10) DEFAULT NULL;

-- Modify status column
ALTER TABLE orders MODIFY COLUMN status ENUM('pending','accepted','in_progress','quoted','completed','cancelled','disputed') DEFAULT 'pending';
