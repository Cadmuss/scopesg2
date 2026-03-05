
CREATE TABLE public.knowledge_base (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  source_type TEXT NOT NULL DEFAULT 'manual',
  source_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.knowledge_base ENABLE ROW LEVEL SECURITY;

-- Public read for the AI to query
CREATE POLICY "Anyone can read knowledge base" ON public.knowledge_base FOR SELECT USING (true);

-- Only authenticated users can manage (admin use)
CREATE POLICY "Authenticated users can insert" ON public.knowledge_base FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update" ON public.knowledge_base FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete" ON public.knowledge_base FOR DELETE TO authenticated USING (true);
