import { ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import ProductCard, { Product } from "./ProductCard";

const featuredProducts: Product[] = [
  {
    id: "1",
    name: "Премиум корм для собак Royal Canin Medium Adult",
    price: 4290,
    oldPrice: 4890,
    image: "https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=400&h=400&fit=crop",
    rating: 4.9,
    reviewCount: 2341,
    category: "Корма для собак",
    isBestseller: true,
    aiRecommended: true,
  },
  {
    id: "2",
    name: "Корм для кошек Whiskas с курицей",
    price: 1490,
    image: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400&h=400&fit=crop",
    rating: 4.8,
    reviewCount: 856,
    category: "Корма для кошек",
    isNew: true,
  },
  {
    id: "3",
    name: "Комбикорм для цыплят стартовый ПК-2",
    price: 890,
    oldPrice: 1090,
    image: "https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=400&h=400&fit=crop",
    rating: 4.7,
    reviewCount: 423,
    category: "Сельхоз животные",
    isBestseller: true,
  },
  {
    id: "4",
    name: "Клетка для попугая с аксессуарами",
    price: 4990,
    image: "https://images.unsplash.com/photo-1552728089-57bdde30beb3?w=400&h=400&fit=crop",
    rating: 4.9,
    reviewCount: 1205,
    category: "Птицы и попугаи",
    aiRecommended: true,
  },
  {
    id: "5",
    name: "Аквариум Tetra 60л с фильтром",
    price: 5890,
    image: "https://images.unsplash.com/photo-1522069169874-c58ec4b76be5?w=400&h=400&fit=crop",
    rating: 4.6,
    reviewCount: 678,
    category: "Аквариумистика",
    isNew: true,
  },
  {
    id: "6",
    name: "Корм для кур-несушек ПК-1",
    price: 1290,
    oldPrice: 1590,
    image: "https://images.unsplash.com/photo-1569127959161-2b1297b2d9a6?w=400&h=400&fit=crop",
    rating: 4.8,
    reviewCount: 932,
    category: "Сельхоз животные",
    isBestseller: true,
  },
  {
    id: "7",
    name: "Домик-когтеточка для кошки",
    price: 6490,
    image: "https://images.unsplash.com/photo-1545249390-6bdfa286032f?w=400&h=400&fit=crop",
    rating: 4.7,
    reviewCount: 567,
    category: "Мебель для кошек",
  },
  {
    id: "8",
    name: "Корм для хомяков и морских свинок",
    price: 590,
    image: "https://images.unsplash.com/photo-1425082661705-1834bfd09dca?w=400&h=400&fit=crop",
    rating: 4.9,
    reviewCount: 1089,
    category: "Грызуны",
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
                Популярные товары
              </span>
            </div>
            <h2 className="text-2xl md:text-3xl font-serif font-semibold">
              Хиты продаж
            </h2>
          </div>
          <Link
            to="/catalog"
            className="hidden md:flex items-center gap-2 text-sm font-medium text-primary hover:gap-3 transition-all"
          >
            Все товары
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
          Все товары
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
};

export default FeaturedProducts;
