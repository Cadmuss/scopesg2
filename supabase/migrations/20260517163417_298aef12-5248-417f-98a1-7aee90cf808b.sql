
CREATE TABLE public.market_news_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  query_key TEXT NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
CREATE INDEX idx_market_news_cache_key_time ON public.market_news_cache (query_key, created_at DESC);
ALTER TABLE public.market_news_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read news cache" ON public.market_news_cache FOR SELECT USING (true);
