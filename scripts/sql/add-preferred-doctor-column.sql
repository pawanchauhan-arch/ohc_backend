-- Add preferredDoctorID column to request table
-- This script adds the preferredDoctorID column to support storing preferred doctor references in requests

-- Add the preferredDoctorID column
ALTER TABLE request ADD COLUMN "preferredDoctorID" INTEGER;

-- Add foreign key constraint to reference doctor table
ALTER TABLE request ADD CONSTRAINT "fk_request_preferred_doctor"
FOREIGN KEY ("preferredDoctorID") REFERENCES "doctor"(id) ON DELETE SET NULL;


