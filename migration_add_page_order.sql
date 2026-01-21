-- Add order column to documentation_pages table
ALTER TABLE public.documentation_pages 
ADD COLUMN IF NOT EXISTS "order" INTEGER NOT NULL DEFAULT 0;

-- Set initial order based on created_at for existing pages
WITH ordered_pages AS (
  SELECT 
    id,
    section_id,
    ROW_NUMBER() OVER (PARTITION BY section_id ORDER BY created_at) - 1 as new_order
  FROM public.documentation_pages
)
UPDATE public.documentation_pages p
SET "order" = op.new_order
FROM ordered_pages op
WHERE p.id = op.id;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_documentation_pages_section_order 
ON public.documentation_pages(section_id, "order");
