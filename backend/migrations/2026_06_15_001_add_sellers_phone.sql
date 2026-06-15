-- Add seller phone column for quick seller profile usage
-- Non-breaking: keeps existing users.phone as authentication source of truth.

ALTER TABLE sellers
  ADD COLUMN IF NOT EXISTS phone VARCHAR(20) NULL;

