-- Add label fields to products table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS is_bestseller boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS is_new boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS is_ai_recommended boolean DEFAULT false;