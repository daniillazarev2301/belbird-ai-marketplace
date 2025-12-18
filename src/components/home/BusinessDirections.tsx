import { ArrowRight, Egg, Wheat, Package, Wrench } from "lucide-react";
import { Link } from "react-router-dom";

const directions = [
  {
    icon: Egg,
    title: "Суточная птица",
    description: "Цыплята-бройлеры, несушки, утята, гусята, индюшата. Здоровая птица от проверенных инкубаториев.",
    href: "/catalog?category=chicks",
    color: "from-yellow-500/20 to-orange-500/20",
    items: ["Бройлеры РОСС-308", "Несушки Ломан Браун", "Утята Пекинские", "Гусята Линда"],
  },
  {
    icon: Wheat,
    title: "Корма и добавки",
    description: "Полнорационные комбикорма, премиксы, витамины. Для всех возрастов и видов птицы.",
    href: "/catalog?category=feed",
    color: "from-green-500/20 to-emerald-500/20",
    items: ["Стартовые корма", "Ростовые корма", "Финишные корма", "Премиксы"],
  },
  {
    icon: Package,
    title: "Инкубационное яйцо",
    description: "Отборное инкубационное яйцо с высоким процентом выводимости. Для собственного разведения.",
    href: "/catalog?category=eggs",
    color: "from-blue-500/20 to-cyan-500/20",
    items: ["Яйцо бройлера", "Яйцо несушки", "Яйцо утки", "Яйцо гуся"],
  },
  {
    icon: Wrench,
    title: "Оборудование",
    description: "Инкубаторы, брудеры, поилки, кормушки. Всё для организации птицефермы любого масштаба.",
    href: "/catalog?category=equipment",
    color: "from-purple-500/20 to-pink-500/20",
    items: ["Инкубаторы", "Брудеры", "Кормушки", "Поилки"],
  },
];

const BusinessDirections = () => {
  return (
    <section className="py-16 md:py-24 bg-muted/30">
      <div className="container px-4 md:px-6">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-serif font-bold mb-4">
            Направления бизнеса
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Комплексное решение для птицеводческих хозяйств любого масштаба — от личного подворья до промышленной фермы
          </p>
        </div>

        {/* Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {directions.map((direction) => (
            <Link
              key={direction.title}
              to={direction.href}
              className="group bg-card rounded-2xl border p-6 hover:shadow-lg hover:border-primary/50 transition-all duration-300"
            >
              {/* Icon */}
              <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${direction.color} flex items-center justify-center mb-5`}>
                <direction.icon className="h-7 w-7 text-foreground" />
              </div>

              {/* Content */}
              <h3 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors">
                {direction.title}
              </h3>
              <p className="text-muted-foreground text-sm mb-4">
                {direction.description}
              </p>

              {/* Items list */}
              <ul className="space-y-1.5 mb-4">
                {direction.items.map((item) => (
                  <li key={item} className="text-sm text-muted-foreground flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-primary" />
                    {item}
                  </li>
                ))}
              </ul>

              {/* Link */}
              <div className="flex items-center gap-2 text-primary font-medium text-sm">
                <span>Смотреть каталог</span>
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BusinessDirections;
