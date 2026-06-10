/*
  # Seed Demo Users

  Creates demo admin and training manager accounts using Supabase auth.users
  via the admin API approach, then inserts matching profile rows.

  ## Demo Accounts
  - Admin: admin@pmnp.gov.ph / Admin@1234
  - Training Manager: manager@pmnp.gov.ph / Manager@1234

  Note: We insert directly into auth.users using crypt() for the password hash
  to match Supabase's bcrypt format. These are for demonstration purposes only.
*/

-- Create admin user
DO $$
DECLARE
  admin_uid uuid := gen_random_uuid();
  manager_uid uuid := gen_random_uuid();
BEGIN
  -- Insert admin into auth.users if not exists
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@pmnp.gov.ph') THEN
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, aud, role, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change
    ) VALUES (
      admin_uid,
      '00000000-0000-0000-0000-000000000000',
      'admin@pmnp.gov.ph',
      crypt('Admin@1234', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{}',
      'authenticated',
      'authenticated',
      now(), now(),
      '', '', '', ''
    );

    INSERT INTO profiles (id, role, full_name, email)
    VALUES (admin_uid, 'admin', 'System Administrator', 'admin@pmnp.gov.ph')
    ON CONFLICT (id) DO NOTHING;
  END IF;

  -- Insert training manager into auth.users if not exists
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'manager@pmnp.gov.ph') THEN
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, aud, role, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change
    ) VALUES (
      manager_uid,
      '00000000-0000-0000-0000-000000000000',
      'manager@pmnp.gov.ph',
      crypt('Manager@1234', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{}',
      'authenticated',
      'authenticated',
      now(), now(),
      '', '', '', ''
    );

    INSERT INTO profiles (id, role, full_name, email)
    VALUES (manager_uid, 'training_manager', 'Training Manager', 'manager@pmnp.gov.ph')
    ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;
