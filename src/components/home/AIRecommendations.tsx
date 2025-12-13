import { useState, useEffect } from "react";
import { ArrowRight, Sparkles, Loader2, PawPrint } from "lucide-react";
import { Link } from "react-router-dom";
import ProductCard from "./ProductCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

const AIRecommendations = () => {
  const [hasPets, setHasPets] = useState(false);
  const [petNames, setPetNames] = useState<string[]>([]);

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["ai-recommendations"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      let petsExist = false;
      let names: string[] = [];
      
      if (user) {
        const { data: pets } = await supabase
          .from('pet_profiles')
          .select('name, species')
          .eq('user_id', user.id);

        if (pets && pets.length > 0) {
          petsExist = true;
          names = pets.map(p => p.name);
        }
      }

      setHasPets(petsExist);
      setPetNames(names);

      // Fetch AI recommended products
      const { data, error } = await supabase
        .from('products')
        .select(`
          id, name, slug, price, old_price, images, rating, review_count,
          is_ai_recommended,
          category:categories(name)
        `)
        .eq('is_active', true)
        .eq('is_ai_recommended', true)
        .limit(8);

      if (error) throw error;
      
      return (data || []).map(p => ({
        id: p.id,
        name: p.name,
        price: p.price,
        oldPrice: p.old_price || undefined,
        image: p.images?.[0] || "/placeholder.svg",
        rating: p.rating || 0,
        reviewCount: p.review_count || 0,
        category: p.category?.name || "Рекомендации",
        slug: p.slug,
        aiRecommended: true,
      }));
    },
  });

  if (isLoading) {
    return (
      <section className="py-12 md:py-16 bg-gradient-to-b from-primary/5 to-transparent">
        <div className="container px-4 md:px-6">
          <div className="flex items-end justify-between mb-8">
            <div>
              <Skeleton className="h-5 w-32 mb-2" />
              <Skeleton className="h-8 w-64" />
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-6">
            {[...Array(4)].map((_, i) => (
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
    <section className="py-12 md:py-16 bg-gradient-to-b from-primary/5 to-transparent">
      <div className="container px-4 md:px-6">
        {/* Header */}
        <div className="flex items-end justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium text-primary">
                {hasPets ? `Рекомендации для ${petNames.join(", ")}` : "AI-подборка"}
              </span>
            </div>
            <h2 className="text-2xl md:text-3xl font-serif font-semibold">
              {hasPets ? "Подобрано специально для ваших питомцев" : "Рекомендуем для вас"}
            </h2>
            {hasPets && (
              <p className="text-muted-foreground mt-1">
                На основе профилей ваших питомцев
              </p>
            )}
          </div>
          <Link
            to="/catalog"
            className="hidden md:flex items-center gap-2 text-sm font-medium text-primary hover:gap-3 transition-all"
          >
            Все товары
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Not logged in banner */}
        {!hasPets && (
          <div className="mb-8 p-4 rounded-lg bg-primary/10 border border-primary/20 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="p-3 rounded-full bg-primary/20">
              <PawPrint className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">Получите персональные рекомендации</h3>
              <p className="text-sm text-muted-foreground">
                Добавьте профиль питомца — собаки, кошки, попугая или даже кур — и получайте товары, подобранные специально для вас
              </p>
            </div>
            <Link to="/account/pets">
              <Button size="sm">Добавить питомца</Button>
            </Link>
          </div>
        )}

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

export default AIRecommendations;