import { Instagram, Send, Phone, Mail, MapPin, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useSiteSettings } from "@/hooks/useSiteSettings";

const Footer = () => {
  const { settings } = useSiteSettings();
  
  const siteName = settings?.general?.site_name || "BelBird";
  const logoUrl = settings?.general?.logo_url;
  const contacts = settings?.contacts;
  const social = settings?.social;

  const categories = [
    { label: "Суточная птица", href: "/catalog?category=chicks" },
    { label: "Корма", href: "/catalog?category=feed" },
    { label: "Инкубационное яйцо", href: "/catalog?category=eggs" },
    { label: "Оборудование", href: "/catalog?category=equipment" },
  ];

  const support = [
    { label: "Доставка и оплата", href: "/delivery" },
    { label: "Возврат товара", href: "/returns" },
    { label: "FAQ", href: "/faq" },
    { label: "Контакты", href: "/contacts" },
  ];

  const company = [
    { label: "О компании", href: "/about" },
    { label: "Оптовикам", href: "/wholesale" },
    { label: "Отзывы", href: "/reviews" },
    { label: "Блог", href: "/blog" },
  ];

  return (
    <footer className="border-t border-border bg-muted/30 pb-20 lg:pb-0">
      <div className="container px-4 md:px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-4 lg:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              {logoUrl ? (
                <img src={logoUrl} alt={siteName} className="h-9 w-auto max-w-[120px] object-contain" />
              ) : (
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                  <span className="text-lg font-bold text-primary-foreground">{siteName.charAt(0)}</span>
                </div>
              )}
              <span className="font-serif text-xl font-semibold">{siteName}</span>
            </Link>
            <p className="text-sm text-muted-foreground mb-4">
              Поставщик суточной птицы, кормов и оборудования для птицеводства
            </p>
            
            {/* Contacts */}
            {contacts && (
              <div className="space-y-2 mb-4 text-sm">
                {contacts.phone && (
                  <a href={`tel:${contacts.phone}`} className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                    <Phone className="h-4 w-4" />
                    {contacts.phone}
                  </a>
                )}
                {contacts.email && (
                  <a href={`mailto:${contacts.email}`} className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                    <Mail className="h-4 w-4" />
                    {contacts.email}
                  </a>
                )}
                {contacts.work_hours && (
                  <p className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    {contacts.work_hours}
                  </p>
                )}
              </div>
            )}
            
            {/* Social */}
            <div className="flex gap-3">
              {social?.vk && (
                <a
                  href={social.vk}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted hover:bg-primary hover:text-primary-foreground transition-colors"
                  title="ВКонтакте"
                >
                  <span className="text-sm font-bold">VK</span>
                </a>
              )}
              {social?.telegram && (
                <a
                  href={social.telegram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted hover:bg-primary hover:text-primary-foreground transition-colors"
                  title="Telegram"
                >
                  <Send className="h-4 w-4" />
                </a>
              )}
              {social?.whatsapp && (
                <a
                  href={social.whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted hover:bg-primary hover:text-primary-foreground transition-colors"
                  title="WhatsApp"
                >
                  <Phone className="h-4 w-4" />
                </a>
              )}
              {!social?.vk && !social?.telegram && !social?.whatsapp && (
                <>
                  <a
                    href="https://instagram.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted hover:bg-primary hover:text-primary-foreground transition-colors"
                  >
                    <Instagram className="h-4 w-4" />
                  </a>
                  <a
                    href="https://t.me/belbird"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted hover:bg-primary hover:text-primary-foreground transition-colors"
                  >
                    <Send className="h-4 w-4" />
                  </a>
                </>
              )}
            </div>
          </div>

          {/* Categories */}
          <div>
            <h4 className="font-semibold mb-4">Каталог</h4>
            <ul className="space-y-2">
              {categories.map((item) => (
                <li key={item.href}>
                  <Link
                    to={item.href}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-semibold mb-4">Покупателям</h4>
            <ul className="space-y-2">
              {support.map((item) => (
                <li key={item.href}>
                  <Link
                    to={item.href}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-semibold mb-4">Компания</h4>
            <ul className="space-y-2">
              {company.map((item) => (
                <li key={item.href}>
                  <Link
                    to={item.href}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div className="col-span-2 md:col-span-2 lg:col-span-1">
            <h4 className="font-semibold mb-4">Подписка</h4>
            <p className="text-sm text-muted-foreground mb-3">
              Получайте специальные предложения первыми
            </p>
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="Email"
                className="h-9 bg-background"
              />
              <Button size="sm" className="h-9 px-3">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 pt-6 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <Link to="/privacy" className="hover:text-primary transition-colors">
              Политика конфиденциальности
            </Link>
            <Link to="/terms" className="hover:text-primary transition-colors">
              Условия использования
            </Link>
          </div>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} {siteName}. Все права защищены.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;