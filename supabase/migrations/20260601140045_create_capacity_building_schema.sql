/*
  # Capacity Building Platform — Initial Schema

  ## Overview
  Creates the full schema for the PMNP Capacity Building / Training Management System.

  ## New Tables

  ### 1. `profiles`
  Extends Supabase auth.users with role and display info.
  - `id` — references auth.users
  - `role` — admin | training_manager | participant
  - `full_name`, `email`, `avatar_url`

  ### 2. `participants`
  Stores participant registration details.
  - Personal: last_name, first_name, middle_initial, sex, profession, office, position, municipality
  - Special fields: lactating, pregnant, is_ip, ip_group
  - Training: training_title, training_status
  - Account: email, mobile_number
  - Approval: status (pending|approved|rejected), rejection_reason, approved_at, approved_by

  ### 3. `trainings`
  Stores training events created by admins/managers.
  - training_type, participating_regions, region, province, city_municipality, barangays
  - training_name, provider_department, provider_office
  - start_date, end_date, venue, submitter, remarks

  ### 4. `participant_trainings`
  Links participants to trainings (many-to-many).
  - participant_id, training_id
  - moodle_course_id, moodle_status, progress_percentage
  - course_status: not_started | in_progress | completed

  ### 5. `course_mappings`
  Maps platform training titles to Moodle course IDs.
  - training_title, moodle_course_id, moodle_course_url, auto_enrol

  ### 6. `moodle_settings`
  Stores Moodle integration configuration (one row per project).
  - base_url, api_token, default_category
  - auto_user_creation, auto_course_enrolment, sso_enabled

  ## Security
  - RLS enabled on all tables
  - Admins can read/write everything
  - Training managers can read participants and manage trainings
  - Participants can only read/update their own data
*/

-- ─── PROFILES ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id          uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role        text NOT NULL DEFAULT 'participant' CHECK (role IN ('admin','training_manager','participant')),
  full_name   text NOT NULL DEFAULT '',
  email       text NOT NULL DEFAULT '',
  avatar_url  text DEFAULT '',
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- ─── PARTICIPANTS ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS participants (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  last_name         text NOT NULL DEFAULT '',
  first_name        text NOT NULL DEFAULT '',
  middle_initial    text DEFAULT '',
  sex               text DEFAULT '' CHECK (sex IN ('','Male','Female','Other')),
  profession        text DEFAULT '',
  office            text DEFAULT '',
  position          text DEFAULT '',
  municipality      text DEFAULT '',
  lactating         boolean DEFAULT false,
  pregnant          boolean DEFAULT false,
  is_ip             boolean DEFAULT false,
  ip_group          text DEFAULT '',
  training_title    text DEFAULT '',
  training_status   text DEFAULT '' CHECK (training_status IN ('','Yes','No','Trained')),
  email             text NOT NULL,
  mobile_number     text DEFAULT '',
  status            text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  rejection_reason  text DEFAULT '',
  approved_at       timestamptz,
  approved_by       uuid REFERENCES profiles(id),
  user_id           uuid REFERENCES auth.users(id),
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now()
);

ALTER TABLE participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can view own record"
  ON participants FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Participants can insert own record"
  ON participants FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Participants can update own record"
  ON participants FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins and managers can view all participants"
  ON participants FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('admin','training_manager')
    )
  );

CREATE POLICY "Admins can update all participants"
  ON participants FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- Public insert allowed for registration (unauthenticated new registrants)
CREATE POLICY "Public can insert participant registration"
  ON participants FOR INSERT
  TO anon
  WITH CHECK (true);

-- ─── TRAININGS ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS trainings (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  training_type         text NOT NULL DEFAULT '',
  participating_regions text DEFAULT '',
  region                text DEFAULT '',
  province              text DEFAULT '',
  city_municipality     text DEFAULT '',
  barangays             text DEFAULT '',
  training_name         text NOT NULL DEFAULT '',
  provider_department   text DEFAULT '',
  provider_office       text DEFAULT '',
  start_date            date,
  end_date              date,
  venue                 text DEFAULT '',
  submitter             text NOT NULL DEFAULT '',
  remarks               text DEFAULT '',
  created_by            uuid REFERENCES profiles(id),
  created_at            timestamptz DEFAULT now(),
  updated_at            timestamptz DEFAULT now()
);

ALTER TABLE trainings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view all trainings"
  ON trainings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins and managers can insert trainings"
  ON trainings FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('admin','training_manager')
    )
  );

CREATE POLICY "Admins and managers can update trainings"
  ON trainings FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('admin','training_manager')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('admin','training_manager')
    )
  );

-- Public can also view trainings for registration form
CREATE POLICY "Public can view trainings"
  ON trainings FOR SELECT
  TO anon
  USING (true);

-- ─── PARTICIPANT TRAININGS ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS participant_trainings (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id       uuid NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  training_id          uuid REFERENCES trainings(id) ON DELETE SET NULL,
  training_title       text DEFAULT '',
  moodle_course_id     text DEFAULT '',
  moodle_status        text DEFAULT 'not_enrolled' CHECK (moodle_status IN ('not_enrolled','enrolled','completed')),
  course_status        text DEFAULT 'not_started' CHECK (course_status IN ('not_started','in_progress','completed')),
  progress_percentage  integer DEFAULT 0 CHECK (progress_percentage BETWEEN 0 AND 100),
  created_at           timestamptz DEFAULT now(),
  updated_at           timestamptz DEFAULT now()
);

ALTER TABLE participant_trainings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can view own training enrollments"
  ON participant_trainings FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM participants p
      WHERE p.id = participant_id AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins and managers can view all enrollments"
  ON participant_trainings FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('admin','training_manager')
    )
  );

CREATE POLICY "Admins can insert enrollments"
  ON participant_trainings FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

CREATE POLICY "Admins can update enrollments"
  ON participant_trainings FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- ─── COURSE MAPPINGS ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS course_mappings (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  training_title    text NOT NULL UNIQUE,
  moodle_course_id  text DEFAULT '',
  moodle_course_url text DEFAULT '',
  auto_enrol        boolean DEFAULT false,
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now()
);

ALTER TABLE course_mappings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view course mappings"
  ON course_mappings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert course mappings"
  ON course_mappings FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

CREATE POLICY "Admins can update course mappings"
  ON course_mappings FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- ─── MOODLE SETTINGS ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS moodle_settings (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  base_url               text DEFAULT '',
  api_token              text DEFAULT '',
  default_category       text DEFAULT '',
  auto_user_creation     boolean DEFAULT false,
  auto_course_enrolment  boolean DEFAULT false,
  sso_enabled            boolean DEFAULT false,
  updated_at             timestamptz DEFAULT now()
);

ALTER TABLE moodle_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view moodle settings"
  ON moodle_settings FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

CREATE POLICY "Admins can insert moodle settings"
  ON moodle_settings FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

CREATE POLICY "Admins can update moodle settings"
  ON moodle_settings FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- ─── SEED DEFAULT COURSE MAPPINGS ─────────────────────────────────────────────
INSERT INTO course_mappings (training_title, moodle_course_id, moodle_course_url, auto_enrol) VALUES
  ('NLG',  '101', 'https://lms.example.org/course/view.php?id=101', true),
  ('SBC',  '102', 'https://lms.example.org/course/view.php?id=102', true),
  ('DQC',  '103', 'https://lms.example.org/course/view.php?id=103', false),
  ('NPHC', '104', 'https://lms.example.org/course/view.php?id=104', false),
  ('HCSC', '105', 'https://lms.example.org/course/view.php?id=105', false),
  ('SE',   '106', 'https://lms.example.org/course/view.php?id=106', true),
  ('TS',   '107', 'https://lms.example.org/course/view.php?id=107', false),
  ('PMS',  '108', 'https://lms.example.org/course/view.php?id=108', false)
ON CONFLICT (training_title) DO NOTHING;

-- ─── SEED DEFAULT MOODLE SETTINGS ─────────────────────────────────────────────
INSERT INTO moodle_settings (base_url, default_category, auto_user_creation, auto_course_enrolment, sso_enabled)
VALUES ('https://lms.example.org', 'Capacity Building', true, true, false);

-- ─── INDEXES ─────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_participants_status ON participants(status);
CREATE INDEX IF NOT EXISTS idx_participants_email ON participants(email);
CREATE INDEX IF NOT EXISTS idx_participants_user_id ON participants(user_id);
CREATE INDEX IF NOT EXISTS idx_trainings_training_name ON trainings(training_name);
CREATE INDEX IF NOT EXISTS idx_trainings_start_date ON trainings(start_date);
CREATE INDEX IF NOT EXISTS idx_participant_trainings_participant_id ON participant_trainings(participant_id);
CREATE INDEX IF NOT EXISTS idx_participant_trainings_training_id ON participant_trainings(training_id);
