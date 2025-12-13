import { ArrowRight, Folder } from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

interface CategoryCardProps {
  title: string;
  description: string;
  image: string;
  href: string;
  itemCount: number;
  size?: "large" | "small";
}

const CategoryCard = ({ title, description, image, href, itemCount, size = "large" }: CategoryCardProps) => (
  <Link
    to={href}
    className="group relative overflow-hidden rounded-2xl bg-card shadow-card hover:shadow-elevated transition-all duration-300"
  >
    {/* Image */}
    <div className={size === "large" ? "aspect-[4/5] md:aspect-[3/4]" : "aspect-[4/3]"}>
      {image ? (
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      ) : (
        <div className="w-full h-full bg-muted flex items-center justify-center">
          <Folder className="h-12 w-12 text-muted-foreground" />
        </div>
      )}
    </div>

    {/* Overlay */}
    <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/20 to-transparent" />

    {/* Content */}
    <div className="absolute inset-x-0 bottom-0 p-4 md:p-5">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs font-medium text-primary-foreground/80">
          {itemCount} товаров
        </span>
      </div>
      <h3 className={`${size === "large" ? "text-xl md:text-2xl" : "text-lg"} font-serif font-semibold text-primary-foreground mb-1`}>
        {title}
      </h3>
      {description && (
        <p className="text-sm text-primary-foreground/70 mb-2 line-clamp-2">
          {description}
        </p>
      )}
      <div className="flex items-center gap-2 text-sm font-medium text-primary-foreground group-hover:gap-3 transition-all">
        <span>Смотреть</span>
        <ArrowRight className="h-4 w-4" />
      </div>
    </div>
  </Link>
);

const CategorySection = () => {
  const { data: categories = [], isLoading } = useQuery({
    queryKey: ["home-categories"],
    queryFn: async () => {
      // Get categories
      const { data: cats, error } = await supabase
        .from("categories")
        .select("id, name, slug, description, image_url, parent_id")
        .is("parent_id", null)
        .order("sort_order", { ascending: true });

      if (error) throw error;

      // Get product counts
      const { data: products } = await supabase
        .from("products")
        .select("category_id")
        .eq("is_active", true);

      const countMap: Record<string, number> = {};
      products?.forEach((p) => {
        if (p.category_id) {
          countMap[p.category_id] = (countMap[p.category_id] || 0) + 1;
        }
      });

      return (cats || []).map((cat) => ({
        id: cat.id,
        title: cat.name,
        description: cat.description || "",
        image: cat.image_url || "",
        href: `/catalog/${cat.slug}`,
        itemCount: countMap[cat.id] || 0,
      }));
    },
  });

  if (isLoading) {
    return (
      <section className="py-12 md:py-16 lg:py-20">
        <div className="container px-4 md:px-6">
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-5 w-64 mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="aspect-[3/4] rounded-2xl" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (categories.length === 0) {
    return null;
  }

  // Split categories into main (first 3) and secondary (rest)
  const mainCategories = categories.slice(0, 3);
  const secondaryCategories = categories.slice(3, 6);

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
              Выберите интересующую категорию товаров
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
        {mainCategories.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-4 md:mb-6">
            {mainCategories.map((category) => (
              <CategoryCard key={category.id} {...category} size="large" />
            ))}
          </div>
        )}

        {/* Secondary Categories Grid */}
        {secondaryCategories.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
            {secondaryCategories.map((category) => (
              <CategoryCard key={category.id} {...category} size="small" />
            ))}
          </div>
        )}

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