
-- Add visible_in_ranking to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS visible_in_ranking boolean NOT NULL DEFAULT true;

-- Set joao.ferreira hidden from ranking
UPDATE public.profiles SET visible_in_ranking = false WHERE email = 'joao.ferreira@fieac.org.br';
