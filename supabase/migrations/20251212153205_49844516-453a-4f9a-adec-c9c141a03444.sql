-- Create storage bucket for product images
INSERT INTO storage.buckets (id, name, public) VALUES ('products', 'products', true);

-- Storage policies for products bucket
CREATE POLICY "Product images are publicly accessible" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'products');

CREATE POLICY "Admins can upload product images" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'products');

CREATE POLICY "Admins can update product images" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'products');

CREATE POLICY "Admins can delete product images" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'products');

-- Create user roles enum and table
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (prevents recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS policies for user_roles
CREATE POLICY "Users can view own roles" 
ON public.user_roles FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles" 
ON public.user_roles FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));

-- Pet profiles table for AI recommendations
CREATE TABLE public.pet_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  species TEXT NOT NULL, -- dog, cat, bird, etc.
  breed TEXT,
  age_years INTEGER,
  weight_kg DECIMAL(5,2),
  allergies TEXT[],
  special_needs TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.pet_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own pets" 
ON public.pet_profiles FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own pets" 
ON public.pet_profiles FOR ALL 
USING (auth.uid() = user_id);

-- Chat messages for AI consultant
CREATE TABLE public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own messages" 
ON public.chat_messages FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own messages" 
ON public.chat_messages FOR INSERT 
WITH CHECK (auth.uid() = user_id);