-- Migration to add availability columns to sellers
ALTER TABLE sellers
  ADD COLUMN available_days longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin 
    CHECK (json_valid(`available_days`)),
  ADD COLUMN unavailable_dates longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin 
    CHECK (json_valid(`unavailable_dates`));

-- Retroactively set defaults for existing rows if columns were somehow initialized to NULL
UPDATE sellers SET available_days = '["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"]' WHERE available_days IS NULL;
UPDATE sellers SET unavailable_dates = '[]' WHERE unavailable_dates IS NULL;
