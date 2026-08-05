-- Migration: Add scheduling and agency capacity fields to sellers table
-- Supports custom working hours, slot duration, and agency team capacity

ALTER TABLE sellers ADD COLUMN account_type VARCHAR(50) DEFAULT 'individual';
ALTER TABLE sellers ADD COLUMN slot_capacity INT DEFAULT 1;
ALTER TABLE sellers ADD COLUMN slot_duration_mins INT DEFAULT 60;
ALTER TABLE sellers ADD COLUMN working_hours_start VARCHAR(10) DEFAULT '09:00';
ALTER TABLE sellers ADD COLUMN working_hours_end VARCHAR(10) DEFAULT '19:00';
