-- Add rich_content field to products table for rich content blocks
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS rich_content jsonb DEFAULT '[]'::jsonb;

-- Add comment for clarity
COMMENT ON COLUMN public.products.rich_content IS 'Array of rich content blocks (text, image, video) for product page';