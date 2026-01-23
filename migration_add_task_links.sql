-- Migration: Add task_links table
-- This table stores links associated with tasks (Plugins, Documentación, Tutoriales)

-- Create task_links table
CREATE TABLE public.task_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  link_type TEXT NOT NULL CHECK (link_type IN ('plugins', 'documentacion', 'tutoriales')),
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.task_links ENABLE ROW LEVEL SECURITY;

-- RLS Policies for task_links
-- Anyone authenticated can read task links
CREATE POLICY "Anyone can view task links"
  ON public.task_links
  FOR SELECT
  TO authenticated
  USING (true);

-- Only admins can insert task links
CREATE POLICY "Only admins can create task links"
  ON public.task_links
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Only admins can update task links
CREATE POLICY "Only admins can update task links"
  ON public.task_links
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Only admins can delete task links
CREATE POLICY "Only admins can delete task links"
  ON public.task_links
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Create index for faster queries
CREATE INDEX idx_task_links_task_id ON public.task_links(task_id);
CREATE INDEX idx_task_links_type ON public.task_links(link_type);
