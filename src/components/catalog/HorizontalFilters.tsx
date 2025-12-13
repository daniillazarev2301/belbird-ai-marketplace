import { useState } from "react";
import { SlidersHorizontal, ChevronDown, X, Grid3X3, List, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface Brand {
  id: string;
  name: string;
}

interface SpecificationFilter {
  key: string;
  label: string;
  values: string[];
}

interface HorizontalFiltersProps {
  brands: Brand[];
  selectedBrands: string[];
  onBrandToggle: (brand: string) => void;
  priceRange: number[];
  onPriceChange: (range: number[]) => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
  viewMode: "grid" | "list";
  onViewModeChange: (mode: "grid" | "list") => void;
  onClearFilters: () => void;
  activeFiltersCount: number;
  maxPrice?: number;
  specificationFilters?: SpecificationFilter[];
  selectedSpecifications?: Record<string, string[]>;
  onSpecificationChange?: (key: string, values: string[]) => void;
  totalProducts: number;
}

export function HorizontalFilters({
  brands,
  selectedBrands,
  onBrandToggle,
  priceRange,
  onPriceChange,
  sortBy,
  onSortChange,
  viewMode,
  onViewModeChange,
  onClearFilters,
  activeFiltersCount,
  maxPrice = 50000,
  specificationFilters = [],
  selectedSpecifications = {},
  onSpecificationChange,
  totalProducts,
}: HorizontalFiltersProps) {
  const [priceOpen, setPriceOpen] = useState(false);
  const [brandOpen, setBrandOpen] = useState(false);
  const [allFiltersOpen, setAllFiltersOpen] = useState(false);
  const [localPriceRange, setLocalPriceRange] = useState(priceRange);

  const applyPriceFilter = () => {
    onPriceChange(localPriceRange);
    setPriceOpen(false);
  };

  const handleSpecToggle = (key: string, value: string) => {
    if (!onSpecificationChange) return;
    const current = selectedSpecifications[key] || [];
    const updated = current.includes(value)
      ? current.filter(v => v !== value)
      : [...current, value];
    onSpecificationChange(key, updated);
  };

  return (
    <div className="sticky top-0 z-10 bg-background border-b">
      <div className="flex items-center gap-2 py-3 overflow-x-auto scrollbar-hide">
        {/* Sort */}
        <Select value={sortBy} onValueChange={onSortChange}>
          <SelectTrigger className="w-auto min-w-[160px] h-9 text-sm">
            <SelectValue placeholder="По популярности" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="popular">По популярности</SelectItem>
            <SelectItem value="price-asc">Сначала дешевле</SelectItem>
            <SelectItem value="price-desc">Сначала дороже</SelectItem>
            <SelectItem value="rating">По рейтингу</SelectItem>
            <SelectItem value="new">Сначала новые</SelectItem>
          </SelectContent>
        </Select>

        <Separator orientation="vertical" className="h-6" />

        {/* All Filters Button */}
        <Sheet open={allFiltersOpen} onOpenChange={setAllFiltersOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2 h-9 whitespace-nowrap">
              <SlidersHorizontal className="h-4 w-4" />
              Все фильтры
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="h-5 px-1.5 min-w-[20px]">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-full sm:w-[400px] p-0">
            <SheetHeader className="px-4 py-4 border-b">
              <SheetTitle>Фильтры</SheetTitle>
            </SheetHeader>
            <ScrollArea className="h-[calc(100vh-140px)]">
              <div className="p-4 space-y-6">
                {/* Price */}
                <div>
                  <h4 className="font-medium mb-4">Цена, ₽</h4>
                  <div className="flex gap-3 mb-4">
                    <div className="flex-1">
                      <Label className="text-xs text-muted-foreground">От</Label>
                      <Input
                        type="number"
                        value={localPriceRange[0]}
                        onChange={(e) => setLocalPriceRange([Number(e.target.value), localPriceRange[1]])}
                        className="mt-1"
                      />
                    </div>
                    <div className="flex-1">
                      <Label className="text-xs text-muted-foreground">До</Label>
                      <Input
                        type="number"
                        value={localPriceRange[1]}
                        onChange={(e) => setLocalPriceRange([localPriceRange[0], Number(e.target.value)])}
                        className="mt-1"
                      />
                    </div>
                  </div>
                  <Slider
                    value={localPriceRange}
                    onValueChange={setLocalPriceRange}
                    max={maxPrice}
                    step={100}
                  />
                </div>

                <Separator />

                {/* Brands */}
                {brands.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-4">Бренд</h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {brands.map((brand) => (
                        <label
                          key={brand.id}
                          className="flex items-center gap-3 cursor-pointer py-1"
                        >
                          <Checkbox
                            checked={selectedBrands.includes(brand.name)}
                            onCheckedChange={() => onBrandToggle(brand.name)}
                          />
                          <span className="text-sm">{brand.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Dynamic Specification Filters */}
                {specificationFilters.map((spec) => (
                  <div key={spec.key}>
                    <Separator className="mb-6" />
                    <h4 className="font-medium mb-4">{spec.label}</h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {spec.values.map((value) => (
                        <label
                          key={value}
                          className="flex items-center gap-3 cursor-pointer py-1"
                        >
                          <Checkbox
                            checked={(selectedSpecifications[spec.key] || []).includes(value)}
                            onCheckedChange={() => handleSpecToggle(spec.key, value)}
                          />
                          <span className="text-sm">{value}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
            <SheetFooter className="absolute bottom-0 left-0 right-0 p-4 bg-background border-t">
              <Button onClick={() => { applyPriceFilter(); setAllFiltersOpen(false); }} className="w-full">
                Показать {totalProducts} товаров
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>

        {/* Price Dropdown */}
        <DropdownMenu open={priceOpen} onOpenChange={setPriceOpen}>
          <DropdownMenuTrigger asChild>
            <Button 
              variant={priceRange[0] > 0 || priceRange[1] < maxPrice ? "secondary" : "outline"} 
              size="sm" 
              className="gap-1 h-9 whitespace-nowrap"
            >
              Цена, ₽
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-72 p-4">
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="flex-1">
                  <Label className="text-xs text-muted-foreground">От</Label>
                  <Input
                    type="number"
                    value={localPriceRange[0]}
                    onChange={(e) => setLocalPriceRange([Number(e.target.value), localPriceRange[1]])}
                    className="mt-1 h-9"
                  />
                </div>
                <div className="flex-1">
                  <Label className="text-xs text-muted-foreground">До</Label>
                  <Input
                    type="number"
                    value={localPriceRange[1]}
                    onChange={(e) => setLocalPriceRange([localPriceRange[0], Number(e.target.value)])}
                    className="mt-1 h-9"
                  />
                </div>
              </div>
              <Button size="sm" onClick={applyPriceFilter} className="w-full">
                Применить
              </Button>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Brand Dropdown */}
        {brands.length > 0 && (
          <DropdownMenu open={brandOpen} onOpenChange={setBrandOpen}>
            <DropdownMenuTrigger asChild>
              <Button 
                variant={selectedBrands.length > 0 ? "secondary" : "outline"} 
                size="sm" 
                className="gap-1 h-9 whitespace-nowrap"
              >
                Бренд
                {selectedBrands.length > 0 && (
                  <Badge variant="outline" className="ml-1 h-5 px-1.5 min-w-[20px]">
                    {selectedBrands.length}
                  </Badge>
                )}
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56 max-h-64 overflow-y-auto">
              {brands.map((brand) => (
                <DropdownMenuCheckboxItem
                  key={brand.id}
                  checked={selectedBrands.includes(brand.name)}
                  onCheckedChange={() => onBrandToggle(brand.name)}
                >
                  {brand.name}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Specification Quick Filters */}
        {specificationFilters.slice(0, 3).map((spec) => {
          const selectedCount = (selectedSpecifications[spec.key] || []).length;
          return (
            <DropdownMenu key={spec.key}>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant={selectedCount > 0 ? "secondary" : "outline"} 
                  size="sm" 
                  className="gap-1 h-9 whitespace-nowrap"
                >
                  {spec.label}
                  {selectedCount > 0 && (
                    <Badge variant="outline" className="ml-1 h-5 px-1.5 min-w-[20px]">
                      {selectedCount}
                    </Badge>
                  )}
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56 max-h-64 overflow-y-auto">
                {spec.values.map((value) => (
                  <DropdownMenuCheckboxItem
                    key={value}
                    checked={(selectedSpecifications[spec.key] || []).includes(value)}
                    onCheckedChange={() => handleSpecToggle(spec.key, value)}
                  >
                    {value}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          );
        })}

        {/* Clear Filters */}
        {activeFiltersCount > 0 && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onClearFilters}
            className="gap-1 h-9 text-muted-foreground whitespace-nowrap"
          >
            <X className="h-3 w-3" />
            Сбросить
          </Button>
        )}

        <div className="flex-1" />

        {/* View Mode */}
        <div className="flex items-center border rounded-lg">
          <Button
            variant={viewMode === "grid" ? "secondary" : "ghost"}
            size="icon"
            className="h-9 w-9 rounded-r-none"
            onClick={() => onViewModeChange("grid")}
          >
            <Grid3X3 className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "secondary" : "ghost"}
            size="icon"
            className="h-9 w-9 rounded-l-none"
            onClick={() => onViewModeChange("list")}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
