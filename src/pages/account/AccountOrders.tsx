import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
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
  RefreshCw,
  MapPin,
  ShoppingBag,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

interface OrderItem {
  id: string;
  product_name: string;
  quantity: number;
  price: number;
  product_id: string | null;
}

interface Order {
  id: string;
  created_at: string;
  status: string;
  total_amount: number;
  shipping_address: any;
  order_items: OrderItem[];
}

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive"; icon: React.ElementType }> = {
  pending: { label: "Ожидает оплаты", variant: "outline", icon: Clock },
  processing: { label: "В обработке", variant: "secondary", icon: Package },
  shipped: { label: "В пути", variant: "default", icon: Truck },
  delivered: { label: "Доставлен", variant: "default", icon: CheckCircle },
  cancelled: { label: "Отменён", variant: "destructive", icon: XCircle },
};

const AccountOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('orders')
      .select(`
        id, created_at, status, total_amount, shipping_address,
        order_items (id, product_name, quantity, price, product_id)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setOrders(data as Order[]);
    }
    setLoading(false);
  };

  const filteredOrders = activeTab === "all" 
    ? orders 
    : orders.filter(o => o.status === activeTab);

  const getStatusCounts = () => ({
    all: orders.length,
    shipped: orders.filter(o => o.status === "shipped").length,
    delivered: orders.filter(o => o.status === "delivered").length,
    cancelled: orders.filter(o => o.status === "cancelled").length,
  });

  const counts = getStatusCounts();

  if (loading) {
    return (
      <AccountLayout>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AccountLayout>
    );
  }

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
                Все ({counts.all})
              </TabsTrigger>
              <TabsTrigger value="shipped" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                В пути ({counts.shipped})
              </TabsTrigger>
              <TabsTrigger value="delivered" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Доставлены ({counts.delivered})
              </TabsTrigger>
              <TabsTrigger value="cancelled" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Отменённые ({counts.cancelled})
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-4 space-y-4">
              {filteredOrders.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <ShoppingBag className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="font-semibold mb-2">Заказов пока нет</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Самое время сделать первый заказ!
                    </p>
                    <Button asChild>
                      <Link to="/catalog">Перейти в каталог</Link>
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                filteredOrders.map((order) => {
                  const StatusIcon = statusConfig[order.status]?.icon || Package;
                  const statusInfo = statusConfig[order.status] || statusConfig.pending;
                  return (
                    <Card key={order.id} className="overflow-hidden">
                      <CardContent className="p-0">
                        {/* Order Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-muted/30 border-b border-border">
                          <div className="flex items-center gap-4">
                            <div>
                              <p className="font-semibold">Заказ #{order.id.slice(0, 8)}</p>
                              <p className="text-sm text-muted-foreground">
                                {format(new Date(order.created_at), 'd MMMM yyyy', { locale: ru })}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge variant={statusInfo.variant} className="gap-1">
                              <StatusIcon className="h-3 w-3" />
                              {statusInfo.label}
                            </Badge>
                            <span className="font-semibold">{order.total_amount.toLocaleString()} ₽</span>
                          </div>
                        </div>

                        {/* Order Items */}
                        <div className="p-4">
                          <div className="flex flex-wrap gap-3 mb-4">
                            {order.order_items.map((item) => (
                              <div key={item.id} className="flex items-center gap-3">
                                <div className="w-14 h-14 rounded-lg bg-muted flex items-center justify-center">
                                  <Package className="h-6 w-6 text-muted-foreground" />
                                </div>
                                <div>
                                  <p className="text-sm font-medium line-clamp-1">{item.product_name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {item.quantity} шт × {item.price.toLocaleString()} ₽
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
                            {order.status === "shipped" && (
                              <Button variant="outline" size="sm" className="gap-1">
                                <Truck className="h-4 w-4" />
                                Отследить
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
              <DialogTitle>Заказ #{selectedOrder?.id.slice(0, 8)}</DialogTitle>
            </DialogHeader>
            {selectedOrder && (
              <div className="space-y-6">
                {/* Status */}
                <div className="flex items-center justify-between">
                  <Badge variant={statusConfig[selectedOrder.status]?.variant || "outline"} className="gap-1">
                    {statusConfig[selectedOrder.status]?.label || selectedOrder.status}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {format(new Date(selectedOrder.created_at), 'd MMMM yyyy', { locale: ru })}
                  </span>
                </div>

                {/* Delivery Info */}
                {selectedOrder.shipping_address && (
                  <div className="p-4 rounded-lg bg-muted/50 space-y-3">
                    <h4 className="font-medium flex items-center gap-2">
                      <Truck className="h-4 w-4" />
                      Доставка
                    </h4>
                    <div className="flex items-start gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <span>
                        {selectedOrder.shipping_address.city}, {selectedOrder.shipping_address.address}
                      </span>
                    </div>
                  </div>
                )}

                {/* Items */}
                <div>
                  <h4 className="font-medium mb-3">Товары</h4>
                  <div className="space-y-3">
                    {selectedOrder.order_items.map((item) => (
                      <div key={item.id} className="flex items-center gap-3 p-3 rounded-lg border border-border">
                        <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center">
                          <Package className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm">{item.product_name}</p>
                          <p className="text-xs text-muted-foreground">{item.quantity} шт</p>
                        </div>
                        <p className="font-medium">{(item.quantity * item.price).toLocaleString()} ₽</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Total */}
                <div className="flex justify-between items-center pt-4 border-t border-border">
                  <span className="font-semibold">Итого</span>
                  <span className="text-xl font-semibold">{selectedOrder.total_amount.toLocaleString()} ₽</span>
                </div>

                {/* Actions */}
                <Button variant="outline" className="w-full">
                  Нужна помощь?
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </AccountLayout>
    </>
  );
};

export default AccountOrders;
