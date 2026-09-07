-- "Konto löschen" only anonymized the profiles row (set name to "Gelöschter
-- Nutzer") but never touched auth.users, so the Supabase Auth identity
-- persisted forever. That meant re-registering with the same email hit the
-- old, still-existing (and now anonymized) account instead of creating a
-- fresh one, and the GDPR "unwiderruflich gelöscht" promise wasn't actually
-- true. Every table referencing profiles already cascades correctly
-- (ON DELETE CASCADE or SET NULL - checked directly against pg_constraint),
-- so deleting the auth.users row is enough to clean up everything in one go.
CREATE OR REPLACE FUNCTION public.delete_own_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  DELETE FROM auth.users WHERE id = auth.uid();
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_own_account() TO authenticated;
