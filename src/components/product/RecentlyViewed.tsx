import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  images: string[] | null;
}

export const RecentlyViewed = () => {
  const [sessionId] = useState(() => {
    let id = localStorage.getItem("session_id");
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem("session_id", id);
    }
    return id;
  });

  const { data: products = [] } = useQuery({
    queryKey: ["recently-viewed", sessionId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      let query = supabase
        .from("product_views")
        .select("product_id, viewed_at")
        .order("viewed_at", { ascending: false })
        .limit(10);

      if (user) {
        query = query.eq("user_id", user.id);
      } else {
        query = query.eq("session_id", sessionId);
      }

      const { data: views, error: viewsError } = await query;
      if (viewsError || !views?.length) return [];

      // Get unique product IDs
      const productIds = [...new Set(views.map((v) => v.product_id))];

      const { data: products, error: productsError } = await supabase
        .from("products")
        .select("id, name, slug, price, images")
        .in("id", productIds)
        .eq("is_active", true);

      if (productsError) return [];

      // Sort by view order
      return productIds
        .map((id) => products?.find((p) => p.id === id))
        .filter(Boolean) as Product[];
    },
  });

  if (products.length === 0) return null;

  return (
    <section className="py-8">
      <div className="container px-4 md:px-6">
        <h2 className="text-xl font-semibold mb-4">Недавно просмотренные</h2>
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
          {products.map((product) => (
            <Link
              key={product.id}
              to={`/product/${product.slug}`}
              className="flex-shrink-0 w-32"
            >
              <Card className="overflow-hidden hover:border-primary transition-colors">
                <CardContent className="p-2">
                  <img
                    src={product.images?.[0] || "/placeholder.svg"}
                    alt={product.name}
                    className="w-full h-24 object-cover rounded"
                  />
                  <p className="text-xs font-medium mt-2 line-clamp-2">{product.name}</p>
                  <p className="text-sm font-semibold text-primary">{product.price.toLocaleString()} ₽</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

// Hook to track product views
export const useTrackProductView = (productId: string | undefined) => {
  useEffect(() => {
    if (!productId) return;

    const trackView = async () => {
      const sessionId = localStorage.getItem("session_id") || crypto.randomUUID();
      localStorage.setItem("session_id", sessionId);

      const { data: { user } } = await supabase.auth.getUser();

      await supabase.from("product_views").insert({
        product_id: productId,
        user_id: user?.id || null,
        session_id: user ? null : sessionId,
      });
    };

    trackView();
  }, [productId]);
};
