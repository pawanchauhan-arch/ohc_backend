-- Consent form document for patient registration
-- Table: DRIVERMASTERs
-- Run once on the application PostgreSQL database

ALTER TABLE public."DRIVERMASTERs"
ADD COLUMN consent_form VARCHAR NULL;
