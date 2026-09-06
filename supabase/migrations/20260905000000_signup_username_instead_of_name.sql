-- Signup now collects a single username instead of first/last name. The
-- trigger already falls back to nickname for display everywhere in the app
-- ([first_name, last_name].filter(Boolean).join(' ') || nickname), so storing
-- the username as nickname (leaving first/last name null) makes it show up
-- correctly with no changes needed at any of the ~37 display call sites.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (
    user_id,
    email,
    first_name,
    last_name,
    nickname,
    gdpr_consent_at,
    terms_accepted_at,
    trial_ends_at
  )
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'first_name',
    new.raw_user_meta_data ->> 'last_name',
    new.raw_user_meta_data ->> 'nickname',
    now(),
    now(),
    now() + interval '30 days'
  );
  RETURN new;
END;
$function$;
