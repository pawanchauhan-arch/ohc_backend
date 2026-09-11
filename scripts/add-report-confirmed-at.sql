-- Freeze the moment a health checkup first becomes Ready for shift-wise counting
-- Table: driverhealthcheckups
-- Run once on the application PostgreSQL database

ALTER TABLE public.driverhealthcheckups
ADD COLUMN IF NOT EXISTS report_confirmed_at TIMESTAMP WITH TIME ZONE NULL;

-- Backfill existing Ready reports so historical shift counts keep working.
-- Use updatedAt as best available proxy for when the report became Ready.
UPDATE public.driverhealthcheckups
SET report_confirmed_at = "updatedAt"
WHERE report_confirmed_at IS NULL
  AND is_submited = true
  AND LOWER(TRIM(COALESCE(confirm_report, ''))) = 'yes';

CREATE INDEX IF NOT EXISTS driverhealthcheckups_report_confirmed_at_idx
  ON public.driverhealthcheckups (report_confirmed_at);
