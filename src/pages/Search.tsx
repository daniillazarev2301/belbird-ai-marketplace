import { useState, useEffect, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Search as SearchIcon, Mic, MicOff, X, Sparkles, Clock, TrendingUp, Camera, Star, Heart, ShoppingCart } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import MobileNav from "@/components/layout/MobileNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface SearchResult {
  id: string;
  name: string;
  slug: string;
  price: number;
  old_price?: number;
  images: string[];
  rating: number;
  review_count: number;
  brand?: { name: string };
}

const recentSearches = [
  "корм для собак",
  "лежанка ортопедическая",
  "игрушки для кошек",
  "витамины для суставов"
];

const trendingSearches = [
  "Royal Canin",
  "когтеточка",
  "шампунь для собак",
  "переноска",
  "наполнитель"
];

const Search = () => {
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [isListening, setIsListening] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.lang = 'ru-RU';
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setQuery(transcript);
        if (event.results[0].isFinal) {
          setIsListening(false);
          handleSearch(transcript);
        }
      };

      recognitionRef.current.onerror = () => {
        setIsListening(false);
        toast({
          variant: "destructive",
          title: "Ошибка распознавания",
          description: "Не удалось распознать речь. Попробуйте ещё раз."
        });
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  useEffect(() => {
    const q = searchParams.get("q");
    if (q) {
      setQuery(q);
      handleSearch(q);
    }
  }, [searchParams]);

  const toggleVoiceInput = () => {
    if (!recognitionRef.current) {
      toast({
        variant: "destructive",
        title: "Голосовой ввод недоступен",
        description: "Ваш браузер не поддерживает голосовой ввод."
      });
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
      toast({
        title: "Слушаю...",
        description: "Скажите, что вы ищете"
      });
    }
  };

  const handleSearch = async (searchQuery: string = query) => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    setShowSuggestions(false);
    setSearchParams({ q: searchQuery });
    
    const { data, error } = await supabase
      .from("products")
      .select(`
        id, name, slug, price, old_price, images, rating, review_count,
        brand:brands(name)
      `)
      .eq("is_active", true)
      .ilike("name", `%${searchQuery}%`)
      .limit(20);

    if (error) {
      console.error("Search error:", error);
    } else {
      setResults((data || []) as SearchResult[]);
    }
    setIsSearching(false);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    handleSearch(suggestion);
  };

  const clearSearch = () => {
    setQuery("");
    setResults([]);
    setShowSuggestions(false);
    setSearchParams({});
    inputRef.current?.focus();
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

  const addToCart = (product: SearchResult) => {
    toast({
      title: "Добавлено в корзину",
      description: product.name
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-6 pb-24 lg:pb-12">
        <div className="max-w-2xl mx-auto mb-8">
          <div className="relative">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  ref={inputRef}
                  type="text"
                  placeholder="Поиск товаров, брендов, категорий..."
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setShowSuggestions(e.target.value.length === 0);
                  }}
                  onFocus={() => setShowSuggestions(query.length === 0)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-12 pr-12 h-14 text-lg rounded-full border-2 focus:border-primary"
                />
                {query && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
                    onClick={clearSearch}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              
              <Button
                variant={isListening ? "default" : "outline"}
                size="icon"
                className={`h-14 w-14 rounded-full flex-shrink-0 ${isListening ? 'animate-pulse' : ''}`}
                onClick={toggleVoiceInput}
              >
                {isListening ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
              </Button>

              <Button
                variant="outline"
                size="icon"
                className="h-14 w-14 rounded-full flex-shrink-0"
                onClick={() => toast({ title: "Визуальный поиск", description: "Функция будет доступна скоро" })}
              >
                <Camera className="h-6 w-6" />
              </Button>
            </div>

            {showSuggestions && query.length === 0 && (
              <Card className="absolute top-full left-0 right-0 mt-2 z-50">
                <CardContent className="p-4">
                  {recentSearches.length > 0 && (
                    <div className="mb-4">
                      <div className="flex items-center gap-2 text-sm font-medium mb-3">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        Недавние запросы
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {recentSearches.map((search, index) => (
                          <Badge
                            key={index}
                            variant="secondary"
                            className="cursor-pointer hover:bg-secondary/80"
                            onClick={() => handleSuggestionClick(search)}
                          >
                            {search}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <div className="flex items-center gap-2 text-sm font-medium mb-3">
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                      Популярные запросы
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {trendingSearches.map((search, index) => (
                        <Badge
                          key={index}
                          variant="outline"
                          className="cursor-pointer hover:bg-accent"
                          onClick={() => handleSuggestionClick(search)}
                        >
                          {search}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {isSearching && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
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
        )}

        {!isSearching && results.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <p className="text-muted-foreground">
                Найдено <span className="font-medium text-foreground">{results.length}</span> товаров по запросу «{query}»
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {results.map((product) => (
                <Card key={product.id} className="group cursor-pointer hover:shadow-lg transition-shadow">
                  <CardContent className="p-4">
                    <div className="relative aspect-square rounded-lg bg-muted mb-3 overflow-hidden">
                      <Link to={`/product/${product.slug}`}>
                        <img 
                          src={product.images?.[0] || "/placeholder.svg"} 
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      </Link>
                      {product.old_price && (
                        <Badge className="absolute top-2 left-2 bg-destructive">
                          -{Math.round((1 - product.price / product.old_price) * 100)}%
                        </Badge>
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
                      <h3 className="font-medium line-clamp-2 mb-2 text-sm hover:text-primary">{product.name}</h3>
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
                          <span className="text-sm text-muted-foreground line-through ml-2">
                            {product.old_price.toLocaleString()} ₽
                          </span>
                        )}
                      </div>
                      <Button size="icon" variant="outline" onClick={() => addToCart(product)}>
                        <ShoppingCart className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {!isSearching && results.length === 0 && query && (
          <div className="text-center py-12">
            <SearchIcon className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Ничего не найдено</h2>
            <p className="text-muted-foreground mb-6">
              Попробуйте изменить запрос или посмотрите популярные товары
            </p>
            <Button asChild>
              <Link to="/catalog">
                <Sparkles className="h-4 w-4 mr-2" />
                Перейти в каталог
              </Link>
            </Button>
          </div>
        )}

        {!query && !isSearching && results.length === 0 && (
          <div className="text-center py-12">
            <SearchIcon className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Поиск товаров</h2>
            <p className="text-muted-foreground">
              Введите название товара или воспользуйтесь голосовым поиском
            </p>
          </div>
        )}
      </main>
      <Footer />
      <MobileNav />
    </div>
  );
};

export default Search;
