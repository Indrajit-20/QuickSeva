-- ============================================================================
-- QuickSeva Safe Migration: Ensure all schemas, columns, and indexes are synced
-- This script contains updates that might have been run locally via scripts
-- but were not included in standard migration files for Railway.
-- ============================================================================

-- 1. Ensure columns on sellers table
ALTER TABLE sellers ADD COLUMN lat DECIMAL(10,8) NULL;
ALTER TABLE sellers ADD COLUMN lng DECIMAL(11,8) NULL;
ALTER TABLE sellers ADD COLUMN service_mode VARCHAR(20) DEFAULT 'offline';
ALTER TABLE sellers ADD COLUMN instant_service TINYINT(1) DEFAULT 0;
ALTER TABLE sellers ADD COLUMN is_premium TINYINT(1) DEFAULT 0;
ALTER TABLE sellers ADD COLUMN plan VARCHAR(50) NULL;
ALTER TABLE sellers ADD COLUMN premium_expires_at TIMESTAMP NULL;
ALTER TABLE sellers ADD COLUMN gst_number VARCHAR(15) NULL;
ALTER TABLE sellers ADD COLUMN availability_last_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- 2. Ensure columns on services table
ALTER TABLE services ADD COLUMN sub_service_id INT NULL;
ALTER TABLE services ADD COLUMN is_instant TINYINT(1) DEFAULT 0;
ALTER TABLE services ADD COLUMN duration VARCHAR(50) NULL;

-- 3. Modify wallet_transactions column type
ALTER TABLE wallet_transactions MODIFY COLUMN source VARCHAR(50) NOT NULL;

-- 4. Ensure columns on orders table
ALTER TABLE orders ADD COLUMN completion_otp_code VARCHAR(4) DEFAULT NULL;
