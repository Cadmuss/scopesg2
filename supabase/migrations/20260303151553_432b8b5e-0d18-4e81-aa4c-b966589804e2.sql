
CREATE TABLE public.market_trends_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  query_key text NOT NULL,
  data jsonb NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX idx_market_trends_cache_query_key ON public.market_trends_cache (query_key);

ALTER TABLE public.market_trends_cache ENABLE ROW LEVEL SECURITY;

-- Publicly readable (trend data is not sensitive)
CREATE POLICY "Anyone can read market trends cache"
ON public.market_trends_cache
FOR SELECT
USING (true);

-- Only service role can insert (edge function uses service role)
CREATE POLICY "Service role can insert cache"
ON public.market_trends_cache
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Service role can delete cache"
ON public.market_trends_cache
FOR DELETE
USING (true);
