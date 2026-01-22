-- 1) RPC: is_email_registered
-- Mengecek apakah email sudah terdaftar di sistem auth
CREATE OR REPLACE FUNCTION public.is_email_registered(_email text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM auth.users u
    WHERE lower(u.email) = lower(_email)
  );
$$;

-- 2) RPC: sync_role_by_email
-- Mencari user_id berdasarkan email di auth.users lalu mengubah role di public.user_roles
-- Dibatasi: hanya admin yang boleh memanggil (dicek via has_role)
CREATE OR REPLACE FUNCTION public.sync_role_by_email(_email text, _new_role text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_role public.app_role;
BEGIN
  -- Authorization guard
  IF NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'NOT_AUTHORIZED';
  END IF;

  -- Validate role value
  BEGIN
    v_role := lower(_new_role)::public.app_role;
  EXCEPTION WHEN others THEN
    RAISE EXCEPTION 'INVALID_ROLE';
  END;

  -- Find user_id from auth
  SELECT u.id INTO v_user_id
  FROM auth.users u
  WHERE lower(u.email) = lower(_email)
  LIMIT 1;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'USER_NOT_FOUND';
  END IF;

  -- Upsert role row
  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_user_id, v_role)
  ON CONFLICT (user_id) DO UPDATE
    SET role = EXCLUDED.role;
END;
$$;