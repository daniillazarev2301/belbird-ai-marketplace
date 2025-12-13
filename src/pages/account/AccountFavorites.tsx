import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import AccountLayout from "@/components/account/AccountLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Heart,
  ShoppingCart,
  Trash2,
  Star,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/contexts/CartContext";
import { toast } from "sonner";

interface FavoriteProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  old_price: number | null;
  images: string[] | null;
  rating: number | null;
  review_count: number | null;
  stock_count: number | null;
}

const AccountFavorites = () => {
  const [favorites, setFavorites] = useState<FavoriteProduct[]>([]);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState("added");
  const [loading, setLoading] = useState(true);
  const { addItem } = useCart();

  useEffect(() => {
    fetchFavorites();
  }, [sortBy]);

  const fetchFavorites = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('favorites')
      .select(`
        product_id,
        created_at,
        products (
          id, name, slug, price, old_price, images, rating, review_count, stock_count
        )
      `)
      .eq('user_id', user.id);

    if (!error && data) {
      let products = data
        .map((f: any) => ({ ...f.products, added_at: f.created_at }))
        .filter(Boolean) as (FavoriteProduct & { added_at: string })[];
      
      // Apply sorting
      switch (sortBy) {
        case 'price_asc':
          products.sort((a, b) => a.price - b.price);
          break;
        case 'price_desc':
          products.sort((a, b) => b.price - a.price);
          break;
        case 'rating':
          products.sort((a, b) => (b.rating || 0) - (a.rating || 0));
          break;
        case 'added':
        default:
          products.sort((a, b) => new Date(b.added_at).getTime() - new Date(a.added_at).getTime());
          break;
      }
      
      setFavorites(products);
    }
    setLoading(false);
  };

  const removeFavorite = async (productId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from('favorites')
      .delete()
      .eq('user_id', user.id)
      .eq('product_id', productId);

    setFavorites(prev => prev.filter(p => p.id !== productId));
    toast.success('Удалено из избранного');
  };

  const toggleItem = (id: string) => {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    if (selectedItems.length === favorites.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(favorites.map((f) => f.id));
    }
  };

  const handleAddToCart = (product: FavoriteProduct) => {
    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity: 1,
      image: product.images?.[0] || '/placeholder.svg',
      slug: product.slug,
    });
    toast.success('Добавлено в корзину');
  };

  if (loading) {
    return (
      <AccountLayout>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AccountLayout>
    );
  }

  return (
    <>
      <Helmet>
        <title>Избранное — BelBird</title>
      </Helmet>
      <AccountLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-serif font-semibold">Избранное</h1>
              <p className="text-muted-foreground">{favorites.length} товаров</p>
            </div>
            {favorites.length > 0 && (
              <div className="flex gap-2">
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Сортировка" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="added">По добавлению</SelectItem>
                    <SelectItem value="price_asc">Сначала дешёвые</SelectItem>
                    <SelectItem value="price_desc">Сначала дорогие</SelectItem>
                    <SelectItem value="rating">По рейтингу</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Bulk Actions */}
          {selectedItems.length > 0 && (
            <Card className="bg-muted/50">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={selectedItems.length === favorites.length}
                    onCheckedChange={toggleAll}
                  />
                  <span className="text-sm">Выбрано: {selectedItems.length}</span>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" className="gap-2" onClick={() => {
                    selectedItems.forEach(id => {
                      const product = favorites.find(p => p.id === id);
                      if (product) handleAddToCart(product);
                    });
                    setSelectedItems([]);
                  }}>
                    <ShoppingCart className="h-4 w-4" />
                    В корзину
                  </Button>
                  <Button size="sm" variant="outline" className="gap-2 text-destructive" onClick={() => {
                    selectedItems.forEach(id => removeFavorite(id));
                    setSelectedItems([]);
                  }}>
                    <Trash2 className="h-4 w-4" />
                    Удалить
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Products Grid */}
          {favorites.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Heart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold mb-2">В избранном пусто</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Добавляйте понравившиеся товары, чтобы не потерять их
                </p>
                <Button asChild>
                  <Link to="/catalog">Перейти в каталог</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {favorites.map((product) => {
                const inStock = (product.stock_count ?? 0) > 0;
                return (
                  <Card key={product.id} className="overflow-hidden group">
                    <CardContent className="p-0">
                      {/* Image */}
                      <div className="relative aspect-square">
                        <Link to={`/product/${product.slug}`}>
                          <img
                            src={product.images?.[0] || '/placeholder.svg'}
                            alt={product.name}
                            className={`w-full h-full object-cover transition-transform group-hover:scale-105 ${
                              !inStock ? "opacity-50" : ""
                            }`}
                          />
                        </Link>
                        
                        {/* Checkbox */}
                        <div className="absolute top-3 left-3">
                          <Checkbox
                            checked={selectedItems.includes(product.id)}
                            onCheckedChange={() => toggleItem(product.id)}
                            className="bg-background"
                          />
                        </div>

                        {/* Remove */}
                        <div className="absolute top-3 right-3">
                          <button
                            onClick={() => removeFavorite(product.id)}
                            className="p-2 rounded-full bg-background shadow-sm hover:bg-destructive hover:text-destructive-foreground transition-colors"
                          >
                            <Heart className="h-4 w-4 fill-destructive text-destructive" />
                          </button>
                        </div>

                        {/* Out of stock overlay */}
                        {!inStock && (
                          <div className="absolute inset-0 flex items-center justify-center bg-background/50">
                            <Badge variant="secondary">Нет в наличии</Badge>
                          </div>
                        )}

                        {/* Discount badge */}
                        {product.old_price && (
                          <Badge className="absolute bottom-3 left-3 bg-destructive text-destructive-foreground">
                            -{Math.round((1 - product.price / product.old_price) * 100)}%
                          </Badge>
                        )}
                      </div>

                      {/* Info */}
                      <div className="p-4">
                        <Link to={`/product/${product.slug}`}>
                          <h3 className="font-medium text-sm line-clamp-2 mb-2 group-hover:text-primary transition-colors">
                            {product.name}
                          </h3>
                        </Link>
                        
                        {/* Rating */}
                        {product.rating && (
                          <div className="flex items-center gap-1 mb-3">
                            <Star className="h-3.5 w-3.5 fill-secondary text-secondary" />
                            <span className="text-sm font-medium">{product.rating}</span>
                            <span className="text-xs text-muted-foreground">
                              ({product.review_count || 0})
                            </span>
                          </div>
                        )}

                        {/* Price & Action */}
                        <div className="flex items-end justify-between">
                          <div>
                            <p className="text-lg font-semibold">
                              {product.price.toLocaleString()} ₽
                            </p>
                            {product.old_price && (
                              <p className="text-sm text-muted-foreground line-through">
                                {product.old_price.toLocaleString()} ₽
                              </p>
                            )}
                          </div>
                          <Button 
                            size="sm" 
                            disabled={!inStock} 
                            className="gap-2"
                            onClick={() => handleAddToCart(product)}
                          >
                            <ShoppingCart className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </AccountLayout>
    </>
  );
};

export default AccountFavorites;
