import { Helmet } from "react-helmet-async";
import { useState } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import MobileNav from "@/components/layout/MobileNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Truck, FileText, Users, Phone, Mail, Calculator } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const benefits = [
  {
    icon: Calculator,
    title: "Выгодные цены",
    description: "Скидки от 10% при заказе от 100 голов. Индивидуальные условия для постоянных клиентов.",
  },
  {
    icon: Truck,
    title: "Собственная логистика",
    description: "Специализированный транспорт для перевозки живой птицы. Доставка по всей России.",
  },
  {
    icon: FileText,
    title: "Полный пакет документов",
    description: "Ветеринарные свидетельства, сертификаты качества, договор поставки.",
  },
  {
    icon: Users,
    title: "Персональный менеджер",
    description: "Выделенный специалист для решения любых вопросов и оперативной связи.",
  },
];

const priceTiers = [
  { volume: "до 100 голов", discount: "Розничная цена" },
  { volume: "100-500 голов", discount: "Скидка 10%" },
  { volume: "500-1000 голов", discount: "Скидка 15%" },
  { volume: "от 1000 голов", discount: "Индивидуально" },
];

const Wholesale = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate form submission
    await new Promise((resolve) => setTimeout(resolve, 1000));

    toast({
      title: "Заявка отправлена!",
      description: "Наш менеджер свяжется с вами в течение часа.",
    });

    setIsSubmitting(false);
    (e.target as HTMLFormElement).reset();
  };

  return (
    <>
      <Helmet>
        <title>Оптовикам — BelBird | Оптовые поставки птицы и кормов</title>
        <meta name="description" content="Оптовые поставки суточной птицы, кормов и оборудования. Скидки от 10%, собственная логистика, полный пакет документов. Работаем с фермерами по всей России." />
      </Helmet>

      <div className="min-h-screen flex flex-col">
        <Header />

        <main className="flex-1">
          {/* Hero */}
          <section className="bg-gradient-to-br from-primary/5 via-background to-secondary/5 py-16 md:py-24">
            <div className="container px-4 md:px-6">
              <div className="max-w-3xl mx-auto text-center">
                <h1 className="text-4xl md:text-5xl font-serif font-bold mb-6">
                  Оптовые поставки для вашего бизнеса
                </h1>
                <p className="text-xl text-muted-foreground mb-8">
                  Надёжный партнёр для птицеводческих хозяйств. Суточная птица, корма, оборудование — всё в одном месте с гарантией качества.
                </p>
                <div className="flex flex-wrap justify-center gap-4">
                  <Button size="lg" asChild>
                    <a href="#form">Оставить заявку</a>
                  </Button>
                  <Button size="lg" variant="outline" asChild>
                    <a href="tel:+79001234567">
                      <Phone className="h-4 w-4 mr-2" />
                      Позвонить
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          </section>

          {/* Benefits */}
          <section className="py-16 md:py-24">
            <div className="container px-4 md:px-6">
              <h2 className="text-3xl font-serif font-bold text-center mb-12">
                Преимущества работы с BelBird
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {benefits.map((benefit) => (
                  <Card key={benefit.title} className="border-0 shadow-sm">
                    <CardHeader>
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                        <benefit.icon className="h-6 w-6 text-primary" />
                      </div>
                      <CardTitle className="text-lg">{benefit.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground text-sm">{benefit.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>

          {/* Pricing tiers */}
          <section className="py-16 md:py-24 bg-muted/30">
            <div className="container px-4 md:px-6">
              <div className="max-w-3xl mx-auto">
                <h2 className="text-3xl font-serif font-bold text-center mb-4">
                  Оптовые скидки
                </h2>
                <p className="text-center text-muted-foreground mb-12">
                  Чем больше объём — тем выгоднее цена. Для постоянных клиентов дополнительные бонусы.
                </p>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {priceTiers.map((tier, index) => (
                    <div
                      key={tier.volume}
                      className={`p-6 rounded-2xl text-center ${
                        index === 3
                          ? "bg-primary text-primary-foreground"
                          : "bg-card border"
                      }`}
                    >
                      <div className="font-semibold mb-2">{tier.volume}</div>
                      <div className={`text-sm ${index === 3 ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                        {tier.discount}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Form */}
          <section id="form" className="py-16 md:py-24">
            <div className="container px-4 md:px-6">
              <div className="max-w-2xl mx-auto">
                <h2 className="text-3xl font-serif font-bold text-center mb-4">
                  Оставить заявку
                </h2>
                <p className="text-center text-muted-foreground mb-8">
                  Заполните форму, и наш менеджер свяжется с вами в течение часа
                </p>

                <Card>
                  <CardContent className="p-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="name">Имя *</Label>
                          <Input id="name" placeholder="Иван Иванов" required />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="company">Компания / Хозяйство</Label>
                          <Input id="company" placeholder="ООО Ферма" />
                        </div>
                      </div>

                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="phone">Телефон *</Label>
                          <Input id="phone" type="tel" placeholder="+7 (900) 123-45-67" required />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email">Email</Label>
                          <Input id="email" type="email" placeholder="ivan@example.ru" />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="region">Регион доставки</Label>
                        <Input id="region" placeholder="Московская область" />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="message">Что вас интересует? *</Label>
                        <Textarea
                          id="message"
                          placeholder="Опишите, какую продукцию и в каком объёме хотите заказать"
                          rows={4}
                          required
                        />
                      </div>

                      <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
                        {isSubmitting ? "Отправка..." : "Отправить заявку"}
                      </Button>

                      <p className="text-xs text-center text-muted-foreground">
                        Нажимая кнопку, вы соглашаетесь с{" "}
                        <a href="/privacy" className="underline hover:text-primary">
                          политикой конфиденциальности
                        </a>
                      </p>
                    </form>
                  </CardContent>
                </Card>
              </div>
            </div>
          </section>

          {/* Contact info */}
          <section className="py-16 md:py-24 bg-muted/30">
            <div className="container px-4 md:px-6">
              <div className="max-w-xl mx-auto text-center">
                <h2 className="text-2xl font-serif font-bold mb-6">Связаться напрямую</h2>
                <div className="flex flex-col sm:flex-row justify-center gap-6">
                  <a href="tel:+79001234567" className="flex items-center justify-center gap-2 text-lg hover:text-primary transition-colors">
                    <Phone className="h-5 w-5" />
                    +7 (900) 123-45-67
                  </a>
                  <a href="mailto:opt@belbird.ru" className="flex items-center justify-center gap-2 text-lg hover:text-primary transition-colors">
                    <Mail className="h-5 w-5" />
                    opt@belbird.ru
                  </a>
                </div>
              </div>
            </div>
          </section>
        </main>

        <Footer />
        <MobileNav />
      </div>
    </>
  );
};

export default Wholesale;
