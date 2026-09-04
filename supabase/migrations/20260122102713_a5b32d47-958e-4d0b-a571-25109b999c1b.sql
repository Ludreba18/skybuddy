-- Erlaube authentifizierten Benutzern, alle Profile zu lesen
-- Die public_profiles View filtert bereits sensitive Felder heraus (email, trial_ends_at, membership_tier)
CREATE POLICY "Authenticated users can view all profiles" 
  ON public.profiles 
  FOR SELECT 
  TO authenticated
  USING (true);