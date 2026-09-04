-- BETA PHASE: disable the paywall so every signed-in user has full access,
-- regardless of membership_tier/trial_ends_at.
--
-- Two functions gate access across this schema (a leftover from an earlier,
-- narrower premium-only check that was later widened to also cover trials -
-- but not every call site got migrated, e.g. start_conversation() and the
-- post-images storage policy still called the old one directly). Overriding
-- BOTH here, rather than chasing every individual call site, guarantees
-- nothing is missed. Restore the "real" versions below when it's time to charge.

CREATE OR REPLACE FUNCTION public.has_active_access()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT true;
$function$;

CREATE OR REPLACE FUNCTION public.is_current_user_premium()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT true;
$function$;

-- To restore real trial/premium enforcement later, run:
--
-- CREATE OR REPLACE FUNCTION public.has_active_access()
-- RETURNS boolean
-- LANGUAGE sql
-- STABLE SECURITY DEFINER
-- SET search_path TO 'public'
-- AS $function$
--   SELECT EXISTS (
--     SELECT 1 FROM public.profiles
--     WHERE user_id = auth.uid()
--     AND (
--       (membership_tier = 'premium' AND (membership_expires_at IS NULL OR membership_expires_at > now()))
--       OR
--       (trial_ends_at IS NOT NULL AND trial_ends_at > now())
--     )
--   );
-- $function$;
--
-- CREATE OR REPLACE FUNCTION public.is_current_user_premium()
-- RETURNS boolean
-- LANGUAGE sql
-- STABLE SECURITY DEFINER
-- SET search_path TO 'public'
-- AS $function$
--   SELECT EXISTS (
--     SELECT 1 FROM public.profiles
--     WHERE user_id = auth.uid()
--     AND membership_tier = 'premium'
--   );
-- $function$;
