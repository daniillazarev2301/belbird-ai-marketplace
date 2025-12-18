import { Helmet } from "react-helmet-async";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import MobileNav from "@/components/layout/MobileNav";
import { Card, CardContent } from "@/components/ui/card";
import { Star, Quote, MapPin, CheckCircle } from "lucide-react";

const reviews = [
  {
    name: "Сергей Петров",
    location: "Воронежская область",
    business: "КФХ «Заря»",
    rating: 5,
    text: "Работаем с BelBird уже второй год. Заказываем цыплят-бройлеров партиями по 500 голов. Выживаемость отличная — 98%, птица активная, здоровая. Доставка всегда вовремя, документы в порядке.",
    verified: true,
  },
  {
    name: "Анна Козлова",
    location: "Краснодарский край",
    business: "ЛПХ",
    rating: 5,
    text: "Брала утят и гусят для своего подворья. Менеджер подробно проконсультировал по кормлению и содержанию. Птица пришла в отличном состоянии, все живы-здоровы. Рекомендую!",
    verified: true,
  },
  {
    name: "Михаил Иванов",
    location: "Ростовская область",
    business: "ООО «Птицевод»",
    rating: 5,
    text: "Закупаем у BelBird не только птицу, но и корма. Удобно, что всё можно заказать в одном месте. Цены адекватные, для оптовиков скидки. Логистика налажена отлично.",
    verified: true,
  },
  {
    name: "Елена Смирнова",
    location: "Белгородская область",
    business: "Фермерское хозяйство",
    rating: 5,
    text: "Уже третий сезон беру несушек Ломан Браун. Птица отборная, яйценоскость высокая. Очень довольна качеством и сервисом. Отдельное спасибо за оперативность!",
    verified: true,
  },
  {
    name: "Дмитрий Волков",
    location: "Саратовская область",
    business: "КФХ «Волга»",
    rating: 4,
    text: "Заказывал инкубационное яйцо. Процент выводимости — около 85%, что очень неплохо. Упаковка надёжная, яйца пришли целыми. Буду заказывать ещё.",
    verified: true,
  },
  {
    name: "Ольга Новикова",
    location: "Тамбовская область",
    business: "ЛПХ",
    rating: 5,
    text: "Первый раз заказывала птицу через интернет, переживала. Но всё прошло идеально — консультация, оформление, доставка. Цыплята приехали бодрые и активные. Спасибо!",
    verified: true,
  },
];

const cases = [
  {
    title: "Запуск птицефермы на 5000 голов",
    client: "КФХ «Заря», Воронежская область",
    description: "Помогли с нуля организовать птицеферму: подобрали породу, рассчитали кормовую базу, наладили регулярные поставки.",
    results: ["5000 голов бройлеров", "Выживаемость 97%", "Рентабельность 35%"],
  },
  {
    title: "Переход на органическое птицеводство",
    client: "ООО «ЭкоФерма», Краснодарский край",
    description: "Консультировали по переходу на органические корма и породы, подходящие для свободного выгула.",
    results: ["Сертификация «Органик»", "Премиум-сегмент продаж", "Рост маржинальности 40%"],
  },
  {
    title: "Расширение ЛПХ до КФХ",
    client: "Фермерское хозяйство, Ростовская область",
    description: "Помогли личному подсобному хозяйству масштабироваться до крестьянско-фермерского с официальной регистрацией.",
    results: ["Рост с 200 до 2000 голов", "Оформление КФХ", "Выход на оптовый рынок"],
  },
];

const Reviews = () => {
  return (
    <>
      <Helmet>
        <title>Отзывы и кейсы — BelBird | Истории успеха наших клиентов</title>
        <meta name="description" content="Реальные отзывы фермеров о работе с BelBird. Кейсы успешных птицеводческих хозяйств, построенных с нашей помощью." />
      </Helmet>

      <div className="min-h-screen flex flex-col">
        <Header />

        <main className="flex-1">
          {/* Hero */}
          <section className="bg-gradient-to-br from-primary/5 via-background to-secondary/5 py-16 md:py-24">
            <div className="container px-4 md:px-6">
              <div className="max-w-3xl mx-auto text-center">
                <h1 className="text-4xl md:text-5xl font-serif font-bold mb-6">
                  Отзывы и истории успеха
                </h1>
                <p className="text-xl text-muted-foreground">
                  Что говорят о нас фермеры и птицеводы по всей России
                </p>
                <div className="flex justify-center gap-1 mt-6">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-6 w-6 fill-yellow-400 text-yellow-400" />
                  ))}
                  <span className="ml-2 text-lg font-semibold">4.9 / 5</span>
                </div>
              </div>
            </div>
          </section>

          {/* Reviews */}
          <section className="py-16 md:py-24">
            <div className="container px-4 md:px-6">
              <h2 className="text-3xl font-serif font-bold text-center mb-12">
                Отзывы клиентов
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {reviews.map((review, index) => (
                  <Card key={index} className="border-0 shadow-sm">
                    <CardContent className="p-6">
                      {/* Rating */}
                      <div className="flex gap-0.5 mb-4">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${
                              i < review.rating
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-muted"
                            }`}
                          />
                        ))}
                      </div>

                      {/* Quote */}
                      <div className="relative mb-4">
                        <Quote className="absolute -top-2 -left-2 h-8 w-8 text-primary/10" />
                        <p className="text-muted-foreground relative z-10">
                          {review.text}
                        </p>
                      </div>

                      {/* Author */}
                      <div className="flex items-start justify-between pt-4 border-t">
                        <div>
                          <div className="font-semibold flex items-center gap-2">
                            {review.name}
                            {review.verified && (
                              <CheckCircle className="h-4 w-4 text-primary" />
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">{review.business}</div>
                          <div className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                            <MapPin className="h-3 w-3" />
                            {review.location}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>

          {/* Cases */}
          <section className="py-16 md:py-24 bg-muted/30">
            <div className="container px-4 md:px-6">
              <h2 className="text-3xl font-serif font-bold text-center mb-4">
                Кейсы наших клиентов
              </h2>
              <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
                Реальные истории фермеров, которые развили свой бизнес вместе с BelBird
              </p>
              <div className="grid md:grid-cols-3 gap-6">
                {cases.map((caseItem, index) => (
                  <Card key={index} className="border-0 shadow-sm">
                    <CardContent className="p-6">
                      <h3 className="text-xl font-semibold mb-2">{caseItem.title}</h3>
                      <p className="text-sm text-primary mb-4">{caseItem.client}</p>
                      <p className="text-muted-foreground mb-4">{caseItem.description}</p>
                      <div className="space-y-2">
                        <div className="text-sm font-medium">Результаты:</div>
                        {caseItem.results.map((result) => (
                          <div key={result} className="flex items-center gap-2 text-sm text-muted-foreground">
                            <CheckCircle className="h-4 w-4 text-primary shrink-0" />
                            {result}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>

          {/* CTA */}
          <section className="py-16 md:py-24 bg-primary text-primary-foreground">
            <div className="container px-4 md:px-6">
              <div className="max-w-2xl mx-auto text-center">
                <h2 className="text-3xl font-serif font-bold mb-4">
                  Станьте нашим следующим успешным кейсом
                </h2>
                <p className="text-primary-foreground/80 mb-8">
                  Оставьте заявку, и мы поможем вам развить птицеводческое хозяйство
                </p>
                <a
                  href="/wholesale"
                  className="inline-flex items-center justify-center px-8 py-3 rounded-lg bg-background text-foreground font-medium hover:bg-background/90 transition-colors"
                >
                  Оставить заявку
                </a>
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

export default Reviews;
