
-- Add gestor to the app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'gestor';

-- Add manager_id to profiles to link users to their manager
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS manager_id uuid;

-- Add is_compliance flag to courses
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS is_compliance boolean NOT NULL DEFAULT false;

-- Policy: Gestors can read profiles of their team members
CREATE POLICY "Gestors can read team profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (manager_id = auth.uid());

-- Policy: Gestors can read certificates of their team members
CREATE POLICY "Gestors can read team certificates"
ON public.certificates
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = certificates.user_id
    AND profiles.manager_id = auth.uid()
  )
);
