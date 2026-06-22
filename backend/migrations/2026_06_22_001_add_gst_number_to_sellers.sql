-- Add gst_number column to sellers table
ALTER TABLE sellers
  ADD COLUMN gst_number VARCHAR(15) DEFAULT NULL;
