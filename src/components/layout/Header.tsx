import { Search, ShoppingCart, User, Menu, Heart, Mic, Percent, Camera } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/contexts/CartContext";
import { CategoryMenu } from "./CategoryMenu";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import VoiceSearch from "@/components/search/VoiceSearch";
import VisualSearch from "@/components/search/VisualSearch";
  id: string;
  name: string;
  slug: string;
  price: number;
  images: string[] | null;
}

interface SearchResult {
  id: string;
  name: string;
  slug: string;
  price: number;
  images: string[] | null;
}

const Header = () => {
  const { settings } = useSiteSettings();
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isVoiceSearchOpen, setIsVoiceSearchOpen] = useState(false);
  const [isVisualSearchOpen, setIsVisualSearchOpen] = useState(false);
  const navigate = useNavigate();
  const logoUrl = settings?.general?.logo_url;

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const searchProducts = async () => {
      if (searchQuery.trim().length < 2) {
        setSearchResults([]);
        return;
      }

      const { data, error } = await supabase
        .from('products')
        .select('id, name, slug, price, images')
        .eq('is_active', true)
        .ilike('name', `%${searchQuery}%`)
        .limit(5);

      if (!error && data) {
        setSearchResults(data);
      }
    };

    const debounce = setTimeout(searchProducts, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery]);

  const navLinks = [
    { label: "Акции", href: "/catalog?sale=true", highlight: true, icon: Percent },
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      setShowResults(false);
    }
  };

  const handleResultClick = (slug: string) => {
    navigate(`/product/${slug}`);
    setShowResults(false);
    setSearchQuery("");
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="container flex h-16 items-center justify-between gap-4 px-4 md:px-6">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 shrink-0">
          {logoUrl ? (
            <img src={logoUrl} alt={siteName} className="h-9 w-auto max-w-[120px] object-contain" />
          ) : (
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <span className="text-lg font-bold text-primary-foreground">{siteName.charAt(0)}</span>
            </div>
          )}
          <span className="hidden font-serif text-xl font-semibold text-foreground sm:inline-block">
            {siteName}
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-4">
          <CategoryMenu />
          {navLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className={cn(
                "flex items-center gap-1.5 text-sm font-medium transition-colors hover:text-primary",
                link.highlight
                  ? "text-secondary font-semibold"
                  : "text-muted-foreground"
              )}
            >
              {link.icon && <link.icon className="h-4 w-4" />}
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Search Bar */}
        <div ref={searchRef} className="relative flex-1 max-w-md">
          <form
            onSubmit={handleSearch}
            className={cn(
              "relative transition-all duration-300",
              isSearchFocused && "max-w-lg"
            )}
          >
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Найти товары, бренды..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowResults(true);
              }}
              className="w-full pl-10 pr-10 h-10 bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-primary"
              onFocus={() => {
                setIsSearchFocused(true);
                setShowResults(true);
              }}
              onBlur={() => setIsSearchFocused(false)}
            />
            <button 
              type="button" 
              className="absolute right-10 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
              onClick={() => setIsVisualSearchOpen(true)}
            >
              <Camera className="h-4 w-4" />
            </button>
            <button 
              type="button" 
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
              onClick={() => setIsVoiceSearchOpen(true)}
            >
              <Mic className="h-4 w-4" />
            </button>
          {showResults && searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-lg shadow-lg z-50 overflow-hidden">
              {searchResults.map((result) => (
                <button
                  key={result.id}
                  onClick={() => handleResultClick(result.slug)}
                  className="flex items-center gap-3 w-full p-3 hover:bg-accent transition-colors text-left"
                >
                  <img
                    src={result.images?.[0] || '/placeholder.svg'}
                    alt={result.name}
                    className="w-10 h-10 rounded object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{result.name}</p>
                    <p className="text-sm text-primary font-semibold">{result.price.toLocaleString()} ₽</p>
                  </div>
                </button>
              ))}
              <button
                onClick={() => {
                  navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
                  setShowResults(false);
                }}
                className="w-full p-3 text-sm text-center text-primary hover:bg-accent transition-colors border-t border-border"
              >
                Показать все результаты
              </button>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="hidden sm:flex" asChild>
            <Link to="/account/favorites">
              <Heart className="h-5 w-5" />
            </Link>
          </Button>
          <Button variant="ghost" size="icon" className="relative" asChild>
            <Link to="/cart">
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 && (
                <Badge className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center bg-secondary text-secondary-foreground">
                  {cartCount > 99 ? "99+" : cartCount}
                </Badge>
              )}
            </Link>
          </Button>
          <Button variant="ghost" size="icon" className="hidden sm:flex" asChild>
            <Link to={user ? "/account" : "/auth"}>
              <User className="h-5 w-5" />
            </Link>
          </Button>

          {/* Mobile Menu */}
          <Sheet>
            <SheetTrigger asChild className="lg:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80">
              <div className="flex flex-col gap-6 mt-8">
                <Link to="/" className="flex items-center gap-2">
                  {logoUrl ? (
                    <img src={logoUrl} alt={siteName} className="h-9 w-auto max-w-[120px] object-contain" />
                  ) : (
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                      <span className="text-lg font-bold text-primary-foreground">{siteName.charAt(0)}</span>
                    </div>
                  )}
                  <span className="font-serif text-xl font-semibold">{siteName}</span>
                </Link>
                <nav className="flex flex-col gap-4">
                  {navLinks.map((link) => (
                    <Link
                      key={link.href}
                      to={link.href}
                      className={cn(
                        "text-base font-medium transition-colors hover:text-primary py-2",
                        link.highlight ? "text-secondary" : "text-foreground"
                      )}
                    >
                      {link.label}
                    </Link>
                  ))}
                </nav>
                <div className="border-t border-border pt-4">
                  <Link to={user ? "/account" : "/auth"} className="flex items-center gap-3 py-2 text-foreground hover:text-primary transition-colors">
                    <User className="h-5 w-5" />
                    <span>{user ? "Личный кабинет" : "Войти"}</span>
                  </Link>
                  <Link to="/account/favorites" className="flex items-center gap-3 py-2 text-foreground hover:text-primary transition-colors">
                    <Heart className="h-5 w-5" />
                    <span>Избранное</span>
                  </Link>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <VoiceSearch
        isOpen={isVoiceSearchOpen}
        onOpenChange={setIsVoiceSearchOpen}
        onResult={(text) => {
          setSearchQuery(text);
          navigate(`/search?q=${encodeURIComponent(text)}`);
        }}
      />
      <VisualSearch
        isOpen={isVisualSearchOpen}
        onOpenChange={setIsVisualSearchOpen}
      />
    </header>
  );
};

export default Header;
