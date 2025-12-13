
-- Create site_settings table for storing all site configuration
CREATE TABLE public.site_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value jsonb NOT NULL DEFAULT '{}',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Everyone can read settings (for displaying on frontend)
CREATE POLICY "Site settings are viewable by everyone"
ON public.site_settings FOR SELECT
USING (true);

-- Only admins can modify settings
CREATE POLICY "Admins can manage site settings"
ON public.site_settings FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Insert default settings
INSERT INTO public.site_settings (key, value) VALUES
('general', '{"site_name": "BelBird", "tagline": "Премиальный зоомагазин", "logo_url": "", "favicon_url": ""}'),
('contacts', '{"phone": "+7 (800) 123-45-67", "email": "info@belbird.ru", "address": "Москва, ул. Примерная, д. 1", "work_hours": "Пн-Пт: 9:00-21:00, Сб-Вс: 10:00-18:00"}'),
('social', '{"vk": "", "telegram": "", "whatsapp": "", "youtube": "", "rutube": "", "dzen": ""}'),
('seo', '{"meta_title": "BelBird - Премиальный зоомагазин", "meta_description": "Товары для животных, дома и сада с доставкой по России", "meta_keywords": "зоомагазин, товары для животных, корм для собак, корм для кошек"}'),
('delivery', '{"free_delivery_threshold": 3000, "delivery_info": "Бесплатная доставка от 3000 ₽", "delivery_regions": ["Москва", "Санкт-Петербург", "Россия"]}'),
('payment', '{"methods": ["card", "sbp", "cash"], "installment_available": true}'),
('features', '{"show_ai_recommendations": true, "show_stories": true, "show_promo_banner": true, "enable_chat": true}')
ON CONFLICT (key) DO NOTHING;

-- Trigger for updated_at
CREATE TRIGGER update_site_settings_updated_at
BEFORE UPDATE ON public.site_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
