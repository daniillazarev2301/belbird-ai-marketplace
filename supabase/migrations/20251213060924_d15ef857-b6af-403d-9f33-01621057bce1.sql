-- Drop old restrictive policies and create permissive ones for categories
DROP POLICY IF EXISTS "Admins can manage categories" ON public.categories;
DROP POLICY IF EXISTS "Categories are viewable by everyone" ON public.categories;

CREATE POLICY "Categories are viewable by everyone" 
ON public.categories 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can insert categories" 
ON public.categories 
FOR INSERT 
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update categories" 
ON public.categories 
FOR UPDATE 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete categories" 
ON public.categories 
FOR DELETE 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Fix products policies too
DROP POLICY IF EXISTS "Admins can manage products" ON public.products;
DROP POLICY IF EXISTS "Products are viewable by everyone" ON public.products;

CREATE POLICY "Products are viewable by everyone" 
ON public.products 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can view all products" 
ON public.products 
FOR SELECT 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert products" 
ON public.products 
FOR INSERT 
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update products" 
ON public.products 
FOR UPDATE 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete products" 
ON public.products 
FOR DELETE 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Fix brands policies
DROP POLICY IF EXISTS "Admins can manage brands" ON public.brands;
DROP POLICY IF EXISTS "Brands are viewable by everyone" ON public.brands;

CREATE POLICY "Brands are viewable by everyone" 
ON public.brands 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can insert brands" 
ON public.brands 
FOR INSERT 
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update brands" 
ON public.brands 
FOR UPDATE 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete brands" 
ON public.brands 
FOR DELETE 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));