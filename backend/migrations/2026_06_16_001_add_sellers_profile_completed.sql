-- Add profile completion tracking for seller onboarding

ALTER TABLE sellers
  ADD COLUMN IF NOT EXISTS profile_completed TINYINT(1) DEFAULT 0;

