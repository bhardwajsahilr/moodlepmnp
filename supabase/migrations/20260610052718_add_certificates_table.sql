-- ─── CERTIFICATES ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS certificates (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id     uuid NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  training_title     text NOT NULL DEFAULT '',
  issued_at          date NOT NULL DEFAULT CURRENT_DATE,
  certificate_number text NOT NULL DEFAULT '',
  certificate_url    text DEFAULT '',
  created_at         timestamptz DEFAULT now()
);

ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own_certificates" ON certificates FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM participants p
      WHERE p.id = participant_id AND p.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM profiles pr
      WHERE pr.id = auth.uid() AND pr.role IN ('admin', 'training_manager')
    )
  );

CREATE POLICY "insert_certificates" ON certificates FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles pr
      WHERE pr.id = auth.uid() AND pr.role = 'admin'
    )
  );

CREATE POLICY "update_certificates" ON certificates FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles pr
      WHERE pr.id = auth.uid() AND pr.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles pr
      WHERE pr.id = auth.uid() AND pr.role = 'admin'
    )
  );

CREATE POLICY "delete_certificates" ON certificates FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles pr
      WHERE pr.id = auth.uid() AND pr.role = 'admin'
    )
  );

CREATE INDEX IF NOT EXISTS idx_certificates_participant_id ON certificates(participant_id);

-- Seed sample certificates for Gabriel
INSERT INTO certificates (participant_id, training_title, issued_at, certificate_number, certificate_url) VALUES
  ('8dced524-0380-457f-8455-85397b553f54', 'NLG', '2026-02-14', 'PMNP-NLG-2026-00042', ''),
  ('8dced524-0380-457f-8455-85397b553f54', 'SBC', '2026-03-28', 'PMNP-SBC-2026-00031', ''),
  ('8dced524-0380-457f-8455-85397b553f54', 'SE',  '2026-05-10', 'PMNP-SE-2026-00019',  '');
