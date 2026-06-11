-- QuickSeva migration: add seller service location + radius support
-- Run after updating DB schema.

ALTER TABLE sellers
  ADD COLUMN IF NOT EXISTS latitude DECIMAL(10,8) NULL,
  ADD COLUMN IF NOT EXISTS longitude DECIMAL(11,8) NULL,
  ADD COLUMN IF NOT EXISTS location_address VARCHAR(255) NULL,
  ADD COLUMN IF NOT EXISTS location_updated_at TIMESTAMP NULL,
  ADD COLUMN IF NOT EXISTS is_location_verified BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS service_radius INT DEFAULT 5;

