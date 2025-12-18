import { Users, Package, MapPin, Award, TrendingUp, Clock } from "lucide-react";

const stats = [
  {
    icon: Users,
    value: "500+",
    label: "Постоянных клиентов",
    description: "Фермеры и хозяйства",
  },
  {
    icon: Package,
    value: "1М+",
    label: "Голов поставлено",
    description: "За всё время работы",
  },
  {
    icon: MapPin,
    value: "30+",
    label: "Регионов доставки",
    description: "По всей России",
  },
  {
    icon: Award,
    value: "6 лет",
    label: "На рынке",
    description: "С 2018 года",
  },
  {
    icon: TrendingUp,
    value: "98%",
    label: "Выживаемость",
    description: "Суточной птицы",
  },
  {
    icon: Clock,
    value: "24/7",
    label: "Поддержка",
    description: "Консультации экспертов",
  },
];

const TrustNumbers = () => {
  return (
    <section className="py-16 md:py-24">
      <div className="container px-4 md:px-6">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-serif font-bold mb-4">
            Почему выбирают BelBird
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Цифры, которые говорят о нашей надёжности и опыте в птицеводстве
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="text-center p-6 rounded-2xl bg-card border hover:shadow-md hover:border-primary/30 transition-all"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <stat.icon className="h-6 w-6 text-primary" />
              </div>
              <div className="text-3xl font-bold text-primary mb-1">{stat.value}</div>
              <div className="font-medium text-sm mb-1">{stat.label}</div>
              <div className="text-xs text-muted-foreground">{stat.description}</div>
            </div>
          ))}
        </div>

        {/* Trust badges */}
        <div className="mt-12 flex flex-wrap justify-center gap-4">
          {["Ветеринарные сертификаты", "Гарантия здоровья", "Официальный поставщик"].map((badge) => (
            <div
              key={badge}
              className="px-4 py-2 rounded-full bg-muted text-sm font-medium text-muted-foreground"
            >
              {badge}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrustNumbers;
