import { Search, ShoppingCart, User, Menu, Heart, Mic } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const Header = () => {
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const navLinks = [
    { label: "Любимцы", href: "/pets" },
    { label: "Уют и Дом", href: "/home" },
    { label: "Сад и Огород", href: "/garden" },
    { label: "Акции", href: "/sales", highlight: true },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="container flex h-16 items-center justify-between gap-4 px-4 md:px-6">
        {/* Logo */}
        <a href="/" className="flex items-center gap-2 shrink-0">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <span className="text-lg font-bold text-primary-foreground">B</span>
          </div>
          <span className="hidden font-serif text-xl font-semibold text-foreground sm:inline-block">
            BelBird
          </span>
        </a>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-6">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary",
                link.highlight
                  ? "text-secondary font-semibold"
                  : "text-muted-foreground"
              )}
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Search Bar */}
        <div
          className={cn(
            "relative flex-1 max-w-md transition-all duration-300",
            isSearchFocused && "max-w-lg"
          )}
        >
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Найти товары, бренды..."
            className="w-full pl-10 pr-10 h-10 bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-primary"
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
          />
          <button className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors">
            <Mic className="h-4 w-4" />
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="hidden sm:flex">
            <Heart className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="relative">
            <ShoppingCart className="h-5 w-5" />
            <Badge className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center bg-secondary text-secondary-foreground">
              3
            </Badge>
          </Button>
          <Button variant="ghost" size="icon" className="hidden sm:flex">
            <User className="h-5 w-5" />
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
                <a href="/" className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                    <span className="text-lg font-bold text-primary-foreground">B</span>
                  </div>
                  <span className="font-serif text-xl font-semibold">BelBird</span>
                </a>
                <nav className="flex flex-col gap-4">
                  {navLinks.map((link) => (
                    <a
                      key={link.href}
                      href={link.href}
                      className={cn(
                        "text-base font-medium transition-colors hover:text-primary py-2",
                        link.highlight ? "text-secondary" : "text-foreground"
                      )}
                    >
                      {link.label}
                    </a>
                  ))}
                </nav>
                <div className="border-t border-border pt-4">
                  <a href="/profile" className="flex items-center gap-3 py-2 text-foreground hover:text-primary transition-colors">
                    <User className="h-5 w-5" />
                    <span>Личный кабинет</span>
                  </a>
                  <a href="/favorites" className="flex items-center gap-3 py-2 text-foreground hover:text-primary transition-colors">
                    <Heart className="h-5 w-5" />
                    <span>Избранное</span>
                  </a>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};

export default Header;
