/*
  # Add per-training-title status columns to participants

  ## Summary
  Replaces the single training_title + training_status pair with eight
  dedicated status columns — one per PMNP training module — so each
  participant's progress across all training titles is tracked independently.

  ## New Columns (all optional, default '')
  - nlg_status   — Nutrition Leadership and Governance
  - sbc_status   — Social and Behavior Change
  - dqc_status   — Data Quality Check
  - nphc_status  — Nutrition and Primary Health Care
  - hcsc_status  — Household Convergence Scorecard
  - se_status    — Stakeholder Engagements
  - ts_status    — Technical Sessions
  - pms_status   — Project Management Sessions

  Each column accepts: '' | 'Yes' | 'No' | 'Trained'

  ## Notes
  - Existing training_title and training_status columns are retained for
    backward compatibility and are not dropped.
  - All new columns default to empty string to match existing schema pattern.
*/

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='participants' AND column_name='nlg_status') THEN
    ALTER TABLE participants ADD COLUMN nlg_status text NOT NULL DEFAULT '';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='participants' AND column_name='sbc_status') THEN
    ALTER TABLE participants ADD COLUMN sbc_status text NOT NULL DEFAULT '';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='participants' AND column_name='dqc_status') THEN
    ALTER TABLE participants ADD COLUMN dqc_status text NOT NULL DEFAULT '';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='participants' AND column_name='nphc_status') THEN
    ALTER TABLE participants ADD COLUMN nphc_status text NOT NULL DEFAULT '';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='participants' AND column_name='hcsc_status') THEN
    ALTER TABLE participants ADD COLUMN hcsc_status text NOT NULL DEFAULT '';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='participants' AND column_name='se_status') THEN
    ALTER TABLE participants ADD COLUMN se_status text NOT NULL DEFAULT '';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='participants' AND column_name='ts_status') THEN
    ALTER TABLE participants ADD COLUMN ts_status text NOT NULL DEFAULT '';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='participants' AND column_name='pms_status') THEN
    ALTER TABLE participants ADD COLUMN pms_status text NOT NULL DEFAULT '';
  END IF;
END $$;
