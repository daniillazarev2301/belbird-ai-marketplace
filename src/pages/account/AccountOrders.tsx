import { useState } from "react";
import { Helmet } from "react-helmet-async";
import AccountLayout from "@/components/account/AccountLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Package,
  Truck,
  CheckCircle,
  Clock,
  XCircle,
  ChevronRight,
  RefreshCw,
  MapPin,
  Phone,
} from "lucide-react";

const orders = [
  {
    id: "12345",
    date: "12.12.2024",
    status: "shipped",
    total: 7470,
    items: [
      { name: "Royal Canin Indoor 2кг", qty: 2, price: 3290, image: "https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=80&h=80&fit=crop" },
      { name: "Миска керамическая", qty: 1, price: 890, image: "https://images.unsplash.com/photo-1545249390-6bdfa286032f?w=80&h=80&fit=crop" },
    ],
    delivery: {
      method: "СДЭК",
      address: "г. Москва, ул. Пушкина, д. 10, кв. 25",
      tracking: "1234567890",
      estimated: "15.12.2024",
    },
  },
  {
    id: "12340",
    date: "05.12.2024",
    status: "delivered",
    total: 5890,
    items: [
      { name: "Лежанка Premium XL", qty: 1, price: 4990, image: "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=80&h=80&fit=crop" },
      { name: "Игрушка мячик", qty: 3, price: 300, image: "https://images.unsplash.com/photo-1576201836106-db1758fd1c97?w=80&h=80&fit=crop" },
    ],
    delivery: {
      method: "Boxberry",
      address: "ПВЗ: Москва, Тверская 15",
      tracking: "BB1234567",
      estimated: "08.12.2024",
    },
  },
  {
    id: "12335",
    date: "20.11.2024",
    status: "delivered",
    total: 2950,
    items: [
      { name: "Семена томатов Черри", qty: 5, price: 590, image: "https://images.unsplash.com/photo-1592921870789-04563d55041c?w=80&h=80&fit=crop" },
    ],
    delivery: {
      method: "Почта России",
      address: "г. Москва, ул. Пушкина, д. 10, кв. 25",
      tracking: "12345678901234",
      estimated: "28.11.2024",
    },
  },
  {
    id: "12320",
    date: "01.11.2024",
    status: "cancelled",
    total: 8450,
    items: [
      { name: "Свеча ароматическая", qty: 2, price: 1490, image: "https://images.unsplash.com/photo-1602607550528-80baf3b9c38a?w=80&h=80&fit=crop" },
      { name: "Ваза декоративная", qty: 1, price: 5470, image: "https://images.unsplash.com/photo-1578500494198-246f612d3b3d?w=80&h=80&fit=crop" },
    ],
    delivery: {
      method: "СДЭК",
      address: "г. Москва, ул. Пушкина, д. 10, кв. 25",
      tracking: "",
      estimated: "",
    },
  },
];

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive"; icon: React.ElementType }> = {
  pending: { label: "Ожидает оплаты", variant: "outline", icon: Clock },
  processing: { label: "В обработке", variant: "secondary", icon: Package },
  shipped: { label: "В пути", variant: "default", icon: Truck },
  delivered: { label: "Доставлен", variant: "default", icon: CheckCircle },
  cancelled: { label: "Отменён", variant: "destructive", icon: XCircle },
};

const AccountOrders = () => {
  const [selectedOrder, setSelectedOrder] = useState<typeof orders[0] | null>(null);
  const [activeTab, setActiveTab] = useState("all");

  const filteredOrders = activeTab === "all" 
    ? orders 
    : orders.filter(o => o.status === activeTab);

  return (
    <>
      <Helmet>
        <title>Мои заказы — BelBird</title>
      </Helmet>
      <AccountLayout>
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-serif font-semibold">Мои заказы</h1>
            <p className="text-muted-foreground">История ваших покупок</p>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full justify-start h-auto flex-wrap gap-2 bg-transparent p-0">
              <TabsTrigger value="all" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Все ({orders.length})
              </TabsTrigger>
              <TabsTrigger value="shipped" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                В пути ({orders.filter(o => o.status === "shipped").length})
              </TabsTrigger>
              <TabsTrigger value="delivered" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Доставлены ({orders.filter(o => o.status === "delivered").length})
              </TabsTrigger>
              <TabsTrigger value="cancelled" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Отменённые ({orders.filter(o => o.status === "cancelled").length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-4 space-y-4">
              {filteredOrders.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Заказов не найдено</p>
                  </CardContent>
                </Card>
              ) : (
                filteredOrders.map((order) => {
                  const StatusIcon = statusConfig[order.status].icon;
                  return (
                    <Card key={order.id} className="overflow-hidden">
                      <CardContent className="p-0">
                        {/* Order Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-muted/30 border-b border-border">
                          <div className="flex items-center gap-4">
                            <div>
                              <p className="font-semibold">Заказ #{order.id}</p>
                              <p className="text-sm text-muted-foreground">{order.date}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge variant={statusConfig[order.status].variant} className="gap-1">
                              <StatusIcon className="h-3 w-3" />
                              {statusConfig[order.status].label}
                            </Badge>
                            <span className="font-semibold">{order.total.toLocaleString()} ₽</span>
                          </div>
                        </div>

                        {/* Order Items */}
                        <div className="p-4">
                          <div className="flex flex-wrap gap-3 mb-4">
                            {order.items.map((item, idx) => (
                              <div key={idx} className="flex items-center gap-3">
                                <img
                                  src={item.image}
                                  alt={item.name}
                                  className="w-14 h-14 rounded-lg object-cover"
                                />
                                <div>
                                  <p className="text-sm font-medium line-clamp-1">{item.name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {item.qty} шт × {item.price.toLocaleString()} ₽
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Actions */}
                          <div className="flex flex-wrap gap-2">
                            <Button variant="outline" size="sm" onClick={() => setSelectedOrder(order)}>
                              Подробнее
                            </Button>
                            {order.status === "shipped" && order.delivery.tracking && (
                              <Button variant="outline" size="sm" className="gap-1">
                                <Truck className="h-4 w-4" />
                                Отследить
                              </Button>
                            )}
                            {order.status === "delivered" && (
                              <Button variant="outline" size="sm" className="gap-1">
                                <RefreshCw className="h-4 w-4" />
                                Повторить заказ
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Order Detail Dialog */}
        <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Заказ #{selectedOrder?.id}</DialogTitle>
            </DialogHeader>
            {selectedOrder && (
              <div className="space-y-6">
                {/* Status */}
                <div className="flex items-center justify-between">
                  <Badge variant={statusConfig[selectedOrder.status].variant} className="gap-1">
                    {statusConfig[selectedOrder.status].label}
                  </Badge>
                  <span className="text-sm text-muted-foreground">{selectedOrder.date}</span>
                </div>

                {/* Delivery Info */}
                <div className="p-4 rounded-lg bg-muted/50 space-y-3">
                  <h4 className="font-medium flex items-center gap-2">
                    <Truck className="h-4 w-4" />
                    Доставка: {selectedOrder.delivery.method}
                  </h4>
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <span>{selectedOrder.delivery.address}</span>
                  </div>
                  {selectedOrder.delivery.tracking && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Трек-номер:</span>
                      <span className="font-mono">{selectedOrder.delivery.tracking}</span>
                    </div>
                  )}
                  {selectedOrder.delivery.estimated && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Ожидаемая дата:</span>
                      <span className="font-medium">{selectedOrder.delivery.estimated}</span>
                    </div>
                  )}
                </div>

                {/* Items */}
                <div>
                  <h4 className="font-medium mb-3">Товары</h4>
                  <div className="space-y-3">
                    {selectedOrder.items.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-3 rounded-lg border border-border">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                        <div className="flex-1">
                          <p className="font-medium text-sm">{item.name}</p>
                          <p className="text-xs text-muted-foreground">{item.qty} шт</p>
                        </div>
                        <p className="font-medium">{(item.qty * item.price).toLocaleString()} ₽</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Total */}
                <div className="flex justify-between items-center pt-4 border-t border-border">
                  <span className="font-semibold">Итого</span>
                  <span className="text-xl font-semibold">{selectedOrder.total.toLocaleString()} ₽</span>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  {selectedOrder.status === "delivered" && (
                    <Button className="flex-1 gap-2">
                      <RefreshCw className="h-4 w-4" />
                      Повторить заказ
                    </Button>
                  )}
                  <Button variant="outline" className="flex-1">
                    Нужна помощь?
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </AccountLayout>
    </>
  );
};

export default AccountOrders;
