import { ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import ProductCard from "./ProductCard";
import { Skeleton } from "@/components/ui/skeleton";

const FeaturedProducts = () => {
  const { data: products = [], isLoading } = useQuery({
    queryKey: ["featured-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select(`
          id, name, slug, price, old_price, images, rating, review_count,
          is_bestseller, is_new, is_ai_recommended,
          category:categories(name)
        `)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(12);

      if (error) throw error;
      
      return (data || []).map(p => ({
        id: p.id,
        name: p.name,
        price: p.price,
        oldPrice: p.old_price || undefined,
        image: p.images?.[0] || "/placeholder.svg",
        images: p.images || [],
        rating: p.rating || 0,
        reviewCount: p.review_count || 0,
        category: p.category?.name || "",
        slug: p.slug,
        isBestseller: p.is_bestseller || false,
        isNew: p.is_new || false,
        aiRecommended: p.is_ai_recommended || false,
      }));
    },
  });

  if (isLoading) {
    return (
      <section className="py-12 md:py-16">
        <div className="container px-4 md:px-6">
          <div className="flex items-end justify-between mb-8">
            <div>
              <Skeleton className="h-5 w-32 mb-2" />
              <Skeleton className="h-8 w-48" />
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-6">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-square rounded-xl" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-6 w-24" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (products.length === 0) {
    return null;
  }

  return (
    <section className="py-12 md:py-16">
      <div className="container px-4 md:px-6">
        {/* Header */}
        <div className="flex items-end justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium text-primary">
                Каталог товаров
              </span>
            </div>
            <h2 className="text-2xl md:text-3xl font-serif font-semibold">
              Наши товары
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
          {products.map((product) => (
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