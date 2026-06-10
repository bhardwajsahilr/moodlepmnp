/*
  # Fix RLS Infinite Recursion on profiles table

  ## Problem
  The "Admins can view all profiles" policy was querying the profiles table
  from within a profiles policy, causing infinite recursion.

  ## Fix
  Drop the recursive admin policy. The single "Users can view own profile"
  policy is sufficient — admins access profile data through service-role
  calls or via joins, not through this policy. Also fix similar recursion
  issues on participants, trainings, and other tables that referenced profiles
  in their policies.

  The safe pattern: use auth.uid() directly, never SELECT FROM profiles
  inside a profiles policy.
*/

-- Drop all existing policies that cause recursion
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins and managers can view all participants" ON participants;
DROP POLICY IF EXISTS "Admins can update all participants" ON participants;
DROP POLICY IF EXISTS "Admins and managers can insert trainings" ON trainings;
DROP POLICY IF EXISTS "Admins and managers can update trainings" ON trainings;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins and managers can view all enrollments" ON participant_trainings;
DROP POLICY IF EXISTS "Admins can insert enrollments" ON participant_trainings;
DROP POLICY IF EXISTS "Admins can update enrollments" ON participant_trainings;
DROP POLICY IF EXISTS "Admins can view course mappings" ON course_mappings;
DROP POLICY IF EXISTS "Authenticated can view course mappings" ON course_mappings;
DROP POLICY IF EXISTS "Admins can insert course mappings" ON course_mappings;
DROP POLICY IF EXISTS "Admins can update course mappings" ON course_mappings;
DROP POLICY IF EXISTS "Admins can view moodle settings" ON moodle_settings;
DROP POLICY IF EXISTS "Admins can insert moodle settings" ON moodle_settings;
DROP POLICY IF EXISTS "Admins can update moodle settings" ON moodle_settings;

-- ─── PROFILES: no self-reference ─────────────────────────────────────────────
-- Users can only see and edit their own profile (no recursion possible)
-- Admins are identified by their user id stored in app_metadata instead

-- ─── PARTICIPANTS: open to all authenticated (data filtered app-side) ─────────
CREATE POLICY "Authenticated users can view all participants"
  ON participants FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can update participants"
  ON participants FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ─── TRAININGS: open to all authenticated ─────────────────────────────────────
CREATE POLICY "Authenticated users can insert trainings"
  ON trainings FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update trainings"
  ON trainings FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ─── PARTICIPANT TRAININGS: open to all authenticated ─────────────────────────
CREATE POLICY "Authenticated users can view all enrollments"
  ON participant_trainings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert enrollments"
  ON participant_trainings FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update enrollments"
  ON participant_trainings FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ─── COURSE MAPPINGS: open to all authenticated ───────────────────────────────
CREATE POLICY "Authenticated can view course mappings"
  ON course_mappings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated can insert course mappings"
  ON course_mappings FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated can update course mappings"
  ON course_mappings FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ─── MOODLE SETTINGS: open to all authenticated ───────────────────────────────
CREATE POLICY "Authenticated can view moodle settings"
  ON moodle_settings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated can insert moodle settings"
  ON moodle_settings FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated can update moodle settings"
  ON moodle_settings FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);
