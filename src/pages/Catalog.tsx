import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Filter, Grid3X3, List, Star, Heart, ShoppingCart, SlidersHorizontal, X, Folder } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import MobileNav from "@/components/layout/MobileNav";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useCart } from "@/contexts/CartContext";

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  old_price?: number;
  images: string[];
  rating: number;
  review_count: number;
  stock_count: number;
  brand?: { name: string };
  category?: { name: string; slug: string };
}

interface Brand {
  id: string;
  name: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
}

const Catalog = () => {
  const { category } = useParams();
  const { toast } = useToast();
  const { addItem } = useCart();
  
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [priceRange, setPriceRange] = useState([0, 50000]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [minRating, setMinRating] = useState(0);
  const [sortBy, setSortBy] = useState("popular");
  const [favorites, setFavorites] = useState<string[]>([]);

  // Fetch current category info
  const { data: currentCategory } = useQuery({
    queryKey: ["category", category],
    queryFn: async () => {
      if (!category) return null;
      const { data, error } = await supabase
        .from("categories")
        .select("id, name, slug, description, image_url")
        .eq("slug", category)
        .single();
      
      if (error) return null;
      return data as Category;
    },
    enabled: !!category,
  });

  // Fetch products
  const { data: products = [], isLoading: loadingProducts } = useQuery({
    queryKey: ["catalog-products", category, sortBy],
    queryFn: async () => {
      let query = supabase
        .from("products")
        .select(`
          id, name, slug, price, old_price, images, rating, review_count, stock_count,
          brand:brands(name),
          category:categories(name, slug)
        `)
        .eq("is_active", true);

      if (category && currentCategory) {
        query = query.eq("category_id", currentCategory.id);
      }

      switch (sortBy) {
        case "price-asc":
          query = query.order("price", { ascending: true });
          break;
        case "price-desc":
          query = query.order("price", { ascending: false });
          break;
        case "rating":
          query = query.order("rating", { ascending: false });
          break;
        default:
          query = query.order("review_count", { ascending: false });
      }

      const { data, error } = await query;
      
      if (error) {
        console.error("Error loading products:", error);
        return [];
      }
      return (data || []) as Product[];
    },
    enabled: !category || !!currentCategory,
  });

  // Fetch brands
  const { data: brands = [] } = useQuery({
    queryKey: ["brands"],
    queryFn: async () => {
      const { data } = await supabase.from("brands").select("id, name");
      return (data || []) as Brand[];
    },
  });

  const filteredProducts = products.filter(product => {
    if (product.price < priceRange[0] || product.price > priceRange[1]) return false;
    if (selectedBrands.length > 0 && product.brand && !selectedBrands.includes(product.brand.name)) return false;
    if (product.rating < minRating) return false;
    return true;
  });

  const toggleBrand = (brand: string) => {
    setSelectedBrands(prev => 
      prev.includes(brand) 
        ? prev.filter(b => b !== brand)
        : [...prev, brand]
    );
  };

  const toggleFavorite = (productId: string) => {
    setFavorites(prev => 
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
    toast({
      title: favorites.includes(productId) ? "Удалено из избранного" : "Добавлено в избранное"
    });
  };

  const addToCart = (product: Product) => {
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
      description: product.name
    });
  };

  const clearFilters = () => {
    setPriceRange([0, 50000]);
    setSelectedBrands([]);
    setMinRating(0);
  };

  const activeFiltersCount = selectedBrands.length + (minRating > 0 ? 1 : 0) + (priceRange[0] > 0 || priceRange[1] < 50000 ? 1 : 0);

  const getCategoryTitle = () => {
    if (currentCategory) return currentCategory.name;
    return "Каталог";
  };

  const FilterContent = () => (
    <div className="space-y-6">
      <div>
        <h3 className="font-medium mb-4">Цена</h3>
        <Slider
          value={priceRange}
          onValueChange={setPriceRange}
          max={50000}
          step={500}
          className="mb-2"
        />
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>{priceRange[0].toLocaleString()} ₽</span>
          <span>{priceRange[1].toLocaleString()} ₽</span>
        </div>
      </div>

      <Separator />

      <div>
        <h3 className="font-medium mb-4">Бренд</h3>
        <div className="space-y-3">
          {brands.map(brand => (
            <div key={brand.id} className="flex items-center gap-2">
              <Checkbox
                id={brand.id}
                checked={selectedBrands.includes(brand.name)}
                onCheckedChange={() => toggleBrand(brand.name)}
              />
              <Label htmlFor={brand.id} className="font-normal cursor-pointer">{brand.name}</Label>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      <div>
        <h3 className="font-medium mb-4">Рейтинг</h3>
        <div className="space-y-3">
          {[4, 3, 2, 1].map(rating => (
            <div key={rating} className="flex items-center gap-2">
              <Checkbox
                id={`rating-${rating}`}
                checked={minRating === rating}
                onCheckedChange={() => setMinRating(minRating === rating ? 0 : rating)}
              />
              <Label htmlFor={`rating-${rating}`} className="font-normal cursor-pointer flex items-center gap-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                от {rating}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {activeFiltersCount > 0 && (
        <>
          <Separator />
          <Button variant="outline" className="w-full" onClick={clearFilters}>
            <X className="h-4 w-4 mr-2" />
            Сбросить фильтры
          </Button>
        </>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pb-24 lg:pb-12">
        {/* Category Banner */}
        {currentCategory && (
          <div className="relative h-48 md:h-64 lg:h-80 overflow-hidden animate-fade-in">
            {currentCategory.image_url ? (
              <img
                src={currentCategory.image_url}
                alt={currentCategory.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                <Folder className="h-24 w-24 text-primary/30" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-6 md:p-8 lg:p-12">
              <div className="container mx-auto">
                <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-3 animate-fade-in">
                  <Link to="/" className="hover:text-foreground transition-colors">Главная</Link>
                  <span>/</span>
                  <span className="text-foreground">{currentCategory.name}</span>
                </nav>
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold mb-2 animate-fade-in">
                  {currentCategory.name}
                </h1>
                {currentCategory.description && (
                  <p className="text-muted-foreground max-w-2xl animate-fade-in">
                    {currentCategory.description}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="container mx-auto px-4 py-6">
          {/* Breadcrumb for non-category pages */}
          {!currentCategory && (
            <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
              <Link to="/" className="hover:text-foreground">Главная</Link>
              <span>/</span>
              <span className="text-foreground">Каталог</span>
            </nav>
          )}

          {!currentCategory && (
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold">{getCategoryTitle()}</h1>
                <p className="text-muted-foreground">{filteredProducts.length} товаров</p>
              </div>
            </div>
          )}

          {currentCategory && (
            <p className="text-muted-foreground mb-6">{filteredProducts.length} товаров</p>
          )}

          <div className="flex gap-8">
            <aside className="hidden lg:block w-64 flex-shrink-0">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="font-semibold flex items-center gap-2">
                      <SlidersHorizontal className="h-5 w-5" />
                      Фильтры
                    </h2>
                    {activeFiltersCount > 0 && <Badge>{activeFiltersCount}</Badge>}
                  </div>
                  <FilterContent />
                </CardContent>
              </Card>
            </aside>

            <div className="flex-1">
              <div className="flex items-center justify-between mb-6 gap-4">
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" className="lg:hidden">
                      <Filter className="h-4 w-4 mr-2" />
                      Фильтры
                      {activeFiltersCount > 0 && <Badge className="ml-2">{activeFiltersCount}</Badge>}
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-80">
                    <SheetHeader><SheetTitle>Фильтры</SheetTitle></SheetHeader>
                    <div className="py-6"><FilterContent /></div>
                  </SheetContent>
                </Sheet>

                <div className="flex items-center gap-4 ml-auto">
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Сортировка" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="popular">По популярности</SelectItem>
                      <SelectItem value="price-asc">Сначала дешевле</SelectItem>
                      <SelectItem value="price-desc">Сначала дороже</SelectItem>
                      <SelectItem value="rating">По рейтингу</SelectItem>
                    </SelectContent>
                  </Select>

                  <div className="hidden sm:flex items-center border rounded-lg">
                    <Button
                      variant={viewMode === "grid" ? "secondary" : "ghost"}
                      size="icon"
                      className="rounded-r-none"
                      onClick={() => setViewMode("grid")}
                    >
                      <Grid3X3 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === "list" ? "secondary" : "ghost"}
                      size="icon"
                      className="rounded-l-none"
                      onClick={() => setViewMode("list")}
                    >
                      <List className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {loadingProducts ? (
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                  {[...Array(8)].map((_, i) => (
                    <Card key={i}>
                      <CardContent className="p-4">
                        <Skeleton className="aspect-square rounded-lg mb-3" />
                        <Skeleton className="h-4 w-20 mb-2" />
                        <Skeleton className="h-5 w-full mb-2" />
                        <Skeleton className="h-4 w-16 mb-2" />
                        <Skeleton className="h-6 w-24" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : filteredProducts.length > 0 ? (
                <div className={viewMode === "grid" 
                  ? "grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4" 
                  : "space-y-4"
                }>
                  {filteredProducts.map((product, index) => (
                    <Card 
                      key={product.id} 
                      className="group cursor-pointer hover:shadow-lg transition-all duration-300 animate-fade-in"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <CardContent className="p-4">
                        <div className="relative aspect-square rounded-lg bg-muted mb-3 overflow-hidden">
                          <Link to={`/product/${product.slug}`}>
                            <img 
                              src={product.images?.[0] || "/placeholder.svg"} 
                              alt={product.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          </Link>
                          {product.old_price && (
                            <Badge className="absolute top-2 left-2 bg-destructive">
                              -{Math.round((1 - product.price / product.old_price) * 100)}%
                            </Badge>
                          )}
                          {product.stock_count === 0 && (
                            <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                              <span className="text-sm font-medium">Нет в наличии</span>
                            </div>
                          )}
                          <Button
                            variant="secondary"
                            size="icon"
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => {
                              e.preventDefault();
                              toggleFavorite(product.id);
                            }}
                          >
                            <Heart className={`h-4 w-4 ${favorites.includes(product.id) ? 'fill-destructive text-destructive' : ''}`} />
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground mb-1">{product.brand?.name}</p>
                        <Link to={`/product/${product.slug}`}>
                          <h3 className="font-medium line-clamp-2 mb-2 text-sm hover:text-primary transition-colors">{product.name}</h3>
                        </Link>
                        <div className="flex items-center gap-1 mb-2">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm font-medium">{product.rating || 0}</span>
                          <span className="text-xs text-muted-foreground">({product.review_count || 0})</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-bold">{product.price.toLocaleString()} ₽</span>
                            {product.old_price && (
                              <span className="text-xs text-muted-foreground line-through ml-2">
                                {product.old_price.toLocaleString()} ₽
                              </span>
                            )}
                          </div>
                          <Button
                            size="icon"
                            variant="outline"
                            disabled={product.stock_count === 0}
                            onClick={() => addToCart(product)}
                          >
                            <ShoppingCart className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">Товары не найдены</p>
                  <Button variant="outline" className="mt-4" onClick={clearFilters}>
                    Сбросить фильтры
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
      <MobileNav />
    </div>
  );
};

export default Catalog;