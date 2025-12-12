import { useState } from "react";
import { Helmet } from "react-helmet-async";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
} from "@/components/ui/dialog";
import {
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Truck,
  Package,
  CheckCircle,
  Clock,
  XCircle,
  Download,
} from "lucide-react";

const orders = [
  {
    id: "12345",
    date: "12.12.2024 14:32",
    customer: { name: "Анна Морозова", email: "anna@mail.ru", phone: "+7 999 123 45 67" },
    items: [
      { name: "Royal Canin Indoor", qty: 2, price: 3290 },
      { name: "Миска керамическая", qty: 1, price: 890 },
    ],
    total: 7470,
    status: "processing",
    delivery: "CDEK",
    address: "Москва, ул. Пушкина, д. 10, кв. 25",
  },
  {
    id: "12344",
    date: "12.12.2024 12:15",
    customer: { name: "Иван Петров", email: "ivan@gmail.com", phone: "+7 916 555 12 34" },
    items: [
      { name: "Лежанка Premium XL", qty: 1, price: 4990 },
      { name: "Игрушка мячик", qty: 3, price: 290 },
    ],
    total: 5860,
    status: "shipped",
    delivery: "Boxberry",
    address: "СПб, Невский пр., д. 100",
  },
  {
    id: "12343",
    date: "12.12.2024 10:45",
    customer: { name: "Мария Козлова", email: "maria@yandex.ru", phone: "+7 925 111 22 33" },
    items: [
      { name: "Семена томатов Черри", qty: 5, price: 590 },
    ],
    total: 2950,
    status: "delivered",
    delivery: "Почта России",
    address: "Казань, ул. Баумана, д. 5",
  },
  {
    id: "12342",
    date: "11.12.2024 18:20",
    customer: { name: "Алексей Сидоров", email: "alex@mail.ru", phone: "+7 903 777 88 99" },
    items: [
      { name: "Свеча ароматическая", qty: 4, price: 1490 },
      { name: "Ваза декоративная", qty: 1, price: 2890 },
    ],
    total: 8850,
    status: "pending",
    delivery: "CDEK",
    address: "Новосибирск, ул. Красный пр., д. 50",
  },
  {
    id: "12341",
    date: "11.12.2024 15:10",
    customer: { name: "Елена Волкова", email: "elena@gmail.com", phone: "+7 912 333 44 55" },
    items: [
      { name: "Монстера в кашпо", qty: 2, price: 2890 },
      { name: "Горшок керамический", qty: 2, price: 1290 },
    ],
    total: 8360,
    status: "cancelled",
    delivery: "Самовывоз",
    address: "Пункт выдачи, Москва",
  },
];

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive"; icon: React.ElementType }> = {
  pending: { label: "Ожидает оплаты", variant: "outline", icon: Clock },
  processing: { label: "В обработке", variant: "secondary", icon: Package },
  shipped: { label: "Отправлен", variant: "default", icon: Truck },
  delivered: { label: "Доставлен", variant: "default", icon: CheckCircle },
  cancelled: { label: "Отменён", variant: "destructive", icon: XCircle },
};

const AdminOrders = () => {
  const [selectedOrder, setSelectedOrder] = useState<typeof orders[0] | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");

  const stats = {
    pending: orders.filter((o) => o.status === "pending").length,
    processing: orders.filter((o) => o.status === "processing").length,
    shipped: orders.filter((o) => o.status === "shipped").length,
    delivered: orders.filter((o) => o.status === "delivered").length,
  };

  return (
    <>
      <Helmet>
        <title>Заказы — BelBird Admin</title>
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
                <Package className="h-5 w-5 text-secondary" />
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
            <Input placeholder="Поиск по номеру заказа, клиенту..." className="pl-10" />
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
            <Button variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Экспорт
            </Button>
          </div>
        </div>

        {/* Orders Table */}
        <div className="rounded-lg border border-border bg-card">
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
              {orders
                .filter((o) => statusFilter === "all" || o.status === statusFilter)
                .map((order) => {
                  const StatusIcon = statusConfig[order.status].icon;
                  return (
                    <TableRow key={order.id} className="cursor-pointer" onClick={() => setSelectedOrder(order)}>
                      <TableCell className="font-medium">#{order.id}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{order.date}</TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm font-medium">{order.customer.name}</p>
                          <p className="text-xs text-muted-foreground">{order.customer.email}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{order.delivery}</TableCell>
                      <TableCell className="text-right font-medium">{order.total.toLocaleString()} ₽</TableCell>
                      <TableCell>
                        <Badge variant={statusConfig[order.status].variant} className="gap-1">
                          <StatusIcon className="h-3 w-3" />
                          {statusConfig[order.status].label}
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
                            <DropdownMenuItem onClick={() => setSelectedOrder(order)}>
                              <Eye className="h-4 w-4 mr-2" />
                              Детали
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Truck className="h-4 w-4 mr-2" />
                              Отправить
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive">
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
        </div>

        {/* Order Detail Dialog */}
        <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
          <DialogContent className="max-w-lg">
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

                {/* Customer */}
                <div>
                  <h4 className="text-sm font-medium mb-2">Клиент</h4>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="font-medium">{selectedOrder.customer.name}</p>
                    <p className="text-sm text-muted-foreground">{selectedOrder.customer.email}</p>
                    <p className="text-sm text-muted-foreground">{selectedOrder.customer.phone}</p>
                  </div>
                </div>

                {/* Delivery */}
                <div>
                  <h4 className="text-sm font-medium mb-2">Доставка</h4>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="font-medium">{selectedOrder.delivery}</p>
                    <p className="text-sm text-muted-foreground">{selectedOrder.address}</p>
                  </div>
                </div>

                {/* Items */}
                <div>
                  <h4 className="text-sm font-medium mb-2">Товары</h4>
                  <div className="space-y-2">
                    {selectedOrder.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center p-2 rounded-lg bg-muted/50">
                        <div>
                          <p className="text-sm font-medium">{item.name}</p>
                          <p className="text-xs text-muted-foreground">{item.qty} шт × {item.price.toLocaleString()} ₽</p>
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
                  <Button className="flex-1">Отправить</Button>
                  <Button variant="outline" className="flex-1">Печать</Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </AdminLayout>
    </>
  );
};

export default AdminOrders;
