import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Star, ShoppingCart } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  old_price?: number;
  images: string[];
  rating: number;
  review_count: number;
}

interface RelatedProductsProps {
  currentProductId: string;
  categoryId?: string;
  brandId?: string;
}

export const RelatedProducts = ({ currentProductId, categoryId, brandId }: RelatedProductsProps) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { addItem } = useCart();
  const { toast } = useToast();

  useEffect(() => {
    loadRelatedProducts();
  }, [currentProductId, categoryId, brandId]);

  const loadRelatedProducts = async () => {
    setLoading(true);
    
    let query = supabase
      .from("products")
      .select("id, name, slug, price, old_price, images, rating, review_count")
      .eq("is_active", true)
      .neq("id", currentProductId)
      .limit(8);

    if (categoryId) {
      query = query.eq("category_id", categoryId);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error loading related products:", error);
    } else {
      setProducts(data || []);
    }
    setLoading(false);
  };

  const handleAddToCart = (product: Product) => {
    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      oldPrice: product.old_price,
      quantity: 1,
      image: product.images?.[0] || "/placeholder.svg",
      slug: product.slug,
    });
    toast({
      title: "Добавлено в корзину",
      description: product.name,
    });
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-bold">Похожие товары</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-3">
                <Skeleton className="aspect-square rounded-lg mb-3" />
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-5 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Похожие товары</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {products.map((product) => {
          const discount = product.old_price 
            ? Math.round((1 - product.price / product.old_price) * 100) 
            : 0;

          return (
            <Card key={product.id} className="group overflow-hidden hover:shadow-lg transition-shadow">
              <CardContent className="p-3">
                <Link to={`/product/${product.slug}`} className="block">
                  <div className="relative aspect-square rounded-lg overflow-hidden bg-muted mb-3">
                    <img
                      src={product.images?.[0] || "/placeholder.svg"}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {discount > 0 && (
                      <Badge className="absolute top-2 left-2 bg-destructive text-xs">
                        -{discount}%
                      </Badge>
                    )}
                  </div>
                  <h3 className="text-sm font-medium line-clamp-2 mb-2 group-hover:text-primary transition-colors">
                    {product.name}
                  </h3>
                </Link>
                
                <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  <span>{product.rating || 0}</span>
                  <span>• {product.review_count || 0} отз.</span>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-primary">
                      {product.price.toLocaleString()} ₽
                    </span>
                    {product.old_price && (
                      <span className="text-xs text-muted-foreground line-through ml-2">
                        {product.old_price.toLocaleString()} ₽
                      </span>
                    )}
                  </div>
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="h-8 w-8"
                    onClick={() => handleAddToCart(product)}
                  >
                    <ShoppingCart className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
