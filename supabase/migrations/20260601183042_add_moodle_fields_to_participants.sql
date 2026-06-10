/*
  # Add Moodle integration fields to participants and participant_trainings

  ## Changes

  ### participants table
  - `moodle_user_id` (text) — stores the Moodle numeric user ID after account creation
  - `moodle_enrolment_status` (text) — tracks enrolment pipeline state:
      not_started | user_created | enrolled | failed

  ### participant_trainings table
  - `moodle_user_id` (text) — mirrors participant moodle_user_id for quick joins
  - `moodle_course_url` (text) — full URL to the Moodle course for this enrolment

  ## Notes
  - Uses IF NOT EXISTS guards so migration is safe to re-run
  - Default values ensure existing rows are in a valid state
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'participants' AND column_name = 'moodle_user_id'
  ) THEN
    ALTER TABLE participants ADD COLUMN moodle_user_id text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'participants' AND column_name = 'moodle_enrolment_status'
  ) THEN
    ALTER TABLE participants ADD COLUMN moodle_enrolment_status text DEFAULT 'not_started'
      CHECK (moodle_enrolment_status IN ('not_started','user_created','enrolled','failed'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'participant_trainings' AND column_name = 'moodle_user_id'
  ) THEN
    ALTER TABLE participant_trainings ADD COLUMN moodle_user_id text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'participant_trainings' AND column_name = 'moodle_course_url'
  ) THEN
    ALTER TABLE participant_trainings ADD COLUMN moodle_course_url text DEFAULT '';
  END IF;
END $$;
