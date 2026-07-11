
-- Enums
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  bio TEXT,
  description TEXT,
  avatar_url TEXT,
  background_url TEXT,
  song_url TEXT,
  accent_color TEXT DEFAULT '#ffffff',
  card_opacity INT DEFAULT 55,
  is_premium BOOLEAN NOT NULL DEFAULT false,
  views INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT username_format CHECK (username ~ '^[a-zA-Z0-9_-]{2,32}$')
);
GRANT SELECT ON public.profiles TO anon;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- user_roles
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- has_role security definer
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

-- Badges catalog
CREATE TABLE public.badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#ffffff',
  is_custom BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.badges TO anon, authenticated;
GRANT ALL ON public.badges TO service_role;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;

-- user_badges
CREATE TABLE public.user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, badge_id)
);
GRANT SELECT ON public.user_badges TO anon, authenticated;
GRANT ALL ON public.user_badges TO service_role;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "profiles_public_read" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "profiles_admin_update" ON public.profiles FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "user_roles_read_own" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "badges_read_all" ON public.badges FOR SELECT USING (true);

CREATE POLICY "user_badges_read_all" ON public.user_badges FOR SELECT USING (true);

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.tg_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  base_username TEXT;
  final_username TEXT;
  suffix INT := 0;
BEGIN
  base_username := lower(regexp_replace(coalesce(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1), 'user'), '[^a-zA-Z0-9_-]', '', 'g'));
  IF length(base_username) < 2 THEN base_username := 'user' || substr(NEW.id::text, 1, 6); END IF;
  final_username := base_username;
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = final_username) LOOP
    suffix := suffix + 1;
    final_username := base_username || suffix::text;
  END LOOP;
  INSERT INTO public.profiles (id, username, display_name)
  VALUES (NEW.id, final_username, coalesce(NEW.raw_user_meta_data->>'display_name', final_username));
  -- Auto-grant admin to forkdot324@gmail.com
  IF NEW.email = 'forkdot324@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin') ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Seed default badges
INSERT INTO public.badges (slug, name, description, icon, color) VALUES
  ('verified', 'Verified', 'Verified user', 'BadgeCheck', '#3b82f6'),
  ('buyer', 'Buyer', 'Supported Gurt.lol', 'ShoppingBag', '#10b981'),
  ('premium', 'Premium', 'Premium member', 'Crown', '#fbbf24'),
  ('staff', 'Staff', 'Gurt.lol staff', 'Shield', '#ef4444'),
  ('og', 'OG', 'Early Gurt.lol user', 'Star', '#a855f7');

-- View increment RPC (bypasses RLS restriction on updates from anon)
CREATE OR REPLACE FUNCTION public.increment_profile_views(_username TEXT)
RETURNS INT LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE new_views INT;
BEGIN
  UPDATE public.profiles SET views = views + 1
  WHERE username = _username
  RETURNING views INTO new_views;
  RETURN COALESCE(new_views, 0);
END; $$;
GRANT EXECUTE ON FUNCTION public.increment_profile_views(TEXT) TO anon, authenticated;

-- Admin RPC: grant/revoke badge
CREATE OR REPLACE FUNCTION public.admin_grant_badge(_target_user UUID, _badge_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'not admin'; END IF;
  INSERT INTO public.user_badges (user_id, badge_id) VALUES (_target_user, _badge_id) ON CONFLICT DO NOTHING;
END; $$;
GRANT EXECUTE ON FUNCTION public.admin_grant_badge(UUID, UUID) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_revoke_badge(_target_user UUID, _badge_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'not admin'; END IF;
  DELETE FROM public.user_badges WHERE user_id = _target_user AND badge_id = _badge_id;
END; $$;
GRANT EXECUTE ON FUNCTION public.admin_revoke_badge(UUID, UUID) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_grant_role(_target_user UUID, _role app_role)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'not admin'; END IF;
  INSERT INTO public.user_roles (user_id, role) VALUES (_target_user, _role) ON CONFLICT DO NOTHING;
END; $$;
GRANT EXECUTE ON FUNCTION public.admin_grant_role(UUID, app_role) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_revoke_role(_target_user UUID, _role app_role)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'not admin'; END IF;
  DELETE FROM public.user_roles WHERE user_id = _target_user AND role = _role;
END; $$;
GRANT EXECUTE ON FUNCTION public.admin_revoke_role(UUID, app_role) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_create_badge(_slug TEXT, _name TEXT, _description TEXT, _icon TEXT, _color TEXT)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE new_id UUID;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'not admin'; END IF;
  INSERT INTO public.badges (slug, name, description, icon, color, is_custom)
  VALUES (_slug, _name, _description, _icon, _color, true) RETURNING id INTO new_id;
  RETURN new_id;
END; $$;
GRANT EXECUTE ON FUNCTION public.admin_create_badge(TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_delete_badge(_badge_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'not admin'; END IF;
  DELETE FROM public.badges WHERE id = _badge_id AND is_custom = true;
END; $$;
GRANT EXECUTE ON FUNCTION public.admin_delete_badge(UUID) TO authenticated;
