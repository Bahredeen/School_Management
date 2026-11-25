/*
# Selam Academy — Personal Email & Phone Number Login Lookup
Allows parents, teachers, and staff to register with any email domain (e.g. Gmail)
and/or Ethiopian phone number (+2519... or 09...) and sign in with either.
*/

CREATE OR REPLACE FUNCTION public.fn_resolve_login_email(p_identifier text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_clean text;
  v_digits text;
  v_normalized_phone text;
  v_email text;
BEGIN
  v_clean := lower(trim(p_identifier));
  IF v_clean = '' OR v_clean IS NULL THEN
    RETURN NULL;
  END IF;

  -- If identifier contains '@', treat it directly as an email
  IF position('@' in v_clean) > 0 THEN
    RETURN v_clean;
  END IF;

  -- Otherwise normalize Ethiopian phone number (+2519..., 2519..., or 09...)
  v_digits := regexp_replace(v_clean, '[^0-9]', '', 'g');

  IF length(v_digits) = 10 AND left(v_digits, 2) = '09' THEN
    v_normalized_phone := '+251' || substring(v_digits from 2);
  ELSIF length(v_digits) = 10 AND left(v_digits, 2) = '07' THEN
    v_normalized_phone := '+251' || substring(v_digits from 2);
  ELSIF length(v_digits) = 12 AND left(v_digits, 3) = '251' THEN
    v_normalized_phone := '+' || v_digits;
  ELSE
    v_normalized_phone := trim(p_identifier);
  END IF;

  SELECT email INTO v_email
  FROM public.profiles
  WHERE regexp_replace(coalesce(phone, ''), '[^0-9]', '', 'g') = regexp_replace(v_normalized_phone, '[^0-9]', '', 'g')
    AND status = 'active'
  LIMIT 1;

  RETURN v_email;
END;
$$;

GRANT EXECUTE ON FUNCTION public.fn_resolve_login_email(text) TO anon, authenticated;