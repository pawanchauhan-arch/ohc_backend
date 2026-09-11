-- Add invoice_url, po_url, and cet_id to camp_lists

ALTER TABLE camp_lists
ADD COLUMN IF NOT EXISTS invoice_url TEXT;

ALTER TABLE camp_lists
ADD COLUMN IF NOT EXISTS po_url TEXT;

ALTER TABLE camp_lists
ADD COLUMN IF NOT EXISTS cet_id INTEGER;

-- Add FK constraint if not exists (Postgres-safe)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_camp_lists_cet_id'
  ) THEN
    ALTER TABLE camp_lists
      ADD CONSTRAINT fk_camp_lists_cet_id
      FOREIGN KEY (cet_id)
      REFERENCES "CETMANAGEMENTs"(id)
      ON DELETE CASCADE
      ON UPDATE CASCADE;
  END IF;
END
$$;
