import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ChevronRight } from "lucide-react";

const orders = [
  {
    id: "12345",
    customer: "Анна М.",
    email: "anna@mail.ru",
    total: 5890,
    status: "processing",
    items: 3,
  },
  {
    id: "12344",
    customer: "Иван П.",
    email: "ivan@gmail.com",
    total: 12450,
    status: "shipped",
    items: 5,
  },
  {
    id: "12343",
    customer: "Мария К.",
    email: "maria@yandex.ru",
    total: 3290,
    status: "delivered",
    items: 1,
  },
  {
    id: "12342",
    customer: "Алексей С.",
    email: "alex@mail.ru",
    total: 8900,
    status: "pending",
    items: 4,
  },
  {
    id: "12341",
    customer: "Елена В.",
    email: "elena@gmail.com",
    total: 15600,
    status: "delivered",
    items: 7,
  },
];

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  pending: { label: "Ожидает", variant: "outline" },
  processing: { label: "В обработке", variant: "secondary" },
  shipped: { label: "Отправлен", variant: "default" },
  delivered: { label: "Доставлен", variant: "default" },
};

const RecentOrders = () => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-semibold">Последние заказы</CardTitle>
        <a href="/admin/orders" className="text-xs text-primary hover:underline flex items-center gap-1">
          Все заказы
          <ChevronRight className="h-3 w-3" />
        </a>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-primary/10 text-primary text-xs">
                    {order.customer.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">#{order.id}</p>
                  <p className="text-xs text-muted-foreground">{order.customer}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">{order.total.toLocaleString()} ₽</p>
                <Badge variant={statusConfig[order.status].variant} className="text-xs mt-1">
                  {statusConfig[order.status].label}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default RecentOrders;
