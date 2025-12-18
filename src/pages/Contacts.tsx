import { Helmet } from "react-helmet-async";
import { useState } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import MobileNav from "@/components/layout/MobileNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Phone, Mail, MapPin, Clock, Send, MessageCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const contactInfo = [
  {
    icon: Phone,
    title: "Телефон",
    value: "+7 (900) 123-45-67",
    href: "tel:+79001234567",
    description: "Ежедневно с 8:00 до 20:00",
  },
  {
    icon: Mail,
    title: "Email",
    value: "info@belbird.ru",
    href: "mailto:info@belbird.ru",
    description: "Ответим в течение часа",
  },
  {
    icon: MapPin,
    title: "Адрес",
    value: "г. Белгород, ул. Промышленная, 1",
    href: "https://yandex.ru/maps",
    description: "Офис и склад",
  },
  {
    icon: Clock,
    title: "Режим работы",
    value: "Пн-Сб: 8:00-20:00",
    description: "Вс: 10:00-18:00",
  },
];

const messengers = [
  {
    name: "WhatsApp",
    href: "https://wa.me/79001234567",
    color: "bg-green-500",
  },
  {
    name: "Telegram",
    href: "https://t.me/belbird",
    color: "bg-blue-500",
  },
];

const Contacts = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    await new Promise((resolve) => setTimeout(resolve, 1000));

    toast({
      title: "Сообщение отправлено!",
      description: "Мы свяжемся с вами в ближайшее время.",
    });

    setIsSubmitting(false);
    (e.target as HTMLFormElement).reset();
  };

  return (
    <>
      <Helmet>
        <title>Контакты — BelBird | Связаться с нами</title>
        <meta name="description" content="Свяжитесь с BelBird: телефон, email, адрес. Консультации по птицеводству, оформление заказов, доставка по России." />
      </Helmet>

      <div className="min-h-screen flex flex-col">
        <Header />

        <main className="flex-1">
          {/* Hero */}
          <section className="bg-gradient-to-br from-primary/5 via-background to-secondary/5 py-16 md:py-24">
            <div className="container px-4 md:px-6">
              <div className="max-w-3xl mx-auto text-center">
                <h1 className="text-4xl md:text-5xl font-serif font-bold mb-6">
                  Свяжитесь с нами
                </h1>
                <p className="text-xl text-muted-foreground">
                  Готовы ответить на ваши вопросы и помочь с выбором продукции
                </p>
              </div>
            </div>
          </section>

          {/* Contact info */}
          <section className="py-16 md:py-24">
            <div className="container px-4 md:px-6">
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                {contactInfo.map((item) => (
                  <Card key={item.title} className="border-0 shadow-sm">
                    <CardContent className="p-6">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                        <item.icon className="h-6 w-6 text-primary" />
                      </div>
                      <h3 className="font-semibold mb-1">{item.title}</h3>
                      {item.href ? (
                        <a href={item.href} className="text-primary hover:underline block mb-1">
                          {item.value}
                        </a>
                      ) : (
                        <p className="font-medium mb-1">{item.value}</p>
                      )}
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Messengers */}
              <div className="flex justify-center gap-4 mb-12">
                {messengers.map((messenger) => (
                  <a
                    key={messenger.name}
                    href={messenger.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-flex items-center gap-2 px-6 py-3 rounded-lg text-white font-medium hover:opacity-90 transition-opacity ${messenger.color}`}
                  >
                    <MessageCircle className="h-5 w-5" />
                    {messenger.name}
                  </a>
                ))}
              </div>
            </div>
          </section>

          {/* Form & Map */}
          <section className="py-16 md:py-24 bg-muted/30">
            <div className="container px-4 md:px-6">
              <div className="grid lg:grid-cols-2 gap-12">
                {/* Form */}
                <div>
                  <h2 className="text-3xl font-serif font-bold mb-4">
                    Напишите нам
                  </h2>
                  <p className="text-muted-foreground mb-8">
                    Заполните форму, и мы свяжемся с вами в течение часа
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
                            <Label htmlFor="phone">Телефон *</Label>
                            <Input id="phone" type="tel" placeholder="+7 (900) 123-45-67" required />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="email">Email</Label>
                          <Input id="email" type="email" placeholder="ivan@example.ru" />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="subject">Тема обращения</Label>
                          <Input id="subject" placeholder="Консультация по выбору птицы" />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="message">Сообщение *</Label>
                          <Textarea
                            id="message"
                            placeholder="Опишите ваш вопрос или пожелание"
                            rows={4}
                            required
                          />
                        </div>

                        <Button type="submit" size="lg" className="w-full gap-2" disabled={isSubmitting}>
                          <Send className="h-4 w-4" />
                          {isSubmitting ? "Отправка..." : "Отправить сообщение"}
                        </Button>
                      </form>
                    </CardContent>
                  </Card>
                </div>

                {/* Map placeholder */}
                <div>
                  <h2 className="text-3xl font-serif font-bold mb-4">
                    Как нас найти
                  </h2>
                  <p className="text-muted-foreground mb-8">
                    Наш офис и склад находятся в Белгороде
                  </p>
                  <div className="aspect-[4/3] rounded-2xl bg-muted flex items-center justify-center border">
                    <div className="text-center p-8">
                      <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground mb-4">
                        г. Белгород, ул. Промышленная, 1
                      </p>
                      <a
                        href="https://yandex.ru/maps"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        Открыть в Яндекс.Картах
                      </a>
                    </div>
                  </div>
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

export default Contacts;
