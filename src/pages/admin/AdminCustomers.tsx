import { useState } from "react";
import { Helmet } from "react-helmet-async";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Search,
  Download,
  Mail,
  Phone,
  Calendar,
  TrendingUp,
  Plus,
  Loader2,
  RefreshCw,
  Edit,
  ShoppingCart,
  UserPlus,
  Key,
  Save,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { exportToExcel, formatDataForExport } from "@/utils/exportToExcel";
import { useRealtimeSubscription } from "@/hooks/useRealtimeSubscription";

interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  customer_notes: string | null;
  customer_tags: string[] | null;
  loyalty_points: number | null;
  created_at: string | null;
  orders_count?: number;
  total_spent?: number;
  last_order_date?: string | null;
}

const AdminCustomers = () => {
  const queryClient = useQueryClient();
  const [selectedCustomer, setSelectedCustomer] = useState<Profile | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [resetPasswordEmail, setResetPasswordEmail] = useState("");

  // Realtime subscription
  useRealtimeSubscription({
    table: "profiles",
    queryKey: ["admin-customers"],
  });

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    full_name: "",
    phone: "",
  });

  const [editFormData, setEditFormData] = useState({
    full_name: "",
    phone: "",
    customer_notes: "",
    customer_tags: "",
    loyalty_points: 0,
  });

  // Fetch customers (profiles) with order stats
  const { data: customers = [], isLoading, refetch } = useQuery({
    queryKey: ["admin-customers", searchQuery],
    queryFn: async () => {
      let query = supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (searchQuery) {
        query = query.or(`email.ilike.%${searchQuery}%,full_name.ilike.%${searchQuery}%,phone.ilike.%${searchQuery}%`);
      }

      const { data: profiles, error } = await query;
      if (error) throw error;

      // Get order stats for each customer
      const { data: orderStats } = await supabase
        .from("orders")
        .select("user_id, total_amount, created_at");

      const statsMap: Record<string, { count: number; total: number; lastDate: string | null }> = {};
      orderStats?.forEach((order) => {
        if (order.user_id) {
          if (!statsMap[order.user_id]) {
            statsMap[order.user_id] = { count: 0, total: 0, lastDate: null };
          }
          statsMap[order.user_id].count++;
          statsMap[order.user_id].total += Number(order.total_amount) || 0;
          if (!statsMap[order.user_id].lastDate || order.created_at > statsMap[order.user_id].lastDate!) {
            statsMap[order.user_id].lastDate = order.created_at;
          }
        }
      });

      return (profiles || []).map((profile) => ({
        ...profile,
        orders_count: statsMap[profile.id]?.count || 0,
        total_spent: statsMap[profile.id]?.total || 0,
        last_order_date: statsMap[profile.id]?.lastDate || null,
      })) as Profile[];
    },
  });

  // Create new customer
  const createCustomer = useMutation({
    mutationFn: async (data: typeof formData) => {
      // Create user in Supabase Auth using edge function would be needed for admin creation
      // For now, we'll use signUp which requires email confirmation
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.full_name,
          },
          emailRedirectTo: `${window.location.origin}/`,
        },
      });
      
      if (authError) throw authError;
      
      // Update profile with additional data
      if (authData.user) {
        const { error: profileError } = await supabase
          .from("profiles")
          .update({
            full_name: data.full_name,
            phone: data.phone,
          })
          .eq("id", authData.user.id);
        
        if (profileError) throw profileError;
      }
      
      return authData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-customers"] });
      toast.success("Клиент создан. Письмо для подтверждения отправлено.");
      setAddDialogOpen(false);
      setFormData({ email: "", password: "", full_name: "", phone: "" });
    },
    onError: (error: Error) => {
      toast.error("Ошибка: " + error.message);
    },
  });

  // Update customer profile
  const updateCustomer = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof editFormData }) => {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: data.full_name,
          phone: data.phone,
          customer_notes: data.customer_notes || null,
          customer_tags: data.customer_tags ? data.customer_tags.split(",").map(t => t.trim()) : null,
          loyalty_points: data.loyalty_points,
        })
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-customers"] });
      toast.success("Данные клиента обновлены");
      setEditDialogOpen(false);
      setSelectedCustomer(null);
    },
    onError: (error: Error) => {
      toast.error("Ошибка: " + error.message);
    },
  });

  // Send password reset
  const sendPasswordReset = useMutation({
    mutationFn: async (email: string) => {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth`,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Письмо для сброса пароля отправлено");
      setResetPasswordEmail("");
    },
    onError: (error: Error) => {
      toast.error("Ошибка: " + error.message);
    },
  });

  const openEditDialog = (customer: Profile) => {
    setSelectedCustomer(customer);
    setEditFormData({
      full_name: customer.full_name || "",
      phone: customer.phone || "",
      customer_notes: customer.customer_notes || "",
      customer_tags: customer.customer_tags?.join(", ") || "",
      loyalty_points: customer.loyalty_points || 0,
    });
    setEditDialogOpen(true);
  };

  const getSegment = (customer: Profile) => {
    if ((customer.total_spent || 0) > 50000) return { label: "VIP", variant: "default" as const };
    if ((customer.orders_count || 0) > 3) return { label: "Постоянный", variant: "secondary" as const };
    return { label: "Новый", variant: "outline" as const };
  };

  const stats = {
    total: customers.length,
    vip: customers.filter((c) => (c.total_spent || 0) > 50000).length,
    new: customers.filter((c) => {
      const createdAt = new Date(c.created_at || 0);
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      return createdAt > monthAgo;
    }).length,
  };

  return (
    <>
      <Helmet>
        <title>Клиенты — BelBird Admin</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <AdminLayout title="Клиенты (CRM)" description="Управление клиентской базой">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Всего клиентов</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-secondary/20">
                <ShoppingCart className="h-5 w-5 text-secondary-foreground" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{stats.vip}</p>
                <p className="text-xs text-muted-foreground">VIP клиентов</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted">
                <Calendar className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{stats.new}</p>
                <p className="text-xs text-muted-foreground">Новых за месяц</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input 
              placeholder="Поиск по имени, email, телефону..." 
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              className="gap-2"
              onClick={() => {
                const exportData = formatDataForExport.customers(customers);
                exportToExcel(exportData, `customers-${new Date().toISOString().split('T')[0]}`, 'Клиенты');
                toast.success('Экспорт завершён');
              }}
            >
              <Download className="h-4 w-4" />
              Экспорт
            </Button>
            <Button className="gap-2" onClick={() => setAddDialogOpen(true)}>
              <UserPlus className="h-4 w-4" />
              Добавить клиента
            </Button>
          </div>
        </div>

        {/* Customers Table */}
        <div className="rounded-lg border border-border bg-card">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : customers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-muted-foreground mb-4">Клиенты не найдены</p>
              <Button onClick={() => setAddDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Добавить первого клиента
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Клиент</TableHead>
                  <TableHead>Контакты</TableHead>
                  <TableHead>Сегмент</TableHead>
                  <TableHead className="text-right">Заказов</TableHead>
                  <TableHead className="text-right">Сумма покупок</TableHead>
                  <TableHead>Баллы</TableHead>
                  <TableHead>Регистрация</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((customer) => {
                  const segment = getSegment(customer);
                  return (
                    <TableRow
                      key={customer.id}
                      className="cursor-pointer"
                      onClick={() => setSelectedCustomer(customer)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarFallback className="bg-primary/10 text-primary text-xs">
                              {(customer.full_name || customer.email || "?").split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{customer.full_name || "Без имени"}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p className="text-muted-foreground">{customer.email || "—"}</p>
                          <p className="text-muted-foreground">{customer.phone || "—"}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={segment.variant}>
                          {segment.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">{customer.orders_count || 0}</TableCell>
                      <TableCell className="text-right font-medium">
                        {(customer.total_spent || 0).toLocaleString()} ₽
                      </TableCell>
                      <TableCell>{customer.loyalty_points || 0}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {customer.created_at ? new Date(customer.created_at).toLocaleDateString("ru-RU") : "—"}
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditDialog(customer);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>

        {/* Customer Detail Sheet */}
        <Sheet open={!!selectedCustomer && !editDialogOpen} onOpenChange={() => setSelectedCustomer(null)}>
          <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Профиль клиента</SheetTitle>
            </SheetHeader>
            {selectedCustomer && (
              <div className="mt-6 space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarFallback className="bg-primary/10 text-primary text-xl">
                      {(selectedCustomer.full_name || selectedCustomer.email || "?").split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-lg font-semibold">{selectedCustomer.full_name || "Без имени"}</h3>
                    <Badge variant={getSegment(selectedCustomer).variant}>
                      {getSegment(selectedCustomer).label}
                    </Badge>
                  </div>
                </div>

                {/* Contact Info */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Контактные данные</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{selectedCustomer.email || "Не указан"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{selectedCustomer.phone || "Не указан"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>Регистрация: {selectedCustomer.created_at ? new Date(selectedCustomer.created_at).toLocaleDateString("ru-RU") : "—"}</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <ShoppingCart className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                      <p className="text-2xl font-semibold">{selectedCustomer.orders_count || 0}</p>
                      <p className="text-xs text-muted-foreground">заказов</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <TrendingUp className="h-5 w-5 mx-auto mb-1 text-primary" />
                      <p className="text-2xl font-semibold">{((selectedCustomer.total_spent || 0) / 1000).toFixed(0)}K</p>
                      <p className="text-xs text-muted-foreground">потрачено</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Tags */}
                {selectedCustomer.customer_tags && selectedCustomer.customer_tags.length > 0 && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Теги</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {selectedCustomer.customer_tags.map((tag, idx) => (
                          <Badge key={idx} variant="outline">{tag}</Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Notes */}
                {selectedCustomer.customer_notes && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Заметки</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{selectedCustomer.customer_notes}</p>
                    </CardContent>
                  </Card>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  <Button className="flex-1 gap-2" onClick={() => openEditDialog(selectedCustomer)}>
                    <Edit className="h-4 w-4" />
                    Редактировать
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex-1 gap-2"
                    onClick={() => {
                      if (selectedCustomer.email) {
                        setResetPasswordEmail(selectedCustomer.email);
                        sendPasswordReset.mutate(selectedCustomer.email);
                      }
                    }}
                    disabled={!selectedCustomer.email || sendPasswordReset.isPending}
                  >
                    <Key className="h-4 w-4" />
                    Сбросить пароль
                  </Button>
                </div>
              </div>
            )}
          </SheetContent>
        </Sheet>

        {/* Add Customer Dialog */}
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Добавить клиента</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Email *</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="client@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label>Пароль *</Label>
                <Input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Минимум 6 символов"
                />
              </div>
              <div className="space-y-2">
                <Label>Полное имя</Label>
                <Input
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="Иван Иванов"
                />
              </div>
              <div className="space-y-2">
                <Label>Телефон</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+7 999 123 45 67"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
                Отмена
              </Button>
              <Button onClick={() => createCustomer.mutate(formData)} disabled={createCustomer.isPending}>
                {createCustomer.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Создать
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Customer Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Редактировать клиента</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Полное имя</Label>
                <Input
                  value={editFormData.full_name}
                  onChange={(e) => setEditFormData({ ...editFormData, full_name: e.target.value })}
                  placeholder="Иван Иванов"
                />
              </div>
              <div className="space-y-2">
                <Label>Телефон</Label>
                <Input
                  value={editFormData.phone}
                  onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                  placeholder="+7 999 123 45 67"
                />
              </div>
              <div className="space-y-2">
                <Label>Баллы лояльности</Label>
                <Input
                  type="number"
                  value={editFormData.loyalty_points}
                  onChange={(e) => setEditFormData({ ...editFormData, loyalty_points: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label>Теги (через запятую)</Label>
                <Input
                  value={editFormData.customer_tags}
                  onChange={(e) => setEditFormData({ ...editFormData, customer_tags: e.target.value })}
                  placeholder="VIP, любитель кошек, скидка 10%"
                />
              </div>
              <div className="space-y-2">
                <Label>Заметки</Label>
                <Textarea
                  value={editFormData.customer_notes}
                  onChange={(e) => setEditFormData({ ...editFormData, customer_notes: e.target.value })}
                  placeholder="Заметки о клиенте..."
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                Отмена
              </Button>
              <Button 
                onClick={() => selectedCustomer && updateCustomer.mutate({ id: selectedCustomer.id, data: editFormData })} 
                disabled={updateCustomer.isPending}
              >
                {updateCustomer.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                <Save className="h-4 w-4 mr-2" />
                Сохранить
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </AdminLayout>
    </>
  );
};

export default AdminCustomers;
