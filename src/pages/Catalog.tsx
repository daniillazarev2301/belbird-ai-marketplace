import { useState, useEffect } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { Filter, Grid3X3, List, ChevronDown, Star, Heart, ShoppingCart, SlidersHorizontal, X } from "lucide-react";
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
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { useToast } from "@/hooks/use-toast";

interface Product {
  id: string;
  name: string;
  brand: string;
  price: number;
  oldPrice?: number;
  image: string;
  rating: number;
  reviewCount: number;
  inStock: boolean;
}

const mockProducts: Product[] = [
  { id: "1", name: "Корм для собак Royal Canin Maxi Adult", brand: "Royal Canin", price: 7490, oldPrice: 8900, image: "/placeholder.svg", rating: 4.8, reviewCount: 1247, inStock: true },
  { id: "2", name: "Лежанка ортопедическая для средних пород", brand: "Trixie", price: 3200, image: "/placeholder.svg", rating: 4.6, reviewCount: 234, inStock: true },
  { id: "3", name: "Расчёска-фурминатор для длинношёрстных", brand: "FURminator", price: 1890, image: "/placeholder.svg", rating: 4.9, reviewCount: 567, inStock: true },
  { id: "4", name: "Шампунь для персидских кошек", brand: "Bio-Groom", price: 890, image: "/placeholder.svg", rating: 4.6, reviewCount: 89, inStock: true },
  { id: "5", name: "Когтеточка-домик многоуровневая", brand: "Trixie", price: 5490, oldPrice: 6500, image: "/placeholder.svg", rating: 4.7, reviewCount: 156, inStock: true },
  { id: "6", name: "Витамины для суставов собак", brand: "Purina", price: 1290, image: "/placeholder.svg", rating: 4.5, reviewCount: 312, inStock: false },
  { id: "7", name: "Переноска для кошек и собак мелких пород", brand: "Trixie", price: 2490, image: "/placeholder.svg", rating: 4.4, reviewCount: 178, inStock: true },
  { id: "8", name: "Корм для кошек Royal Canin Persian Adult", brand: "Royal Canin", price: 3590, oldPrice: 4200, image: "/placeholder.svg", rating: 4.8, reviewCount: 892, inStock: true },
  { id: "9", name: "Игрушка-дразнилка с перьями", brand: "Trixie", price: 390, image: "/placeholder.svg", rating: 4.3, reviewCount: 445, inStock: true },
  { id: "10", name: "Миска автоматическая с таймером", brand: "Purina", price: 4990, image: "/placeholder.svg", rating: 4.6, reviewCount: 267, inStock: true },
  { id: "11", name: "Наполнитель комкующийся премиум", brand: "Bio-Groom", price: 1590, image: "/placeholder.svg", rating: 4.7, reviewCount: 1034, inStock: true },
  { id: "12", name: "Ошейник антиблошиный 8 месяцев", brand: "Purina", price: 890, image: "/placeholder.svg", rating: 4.2, reviewCount: 678, inStock: true },
];

const brands = ["Royal Canin", "Trixie", "FURminator", "Bio-Groom", "Purina"];
const ratings = [4, 3, 2, 1];

const Catalog = () => {
  const { category } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [priceRange, setPriceRange] = useState([0, 10000]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [minRating, setMinRating] = useState(0);
  const [sortBy, setSortBy] = useState("popular");
  const [currentPage, setCurrentPage] = useState(1);
  const [favorites, setFavorites] = useState<string[]>([]);
  
  const itemsPerPage = 12;
  
  // Filter products
  const filteredProducts = mockProducts.filter(product => {
    if (product.price < priceRange[0] || product.price > priceRange[1]) return false;
    if (selectedBrands.length > 0 && !selectedBrands.includes(product.brand)) return false;
    if (product.rating < minRating) return false;
    return true;
  });
  
  // Sort products
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case "price-asc": return a.price - b.price;
      case "price-desc": return b.price - a.price;
      case "rating": return b.rating - a.rating;
      case "new": return 0; // Would use date in real app
      default: return b.reviewCount - a.reviewCount; // Popular
    }
  });
  
  // Paginate
  const totalPages = Math.ceil(sortedProducts.length / itemsPerPage);
  const paginatedProducts = sortedProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const toggleBrand = (brand: string) => {
    setSelectedBrands(prev => 
      prev.includes(brand) 
        ? prev.filter(b => b !== brand)
        : [...prev, brand]
    );
    setCurrentPage(1);
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
    toast({
      title: "Добавлено в корзину",
      description: product.name
    });
  };

  const clearFilters = () => {
    setPriceRange([0, 10000]);
    setSelectedBrands([]);
    setMinRating(0);
    setCurrentPage(1);
  };

  const activeFiltersCount = selectedBrands.length + (minRating > 0 ? 1 : 0) + (priceRange[0] > 0 || priceRange[1] < 10000 ? 1 : 0);

  const FilterContent = () => (
    <div className="space-y-6">
      {/* Price Range */}
      <div>
        <h3 className="font-medium mb-4">Цена</h3>
        <Slider
          value={priceRange}
          onValueChange={(value) => {
            setPriceRange(value);
            setCurrentPage(1);
          }}
          max={10000}
          step={100}
          className="mb-2"
        />
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>{priceRange[0].toLocaleString()} ₽</span>
          <span>{priceRange[1].toLocaleString()} ₽</span>
        </div>
      </div>

      <Separator />

      {/* Brands */}
      <div>
        <h3 className="font-medium mb-4">Бренд</h3>
        <div className="space-y-3">
          {brands.map(brand => (
            <div key={brand} className="flex items-center gap-2">
              <Checkbox
                id={brand}
                checked={selectedBrands.includes(brand)}
                onCheckedChange={() => toggleBrand(brand)}
              />
              <Label htmlFor={brand} className="font-normal cursor-pointer">{brand}</Label>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      {/* Rating */}
      <div>
        <h3 className="font-medium mb-4">Рейтинг</h3>
        <div className="space-y-3">
          {ratings.map(rating => (
            <div key={rating} className="flex items-center gap-2">
              <Checkbox
                id={`rating-${rating}`}
                checked={minRating === rating}
                onCheckedChange={() => {
                  setMinRating(minRating === rating ? 0 : rating);
                  setCurrentPage(1);
                }}
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
      <main className="container mx-auto px-4 py-6 pb-24 lg:pb-12">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-foreground">Главная</Link>
          <span>/</span>
          <span className="text-foreground capitalize">{category || "Каталог"}</span>
        </nav>

        {/* Title */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold capitalize">{category || "Каталог"}</h1>
            <p className="text-muted-foreground">{filteredProducts.length} товаров</p>
          </div>
        </div>

        <div className="flex gap-8">
          {/* Desktop Sidebar Filters */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-semibold flex items-center gap-2">
                    <SlidersHorizontal className="h-5 w-5" />
                    Фильтры
                  </h2>
                  {activeFiltersCount > 0 && (
                    <Badge>{activeFiltersCount}</Badge>
                  )}
                </div>
                <FilterContent />
              </CardContent>
            </Card>
          </aside>

          {/* Main Content */}
          <div className="flex-1">
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-6 gap-4">
              {/* Mobile Filters */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" className="lg:hidden">
                    <Filter className="h-4 w-4 mr-2" />
                    Фильтры
                    {activeFiltersCount > 0 && (
                      <Badge className="ml-2">{activeFiltersCount}</Badge>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-80">
                  <SheetHeader>
                    <SheetTitle>Фильтры</SheetTitle>
                  </SheetHeader>
                  <div className="py-6">
                    <FilterContent />
                  </div>
                </SheetContent>
              </Sheet>

              {/* Sort */}
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
                    <SelectItem value="new">Новинки</SelectItem>
                  </SelectContent>
                </Select>

                {/* View Mode */}
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

            {/* Active Filters */}
            {activeFiltersCount > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {selectedBrands.map(brand => (
                  <Badge key={brand} variant="secondary" className="cursor-pointer" onClick={() => toggleBrand(brand)}>
                    {brand}
                    <X className="h-3 w-3 ml-1" />
                  </Badge>
                ))}
                {minRating > 0 && (
                  <Badge variant="secondary" className="cursor-pointer" onClick={() => setMinRating(0)}>
                    ★ от {minRating}
                    <X className="h-3 w-3 ml-1" />
                  </Badge>
                )}
                {(priceRange[0] > 0 || priceRange[1] < 10000) && (
                  <Badge variant="secondary" className="cursor-pointer" onClick={() => setPriceRange([0, 10000])}>
                    {priceRange[0].toLocaleString()} - {priceRange[1].toLocaleString()} ₽
                    <X className="h-3 w-3 ml-1" />
                  </Badge>
                )}
              </div>
            )}

            {/* Products Grid */}
            {paginatedProducts.length > 0 ? (
              <div className={viewMode === "grid" 
                ? "grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4" 
                : "space-y-4"
              }>
                {paginatedProducts.map((product) => (
                  viewMode === "grid" ? (
                    <Card key={product.id} className="group cursor-pointer hover:shadow-lg transition-shadow">
                      <CardContent className="p-4">
                        <div className="relative aspect-square rounded-lg bg-muted mb-3 overflow-hidden">
                          <Link to={`/product/${product.id}`}>
                            <img 
                              src={product.image} 
                              alt={product.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                          </Link>
                          {product.oldPrice && (
                            <Badge className="absolute top-2 left-2 bg-destructive">
                              -{Math.round((1 - product.price / product.oldPrice) * 100)}%
                            </Badge>
                          )}
                          {!product.inStock && (
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
                        <p className="text-xs text-muted-foreground mb-1">{product.brand}</p>
                        <Link to={`/product/${product.id}`}>
                          <h3 className="font-medium line-clamp-2 mb-2 text-sm hover:text-primary">{product.name}</h3>
                        </Link>
                        <div className="flex items-center gap-1 mb-2">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm font-medium">{product.rating}</span>
                          <span className="text-xs text-muted-foreground">({product.reviewCount})</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-bold">{product.price.toLocaleString()} ₽</span>
                            {product.oldPrice && (
                              <span className="text-xs text-muted-foreground line-through ml-2">
                                {product.oldPrice.toLocaleString()} ₽
                              </span>
                            )}
                          </div>
                          <Button
                            size="icon"
                            variant="outline"
                            disabled={!product.inStock}
                            onClick={() => addToCart(product)}
                          >
                            <ShoppingCart className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card key={product.id} className="group hover:shadow-lg transition-shadow">
                      <CardContent className="p-4 flex gap-4">
                        <div className="relative w-32 h-32 rounded-lg bg-muted flex-shrink-0 overflow-hidden">
                          <Link to={`/product/${product.id}`}>
                            <img 
                              src={product.image} 
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          </Link>
                          {product.oldPrice && (
                            <Badge className="absolute top-1 left-1 bg-destructive text-xs">
                              -{Math.round((1 - product.price / product.oldPrice) * 100)}%
                            </Badge>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-muted-foreground mb-1">{product.brand}</p>
                          <Link to={`/product/${product.id}`}>
                            <h3 className="font-medium mb-2 hover:text-primary">{product.name}</h3>
                          </Link>
                          <div className="flex items-center gap-1 mb-2">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span className="text-sm font-medium">{product.rating}</span>
                            <span className="text-xs text-muted-foreground">({product.reviewCount} отзывов)</span>
                          </div>
                          <div className="flex items-center gap-4">
                            <div>
                              <span className="text-xl font-bold">{product.price.toLocaleString()} ₽</span>
                              {product.oldPrice && (
                                <span className="text-sm text-muted-foreground line-through ml-2">
                                  {product.oldPrice.toLocaleString()} ₽
                                </span>
                              )}
                            </div>
                            <Button disabled={!product.inStock} onClick={() => addToCart(product)}>
                              <ShoppingCart className="h-4 w-4 mr-2" />
                              В корзину
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => toggleFavorite(product.id)}
                            >
                              <Heart className={`h-4 w-4 ${favorites.includes(product.id) ? 'fill-destructive text-destructive' : ''}`} />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">По вашему запросу ничего не найдено</p>
                <Button variant="outline" onClick={clearFilters}>Сбросить фильтры</Button>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <Pagination className="mt-8">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <PaginationItem key={page}>
                      <PaginationLink
                        onClick={() => setCurrentPage(page)}
                        isActive={currentPage === page}
                        className="cursor-pointer"
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  <PaginationItem>
                    <PaginationNext 
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </div>
        </div>
      </main>
      <Footer />
      <MobileNav />
    </div>
  );
};

export default Catalog;
