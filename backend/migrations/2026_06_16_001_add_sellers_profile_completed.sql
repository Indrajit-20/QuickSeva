-- Add profile completion tracking for seller onboarding

ALTER TABLE sellers
  ADD COLUMN profile_completed TINYINT(1) DEFAULT 0;

