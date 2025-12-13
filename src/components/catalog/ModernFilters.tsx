import { useState } from "react";
import { Star, X, Check, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

interface Brand {
  id: string;
  name: string;
}

interface ModernFiltersProps {
  brands: Brand[];
  selectedBrands: string[];
  onBrandToggle: (brand: string) => void;
  priceRange: number[];
  onPriceChange: (range: number[]) => void;
  minRating: number;
  onRatingChange: (rating: number) => void;
  onClearFilters: () => void;
  activeFiltersCount: number;
  maxPrice?: number;
}

export function ModernFilters({
  brands,
  selectedBrands,
  onBrandToggle,
  priceRange,
  onPriceChange,
  minRating,
  onRatingChange,
  onClearFilters,
  activeFiltersCount,
  maxPrice = 50000,
}: ModernFiltersProps) {
  const [openSections, setOpenSections] = useState({
    price: true,
    brand: true,
    rating: true,
  });

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const ratingOptions = [
    { value: 4.5, label: "4.5+", description: "Отличные" },
    { value: 4, label: "4+", description: "Хорошие" },
    { value: 3, label: "3+", description: "Средние" },
  ];

  return (
    <div className="space-y-1">
      {/* Active Filters */}
      {activeFiltersCount > 0 && (
        <div className="p-4 bg-muted/30 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium">
              Активные фильтры ({activeFiltersCount})
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-muted-foreground hover:text-foreground"
              onClick={onClearFilters}
            >
              <X className="h-3 w-3 mr-1" />
              Сбросить
            </Button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {priceRange[0] > 0 || priceRange[1] < maxPrice ? (
              <Badge
                variant="secondary"
                className="gap-1 cursor-pointer hover:bg-destructive/20"
                onClick={() => onPriceChange([0, maxPrice])}
              >
                {priceRange[0].toLocaleString()} - {priceRange[1].toLocaleString()} ₽
                <X className="h-3 w-3" />
              </Badge>
            ) : null}
            {selectedBrands.map((brand) => (
              <Badge
                key={brand}
                variant="secondary"
                className="gap-1 cursor-pointer hover:bg-destructive/20"
                onClick={() => onBrandToggle(brand)}
              >
                {brand}
                <X className="h-3 w-3" />
              </Badge>
            ))}
            {minRating > 0 && (
              <Badge
                variant="secondary"
                className="gap-1 cursor-pointer hover:bg-destructive/20"
                onClick={() => onRatingChange(0)}
              >
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                от {minRating}
                <X className="h-3 w-3" />
              </Badge>
            )}
          </div>
        </div>
      )}

      {/* Price Filter */}
      <Collapsible open={openSections.price} onOpenChange={() => toggleSection("price")}>
        <CollapsibleTrigger className="flex w-full items-center justify-between p-4 hover:bg-muted/50 rounded-lg transition-colors">
          <span className="font-medium text-sm">Цена</span>
          <ChevronDown
            className={cn(
              "h-4 w-4 text-muted-foreground transition-transform",
              openSections.price && "rotate-180"
            )}
          />
        </CollapsibleTrigger>
        <CollapsibleContent className="px-4 pb-4">
          <div className="space-y-4">
            <Slider
              value={priceRange}
              onValueChange={onPriceChange}
              max={maxPrice}
              step={500}
              className="mt-2"
            />
            <div className="flex items-center gap-2">
              <div className="flex-1 p-2 bg-muted/50 rounded-md text-center text-sm">
                {priceRange[0].toLocaleString()} ₽
              </div>
              <span className="text-muted-foreground">—</span>
              <div className="flex-1 p-2 bg-muted/50 rounded-md text-center text-sm">
                {priceRange[1].toLocaleString()} ₽
              </div>
            </div>
            {/* Quick price buttons */}
            <div className="flex flex-wrap gap-1.5">
              {[
                { label: "до 1 000 ₽", value: [0, 1000] },
                { label: "1-5 000 ₽", value: [1000, 5000] },
                { label: "5-10 000 ₽", value: [5000, 10000] },
                { label: "от 10 000 ₽", value: [10000, maxPrice] },
              ].map((option) => (
                <Button
                  key={option.label}
                  variant={
                    priceRange[0] === option.value[0] && priceRange[1] === option.value[1]
                      ? "secondary"
                      : "outline"
                  }
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => onPriceChange(option.value)}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      <Separator />

      {/* Brand Filter */}
      <Collapsible open={openSections.brand} onOpenChange={() => toggleSection("brand")}>
        <CollapsibleTrigger className="flex w-full items-center justify-between p-4 hover:bg-muted/50 rounded-lg transition-colors">
          <span className="font-medium text-sm">
            Бренд
            {selectedBrands.length > 0 && (
              <Badge variant="secondary" className="ml-2 h-5 px-1.5">
                {selectedBrands.length}
              </Badge>
            )}
          </span>
          <ChevronDown
            className={cn(
              "h-4 w-4 text-muted-foreground transition-transform",
              openSections.brand && "rotate-180"
            )}
          />
        </CollapsibleTrigger>
        <CollapsibleContent className="px-4 pb-4">
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {brands.map((brand) => {
              const isSelected = selectedBrands.includes(brand.name);
              return (
                <button
                  key={brand.id}
                  onClick={() => onBrandToggle(brand.name)}
                  className={cn(
                    "flex w-full items-center justify-between p-2 rounded-md text-sm transition-colors",
                    isSelected
                      ? "bg-primary/10 text-primary"
                      : "hover:bg-muted/50"
                  )}
                >
                  <span>{brand.name}</span>
                  {isSelected && <Check className="h-4 w-4" />}
                </button>
              );
            })}
          </div>
        </CollapsibleContent>
      </Collapsible>

      <Separator />

      {/* Rating Filter */}
      <Collapsible open={openSections.rating} onOpenChange={() => toggleSection("rating")}>
        <CollapsibleTrigger className="flex w-full items-center justify-between p-4 hover:bg-muted/50 rounded-lg transition-colors">
          <span className="font-medium text-sm">Рейтинг</span>
          <ChevronDown
            className={cn(
              "h-4 w-4 text-muted-foreground transition-transform",
              openSections.rating && "rotate-180"
            )}
          />
        </CollapsibleTrigger>
        <CollapsibleContent className="px-4 pb-4">
          <div className="space-y-1">
            {ratingOptions.map((option) => {
              const isSelected = minRating === option.value;
              return (
                <button
                  key={option.value}
                  onClick={() => onRatingChange(isSelected ? 0 : option.value)}
                  className={cn(
                    "flex w-full items-center justify-between p-2 rounded-md text-sm transition-colors",
                    isSelected
                      ? "bg-primary/10 text-primary"
                      : "hover:bg-muted/50"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={cn(
                            "h-3.5 w-3.5",
                            star <= option.value
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-muted-foreground/30"
                          )}
                        />
                      ))}
                    </div>
                    <span>{option.description}</span>
                  </div>
                  {isSelected && <Check className="h-4 w-4" />}
                </button>
              );
            })}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
