import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronRight, TrendingUp, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const TopProducts = () => {
  const { data: products, isLoading } = useQuery({
    queryKey: ['top-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select(`
          id,
          name,
          price,
          images,
          review_count,
          categories:category_id (name)
        `)
        .eq('is_active', true)
        .order('review_count', { ascending: false })
        .limit(4);
      
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base font-semibold">Топ товаров</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!products || products.length === 0) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base font-semibold">Топ товаров</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">Товаров пока нет</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-semibold">Топ товаров</CardTitle>
        <a href="/admin/products" className="text-xs text-primary hover:underline flex items-center gap-1">
          Все товары
          <ChevronRight className="h-3 w-3" />
        </a>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {products.map((product, index) => {
            const category = product.categories as { name: string } | null;
            const imageUrl = product.images?.[0] || '/placeholder.svg';
            
            return (
              <div
                key={product.id}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
              >
                <span className="text-lg font-semibold text-muted-foreground w-6">
                  {index + 1}
                </span>
                <img
                  src={imageUrl}
                  alt={product.name}
                  className="w-12 h-12 rounded-lg object-cover"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{product.name}</p>
                  <p className="text-xs text-muted-foreground">{category?.name || 'Без категории'}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{product.price.toLocaleString()} ₽</p>
                  <div className="flex items-center justify-end gap-1">
                    <TrendingUp className="h-3 w-3 text-primary" />
                    <span className="text-xs text-muted-foreground">
                      {product.review_count || 0} отзывов
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default TopProducts;
