import { ArrowRight, Clock, Percent } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const PromoSection = () => {
  return (
    <section className="py-12 md:py-16">
      <div className="container px-4 md:px-6">
        <div className="grid md:grid-cols-2 gap-4 md:gap-6">
          {/* Main Promo */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-primary/80 p-6 md:p-8 lg:p-10 text-primary-foreground">
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-4">
                <Percent className="h-5 w-5" />
                <span className="text-sm font-medium opacity-90">
                  Специальное предложение
                </span>
              </div>
              <h3 className="text-2xl md:text-3xl font-serif font-semibold mb-3">
                Скидка 20% на первый заказ
              </h3>
              <p className="text-base opacity-80 mb-6 max-w-sm">
                Используйте промокод BELBIRD20 при оформлении заказа
              </p>
              <Button
                variant="secondary"
                size="lg"
                className="gap-2"
                asChild
              >
                <Link to="/catalog">
                  Использовать
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
            {/* Decorative circles */}
            <div className="absolute -right-10 -bottom-10 w-40 h-40 rounded-full bg-primary-foreground/10" />
            <div className="absolute right-20 bottom-20 w-20 h-20 rounded-full bg-primary-foreground/5" />
          </div>

          {/* Secondary Promos */}
          <div className="grid gap-4 md:gap-6">
            {/* Flash Sale */}
            <div className="relative overflow-hidden rounded-2xl bg-secondary/10 p-5 md:p-6 border border-secondary/20">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-4 w-4 text-secondary" />
                    <span className="text-sm font-medium text-secondary">
                      Flash Sale
                    </span>
                  </div>
                  <h4 className="text-lg font-semibold mb-1">
                    Товары дня до -50%
                  </h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Осталось 2 часа 15 минут
                  </p>
                  <Link
                    to="/catalog"
                    className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:gap-3 transition-all"
                  >
                    Смотреть
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
                <div className="flex gap-2 text-center">
                  <div className="px-3 py-2 rounded-lg bg-secondary/20">
                    <p className="text-xl font-bold text-secondary">02</p>
                    <p className="text-xs text-muted-foreground">часа</p>
                  </div>
                  <div className="px-3 py-2 rounded-lg bg-secondary/20">
                    <p className="text-xl font-bold text-secondary">15</p>
                    <p className="text-xs text-muted-foreground">мин</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Subscription */}
            <div className="relative overflow-hidden rounded-2xl bg-accent p-5 md:p-6">
              <div>
                <span className="inline-block px-2 py-1 text-xs font-medium bg-primary/10 text-primary rounded mb-2">
                  Выгодно
                </span>
                <h4 className="text-lg font-semibold mb-1">
                  Подписка на корм
                </h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Экономьте до 15% с регулярной доставкой
                </p>
                <Link
                  to="/account/subscriptions"
                  className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:gap-3 transition-all"
                >
                  Узнать больше
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PromoSection;
