-- QuickSeva migration: add seller service location + radius support
-- Run after updating DB schema.

ALTER TABLE sellers
  ADD COLUMN latitude DECIMAL(10,8) NULL,
  ADD COLUMN longitude DECIMAL(11,8) NULL,
  ADD COLUMN location_address VARCHAR(255) NULL,
  ADD COLUMN location_updated_at TIMESTAMP NULL,
  ADD COLUMN is_location_verified BOOLEAN DEFAULT TRUE,
  ADD COLUMN service_radius INT DEFAULT 5;

