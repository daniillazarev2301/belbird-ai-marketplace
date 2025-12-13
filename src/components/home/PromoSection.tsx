import { useState, useEffect } from "react";
import { ArrowRight, Clock, Percent } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useSiteSettings, PromoCard } from "@/hooks/useSiteSettings";

const PromoSection = () => {
  const { settings } = useSiteSettings();
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });
  
  const promoCards = settings?.promo_cards?.cards?.filter((c: PromoCard) => c.is_active) || [];
  const mainPromo = promoCards.find((c: PromoCard) => c.type === "main");
  const flashSale = promoCards.find((c: PromoCard) => c.type === "flash_sale");
  const subscription = promoCards.find((c: PromoCard) => c.type === "subscription");

  // Countdown timer for flash sale
  useEffect(() => {
    if (!flashSale?.end_time) return;

    const updateTimer = () => {
      const now = new Date().getTime();
      const endTime = new Date(flashSale.end_time!).getTime();
      const diff = endTime - now;

      if (diff <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      setTimeLeft({
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
      });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [flashSale?.end_time]);

  // Default data if no settings configured
  const defaultMainPromo = {
    title: "Скидка 20% на первый заказ",
    description: "Используйте промокод BELBIRD20 при оформлении заказа",
    button_text: "Использовать",
    button_link: "/catalog",
    badge: "Специальное предложение",
  };

  const defaultFlashSale = {
    title: "Товары дня до -50%",
    description: "Осталось 2 часа 15 минут",
    button_text: "Смотреть",
    button_link: "/catalog",
    badge: "Flash Sale",
  };

  const defaultSubscription = {
    title: "Подписка на корм",
    description: "Экономьте до 15% с регулярной доставкой",
    button_text: "Узнать больше",
    button_link: "/account/subscriptions",
    badge: "Выгодно",
  };

  const main = mainPromo || defaultMainPromo;
  const flash = flashSale || defaultFlashSale;
  const sub = subscription || defaultSubscription;

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
                  {main.badge || "Специальное предложение"}
                </span>
              </div>
              <h3 className="text-2xl md:text-3xl font-serif font-semibold mb-3">
                {main.title}
              </h3>
              <p className="text-base opacity-80 mb-6 max-w-sm">
                {main.description}
              </p>
              <Button
                variant="secondary"
                size="lg"
                className="gap-2"
                asChild
              >
                <Link to={main.button_link || "/catalog"}>
                  {main.button_text || "Использовать"}
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
                      {flash.badge || "Flash Sale"}
                    </span>
                  </div>
                  <h4 className="text-lg font-semibold mb-1">
                    {flash.title}
                  </h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    {flashSale?.end_time 
                      ? `Осталось ${timeLeft.hours}ч ${timeLeft.minutes}м`
                      : flash.description
                    }
                  </p>
                  <Link
                    to={flash.button_link || "/catalog"}
                    className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:gap-3 transition-all"
                  >
                    {flash.button_text || "Смотреть"}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
                <div className="flex gap-2 text-center">
                  <div className="px-3 py-2 rounded-lg bg-secondary/20">
                    <p className="text-xl font-bold text-secondary">
                      {flashSale?.end_time ? String(timeLeft.hours).padStart(2, '0') : "02"}
                    </p>
                    <p className="text-xs text-muted-foreground">часа</p>
                  </div>
                  <div className="px-3 py-2 rounded-lg bg-secondary/20">
                    <p className="text-xl font-bold text-secondary">
                      {flashSale?.end_time ? String(timeLeft.minutes).padStart(2, '0') : "15"}
                    </p>
                    <p className="text-xs text-muted-foreground">мин</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Subscription */}
            <div className="relative overflow-hidden rounded-2xl bg-accent p-5 md:p-6">
              <div>
                <span className="inline-block px-2 py-1 text-xs font-medium bg-primary/10 text-primary rounded mb-2">
                  {sub.badge || "Выгодно"}
                </span>
                <h4 className="text-lg font-semibold mb-1">
                  {sub.title}
                </h4>
                <p className="text-sm text-muted-foreground mb-3">
                  {sub.description}
                </p>
                <Link
                  to={sub.button_link || "/account/subscriptions"}
                  className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:gap-3 transition-all"
                >
                  {sub.button_text || "Узнать больше"}
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