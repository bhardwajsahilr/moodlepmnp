/*
  # Update trainings table — replace old location columns with DHIS2-aligned participating-area columns

  ## Changes
  1. Add new participating-area columns (all optional text):
     - participating_province
     - participating_provinces
     - participating_city_municipality
     - participating_cities_municipalities
     - participating_barangays
  2. The existing `participating_regions` column is retained (already present).
  3. Old columns `region`, `province`, `city_municipality` are left in place (non-destructive) but
     are no longer used by the application — they are superseded by the new fields above.

  ## Notes
  - No data is dropped; existing rows are unaffected.
  - All new columns default to empty string to match the rest of the schema pattern.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'trainings' AND column_name = 'participating_province'
  ) THEN
    ALTER TABLE trainings ADD COLUMN participating_province text NOT NULL DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'trainings' AND column_name = 'participating_provinces'
  ) THEN
    ALTER TABLE trainings ADD COLUMN participating_provinces text NOT NULL DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'trainings' AND column_name = 'participating_city_municipality'
  ) THEN
    ALTER TABLE trainings ADD COLUMN participating_city_municipality text NOT NULL DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'trainings' AND column_name = 'participating_cities_municipalities'
  ) THEN
    ALTER TABLE trainings ADD COLUMN participating_cities_municipalities text NOT NULL DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'trainings' AND column_name = 'participating_barangays'
  ) THEN
    ALTER TABLE trainings ADD COLUMN participating_barangays text NOT NULL DEFAULT '';
  END IF;
END $$;
