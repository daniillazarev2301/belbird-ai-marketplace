-- =====================================================
-- BelBird Self-Hosted Supabase - Начальные данные
-- Выполните этот файл ПОСЛЕ 001_schema.sql
-- =====================================================

-- =====================================================
-- НАСТРОЙКИ САЙТА
-- =====================================================

INSERT INTO public.site_settings (key, value) VALUES
('general', '{"site_name": "BelBird", "tagline": "Премиальный зоомагазин", "logo_url": "", "favicon_url": ""}'),
('contacts', '{"phone": "+7 (800) 123-45-67", "email": "info@belbird.ru", "address": "Москва, ул. Примерная, д. 1", "work_hours": "Пн-Пт: 9:00-21:00, Сб-Вс: 10:00-18:00"}'),
('social', '{"vk": "", "telegram": "", "whatsapp": "", "youtube": "", "rutube": "", "dzen": ""}'),
('seo', '{"meta_title": "BelBird - Премиальный зоомагазин", "meta_description": "Товары для животных, дома и сада с доставкой по России", "meta_keywords": "зоомагазин, товары для животных, корм для собак, корм для кошек"}'),
('delivery', '{"free_delivery_threshold": 3000, "delivery_info": "Бесплатная доставка от 3000 ₽", "delivery_regions": ["Москва", "Санкт-Петербург", "Россия"]}'),
('payment', '{"methods": ["card", "sbp", "cash"], "installment_available": true}'),
('features', '{"show_ai_recommendations": true, "show_stories": true, "show_promo_banner": true, "enable_chat": true}'),
('promo_banner', '{"title": "Скидка 20% на первый заказ", "description": "Используйте промокод WELCOME20", "badge": "Акция", "button_text": "Получить скидку", "button_link": "/catalog", "is_active": true}'),
('flash_sale', '{"title": "Распродажа выходного дня", "description": "Скидки до 50% на популярные товары", "badge": "Горящее предложение", "button_text": "Смотреть товары", "button_link": "/catalog?sale=true", "is_active": false, "end_time": null}'),
('subscription_promo', '{"title": "Подписка с выгодой", "description": "Оформите подписку и экономьте 10% на каждой доставке", "badge": "Выгодно", "button_text": "Узнать больше", "button_link": "/account/subscriptions", "is_active": true}')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- =====================================================
-- КАТЕГОРИИ
-- =====================================================

INSERT INTO public.categories (id, name, slug, sort_order, description) VALUES
('11111111-1111-1111-1111-111111111111', 'Питомцы', 'pets', 1, 'Товары для домашних и сельскохозяйственных животных'),
('22222222-2222-2222-2222-222222222222', 'Дом', 'home', 2, 'Товары для дома и уюта'),
('33333333-3333-3333-3333-333333333333', 'Сад', 'garden', 3, 'Товары для сада и огорода')
ON CONFLICT (slug) DO NOTHING;

-- Подкатегории для Питомцев
INSERT INTO public.categories (name, slug, parent_id, sort_order) VALUES
('Собаки', 'dogs', '11111111-1111-1111-1111-111111111111', 1),
('Кошки', 'cats', '11111111-1111-1111-1111-111111111111', 2),
('Птицы', 'birds', '11111111-1111-1111-1111-111111111111', 3),
('Грызуны', 'rodents', '11111111-1111-1111-1111-111111111111', 4),
('Рыбки и аквариумы', 'fish', '11111111-1111-1111-1111-111111111111', 5),
('Сельхоз животные', 'farm-animals', '11111111-1111-1111-1111-111111111111', 6)
ON CONFLICT (slug) DO NOTHING;

-- =====================================================
-- БРЕНДЫ
-- =====================================================

INSERT INTO public.brands (name, slug) VALUES
('Royal Canin', 'royal-canin'),
('Trixie', 'trixie'),
('FURminator', 'furminator'),
('Bio-Groom', 'bio-groom'),
('Purina', 'purina'),
('Hill''s', 'hills'),
('Monge', 'monge'),
('Farmina', 'farmina'),
('Brit', 'brit'),
('Applaws', 'applaws')
ON CONFLICT (slug) DO NOTHING;

-- =====================================================
-- ЗОНЫ ДОСТАВКИ
-- =====================================================

INSERT INTO public.delivery_zones (name, provider, zone_code, base_cost, free_threshold, delivery_days_min, delivery_days_max, is_active) VALUES
('Москва', 'cdek', 'MSK', 0, 3000, 1, 2, true),
('Санкт-Петербург', 'cdek', 'SPB', 200, 5000, 2, 3, true),
('Московская область', 'cdek', 'MSK-OBL', 300, 5000, 2, 4, true),
('Россия (остальные регионы)', 'cdek', 'RU', 500, 10000, 5, 10, true),
('Москва ПВЗ', 'boxberry', 'MSK', 150, 3000, 1, 2, true),
('Почта России', 'russian_post', 'RU', 350, 7000, 7, 14, true)
ON CONFLICT DO NOTHING;

-- =====================================================
-- ПРОМОКОДЫ
-- =====================================================

INSERT INTO public.promo_codes (code, discount_percent, min_order_amount, is_active, valid_until) VALUES
('WELCOME20', 20, 1000, true, now() + interval '1 year'),
('FIRST10', 10, 500, true, now() + interval '1 year'),
('SALE15', 15, 2000, true, now() + interval '6 months')
ON CONFLICT (code) DO NOTHING;

-- =====================================================
-- СТАТИЧЕСКИЕ СТРАНИЦЫ
-- =====================================================

INSERT INTO public.pages (slug, title, content, is_published) VALUES
('about', 'О нас', '<h1>О компании BelBird</h1><p>BelBird — это премиальный зоомагазин с широким ассортиментом товаров для питомцев, дома и сада.</p><h2>Наша миссия</h2><p>Мы стремимся сделать жизнь ваших питомцев счастливее, предлагая только качественные товары от проверенных производителей.</p>', true),
('delivery', 'Доставка и оплата', '<h1>Доставка и оплата</h1><h2>Способы доставки</h2><ul><li>Курьерская доставка СДЭК</li><li>Пункты выдачи Boxberry</li><li>Почта России</li></ul><h2>Оплата</h2><ul><li>Банковской картой онлайн</li><li>СБП</li><li>При получении</li></ul>', true),
('contacts', 'Контакты', '<h1>Контакты</h1><p>Телефон: +7 (800) 123-45-67</p><p>Email: info@belbird.ru</p><p>Адрес: Москва, ул. Примерная, д. 1</p><p>Время работы: Пн-Пт 9:00-21:00, Сб-Вс 10:00-18:00</p>', true),
('privacy', 'Политика конфиденциальности', '<h1>Политика конфиденциальности</h1><p>Настоящая Политика конфиденциальности определяет порядок обработки и защиты персональных данных пользователей сайта.</p>', true),
('terms', 'Пользовательское соглашение', '<h1>Пользовательское соглашение</h1><p>Настоящее Соглашение определяет условия использования сайта.</p>', true)
ON CONFLICT (slug) DO NOTHING;

-- =====================================================
-- ГОТОВО! Начальные данные установлены.
-- 
-- ВАЖНО: Чтобы назначить пользователя администратором:
-- 1. Зарегистрируйте пользователя через форму регистрации
-- 2. Выполните SQL-запрос:
--    INSERT INTO public.user_roles (user_id, role)
--    SELECT id, 'admin'::app_role FROM auth.users WHERE email = 'your@email.com';
-- =====================================================
