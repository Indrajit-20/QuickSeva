-- Ensure sellers.phone exists (seller business/profile phone)
-- Authentication continues to use users.phone.

ALTER TABLE sellers
  ADD COLUMN phone VARCHAR(20) NULL;

-- Keep existing constraints/indexes untouched.


