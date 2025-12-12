import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, TrendingUp, TrendingDown } from "lucide-react";

const products = [
  {
    id: "1",
    name: "Royal Canin Indoor",
    category: "Корма",
    sales: 156,
    revenue: 512840,
    trend: 23,
    image: "https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=80&h=80&fit=crop",
  },
  {
    id: "2",
    name: "Лежанка Premium XL",
    category: "Аксессуары",
    sales: 89,
    revenue: 444110,
    trend: 15,
    image: "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=80&h=80&fit=crop",
  },
  {
    id: "3",
    name: "Семена томатов Черри",
    category: "Семена",
    sales: 234,
    revenue: 138060,
    trend: -8,
    image: "https://images.unsplash.com/photo-1592921870789-04563d55041c?w=80&h=80&fit=crop",
  },
  {
    id: "4",
    name: "Свеча ароматическая",
    category: "Декор",
    sales: 178,
    revenue: 265220,
    trend: 45,
    image: "https://images.unsplash.com/photo-1602607550528-80baf3b9c38a?w=80&h=80&fit=crop",
  },
];

const TopProducts = () => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-semibold">Топ товаров</CardTitle>
        <a href="/admin/products" className="text-xs text-primary hover:underline flex items-center gap-1">
          Все товары
          <ChevronRight className="h-3 w-3" />
        </a>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {products.map((product, index) => (
            <div
              key={product.id}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
            >
              <span className="text-lg font-semibold text-muted-foreground w-6">
                {index + 1}
              </span>
              <img
                src={product.image}
                alt={product.name}
                className="w-12 h-12 rounded-lg object-cover"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{product.name}</p>
                <p className="text-xs text-muted-foreground">{product.category}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">{(product.revenue / 1000).toFixed(0)}K ₽</p>
                <div className="flex items-center justify-end gap-1">
                  {product.trend >= 0 ? (
                    <TrendingUp className="h-3 w-3 text-primary" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-destructive" />
                  )}
                  <span className={`text-xs ${product.trend >= 0 ? 'text-primary' : 'text-destructive'}`}>
                    {product.trend >= 0 ? '+' : ''}{product.trend}%
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default TopProducts;
