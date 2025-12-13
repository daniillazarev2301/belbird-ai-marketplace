-- Add specifications (JSONB) field to products table for dynamic product attributes
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS specifications jsonb DEFAULT '{}'::jsonb;

-- Add comment for clarity
COMMENT ON COLUMN public.products.specifications IS 'Dynamic product specifications/attributes as key-value pairs for filtering';