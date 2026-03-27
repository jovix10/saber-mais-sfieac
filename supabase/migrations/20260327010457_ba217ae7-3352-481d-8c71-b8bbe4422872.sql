
-- Create app_role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- User roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function for role checking (BEFORE policies)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Users can read own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  unit TEXT NOT NULL DEFAULT 'FIEAC',
  area TEXT NOT NULL DEFAULT '',
  total_hours NUMERIC NOT NULL DEFAULT 0,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Admins can read all profiles" ON public.profiles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Anyone can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- Courses table
CREATE TABLE public.courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  competence TEXT NOT NULL DEFAULT 'Digital',
  hours INTEGER NOT NULL DEFAULT 1,
  provider TEXT DEFAULT '',
  image_url TEXT DEFAULT '',
  external_url TEXT NOT NULL DEFAULT '',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can read active courses" ON public.courses FOR SELECT TO authenticated USING (active = true);
CREATE POLICY "Admins can manage courses" ON public.courses FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Certificates table
CREATE TABLE public.certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  hours INTEGER NOT NULL DEFAULT 0,
  competence TEXT NOT NULL DEFAULT 'Digital',
  status TEXT NOT NULL DEFAULT 'pending',
  file_url TEXT,
  reviewer_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own certificates" ON public.certificates FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own certificates" ON public.certificates FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can read all certificates" ON public.certificates FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update certificates" ON public.certificates FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Achievements table
CREATE TABLE public.achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  user_name TEXT NOT NULL,
  user_unit TEXT NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can read achievements" ON public.achievements FOR SELECT TO authenticated USING (true);
CREATE POLICY "System can insert achievements" ON public.achievements FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Trigger to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, unit, area)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'unit', 'FIEAC'),
    COALESCE(NEW.raw_user_meta_data->>'area', '')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update hours when certificate is approved
CREATE OR REPLACE FUNCTION public.update_hours_on_approval()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
    UPDATE public.profiles
    SET total_hours = total_hours + NEW.hours
    WHERE id = NEW.user_id;
  END IF;
  IF OLD.status = 'approved' AND NEW.status != 'approved' THEN
    UPDATE public.profiles
    SET total_hours = GREATEST(total_hours - OLD.hours, 0)
    WHERE id = OLD.user_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_certificate_status_change
  AFTER UPDATE OF status ON public.certificates
  FOR EACH ROW EXECUTE FUNCTION public.update_hours_on_approval();

-- Insert seed courses
INSERT INTO public.courses (title, description, competence, hours, provider, external_url) VALUES
('IA Generativa para Negócios', 'Aprenda os fundamentos da IA generativa aplicada ao mundo corporativo', 'Digital', 8, 'Coursera', 'https://www.coursera.org'),
('ESG e Sustentabilidade Corporativa', 'Conceitos de ESG aplicados à gestão empresarial', 'Ambiental', 6, 'FGV', 'https://www.fgv.br'),
('Diversidade e Inclusão no Trabalho', 'Práticas inclusivas no ambiente de trabalho', 'Inclusiva', 4, 'SENAI', 'https://www.senai.br'),
('Transformação Digital', 'Estratégias de transformação digital para organizações', 'Digital', 10, 'Google', 'https://grow.google'),
('Economia Circular', 'Princípios de economia circular e sustentabilidade', 'Ambiental', 5, 'SESI', 'https://www.sesi.org.br'),
('Acessibilidade Web', 'Padrões de acessibilidade para web', 'Inclusiva', 3, 'W3C', 'https://www.w3.org');
