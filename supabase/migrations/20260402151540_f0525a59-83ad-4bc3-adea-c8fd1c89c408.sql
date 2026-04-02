
-- Create team_tasks table for manager task assignments
CREATE TABLE public.team_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  assigned_by UUID NOT NULL,
  assigned_to UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  task_type TEXT NOT NULL DEFAULT 'tarefa',
  status TEXT NOT NULL DEFAULT 'pendente',
  due_date DATE,
  evidence_url TEXT,
  evidence_note TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.team_tasks ENABLE ROW LEVEL SECURITY;

-- Managers can do everything with tasks they assigned
CREATE POLICY "Managers can manage their assigned tasks"
ON public.team_tasks FOR ALL
TO authenticated
USING (assigned_by = auth.uid())
WITH CHECK (assigned_by = auth.uid());

-- Users can read tasks assigned to them
CREATE POLICY "Users can read tasks assigned to them"
ON public.team_tasks FOR SELECT
TO authenticated
USING (assigned_to = auth.uid());

-- Users can update tasks assigned to them (status, evidence)
CREATE POLICY "Users can update tasks assigned to them"
ON public.team_tasks FOR UPDATE
TO authenticated
USING (assigned_to = auth.uid());

-- Admins can read all tasks
CREATE POLICY "Admins can read all tasks"
ON public.team_tasks FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
