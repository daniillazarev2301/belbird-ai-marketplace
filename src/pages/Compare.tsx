import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import MobileNav from "@/components/layout/MobileNav";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Star, ShoppingCart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/contexts/CartContext";
import { toast } from "sonner";

const STORAGE_KEY = "compare_products";

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  old_price: number | null;
  images: string[] | null;
  rating: number | null;
  features: string[] | null;
  description: string | null;
  categories?: { name: string } | null;
  brands?: { name: string } | null;
}

const Compare = () => {
  const [productIds, setProductIds] = useState<string[]>([]);
  const { addItem } = useCart();

  useEffect(() => {
    const loadItems = () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        setProductIds(stored ? JSON.parse(stored) : []);
      } catch {
        setProductIds([]);
      }
    };

    loadItems();
    window.addEventListener("compare-updated", loadItems);
    return () => window.removeEventListener("compare-updated", loadItems);
  }, []);

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["compare-products", productIds],
    queryFn: async () => {
      if (productIds.length === 0) return [];

      const { data, error } = await supabase
        .from("products")
        .select("*, categories(name), brands(name)")
        .in("id", productIds);

      if (error) throw error;
      return data as Product[];
    },
    enabled: productIds.length > 0,
  });

  const removeProduct = (id: string) => {
    const newIds = productIds.filter((pid) => pid !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newIds));
    setProductIds(newIds);
    window.dispatchEvent(new CustomEvent("compare-updated"));
    toast.success("Товар убран из сравнения");
  };

  const handleAddToCart = (product: Product) => {
    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      oldPrice: product.old_price || undefined,
      image: product.images?.[0] || "/placeholder.svg",
      slug: product.slug,
      quantity: 1,
    });
    toast.success("Добавлено в корзину");
  };

  // Get all unique feature keys
  const allFeatures = [...new Set(products.flatMap((p) => p.features || []))];

  return (
    <>
      <Helmet>
        <title>Сравнение товаров — BelBird</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className="min-h-screen flex flex-col">
        <Header />

        <main className="flex-1 container px-4 md:px-6 py-8">
          <h1 className="text-2xl font-bold mb-6">Сравнение товаров</h1>

          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">Загрузка...</div>
          ) : products.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">Нет товаров для сравнения</p>
              <Button asChild>
                <Link to="/catalog">Перейти в каталог</Link>
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px] border-collapse">
                <thead>
                  <tr>
                    <th className="p-4 text-left w-40 bg-muted/50">Характеристика</th>
                    {products.map((product) => (
                      <th key={product.id} className="p-4 text-center min-w-[200px] border-l border-border">
                        <div className="relative">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="absolute -top-2 -right-2 h-6 w-6"
                            onClick={() => removeProduct(product.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                          <Link to={`/product/${product.slug}`}>
                            <img
                              src={product.images?.[0] || "/placeholder.svg"}
                              alt={product.name}
                              className="w-32 h-32 object-cover rounded-lg mx-auto mb-2"
                            />
                            <h3 className="font-medium text-sm line-clamp-2 hover:text-primary">
                              {product.name}
                            </h3>
                          </Link>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {/* Price */}
                  <tr className="border-t border-border">
                    <td className="p-4 font-medium bg-muted/50">Цена</td>
                    {products.map((product) => (
                      <td key={product.id} className="p-4 text-center border-l border-border">
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-lg font-bold text-primary">
                            {product.price.toLocaleString()} ₽
                          </span>
                          {product.old_price && (
                            <span className="text-sm text-muted-foreground line-through">
                              {product.old_price.toLocaleString()} ₽
                            </span>
                          )}
                        </div>
                      </td>
                    ))}
                  </tr>

                  {/* Rating */}
                  <tr className="border-t border-border">
                    <td className="p-4 font-medium bg-muted/50">Рейтинг</td>
                    {products.map((product) => (
                      <td key={product.id} className="p-4 text-center border-l border-border">
                        <div className="flex items-center justify-center gap-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span>{product.rating?.toFixed(1) || "—"}</span>
                        </div>
                      </td>
                    ))}
                  </tr>

                  {/* Category */}
                  <tr className="border-t border-border">
                    <td className="p-4 font-medium bg-muted/50">Категория</td>
                    {products.map((product) => (
                      <td key={product.id} className="p-4 text-center border-l border-border">
                        {product.categories?.name || "—"}
                      </td>
                    ))}
                  </tr>

                  {/* Brand */}
                  <tr className="border-t border-border">
                    <td className="p-4 font-medium bg-muted/50">Бренд</td>
                    {products.map((product) => (
                      <td key={product.id} className="p-4 text-center border-l border-border">
                        {product.brands?.name || "—"}
                      </td>
                    ))}
                  </tr>

                  {/* Features */}
                  {allFeatures.slice(0, 5).map((feature, index) => (
                    <tr key={index} className="border-t border-border">
                      <td className="p-4 font-medium bg-muted/50">Особенность {index + 1}</td>
                      {products.map((product) => (
                        <td key={product.id} className="p-4 text-center border-l border-border">
                          {product.features?.includes(feature) ? (
                            <Badge variant="secondary">{feature}</Badge>
                          ) : (
                            "—"
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}

                  {/* Add to Cart */}
                  <tr className="border-t border-border">
                    <td className="p-4 bg-muted/50"></td>
                    {products.map((product) => (
                      <td key={product.id} className="p-4 text-center border-l border-border">
                        <Button onClick={() => handleAddToCart(product)} className="gap-2">
                          <ShoppingCart className="h-4 w-4" />
                          В корзину
                        </Button>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </main>

        <Footer />
        <MobileNav />
      </div>
    </>
  );
};

export default Compare;
