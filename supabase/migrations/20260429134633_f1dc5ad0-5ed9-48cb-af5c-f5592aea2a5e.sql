CREATE TABLE IF NOT EXISTS public.branding_config (
  key text PRIMARY KEY,
  value text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.branding_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read branding"
  ON public.branding_config FOR SELECT TO authenticated, anon USING (true);

CREATE POLICY "Admins can manage branding"
  ON public.branding_config FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

ALTER PUBLICATION supabase_realtime ADD TABLE public.branding_config;