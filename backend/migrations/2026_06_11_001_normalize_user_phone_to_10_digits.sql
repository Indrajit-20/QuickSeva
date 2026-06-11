-- Normalize existing user phone numbers to last 10 digits
-- This guarantees DB stores only 10-digit Indian mobile numbers.

USE quickseva_db;

UPDATE users
SET phone = RIGHT(phone, 10)
WHERE LENGTH(phone) > 10;

