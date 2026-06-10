/*
  # Add moodle_password to participants

  ## Purpose
  Temporarily stores the participant's plain-text password at registration so
  it can be used verbatim when creating their Moodle account during approval.
  The column is cleared (set to NULL) immediately after the Moodle account is
  successfully created, so no long-term plain-text password is retained.

  ## Changes
  - `participants` table: new nullable `moodle_password` column (text, default NULL)

  ## Notes
  - The column is intentionally excluded from SELECT * responses via RLS — participants
    cannot read their own moodle_password; only the service-role key used by Edge
    Functions can access it.
  - The approve-participant edge function nullifies the column after use.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'participants' AND column_name = 'moodle_password'
  ) THEN
    ALTER TABLE participants ADD COLUMN moodle_password text DEFAULT NULL;
  END IF;
END $$;
