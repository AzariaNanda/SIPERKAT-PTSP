-- 1) Whitelist table
CREATE TABLE IF NOT EXISTS public.pegawai_whitelist (
  email TEXT PRIMARY KEY,
  nama_pegawai TEXT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  user_id UUID NULL UNIQUE,
  is_registered BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT pegawai_whitelist_email_lowercase CHECK (email = lower(email)),
  CONSTRAINT pegawai_whitelist_role_valid CHECK (role IN ('admin','user'))
);

ALTER TABLE public.pegawai_whitelist ENABLE ROW LEVEL SECURITY;

-- 2) RLS: only admins can CRUD whitelist
DROP POLICY IF EXISTS "Admins can select whitelist" ON public.pegawai_whitelist;
CREATE POLICY "Admins can select whitelist"
ON public.pegawai_whitelist
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Admins can insert whitelist" ON public.pegawai_whitelist;
CREATE POLICY "Admins can insert whitelist"
ON public.pegawai_whitelist
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Admins can update whitelist" ON public.pegawai_whitelist;
CREATE POLICY "Admins can update whitelist"
ON public.pegawai_whitelist
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Admins can delete whitelist" ON public.pegawai_whitelist;
CREATE POLICY "Admins can delete whitelist"
ON public.pegawai_whitelist
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- 3) RPC: check_whitelist_email
CREATE OR REPLACE FUNCTION public.check_whitelist_email(_email TEXT)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.pegawai_whitelist
    WHERE email = lower(_email)
  );
$$;

-- 4) Processor function called by backend signup flow (instead of triggers on auth.users)
CREATE OR REPLACE FUNCTION public.process_new_user_whitelist(_user_id uuid, _email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  wl_role text;
BEGIN
  SELECT role
  INTO wl_role
  FROM public.pegawai_whitelist
  WHERE email = lower(_email)
  LIMIT 1;

  IF wl_role IS NULL THEN
    RAISE EXCEPTION 'EMAIL_NOT_WHITELISTED';
  END IF;

  -- Ensure a single row per user_id in user_roles for simple RBAC
  CREATE UNIQUE INDEX IF NOT EXISTS user_roles_user_id_unique ON public.user_roles(user_id);

  INSERT INTO public.user_roles (user_id, role)
  VALUES (_user_id, wl_role::public.app_role)
  ON CONFLICT (user_id) DO UPDATE
    SET role = EXCLUDED.role;

  UPDATE public.pegawai_whitelist
  SET user_id = _user_id,
      is_registered = TRUE
  WHERE email = lower(_email);
END;
$$;

-- 5) Trigger: sync role changes from whitelist -> user_roles
CREATE OR REPLACE FUNCTION public.sync_user_role_from_whitelist()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (TG_OP = 'UPDATE') THEN
    IF NEW.user_id IS NOT NULL AND (NEW.role IS DISTINCT FROM OLD.role) THEN
      UPDATE public.user_roles
      SET role = NEW.role::public.app_role
      WHERE user_id = NEW.user_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_user_role_from_whitelist ON public.pegawai_whitelist;
CREATE TRIGGER trg_sync_user_role_from_whitelist
AFTER UPDATE OF role ON public.pegawai_whitelist
FOR EACH ROW
EXECUTE FUNCTION public.sync_user_role_from_whitelist();

-- 6) Seed data
INSERT INTO public.pegawai_whitelist (email, nama_pegawai, role)
VALUES
  ('subbagumpeg.dpmptspbms@gmail.com', 'Admin Utama', 'admin'),
  ('dpmpptspkabbanyumas@gmail.com', 'Pegawai Dinas', 'user')
ON CONFLICT (email) DO UPDATE
SET nama_pegawai = EXCLUDED.nama_pegawai,
    role = EXCLUDED.role;