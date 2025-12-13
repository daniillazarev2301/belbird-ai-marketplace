import { useState, useMemo } from "react";
import { useParams, Link, useSearchParams } from "react-router-dom";
import { Star, Heart, ShoppingCart, Folder, ChevronLeft, ChevronRight } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import MobileNav from "@/components/layout/MobileNav";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useCart } from "@/contexts/CartContext";
import { CatalogSidebar } from "@/components/catalog/CatalogSidebar";
import { HorizontalFilters } from "@/components/catalog/HorizontalFilters";

const PRODUCTS_PER_PAGE = 20;

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
  specifications?: Record<string, string>;
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

interface SpecificationFilter {
  key: string;
  label: string;
  values: string[];
}

const Catalog = () => {
  const { category } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const { addItem } = useCart();
  
  const currentPage = parseInt(searchParams.get("page") || "1", 10);
  
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [priceRange, setPriceRange] = useState([0, 50000]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedSpecifications, setSelectedSpecifications] = useState<Record<string, string[]>>({});
  const [sortBy, setSortBy] = useState("popular");
  const [favorites, setFavorites] = useState<string[]>([]);

  const setCurrentPage = (page: number) => {
    const newParams = new URLSearchParams(searchParams);
    if (page === 1) {
      newParams.delete("page");
    } else {
      newParams.set("page", page.toString());
    }
    setSearchParams(newParams);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Fetch all categories for sidebar
  const { data: categories = [] } = useQuery({
    queryKey: ["all-categories"],
    queryFn: async () => {
      const { data } = await supabase
        .from("categories")
        .select("id, name, slug, image_url")
        .order("sort_order");
      return (data || []) as Category[];
    },
  });

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
          id, name, slug, price, old_price, images, rating, review_count, stock_count, specifications,
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
        case "new":
          query = query.order("created_at", { ascending: false });
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

  // Extract unique specification filters from products
  const specificationFilters = useMemo((): SpecificationFilter[] => {
    const specsMap: Record<string, Set<string>> = {};
    
    products.forEach(product => {
      if (product.specifications && typeof product.specifications === 'object') {
        Object.entries(product.specifications).forEach(([key, value]) => {
          if (value && typeof value === 'string') {
            if (!specsMap[key]) specsMap[key] = new Set();
            specsMap[key].add(value);
          }
        });
      }
    });

    return Object.entries(specsMap)
      .filter(([_, values]) => values.size > 1) // Only show filters with multiple options
      .map(([key, values]) => ({
        key,
        label: key,
        values: Array.from(values).sort(),
      }));
  }, [products]);

  // Filter products
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      // Price filter
      if (product.price < priceRange[0] || product.price > priceRange[1]) return false;
      
      // Brand filter
      if (selectedBrands.length > 0 && product.brand && !selectedBrands.includes(product.brand.name)) return false;
      
      // Specification filters
      for (const [key, values] of Object.entries(selectedSpecifications)) {
        if (values.length > 0) {
          const productValue = product.specifications?.[key];
          if (!productValue || !values.includes(productValue)) return false;
        }
      }
      
      return true;
    });
  }, [products, priceRange, selectedBrands, selectedSpecifications]);

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE);
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * PRODUCTS_PER_PAGE;
    return filteredProducts.slice(start, start + PRODUCTS_PER_PAGE);
  }, [filteredProducts, currentPage]);

  // Reset to page 1 when filters change
  const handleFilterChange = () => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  };

  const toggleBrand = (brand: string) => {
    setSelectedBrands(prev => 
      prev.includes(brand) 
        ? prev.filter(b => b !== brand)
        : [...prev, brand]
    );
  };

  const handleSpecificationChange = (key: string, values: string[]) => {
    setSelectedSpecifications(prev => ({
      ...prev,
      [key]: values,
    }));
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
    setSelectedSpecifications({});
    setCurrentPage(1);
  };

  const activeFiltersCount = 
    selectedBrands.length + 
    (priceRange[0] > 0 || priceRange[1] < 50000 ? 1 : 0) +
    Object.values(selectedSpecifications).filter(v => v.length > 0).length;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      {/* Add bottom padding for mobile filter bar */}
      <main className="pb-[140px] md:pb-24 lg:pb-12">
        {/* Category Banner */}
        {currentCategory && (
          <div className="relative h-24 md:h-48 overflow-hidden bg-gradient-to-br from-primary/10 to-primary/5">
            {currentCategory.image_url ? (
              <img
                src={currentCategory.image_url}
                alt={currentCategory.name}
                className="w-full h-full object-cover opacity-30"
              />
            ) : null}
            <div className="absolute inset-0 flex items-center">
              <div className="container mx-auto px-4">
                <nav className="hidden md:flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  <Link to="/" className="hover:text-foreground transition-colors">Главная</Link>
                  <span>/</span>
                  <Link to="/catalog" className="hover:text-foreground transition-colors">Каталог</Link>
                  <span>/</span>
                  <span className="text-foreground">{currentCategory.name}</span>
                </nav>
                <h1 className="text-xl md:text-3xl font-bold">{currentCategory.name}</h1>
                {currentCategory.description && (
                  <p className="text-muted-foreground mt-1 max-w-2xl text-sm hidden md:block">
                    {currentCategory.description}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="container mx-auto px-3 md:px-4 py-2 md:py-4">
          {/* Breadcrumb for catalog root */}
          {!currentCategory && (
            <nav className="hidden md:flex items-center gap-2 text-sm text-muted-foreground mb-4">
              <Link to="/" className="hover:text-foreground">Главная</Link>
              <span>/</span>
              <span className="text-foreground">Каталог</span>
            </nav>
          )}

          {!currentCategory && (
            <h1 className="text-xl md:text-2xl font-bold mb-2 md:mb-4">Каталог</h1>
          )}

          <div className="flex gap-6">
            {/* Sidebar - Categories (desktop only) */}
            <div className="hidden lg:block">
              <CatalogSidebar 
                categories={categories} 
                currentCategorySlug={category} 
              />
            </div>

            {/* Main Content */}
            <div className="flex-1 min-w-0">
              {/* Horizontal Filters */}
              <HorizontalFilters
                brands={brands}
                selectedBrands={selectedBrands}
                onBrandToggle={toggleBrand}
                priceRange={priceRange}
                onPriceChange={setPriceRange}
                sortBy={sortBy}
                onSortChange={setSortBy}
                viewMode={viewMode}
                onViewModeChange={setViewMode}
                onClearFilters={clearFilters}
                activeFiltersCount={activeFiltersCount}
                maxPrice={50000}
                specificationFilters={specificationFilters}
                selectedSpecifications={selectedSpecifications}
                onSpecificationChange={handleSpecificationChange}
                totalProducts={filteredProducts.length}
              />

              {/* Products Grid */}
              {loadingProducts ? (
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2 md:gap-4">
                  {[...Array(8)].map((_, i) => (
                    <Card key={i}>
                      <CardContent className="p-3">
                        <Skeleton className="aspect-square rounded-lg mb-3" />
                        <Skeleton className="h-4 w-20 mb-2" />
                        <Skeleton className="h-5 w-full mb-2" />
                        <Skeleton className="h-4 w-16 mb-2" />
                        <Skeleton className="h-6 w-24" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : paginatedProducts.length > 0 ? (
                <div className={viewMode === "grid" 
                  ? "grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2 md:gap-4" 
                  : "space-y-3"
                }>
                  {paginatedProducts.map((product, index) => (
                    <Card 
                      key={product.id} 
                      className="group cursor-pointer hover:shadow-lg transition-all duration-300 animate-fade-in overflow-hidden"
                      style={{ animationDelay: `${index * 30}ms` }}
                    >
                      <CardContent className="p-2 md:p-3">
                        <div className="relative aspect-square rounded-lg bg-muted mb-2 md:mb-3 overflow-hidden">
                          <Link to={`/product/${product.slug}`}>
                            <img 
                              src={product.images?.[0] || "/placeholder.svg"} 
                              alt={product.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              loading="lazy"
                            />
                          </Link>
                          {product.old_price && (
                            <Badge className="absolute top-1.5 left-1.5 md:top-2 md:left-2 bg-destructive text-destructive-foreground text-[10px] md:text-xs px-1.5 md:px-2">
                              -{Math.round((1 - product.price / product.old_price) * 100)}%
                            </Badge>
                          )}
                          {product.stock_count === 0 && (
                            <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                              <span className="text-xs md:text-sm font-medium">Нет в наличии</span>
                            </div>
                          )}
                          <Button
                            variant="secondary"
                            size="icon"
                            className="absolute top-1.5 right-1.5 md:top-2 md:right-2 h-7 w-7 md:h-8 md:w-8 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => {
                              e.preventDefault();
                              toggleFavorite(product.id);
                            }}
                          >
                            <Heart className={`h-3.5 w-3.5 md:h-4 md:w-4 ${favorites.includes(product.id) ? 'fill-destructive text-destructive' : ''}`} />
                          </Button>
                        </div>
                        
                        {product.brand?.name && (
                          <p className="text-[10px] md:text-xs text-muted-foreground mb-0.5 md:mb-1 truncate">{product.brand.name}</p>
                        )}
                        
                        <Link to={`/product/${product.slug}`}>
                          <h3 className="font-medium line-clamp-2 mb-1.5 md:mb-2 text-xs md:text-sm hover:text-primary transition-colors leading-tight">
                            {product.name}
                          </h3>
                        </Link>
                        
                        <div className="flex items-center gap-1 mb-1.5 md:mb-2">
                          <Star className="h-3 w-3 md:h-3.5 md:w-3.5 fill-yellow-400 text-yellow-400" />
                          <span className="text-xs md:text-sm font-medium">{product.rating || 0}</span>
                          <span className="text-[10px] md:text-xs text-muted-foreground">({product.review_count || 0})</span>
                        </div>
                        
                        <div className="flex items-center justify-between gap-1">
                          <div className="min-w-0">
                            <span className="font-bold text-sm md:text-base">{product.price.toLocaleString()} ₽</span>
                            {product.old_price && (
                              <span className="text-[10px] md:text-xs text-muted-foreground line-through ml-1 md:ml-2 block md:inline">
                                {product.old_price.toLocaleString()} ₽
                              </span>
                            )}
                          </div>
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-7 w-7 md:h-8 md:w-8 shrink-0"
                            disabled={product.stock_count === 0}
                            onClick={() => addToCart(product)}
                          >
                            <ShoppingCart className="h-3.5 w-3.5 md:h-4 md:w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Folder className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">Товары не найдены</p>
                  <Button variant="outline" onClick={clearFilters}>
                    Сбросить фильтры
                  </Button>
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && paginatedProducts.length > 0 && (
                <div className="flex items-center justify-center gap-2 pt-8 pb-4">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(currentPage - 1)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  
                  <div className="flex items-center gap-1">
                    {/* First page */}
                    {currentPage > 3 && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-9 w-9 p-0"
                          onClick={() => setCurrentPage(1)}
                        >
                          1
                        </Button>
                        {currentPage > 4 && (
                          <span className="px-1 text-muted-foreground">...</span>
                        )}
                      </>
                    )}
                    
                    {/* Page numbers around current */}
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(page => 
                        page >= currentPage - 2 && 
                        page <= currentPage + 2 &&
                        page >= 1 &&
                        page <= totalPages
                      )
                      .map(page => (
                        <Button
                          key={page}
                          variant={page === currentPage ? "default" : "ghost"}
                          size="sm"
                          className="h-9 w-9 p-0"
                          onClick={() => setCurrentPage(page)}
                        >
                          {page}
                        </Button>
                      ))
                    }
                    
                    {/* Last page */}
                    {currentPage < totalPages - 2 && (
                      <>
                        {currentPage < totalPages - 3 && (
                          <span className="px-1 text-muted-foreground">...</span>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-9 w-9 p-0"
                          onClick={() => setCurrentPage(totalPages)}
                        >
                          {totalPages}
                        </Button>
                      </>
                    )}
                  </div>
                  
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(currentPage + 1)}
                  >
                    <ChevronRight className="h-4 w-4" />
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
