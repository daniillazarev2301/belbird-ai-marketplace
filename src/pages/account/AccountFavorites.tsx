import { useState } from "react";
import { Helmet } from "react-helmet-async";
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
  Bell,
  BellOff,
} from "lucide-react";

interface FavoriteProduct {
  id: string;
  name: string;
  price: number;
  oldPrice?: number;
  image: string;
  rating: number;
  reviewCount: number;
  category: string;
  inStock: boolean;
  priceAlert: boolean;
}

const favorites: FavoriteProduct[] = [
  {
    id: "1",
    name: "Royal Canin Indoor для кошек 2кг",
    price: 3290,
    oldPrice: 3890,
    image: "https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=300&h=300&fit=crop",
    rating: 4.9,
    reviewCount: 2341,
    category: "Корма для кошек",
    inStock: true,
    priceAlert: true,
  },
  {
    id: "2",
    name: "Лежанка Premium для собак XL",
    price: 4990,
    image: "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=300&h=300&fit=crop",
    rating: 4.8,
    reviewCount: 856,
    category: "Аксессуары для собак",
    inStock: true,
    priceAlert: false,
  },
  {
    id: "3",
    name: "Свеча ароматическая с эфирными маслами",
    price: 1490,
    image: "https://images.unsplash.com/photo-1602607550528-80baf3b9c38a?w=300&h=300&fit=crop",
    rating: 4.7,
    reviewCount: 423,
    category: "Декор для дома",
    inStock: false,
    priceAlert: true,
  },
  {
    id: "4",
    name: "Монстера в декоративном кашпо",
    price: 2890,
    image: "https://images.unsplash.com/photo-1614594975525-e45190c55d0b?w=300&h=300&fit=crop",
    rating: 4.6,
    reviewCount: 678,
    category: "Комнатные растения",
    inStock: true,
    priceAlert: false,
  },
  {
    id: "5",
    name: "Секатор садовый профессиональный",
    price: 1290,
    image: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=300&h=300&fit=crop",
    rating: 4.9,
    reviewCount: 1089,
    category: "Инструменты",
    inStock: true,
    priceAlert: false,
  },
];

const AccountFavorites = () => {
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState("added");

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
                  <Button size="sm" className="gap-2">
                    <ShoppingCart className="h-4 w-4" />
                    В корзину
                  </Button>
                  <Button size="sm" variant="outline" className="gap-2 text-destructive">
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
                <Button>Перейти в каталог</Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {favorites.map((product) => (
                <Card key={product.id} className="overflow-hidden group">
                  <CardContent className="p-0">
                    {/* Image */}
                    <div className="relative aspect-square">
                      <img
                        src={product.image}
                        alt={product.name}
                        className={`w-full h-full object-cover transition-transform group-hover:scale-105 ${
                          !product.inStock ? "opacity-50" : ""
                        }`}
                      />
                      
                      {/* Checkbox */}
                      <div className="absolute top-3 left-3">
                        <Checkbox
                          checked={selectedItems.includes(product.id)}
                          onCheckedChange={() => toggleItem(product.id)}
                          className="bg-background"
                        />
                      </div>

                      {/* Badges */}
                      <div className="absolute top-3 right-3 flex flex-col gap-1">
                        <button
                          className="p-2 rounded-full bg-background shadow-sm hover:bg-destructive hover:text-destructive-foreground transition-colors"
                        >
                          <Heart className="h-4 w-4 fill-destructive text-destructive" />
                        </button>
                        <button
                          className={`p-2 rounded-full shadow-sm transition-colors ${
                            product.priceAlert
                              ? "bg-primary text-primary-foreground"
                              : "bg-background hover:bg-primary hover:text-primary-foreground"
                          }`}
                          title={product.priceAlert ? "Отключить уведомление о цене" : "Уведомить о снижении цены"}
                        >
                          {product.priceAlert ? (
                            <Bell className="h-4 w-4" />
                          ) : (
                            <BellOff className="h-4 w-4" />
                          )}
                        </button>
                      </div>

                      {/* Out of stock overlay */}
                      {!product.inStock && (
                        <div className="absolute inset-0 flex items-center justify-center bg-background/50">
                          <Badge variant="secondary">Нет в наличии</Badge>
                        </div>
                      )}

                      {/* Discount badge */}
                      {product.oldPrice && (
                        <Badge className="absolute bottom-3 left-3 bg-destructive text-destructive-foreground">
                          -{Math.round((1 - product.price / product.oldPrice) * 100)}%
                        </Badge>
                      )}
                    </div>

                    {/* Info */}
                    <div className="p-4">
                      <p className="text-xs text-muted-foreground mb-1">{product.category}</p>
                      <h3 className="font-medium text-sm line-clamp-2 mb-2 group-hover:text-primary transition-colors">
                        {product.name}
                      </h3>
                      
                      {/* Rating */}
                      <div className="flex items-center gap-1 mb-3">
                        <Star className="h-3.5 w-3.5 fill-secondary text-secondary" />
                        <span className="text-sm font-medium">{product.rating}</span>
                        <span className="text-xs text-muted-foreground">
                          ({product.reviewCount})
                        </span>
                      </div>

                      {/* Price & Action */}
                      <div className="flex items-end justify-between">
                        <div>
                          <p className="text-lg font-semibold">
                            {product.price.toLocaleString()} ₽
                          </p>
                          {product.oldPrice && (
                            <p className="text-sm text-muted-foreground line-through">
                              {product.oldPrice.toLocaleString()} ₽
                            </p>
                          )}
                        </div>
                        <Button size="sm" disabled={!product.inStock} className="gap-2">
                          <ShoppingCart className="h-4 w-4" />
                          {product.inStock ? "В корзину" : "Нет в наличии"}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </AccountLayout>
    </>
  );
};

export default AccountFavorites;
