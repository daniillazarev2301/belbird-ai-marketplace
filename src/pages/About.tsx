import { Helmet } from "react-helmet-async";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import MobileNav from "@/components/layout/MobileNav";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, MapPin, Award, Users, Building, Leaf } from "lucide-react";

const values = [
  {
    icon: Award,
    title: "Качество",
    description: "Только сертифицированная продукция от проверенных поставщиков. Каждая партия проходит ветеринарный контроль.",
  },
  {
    icon: Users,
    title: "Партнёрство",
    description: "Долгосрочные отношения с клиентами. Индивидуальный подход к каждому хозяйству.",
  },
  {
    icon: Leaf,
    title: "Экология",
    description: "Поддержка фермеров, практикующих устойчивое сельское хозяйство и органическое производство.",
  },
];

const milestones = [
  { year: "2018", event: "Основание компании в Белгородской области" },
  { year: "2019", event: "Запуск собственного инкубатория" },
  { year: "2020", event: "Расширение географии доставки на 15 регионов" },
  { year: "2021", event: "Партнёрство с крупнейшими производителями кормов" },
  { year: "2022", event: "Открытие логистического центра" },
  { year: "2023", event: "Запуск онлайн-платформы BelBird" },
  { year: "2024", event: "Доставка в 30+ регионов России" },
];

const certificates = [
  "Ветеринарное свидетельство формы №1",
  "Сертификат соответствия ГОСТ",
  "Декларация о соответствии ТР ТС",
  "Регистрация в системе «Меркурий»",
];

const About = () => {
  return (
    <>
      <Helmet>
        <title>О компании — BelBird | Надёжный поставщик для птицеводства</title>
        <meta name="description" content="BelBird — надёжный поставщик суточной птицы и кормов с 2018 года. Собственное производство, сертифицированная продукция, доставка по всей России." />
      </Helmet>

      <div className="min-h-screen flex flex-col">
        <Header />

        <main className="flex-1">
          {/* Hero */}
          <section className="bg-gradient-to-br from-primary/5 via-background to-secondary/5 py-16 md:py-24">
            <div className="container px-4 md:px-6">
              <div className="max-w-3xl mx-auto text-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary border border-primary/20 mb-6">
                  <Building className="h-4 w-4" />
                  <span className="text-sm font-medium">С 2018 года на рынке</span>
                </div>
                <h1 className="text-4xl md:text-5xl font-serif font-bold mb-6">
                  Надёжный партнёр для вашего хозяйства
                </h1>
                <p className="text-xl text-muted-foreground">
                  Мы помогаем фермерам по всей России развивать птицеводство, обеспечивая качественной птицей, кормами и профессиональной поддержкой.
                </p>
              </div>
            </div>
          </section>

          {/* Story */}
          <section className="py-16 md:py-24">
            <div className="container px-4 md:px-6">
              <div className="grid lg:grid-cols-2 gap-12 items-center">
                <div>
                  <h2 className="text-3xl font-serif font-bold mb-6">Наша история</h2>
                  <div className="space-y-4 text-muted-foreground">
                    <p>
                      BelBird начинался как небольшое семейное хозяйство в Белгородской области. 
                      Мы сами занимались разведением птицы и хорошо знаем все трудности, с которыми сталкиваются фермеры.
                    </p>
                    <p>
                      Сегодня BelBird — это современная платформа, объединяющая проверенных поставщиков суточной птицы, 
                      производителей кормов и фермерские хозяйства по всей России.
                    </p>
                    <p>
                      Наша миссия — сделать качественные ресурсы для птицеводства доступными для хозяйств любого масштаба, 
                      от личного подворья до промышленной фермы.
                    </p>
                  </div>
                </div>

                {/* Timeline */}
                <div className="bg-card rounded-2xl border p-6">
                  <h3 className="font-semibold mb-6">Ключевые этапы</h3>
                  <div className="space-y-4">
                    {milestones.map((milestone, index) => (
                      <div key={milestone.year} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                            {milestone.year.slice(2)}
                          </div>
                          {index < milestones.length - 1 && (
                            <div className="w-px h-full bg-border mt-2" />
                          )}
                        </div>
                        <div className="pb-4">
                          <div className="font-medium">{milestone.year}</div>
                          <div className="text-sm text-muted-foreground">{milestone.event}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Values */}
          <section className="py-16 md:py-24 bg-muted/30">
            <div className="container px-4 md:px-6">
              <h2 className="text-3xl font-serif font-bold text-center mb-12">
                Наши ценности
              </h2>
              <div className="grid md:grid-cols-3 gap-6">
                {values.map((value) => (
                  <Card key={value.title} className="border-0 shadow-sm">
                    <CardContent className="p-6">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                        <value.icon className="h-6 w-6 text-primary" />
                      </div>
                      <h3 className="text-xl font-semibold mb-2">{value.title}</h3>
                      <p className="text-muted-foreground">{value.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>

          {/* Certificates */}
          <section className="py-16 md:py-24">
            <div className="container px-4 md:px-6">
              <div className="max-w-3xl mx-auto text-center">
                <h2 className="text-3xl font-serif font-bold mb-4">
                  Документы и сертификаты
                </h2>
                <p className="text-muted-foreground mb-8">
                  Вся наша продукция сертифицирована и соответствует требованиям законодательства
                </p>
                <div className="grid sm:grid-cols-2 gap-4">
                  {certificates.map((cert) => (
                    <div key={cert} className="flex items-center gap-3 p-4 rounded-xl bg-card border text-left">
                      <CheckCircle className="h-5 w-5 text-primary shrink-0" />
                      <span className="text-sm">{cert}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Location */}
          <section className="py-16 md:py-24 bg-muted/30">
            <div className="container px-4 md:px-6">
              <div className="max-w-xl mx-auto text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                  <MapPin className="h-8 w-8 text-primary" />
                </div>
                <h2 className="text-3xl font-serif font-bold mb-4">
                  Мы находимся в Белгороде
                </h2>
                <p className="text-muted-foreground mb-6">
                  Центральное расположение позволяет нам оперативно доставлять продукцию по всей России — 
                  от Калининграда до Владивостока.
                </p>
                <p className="text-lg font-medium">
                  г. Белгород, ул. Промышленная, 1
                </p>
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

export default About;
