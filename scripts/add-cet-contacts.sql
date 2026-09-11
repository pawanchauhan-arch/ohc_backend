-- CET Manager (1) + Safety Officer/Supervisor (up to 10) contact mapping
-- Table: cet_contacts
-- Run once on the application PostgreSQL database

CREATE TABLE IF NOT EXISTS public.cet_contacts (
  id SERIAL PRIMARY KEY,
  cet_id INTEGER NOT NULL REFERENCES public."CETMANAGEMENTs"(id) ON DELETE CASCADE,
  contact_role VARCHAR NOT NULL,
  contact_name VARCHAR NULL,
  contact_phone VARCHAR NULL,
  contact_email VARCHAR NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS cet_contacts_cet_id_idx ON public.cet_contacts (cet_id);
CREATE INDEX IF NOT EXISTS cet_contacts_cet_id_role_idx ON public.cet_contacts (cet_id, contact_role);
