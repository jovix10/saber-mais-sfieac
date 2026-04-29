-- 1. Add category to courses (for compliance organization)
ALTER TABLE public.courses 
  ADD COLUMN IF NOT EXISTS compliance_category text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS campaign_month integer DEFAULT NULL;

COMMENT ON COLUMN public.courses.compliance_category IS 'obrigatorio | campanha | introdutorio';
COMMENT ON COLUMN public.courses.campaign_month IS '1-12 for monthly campaigns (Janeiro Branco, etc.)';

-- 2. Compliance badges catalog
CREATE TABLE IF NOT EXISTS public.compliance_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  description text NOT NULL,
  icon text NOT NULL DEFAULT 'shield',
  color text NOT NULL DEFAULT '#F59E0B',
  rule_type text NOT NULL,
  rule_value text,
  required_count integer DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON COLUMN public.compliance_badges.rule_type IS 'category_count | total_hours | course_count';
COMMENT ON COLUMN public.compliance_badges.rule_value IS 'category name or null';

ALTER TABLE public.compliance_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can read compliance badges"
  ON public.compliance_badges FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage compliance badges"
  ON public.compliance_badges FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- 3. User unlocked compliance badges
CREATE TABLE IF NOT EXISTS public.user_compliance_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  badge_id uuid NOT NULL REFERENCES public.compliance_badges(id) ON DELETE CASCADE,
  unlocked_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, badge_id)
);

ALTER TABLE public.user_compliance_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read user compliance badges"
  ON public.user_compliance_badges FOR SELECT TO authenticated USING (true);

CREATE POLICY "System can insert user compliance badges"
  ON public.user_compliance_badges FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 4. Course evaluations (reaction)
CREATE TABLE IF NOT EXISTS public.course_evaluations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  course_id uuid REFERENCES public.courses(id) ON DELETE CASCADE,
  certificate_id uuid REFERENCES public.certificates(id) ON DELETE SET NULL,
  rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.course_evaluations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own evaluations"
  ON public.course_evaluations FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own evaluations"
  ON public.course_evaluations FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can read all evaluations"
  ON public.course_evaluations FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Managers can read team evaluations"
  ON public.course_evaluations FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = course_evaluations.user_id
      AND profiles.manager_id = auth.uid()
  ));

-- 5. Seed default compliance badges catalog
INSERT INTO public.compliance_badges (code, name, description, icon, color, rule_type, rule_value, required_count) VALUES
  ('inclusao', 'Inclusão Social', 'Concluiu curso em Inclusão Social', 'users', '#A855F7', 'category_count', 'Inclusiva', 1),
  ('seguranca_dados', 'Segurança de Dados', 'Concluiu curso de Privacidade/LGPD', 'lock', '#3B82F6', 'category_count', 'LGPD', 1),
  ('combate_corrupcao', 'Combate à Corrupção', 'Concluiu curso anticorrupção/lavagem de dinheiro', 'gavel', '#DC2626', 'category_count', 'Anticorrupcao', 1),
  ('cem_horas', '100 Horas', 'Atingiu 100 horas totais de treinamento', 'clock', '#F59E0B', 'total_hours', NULL, 100),
  ('universidade', 'Universidade Corporativa', 'Concluiu 10 cursos no portal', 'graduation-cap', '#10B981', 'course_count', NULL, 10),
  ('combate_assedio', 'Combate ao Assédio', 'Concluiu treinamento de combate ao assédio', 'shield-check', '#EC4899', 'category_count', 'Assedio', 1),
  ('etica', 'Ética FIEAC', 'Concluiu Código de Ética e Conduta', 'scale', '#0EA5E9', 'category_count', 'Etica', 1)
ON CONFLICT (code) DO NOTHING;