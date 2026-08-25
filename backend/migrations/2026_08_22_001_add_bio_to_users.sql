-- Migration: Add missing bio column to users table
-- Date: 2026-08-22

ALTER TABLE users ADD COLUMN bio TEXT NULL;
