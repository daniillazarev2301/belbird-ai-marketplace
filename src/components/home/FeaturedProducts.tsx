import { ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import ProductCard, { Product } from "./ProductCard";

const featuredProducts: Product[] = [
  {
    id: "1",
    name: "Премиум корм для кошек Royal Canin Indoor",
    price: 3290,
    oldPrice: 3890,
    image: "https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=400&h=400&fit=crop",
    rating: 4.9,
    reviewCount: 2341,
    category: "Корма для кошек",
    isBestseller: true,
    aiRecommended: true,
  },
  {
    id: "2",
    name: "Ароматическая свеча с эфирными маслами",
    price: 1490,
    image: "https://images.unsplash.com/photo-1602607550528-80baf3b9c38a?w=400&h=400&fit=crop",
    rating: 4.8,
    reviewCount: 856,
    category: "Декор для дома",
    isNew: true,
  },
  {
    id: "3",
    name: "Набор семян органических томатов",
    price: 590,
    oldPrice: 790,
    image: "https://images.unsplash.com/photo-1592921870789-04563d55041c?w=400&h=400&fit=crop",
    rating: 4.7,
    reviewCount: 423,
    category: "Семена",
  },
  {
    id: "4",
    name: "Лежанка для собаки с ортопедическим дном",
    price: 4990,
    image: "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=400&h=400&fit=crop",
    rating: 4.9,
    reviewCount: 1205,
    category: "Аксессуары для собак",
    aiRecommended: true,
  },
  {
    id: "5",
    name: "Комнатное растение Монстера в кашпо",
    price: 2890,
    image: "https://images.unsplash.com/photo-1614594975525-e45190c55d0b?w=400&h=400&fit=crop",
    rating: 4.6,
    reviewCount: 678,
    category: "Комнатные растения",
    isNew: true,
  },
  {
    id: "6",
    name: "Эко-набор для уборки дома",
    price: 1890,
    oldPrice: 2390,
    image: "https://images.unsplash.com/photo-1563453392212-326f5e854473?w=400&h=400&fit=crop",
    rating: 4.8,
    reviewCount: 932,
    category: "Бытовая химия",
    isBestseller: true,
  },
  {
    id: "7",
    name: "Когтеточка-домик для кошки",
    price: 6490,
    image: "https://images.unsplash.com/photo-1545249390-6bdfa286032f?w=400&h=400&fit=crop",
    rating: 4.7,
    reviewCount: 567,
    category: "Мебель для кошек",
  },
  {
    id: "8",
    name: "Садовый секатор профессиональный",
    price: 1290,
    image: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=400&fit=crop",
    rating: 4.9,
    reviewCount: 1089,
    category: "Инструменты",
    aiRecommended: true,
  },
];

const FeaturedProducts = () => {
  return (
    <section className="py-12 md:py-16">
      <div className="container px-4 md:px-6">
        {/* Header */}
        <div className="flex items-end justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium text-primary">
                AI-подборка
              </span>
            </div>
            <h2 className="text-2xl md:text-3xl font-serif font-semibold">
              Рекомендуем для вас
            </h2>
          </div>
          <Link
            to="/catalog"
            className="hidden md:flex items-center gap-2 text-sm font-medium text-primary hover:gap-3 transition-all"
          >
            Все рекомендации
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-6">
          {featuredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {/* Mobile link */}
        <Link
          to="/catalog"
          className="flex md:hidden items-center justify-center gap-2 text-sm font-medium text-primary mt-6 py-3"
        >
          Все рекомендации
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
};

export default FeaturedProducts;
