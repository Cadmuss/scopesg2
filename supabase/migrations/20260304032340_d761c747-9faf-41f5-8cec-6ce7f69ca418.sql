
-- Create report_orders table to track paid report requests
CREATE TABLE public.report_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  consultation_data JSONB NOT NULL,
  report_content TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.report_orders ENABLE ROW LEVEL SECURITY;

-- Users can only read their own orders
CREATE POLICY "Users can view their own orders"
ON public.report_orders
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own orders (via edge function with service role, but allow user context too)
CREATE POLICY "Users can create their own orders"
ON public.report_orders
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_report_orders_updated_at
BEFORE UPDATE ON public.report_orders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
