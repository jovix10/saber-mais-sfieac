
-- Storage bucket for certificate PDFs
INSERT INTO storage.buckets (id, name, public) VALUES ('certificates', 'certificates', false) ON CONFLICT DO NOTHING;

-- Storage bucket for user avatars
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT DO NOTHING;

-- RLS for certificates bucket
CREATE POLICY "Users can upload own certificates" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'certificates' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can read own certificates" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'certificates' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Admins can read all cert files" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'certificates' AND public.has_role(auth.uid(), 'admin'));

-- RLS for avatars bucket
CREATE POLICY "Users can upload own avatar" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can update own avatar" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Anyone can view avatars" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'avatars');

-- Goals table (admin-configurable for SENAI/SESI)
CREATE TABLE public.unit_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit text NOT NULL UNIQUE,
  goal_hours integer NOT NULL DEFAULT 20,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.unit_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can read goals" ON public.unit_goals
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage goals" ON public.unit_goals
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Seed default goals
INSERT INTO public.unit_goals (unit, goal_hours) VALUES
  ('SENAI', 40), ('SESI', 20), ('FIEAC', 20), ('IEL', 20);

-- Notifications table
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL DEFAULT 'info',
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own notifications" ON public.notifications
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications" ON public.notifications
  FOR INSERT TO authenticated WITH CHECK (true);

-- Enable realtime for notifications and achievements
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.achievements;

-- Allow authenticated users to read all profiles for ranking
CREATE POLICY "Authenticated users can read profiles for ranking" ON public.profiles
  FOR SELECT TO authenticated USING (true);
