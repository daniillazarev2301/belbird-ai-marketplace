import { useState } from "react";
import { Helmet } from "react-helmet-async";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Search,
  MoreHorizontal,
  Eye,
  Truck,
  Package,
  CheckCircle,
  Clock,
  XCircle,
  Download,
  Loader2,
  RefreshCw,
  Save,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface OrderItem {
  id: string;
  product_name: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  user_id: string | null;
  status: string;
  total_amount: number;
  shipping_address: {
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    delivery_method?: string;
  } | null;
  payment_method: string | null;
  payment_status: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  profiles?: {
    full_name: string | null;
    email: string | null;
    phone: string | null;
  } | null;
  order_items?: OrderItem[];
}

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive"; icon: React.ElementType }> = {
  pending: { label: "Ожидает оплаты", variant: "outline", icon: Clock },
  processing: { label: "В обработке", variant: "secondary", icon: Package },
  shipped: { label: "Отправлен", variant: "default", icon: Truck },
  delivered: { label: "Доставлен", variant: "default", icon: CheckCircle },
  cancelled: { label: "Отменён", variant: "destructive", icon: XCircle },
};

const AdminOrders = () => {
  const queryClient = useQueryClient();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    status: "",
    payment_status: "",
    notes: "",
  });

  // Fetch orders with customer info
  const { data: orders = [], isLoading, refetch } = useQuery({
    queryKey: ["admin-orders", statusFilter, searchQuery],
    queryFn: async () => {
      let query = supabase
        .from("orders")
        .select(`
          *,
          order_items (id, product_name, quantity, price)
        `)
        .order("created_at", { ascending: false });

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Fetch profiles separately for orders with user_id
      const userIds = [...new Set((data || []).filter(o => o.user_id).map(o => o.user_id as string))];
      let profilesMap: Record<string, { full_name: string | null; email: string | null; phone: string | null }> = {};
      
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name, email, phone")
          .in("id", userIds);
        
        profiles?.forEach((p) => {
          profilesMap[p.id] = { full_name: p.full_name, email: p.email, phone: p.phone };
        });
      }

      let filtered = (data || []).map((order) => ({
        ...order,
        profiles: order.user_id ? profilesMap[order.user_id] || null : null,
      }));

      if (searchQuery) {
        const search = searchQuery.toLowerCase();
        filtered = filtered.filter((order) => 
          order.id.toLowerCase().includes(search) ||
          order.profiles?.full_name?.toLowerCase().includes(search) ||
          order.profiles?.email?.toLowerCase().includes(search)
        );
      }

      return filtered as Order[];
    },
  });

  // Update order mutation
  const updateOrder = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof editFormData }) => {
      const { error } = await supabase
        .from("orders")
        .update({
          status: data.status,
          payment_status: data.payment_status,
          notes: data.notes || null,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      toast.success("Заказ обновлён");
      setEditDialogOpen(false);
      setSelectedOrder(null);
    },
    onError: (error: Error) => {
      toast.error("Ошибка: " + error.message);
    },
  });

  // Quick status update
  const quickUpdateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("orders")
        .update({ status })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      toast.success("Статус обновлён");
    },
    onError: (error: Error) => {
      toast.error("Ошибка: " + error.message);
    },
  });

  const openEditDialog = (order: Order) => {
    setSelectedOrder(order);
    setEditFormData({
      status: order.status,
      payment_status: order.payment_status || "pending",
      notes: order.notes || "",
    });
    setEditDialogOpen(true);
  };

  const stats = {
    pending: orders.filter((o) => o.status === "pending").length,
    processing: orders.filter((o) => o.status === "processing").length,
    shipped: orders.filter((o) => o.status === "shipped").length,
    delivered: orders.filter((o) => o.status === "delivered").length,
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <>
      <Helmet>
        <title>Заказы — BelBird Admin</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <AdminLayout title="Заказы" description="Управление заказами клиентов">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => setStatusFilter("pending")}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted">
                <Clock className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{stats.pending}</p>
                <p className="text-xs text-muted-foreground">Ожидают оплаты</p>
              </div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => setStatusFilter("processing")}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-secondary/20">
                <Package className="h-5 w-5 text-secondary-foreground" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{stats.processing}</p>
                <p className="text-xs text-muted-foreground">В обработке</p>
              </div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => setStatusFilter("shipped")}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Truck className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{stats.shipped}</p>
                <p className="text-xs text-muted-foreground">В доставке</p>
              </div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => setStatusFilter("delivered")}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <CheckCircle className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{stats.delivered}</p>
                <p className="text-xs text-muted-foreground">Доставлены</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input 
              placeholder="Поиск по номеру заказа, клиенту..." 
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Статус" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все статусы</SelectItem>
                <SelectItem value="pending">Ожидает оплаты</SelectItem>
                <SelectItem value="processing">В обработке</SelectItem>
                <SelectItem value="shipped">Отправлен</SelectItem>
                <SelectItem value="delivered">Доставлен</SelectItem>
                <SelectItem value="cancelled">Отменён</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Экспорт
            </Button>
          </div>
        </div>

        {/* Orders Table */}
        <div className="rounded-lg border border-border bg-card">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-muted-foreground">Заказы не найдены</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Заказ</TableHead>
                  <TableHead>Дата</TableHead>
                  <TableHead>Клиент</TableHead>
                  <TableHead>Доставка</TableHead>
                  <TableHead className="text-right">Сумма</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => {
                  const StatusIcon = statusConfig[order.status]?.icon || Clock;
                  const statusCfg = statusConfig[order.status] || statusConfig.pending;
                  return (
                    <TableRow key={order.id} className="cursor-pointer" onClick={() => setSelectedOrder(order)}>
                      <TableCell className="font-medium">#{order.id.slice(0, 8)}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{formatDate(order.created_at)}</TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm font-medium">{order.profiles?.full_name || order.shipping_address?.name || "—"}</p>
                          <p className="text-xs text-muted-foreground">{order.profiles?.email || order.shipping_address?.email || "—"}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{order.shipping_address?.delivery_method || "—"}</TableCell>
                      <TableCell className="text-right font-medium">{Number(order.total_amount).toLocaleString()} ₽</TableCell>
                      <TableCell>
                        <Badge variant={statusCfg.variant} className="gap-1">
                          <StatusIcon className="h-3 w-3" />
                          {statusCfg.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setSelectedOrder(order); }}>
                              <Eye className="h-4 w-4 mr-2" />
                              Детали
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openEditDialog(order); }}>
                              <Save className="h-4 w-4 mr-2" />
                              Редактировать
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); quickUpdateStatus.mutate({ id: order.id, status: "shipped" }); }}>
                              <Truck className="h-4 w-4 mr-2" />
                              Отправить
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); quickUpdateStatus.mutate({ id: order.id, status: "delivered" }); }}>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Доставлен
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-destructive"
                              onClick={(e) => { e.stopPropagation(); quickUpdateStatus.mutate({ id: order.id, status: "cancelled" }); }}
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Отменить
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>

        {/* Order Detail Dialog */}
        <Dialog open={!!selectedOrder && !editDialogOpen} onOpenChange={() => setSelectedOrder(null)}>
          <DialogContent className="max-w-lg">
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
                  <span className="text-sm text-muted-foreground">{formatDate(selectedOrder.created_at)}</span>
                </div>

                {/* Customer */}
                <div>
                  <h4 className="text-sm font-medium mb-2">Клиент</h4>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="font-medium">{selectedOrder.profiles?.full_name || selectedOrder.shipping_address?.name || "—"}</p>
                    <p className="text-sm text-muted-foreground">{selectedOrder.profiles?.email || selectedOrder.shipping_address?.email || "—"}</p>
                    <p className="text-sm text-muted-foreground">{selectedOrder.profiles?.phone || selectedOrder.shipping_address?.phone || "—"}</p>
                  </div>
                </div>

                {/* Delivery */}
                <div>
                  <h4 className="text-sm font-medium mb-2">Доставка</h4>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="font-medium">{selectedOrder.shipping_address?.delivery_method || "Не указан"}</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedOrder.shipping_address?.city}, {selectedOrder.shipping_address?.address}
                    </p>
                  </div>
                </div>

                {/* Items */}
                <div>
                  <h4 className="text-sm font-medium mb-2">Товары</h4>
                  <div className="space-y-2">
                    {selectedOrder.order_items && selectedOrder.order_items.length > 0 ? (
                      selectedOrder.order_items.map((item) => (
                        <div key={item.id} className="flex justify-between items-center p-2 rounded-lg bg-muted/50">
                          <div>
                            <p className="text-sm font-medium">{item.product_name}</p>
                            <p className="text-xs text-muted-foreground">{item.quantity} шт × {Number(item.price).toLocaleString()} ₽</p>
                          </div>
                          <p className="font-medium">{(item.quantity * Number(item.price)).toLocaleString()} ₽</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">Товары не найдены</p>
                    )}
                  </div>
                </div>

                {/* Notes */}
                {selectedOrder.notes && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">Заметки</h4>
                    <p className="text-sm text-muted-foreground p-3 rounded-lg bg-muted/50">{selectedOrder.notes}</p>
                  </div>
                )}

                {/* Total */}
                <div className="flex justify-between items-center pt-4 border-t border-border">
                  <span className="font-semibold">Итого</span>
                  <span className="text-xl font-semibold">{Number(selectedOrder.total_amount).toLocaleString()} ₽</span>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button className="flex-1" onClick={() => openEditDialog(selectedOrder)}>
                    Редактировать
                  </Button>
                  <Button variant="outline" className="flex-1">
                    Печать
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Edit Order Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Редактировать заказ</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Статус заказа</Label>
                <Select value={editFormData.status} onValueChange={(v) => setEditFormData({ ...editFormData, status: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Ожидает оплаты</SelectItem>
                    <SelectItem value="processing">В обработке</SelectItem>
                    <SelectItem value="shipped">Отправлен</SelectItem>
                    <SelectItem value="delivered">Доставлен</SelectItem>
                    <SelectItem value="cancelled">Отменён</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Статус оплаты</Label>
                <Select value={editFormData.payment_status} onValueChange={(v) => setEditFormData({ ...editFormData, payment_status: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Ожидает</SelectItem>
                    <SelectItem value="paid">Оплачено</SelectItem>
                    <SelectItem value="refunded">Возврат</SelectItem>
                    <SelectItem value="failed">Ошибка</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Заметки</Label>
                <Textarea
                  value={editFormData.notes}
                  onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                  placeholder="Внутренние заметки к заказу..."
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                Отмена
              </Button>
              <Button 
                onClick={() => selectedOrder && updateOrder.mutate({ id: selectedOrder.id, data: editFormData })} 
                disabled={updateOrder.isPending}
              >
                {updateOrder.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Сохранить
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </AdminLayout>
    </>
  );
};

export default AdminOrders;
