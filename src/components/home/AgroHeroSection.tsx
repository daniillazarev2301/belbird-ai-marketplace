import { ArrowRight, Phone, CheckCircle, TrendingUp, Truck, Shield } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const AgroHeroSection = () => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />
      
      <div className="relative container px-4 md:px-6 py-16 md:py-24 lg:py-32">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="space-y-8">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary border border-primary/20">
              <TrendingUp className="h-4 w-4" />
              <span className="text-sm font-medium">Надёжный поставщик с 2018 года</span>
            </div>

            {/* Heading */}
            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold tracking-tight">
                Всё для успешного
                <span className="block text-primary">птицеводства</span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-lg">
                Суточная птица, инкубационное яйцо, премиальные корма и оборудование. 
                Работаем с фермерами по всей России.
              </p>
            </div>

            {/* Trust points */}
            <div className="flex flex-wrap gap-4">
              {[
                "Сертифицированная продукция",
                "Собственное производство",
                "Гарантия качества",
              ].map((point) => (
                <div key={point} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  <span>{point}</span>
                </div>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" className="gap-2 text-base h-12 px-8" asChild>
                <Link to="/catalog">
                  Каталог продукции
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="gap-2 text-base h-12 px-8" asChild>
                <Link to="/wholesale">
                  <Phone className="h-4 w-4" />
                  Оптовикам
                </Link>
              </Button>
            </div>

            {/* Quick stats */}
            <div className="flex gap-8 pt-4">
              <div>
                <div className="text-3xl font-bold text-primary">500+</div>
                <div className="text-sm text-muted-foreground">Партнёров</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-primary">50К+</div>
                <div className="text-sm text-muted-foreground">Голов в месяц</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-primary">30+</div>
                <div className="text-sm text-muted-foreground">Регионов</div>
              </div>
            </div>
          </div>

          {/* Bento Grid Cards */}
          <div className="grid grid-cols-2 gap-4">
            {/* Main card */}
            <div className="col-span-2 bg-card rounded-2xl p-6 border shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-primary/10">
                  <Truck className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">Доставка по всей России</h3>
                  <p className="text-muted-foreground text-sm">
                    Специализированный транспорт для перевозки живой птицы. Контроль температуры и влажности.
                  </p>
                </div>
              </div>
            </div>

            {/* Product card 1 */}
            <Link to="/catalog?category=chicks" className="group bg-card rounded-2xl p-5 border shadow-sm hover:shadow-md hover:border-primary/50 transition-all">
              <div className="aspect-square rounded-xl bg-gradient-to-br from-yellow-100 to-yellow-200 dark:from-yellow-900/30 dark:to-yellow-800/30 mb-4 flex items-center justify-center">
                <span className="text-5xl">🐣</span>
              </div>
              <h3 className="font-semibold mb-1 group-hover:text-primary transition-colors">Суточная птица</h3>
              <p className="text-sm text-muted-foreground">Цыплята, утята, гусята</p>
            </Link>

            {/* Product card 2 */}
            <Link to="/catalog?category=feed" className="group bg-card rounded-2xl p-5 border shadow-sm hover:shadow-md hover:border-primary/50 transition-all">
              <div className="aspect-square rounded-xl bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-900/30 dark:to-amber-800/30 mb-4 flex items-center justify-center">
                <span className="text-5xl">🌾</span>
              </div>
              <h3 className="font-semibold mb-1 group-hover:text-primary transition-colors">Корма</h3>
              <p className="text-sm text-muted-foreground">Комбикорм, премиксы</p>
            </Link>

            {/* Trust card */}
            <div className="col-span-2 bg-primary text-primary-foreground rounded-2xl p-6">
              <div className="flex items-center gap-4">
                <Shield className="h-8 w-8" />
                <div>
                  <h3 className="font-semibold text-lg">Гарантия здоровья птицы</h3>
                  <p className="text-primary-foreground/80 text-sm">
                    Вся птица вакцинирована и проходит ветеринарный контроль
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AgroHeroSection;
