-- Add WhatsApp report shared flag for Download Data tracking
-- Table: driverhealthcheckups
-- Run once on the application PostgreSQL database

ALTER TABLE public.driverhealthcheckups
ADD COLUMN is_whatsapp_report_sent BOOLEAN NOT NULL DEFAULT FALSE;
