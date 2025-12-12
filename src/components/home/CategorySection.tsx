import { ArrowRight, PawPrint, Home, Flower2 } from "lucide-react";
import categoryPets from "@/assets/category-pets.jpg";
import categoryHome from "@/assets/category-home.jpg";
import categoryGarden from "@/assets/category-garden.jpg";

interface CategoryCardProps {
  title: string;
  description: string;
  image: string;
  icon: React.ReactNode;
  href: string;
  itemCount: number;
}

const CategoryCard = ({ title, description, image, icon, href, itemCount }: CategoryCardProps) => (
  <a
    href={href}
    className="group relative overflow-hidden rounded-2xl bg-card shadow-card hover:shadow-elevated transition-all duration-300"
  >
    {/* Image */}
    <div className="aspect-[4/5] md:aspect-[3/4] overflow-hidden">
      <img
        src={image}
        alt={title}
        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
      />
    </div>

    {/* Overlay */}
    <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/20 to-transparent" />

    {/* Content */}
    <div className="absolute inset-x-0 bottom-0 p-5 md:p-6">
      <div className="flex items-center gap-2 mb-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20 text-primary-foreground backdrop-blur-sm">
          {icon}
        </div>
        <span className="text-xs font-medium text-primary-foreground/80">
          {itemCount.toLocaleString()} товаров
        </span>
      </div>
      <h3 className="text-xl md:text-2xl font-serif font-semibold text-primary-foreground mb-1">
        {title}
      </h3>
      <p className="text-sm text-primary-foreground/70 mb-3 line-clamp-2">
        {description}
      </p>
      <div className="flex items-center gap-2 text-sm font-medium text-primary-foreground group-hover:gap-3 transition-all">
        <span>Смотреть</span>
        <ArrowRight className="h-4 w-4" />
      </div>
    </div>
  </a>
);

const CategorySection = () => {
  const categories = [
    {
      title: "Любимцы",
      description: "Корма, аксессуары и товары для здоровья ваших питомцев",
      image: categoryPets,
      icon: <PawPrint className="h-4 w-4" />,
      href: "/pets",
      itemCount: 15420,
    },
    {
      title: "Уют и Дом",
      description: "Декор, текстиль и эко-товары для комфортного пространства",
      image: categoryHome,
      icon: <Home className="h-4 w-4" />,
      href: "/home",
      itemCount: 23150,
    },
    {
      title: "Сад и Огород",
      description: "Семена, инструменты и всё для цветущего сада",
      image: categoryGarden,
      icon: <Flower2 className="h-4 w-4" />,
      href: "/garden",
      itemCount: 12890,
    },
  ];

  return (
    <section className="py-12 md:py-16 lg:py-20">
      <div className="container px-4 md:px-6">
        {/* Header */}
        <div className="flex items-end justify-between mb-8 md:mb-10">
          <div>
            <h2 className="text-2xl md:text-3xl font-serif font-semibold mb-2">
              Категории
            </h2>
            <p className="text-muted-foreground">
              Выберите направление для покупок
            </p>
          </div>
          <a
            href="/catalog"
            className="hidden md:flex items-center gap-2 text-sm font-medium text-primary hover:gap-3 transition-all"
          >
            Весь каталог
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {categories.map((category) => (
            <CategoryCard key={category.href} {...category} />
          ))}
        </div>

        {/* Mobile link */}
        <a
          href="/catalog"
          className="flex md:hidden items-center justify-center gap-2 text-sm font-medium text-primary mt-6 py-3"
        >
          Весь каталог
          <ArrowRight className="h-4 w-4" />
        </a>
      </div>
    </section>
  );
};

export default CategorySection;
