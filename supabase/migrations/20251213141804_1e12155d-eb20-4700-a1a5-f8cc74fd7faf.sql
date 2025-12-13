-- Create saved_addresses table for storing user delivery addresses
CREATE TABLE public.saved_addresses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  street TEXT,
  house TEXT,
  apartment TEXT,
  postal_code TEXT,
  phone TEXT,
  is_default BOOLEAN DEFAULT false,
  provider TEXT,
  pickup_point_id TEXT,
  pickup_point_name TEXT,
  pickup_point_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.saved_addresses ENABLE ROW LEVEL SECURITY;

-- Users can manage their own addresses
CREATE POLICY "Users can manage own addresses"
ON public.saved_addresses
FOR ALL
USING (auth.uid() = user_id);

-- Add index for faster lookups
CREATE INDEX idx_saved_addresses_user_id ON public.saved_addresses(user_id);

-- Trigger for updated_at
CREATE TRIGGER update_saved_addresses_updated_at
BEFORE UPDATE ON public.saved_addresses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();