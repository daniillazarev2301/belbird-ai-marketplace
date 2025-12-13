-- Create storage bucket for site assets
INSERT INTO storage.buckets (id, name, public)
VALUES ('site-assets', 'site-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public access to site assets
CREATE POLICY "Site assets are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'site-assets');

-- Allow admins to upload site assets
CREATE POLICY "Admins can upload site assets"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'site-assets' AND has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to update site assets
CREATE POLICY "Admins can update site assets"
ON storage.objects FOR UPDATE
USING (bucket_id = 'site-assets' AND has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to delete site assets
CREATE POLICY "Admins can delete site assets"
ON storage.objects FOR DELETE
USING (bucket_id = 'site-assets' AND has_role(auth.uid(), 'admin'::app_role));

-- Enable realtime for orders, products, profiles tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.products;
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;