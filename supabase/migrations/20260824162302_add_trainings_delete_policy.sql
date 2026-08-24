CREATE POLICY "Admins and managers can delete trainings"
  ON trainings FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('admin','training_manager')
    )
  );
