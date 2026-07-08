-- Add gender and Date of Birth columns to users table
ALTER TABLE users ADD COLUMN gender VARCHAR(50) NULL AFTER phone;
ALTER TABLE users ADD COLUMN dob DATE NULL AFTER gender;
