import { MapPin, Phone, Mail, Instagram, Send } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const Footer = () => {
  const categories = [
    { label: "Любимцы", href: "/pets" },
    { label: "Уют и Дом", href: "/home" },
    { label: "Сад и Огород", href: "/garden" },
    { label: "Акции", href: "/sales" },
  ];

  const support = [
    { label: "Доставка и оплата", href: "/delivery" },
    { label: "Возврат товара", href: "/returns" },
    { label: "FAQ", href: "/faq" },
    { label: "Контакты", href: "/contacts" },
  ];

  const company = [
    { label: "О нас", href: "/about" },
    { label: "Блог", href: "/blog" },
    { label: "Карьера", href: "/careers" },
    { label: "Партнёрам", href: "/partners" },
  ];

  return (
    <footer className="border-t border-border bg-muted/30 pb-20 lg:pb-0">
      <div className="container px-4 md:px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-4 lg:col-span-1">
            <a href="/" className="flex items-center gap-2 mb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                <span className="text-lg font-bold text-primary-foreground">B</span>
              </div>
              <span className="font-serif text-xl font-semibold">BelBird</span>
            </a>
            <p className="text-sm text-muted-foreground mb-4">
              Премиальный маркетплейс для ваших любимцев, дома и сада
            </p>
            <div className="flex gap-3">
              <a
                href="#"
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                <Instagram className="h-4 w-4" />
              </a>
              <a
                href="#"
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                <Send className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Categories */}
          <div>
            <h4 className="font-semibold mb-4">Каталог</h4>
            <ul className="space-y-2">
              {categories.map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {item.label}
                  </a>
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
                  <a
                    href={item.href}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {item.label}
                  </a>
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
                  <a
                    href={item.href}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {item.label}
                  </a>
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
            <a href="/privacy" className="hover:text-primary transition-colors">
              Политика конфиденциальности
            </a>
            <a href="/terms" className="hover:text-primary transition-colors">
              Условия использования
            </a>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2024 BelBird. Все права защищены.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
