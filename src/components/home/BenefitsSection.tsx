import { Truck, Shield, Sparkles, RefreshCw } from "lucide-react";

const benefits = [
  {
    icon: <Truck className="h-6 w-6" />,
    title: "Быстрая доставка",
    description: "От 1 дня по всей России",
  },
  {
    icon: <Shield className="h-6 w-6" />,
    title: "Гарантия качества",
    description: "Только проверенные товары",
  },
  {
    icon: <Sparkles className="h-6 w-6" />,
    title: "AI-рекомендации",
    description: "Персональный подбор",
  },
  {
    icon: <RefreshCw className="h-6 w-6" />,
    title: "Простой возврат",
    description: "30 дней на возврат",
  },
];

const BenefitsSection = () => {
  return (
    <section className="py-8 border-y border-border bg-muted/30">
      <div className="container px-4 md:px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          {benefits.map((benefit, index) => (
            <div
              key={index}
              className="flex flex-col md:flex-row items-center md:items-start text-center md:text-left gap-3"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                {benefit.icon}
              </div>
              <div>
                <h4 className="font-semibold text-sm md:text-base">
                  {benefit.title}
                </h4>
                <p className="text-xs md:text-sm text-muted-foreground">
                  {benefit.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BenefitsSection;
