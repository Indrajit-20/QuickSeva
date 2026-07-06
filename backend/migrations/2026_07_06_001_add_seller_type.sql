ALTER TABLE sellers
  ADD COLUMN seller_type VARCHAR(50) DEFAULT 'individual'
  AFTER is_available;
