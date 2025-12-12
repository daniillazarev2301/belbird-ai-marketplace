import { useState, useEffect, useRef } from "react";
import { Search as SearchIcon, Mic, MicOff, X, Sparkles, Clock, TrendingUp, Camera, Filter, ArrowRight } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import MobileNav from "@/components/layout/MobileNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface SearchResult {
  id: string;
  name: string;
  brand: string;
  price: number;
  oldPrice?: number;
  image: string;
  rating: number;
  reviewCount: number;
  category: string;
}

interface AISuggestion {
  text: string;
  type: "product" | "category" | "tip";
  icon?: React.ReactNode;
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

const mockAISuggestions: AISuggestion[] = [
  { text: "Корм для вашего питомца Барсика (персидская кошка, 3 года)", type: "tip", icon: <Sparkles className="h-4 w-4" /> },
  { text: "Товары для ухода за длинной шерстью", type: "category" },
  { text: "Royal Canin Persian Adult", type: "product" },
  { text: "Витамины для кошек с чувствительным пищеварением", type: "tip" },
];

const mockResults: SearchResult[] = [
  {
    id: "1",
    name: "Корм для кошек Royal Canin Persian Adult",
    brand: "Royal Canin",
    price: 3590,
    oldPrice: 4200,
    image: "/placeholder.svg",
    rating: 4.8,
    reviewCount: 234,
    category: "Питомцы"
  },
  {
    id: "2",
    name: "Расчёска-фурминатор для длинношёрстных кошек",
    brand: "FURminator",
    price: 1890,
    image: "/placeholder.svg",
    rating: 4.9,
    reviewCount: 567,
    category: "Питомцы"
  },
  {
    id: "3",
    name: "Шампунь для персидских кошек с кондиционером",
    brand: "Bio-Groom",
    price: 890,
    image: "/placeholder.svg",
    rating: 4.6,
    reviewCount: 89,
    category: "Питомцы"
  },
  {
    id: "4",
    name: "Когтеточка-домик многоуровневая",
    brand: "Trixie",
    price: 5490,
    oldPrice: 6500,
    image: "/placeholder.svg",
    rating: 4.7,
    reviewCount: 156,
    category: "Питомцы"
  }
];

const Search = () => {
  const { toast } = useToast();
  const [query, setQuery] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [priceRange, setPriceRange] = useState([0, 10000]);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  // Initialize speech recognition
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

  const handleSearch = (searchQuery: string = query) => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    setShowSuggestions(false);
    
    // Simulate search delay
    setTimeout(() => {
      setResults(mockResults);
      setIsSearching(false);
    }, 500);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    handleSearch(suggestion);
  };

  const clearSearch = () => {
    setQuery("");
    setResults([]);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-6 pb-24 lg:pb-12">
        {/* Search Header */}
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
                    setShowSuggestions(e.target.value.length > 0);
                  }}
                  onFocus={() => setShowSuggestions(true)}
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
              
              {/* Voice Input Button */}
              <Button
                variant={isListening ? "default" : "outline"}
                size="icon"
                className={`h-14 w-14 rounded-full flex-shrink-0 ${isListening ? 'animate-pulse' : ''}`}
                onClick={toggleVoiceInput}
              >
                {isListening ? (
                  <MicOff className="h-6 w-6" />
                ) : (
                  <Mic className="h-6 w-6" />
                )}
              </Button>

              {/* Visual Search Button */}
              <Button
                variant="outline"
                size="icon"
                className="h-14 w-14 rounded-full flex-shrink-0"
                onClick={() => toast({ title: "Визуальный поиск", description: "Функция будет доступна после подключения AI" })}
              >
                <Camera className="h-6 w-6" />
              </Button>
            </div>

            {/* AI Suggestions Dropdown */}
            {showSuggestions && query.length > 0 && (
              <Card className="absolute top-full left-0 right-0 mt-2 z-50 max-h-[400px] overflow-y-auto">
                <CardContent className="p-4">
                  {/* AI Personalized Suggestions */}
                  <div className="mb-4">
                    <div className="flex items-center gap-2 text-sm font-medium text-primary mb-3">
                      <Sparkles className="h-4 w-4" />
                      AI-подсказки для вас
                    </div>
                    <div className="space-y-2">
                      {mockAISuggestions.map((suggestion, index) => (
                        <button
                          key={index}
                          className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors text-left"
                          onClick={() => handleSuggestionClick(suggestion.text)}
                        >
                          {suggestion.icon || <SearchIcon className="h-4 w-4 text-muted-foreground" />}
                          <span className="flex-1">{suggestion.text}</span>
                          {suggestion.type === "tip" && (
                            <Badge variant="secondary" className="text-xs">Совет</Badge>
                          )}
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        </button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Empty State Suggestions */}
            {showSuggestions && query.length === 0 && (
              <Card className="absolute top-full left-0 right-0 mt-2 z-50">
                <CardContent className="p-4">
                  {/* Recent Searches */}
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

                  <Separator className="my-4" />

                  {/* Trending */}
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

        {/* Results */}
        {results.length > 0 && (
          <div>
            {/* Results Header */}
            <div className="flex items-center justify-between mb-6">
              <p className="text-muted-foreground">
                Найдено <span className="font-medium text-foreground">{results.length}</span> товаров по запросу «{query}»
              </p>
              
              {/* Filters */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" className="lg:hidden">
                    <Filter className="h-4 w-4 mr-2" />
                    Фильтры
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-80">
                  <SheetHeader>
                    <SheetTitle>Фильтры</SheetTitle>
                  </SheetHeader>
                  <div className="py-6 space-y-6">
                    <div>
                      <Label className="text-sm font-medium mb-4 block">
                        Цена: {priceRange[0].toLocaleString()} - {priceRange[1].toLocaleString()} ₽
                      </Label>
                      <Slider
                        value={priceRange}
                        onValueChange={setPriceRange}
                        max={10000}
                        step={100}
                        className="mt-2"
                      />
                    </div>
                    <Separator />
                    <div>
                      <Label className="text-sm font-medium mb-4 block">Категория</Label>
                      <div className="space-y-3">
                        {["Питомцы", "Дом", "Сад"].map((cat) => (
                          <div key={cat} className="flex items-center gap-2">
                            <Checkbox id={cat} />
                            <Label htmlFor={cat} className="font-normal">{cat}</Label>
                          </div>
                        ))}
                      </div>
                    </div>
                    <Separator />
                    <div>
                      <Label className="text-sm font-medium mb-4 block">Бренд</Label>
                      <div className="space-y-3">
                        {["Royal Canin", "Trixie", "FURminator", "Bio-Groom"].map((brand) => (
                          <div key={brand} className="flex items-center gap-2">
                            <Checkbox id={brand} />
                            <Label htmlFor={brand} className="font-normal">{brand}</Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>

            {/* Results Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {results.map((product) => (
                <Card key={product.id} className="group cursor-pointer hover:shadow-lg transition-shadow">
                  <CardContent className="p-4">
                    <div className="aspect-square rounded-lg bg-muted mb-3 overflow-hidden">
                      <img 
                        src={product.image} 
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mb-1">{product.brand}</p>
                    <h3 className="font-medium line-clamp-2 mb-2 text-sm">{product.name}</h3>
                    <div className="flex items-center gap-1 mb-2">
                      <span className="text-yellow-500">★</span>
                      <span className="text-sm font-medium">{product.rating}</span>
                      <span className="text-xs text-muted-foreground">({product.reviewCount})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold">{product.price.toLocaleString()} ₽</span>
                      {product.oldPrice && (
                        <span className="text-sm text-muted-foreground line-through">
                          {product.oldPrice.toLocaleString()} ₽
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isSearching && results.length === 0 && query && (
          <div className="text-center py-12">
            <SearchIcon className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Ничего не найдено</h2>
            <p className="text-muted-foreground mb-6">
              Попробуйте изменить запрос или воспользуйтесь AI-подсказками
            </p>
            <Button onClick={() => setShowSuggestions(true)}>
              <Sparkles className="h-4 w-4 mr-2" />
              Показать AI-подсказки
            </Button>
          </div>
        )}

        {/* Loading State */}
        {isSearching && (
          <div className="text-center py-12">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-muted-foreground">Ищем товары...</p>
          </div>
        )}
      </main>
      <Footer />
      <MobileNav />
    </div>
  );
};

export default Search;
