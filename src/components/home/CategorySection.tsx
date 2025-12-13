import { ArrowRight, Dog, Cat, Bird, Fish, Rabbit, Egg } from "lucide-react";
import { Link } from "react-router-dom";
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
  size?: "large" | "small";
}

const CategoryCard = ({ title, description, image, icon, href, itemCount, size = "large" }: CategoryCardProps) => (
  <Link
    to={href}
    className="group relative overflow-hidden rounded-2xl bg-card shadow-card hover:shadow-elevated transition-all duration-300"
  >
    {/* Image */}
    <div className={size === "large" ? "aspect-[4/5] md:aspect-[3/4]" : "aspect-[4/3]"}>
      <img
        src={image}
        alt={title}
        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
      />
    </div>

    {/* Overlay */}
    <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/20 to-transparent" />

    {/* Content */}
    <div className="absolute inset-x-0 bottom-0 p-4 md:p-5">
      <div className="flex items-center gap-2 mb-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20 text-primary-foreground backdrop-blur-sm">
          {icon}
        </div>
        <span className="text-xs font-medium text-primary-foreground/80">
          {itemCount.toLocaleString()} товаров
        </span>
      </div>
      <h3 className={`${size === "large" ? "text-xl md:text-2xl" : "text-lg"} font-serif font-semibold text-primary-foreground mb-1`}>
        {title}
      </h3>
      <p className="text-sm text-primary-foreground/70 mb-2 line-clamp-2">
        {description}
      </p>
      <div className="flex items-center gap-2 text-sm font-medium text-primary-foreground group-hover:gap-3 transition-all">
        <span>Смотреть</span>
        <ArrowRight className="h-4 w-4" />
      </div>
    </div>
  </Link>
);

const CategorySection = () => {
  const mainCategories = [
    {
      title: "Собаки",
      description: "Корма, лакомства, игрушки, амуниция и ветпрепараты",
      image: categoryPets,
      icon: <Dog className="h-4 w-4" />,
      href: "/catalog/dogs",
      itemCount: 8420,
    },
    {
      title: "Кошки",
      description: "Корма, наполнители, когтеточки и аксессуары",
      image: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=600&h=800&fit=crop",
      icon: <Cat className="h-4 w-4" />,
      href: "/catalog/cats",
      itemCount: 6150,
    },
    {
      title: "Птицы и попугаи",
      description: "Корма, клетки, игрушки для попугаев и канареек",
      image: "https://images.unsplash.com/photo-1552728089-57bdde30beb3?w=600&h=800&fit=crop",
      icon: <Bird className="h-4 w-4" />,
      href: "/catalog/birds",
      itemCount: 3890,
    },
  ];

  const secondaryCategories = [
    {
      title: "Грызуны",
      description: "Хомяки, кролики, морские свинки",
      image: "https://images.unsplash.com/photo-1425082661705-1834bfd09dca?w=400&h=300&fit=crop",
      icon: <Rabbit className="h-4 w-4" />,
      href: "/catalog/rodents",
      itemCount: 2340,
    },
    {
      title: "Рыбки и аквариумы",
      description: "Корма, аквариумы, оборудование",
      image: "https://images.unsplash.com/photo-1522069169874-c58ec4b76be5?w=400&h=300&fit=crop",
      icon: <Fish className="h-4 w-4" />,
      href: "/catalog/fish",
      itemCount: 4120,
    },
    {
      title: "Сельхоз животные",
      description: "Корма для кур, цыплят, уток и других",
      image: categoryGarden,
      icon: <Egg className="h-4 w-4" />,
      href: "/catalog/farm",
      itemCount: 5670,
    },
  ];

  return (
    <section className="py-12 md:py-16 lg:py-20">
      <div className="container px-4 md:px-6">
        {/* Header */}
        <div className="flex items-end justify-between mb-8 md:mb-10">
          <div>
            <h2 className="text-2xl md:text-3xl font-serif font-semibold mb-2">
              Категории животных
            </h2>
            <p className="text-muted-foreground">
              Товары для домашних и сельскохозяйственных питомцев
            </p>
          </div>
          <Link
            to="/catalog"
            className="hidden md:flex items-center gap-2 text-sm font-medium text-primary hover:gap-3 transition-all"
          >
            Весь каталог
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Main Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-4 md:mb-6">
          {mainCategories.map((category) => (
            <CategoryCard key={category.href} {...category} size="large" />
          ))}
        </div>

        {/* Secondary Categories Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
          {secondaryCategories.map((category) => (
            <CategoryCard key={category.href} {...category} size="small" />
          ))}
        </div>

        {/* Mobile link */}
        <Link
          to="/catalog"
          className="flex md:hidden items-center justify-center gap-2 text-sm font-medium text-primary mt-6 py-3"
        >
          Весь каталог
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
};

export default CategorySection;
