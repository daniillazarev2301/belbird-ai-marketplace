import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ChevronRight, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  pending: { label: "Ожидает", variant: "outline" },
  processing: { label: "В обработке", variant: "secondary" },
  shipped: { label: "Отправлен", variant: "default" },
  delivered: { label: "Доставлен", variant: "default" },
  cancelled: { label: "Отменён", variant: "destructive" },
};

const RecentOrders = () => {
  const { data: orders, isLoading } = useQuery({
    queryKey: ['recent-orders'],
    queryFn: async () => {
      const { data: ordersData, error } = await supabase
        .from('orders')
        .select('id, total_amount, status, created_at, user_id')
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      
      // Fetch profiles for orders with user_id
      const userIds = ordersData?.filter(o => o.user_id).map(o => o.user_id) || [];
      let profilesMap: Record<string, { full_name: string | null; email: string | null }> = {};
      
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .in('id', userIds);
        
        profiles?.forEach(p => {
          profilesMap[p.id] = { full_name: p.full_name, email: p.email };
        });
      }
      
      return ordersData?.map(order => ({
        ...order,
        profile: order.user_id ? profilesMap[order.user_id] : null
      }));
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base font-semibold">Последние заказы</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base font-semibold">Последние заказы</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">Заказов пока нет</p>
        </CardContent>
      </Card>
    );
  }

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
          {orders.map((order) => {
            const customerName = order.profile?.full_name || order.profile?.email || 'Гость';
            const initials = customerName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
            const status = statusConfig[order.status] || statusConfig.pending;
            
            return (
              <div
                key={order.id}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">#{order.id.slice(0, 8)}</p>
                    <p className="text-xs text-muted-foreground">{customerName}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{order.total_amount.toLocaleString()} ₽</p>
                  <Badge variant={status.variant} className="text-xs mt-1">
                    {status.label}
                  </Badge>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default RecentOrders;
