/*
# Auto-activate first admin signup

1. Trigger
- When a new user signs up via Supabase Auth, if no admins exist yet, automatically assign them as super_admin.
- This allows the first user to bootstrap the admin system without manual database access.
- Subsequent signups are NOT auto-activated — they must be approved by an existing super_admin.
2. Security
- Uses a SECURITY DEFINER function to check the admins table.
- Only fires on INSERT to auth.users (new signup).
*/

CREATE OR REPLACE FUNCTION public.handle_new_user_signup()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only auto-activate if no admins exist yet (first user bootstrap)
  IF NOT EXISTS (SELECT 1 FROM public.admins WHERE is_active = true) THEN
    INSERT INTO public.admins (user_id, role, is_active)
    VALUES (NEW.id, 'super_admin', true)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_user_signup ON auth.users;
CREATE TRIGGER on_user_signup
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_signup();