import { useState } from "react";
import { Helmet } from "react-helmet-async";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Search,
  Download,
  Mail,
  Phone,
  MapPin,
  ShoppingCart,
  Heart,
  Star,
  PawPrint,
  Home,
  Flower2,
  Calendar,
  TrendingUp,
} from "lucide-react";

const customers = [
  {
    id: "1",
    name: "Анна Морозова",
    email: "anna@mail.ru",
    phone: "+7 999 123 45 67",
    segment: "vip",
    totalOrders: 28,
    totalSpent: 156890,
    lastOrder: "12.12.2024",
    registeredAt: "15.03.2023",
    category: "pets",
    petProfile: { type: "Кошка", name: "Мурка", breed: "Британская", age: 3 },
  },
  {
    id: "2",
    name: "Иван Петров",
    email: "ivan@gmail.com",
    phone: "+7 916 555 12 34",
    segment: "regular",
    totalOrders: 12,
    totalSpent: 45600,
    lastOrder: "10.12.2024",
    registeredAt: "20.06.2023",
    category: "home",
    petProfile: null,
  },
  {
    id: "3",
    name: "Мария Козлова",
    email: "maria@yandex.ru",
    phone: "+7 925 111 22 33",
    segment: "new",
    totalOrders: 2,
    totalSpent: 5890,
    lastOrder: "08.12.2024",
    registeredAt: "01.12.2024",
    category: "garden",
    petProfile: null,
  },
  {
    id: "4",
    name: "Алексей Сидоров",
    email: "alex@mail.ru",
    phone: "+7 903 777 88 99",
    segment: "regular",
    totalOrders: 8,
    totalSpent: 32450,
    lastOrder: "05.12.2024",
    registeredAt: "10.08.2023",
    category: "pets",
    petProfile: { type: "Собака", name: "Рекс", breed: "Лабрадор", age: 5 },
  },
  {
    id: "5",
    name: "Елена Волкова",
    email: "elena@gmail.com",
    phone: "+7 912 333 44 55",
    segment: "vip",
    totalOrders: 45,
    totalSpent: 234500,
    lastOrder: "11.12.2024",
    registeredAt: "05.01.2023",
    category: "home",
    petProfile: { type: "Кошка", name: "Барсик", breed: "Мейн-кун", age: 2 },
  },
];

const segmentConfig: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
  vip: { label: "VIP", variant: "default" },
  regular: { label: "Постоянный", variant: "secondary" },
  new: { label: "Новый", variant: "outline" },
};

const categoryConfig: Record<string, { label: string; icon: React.ElementType }> = {
  pets: { label: "Любимцы", icon: PawPrint },
  home: { label: "Дом", icon: Home },
  garden: { label: "Сад", icon: Flower2 },
};

const AdminCustomers = () => {
  const [selectedCustomer, setSelectedCustomer] = useState<typeof customers[0] | null>(null);
  const [segmentFilter, setSegmentFilter] = useState("all");

  const stats = {
    total: customers.length,
    vip: customers.filter((c) => c.segment === "vip").length,
    new: customers.filter((c) => c.segment === "new").length,
  };

  return (
    <>
      <Helmet>
        <title>Клиенты — BelBird Admin</title>
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
                <Star className="h-5 w-5 text-secondary" />
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
            <Input placeholder="Поиск по имени, email, телефону..." className="pl-10" />
          </div>
          <div className="flex gap-2">
            <Select value={segmentFilter} onValueChange={setSegmentFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Сегмент" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все сегменты</SelectItem>
                <SelectItem value="vip">VIP</SelectItem>
                <SelectItem value="regular">Постоянные</SelectItem>
                <SelectItem value="new">Новые</SelectItem>
              </SelectContent>
            </Select>
            <Select defaultValue="all">
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Категория" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все категории</SelectItem>
                <SelectItem value="pets">Любимцы</SelectItem>
                <SelectItem value="home">Дом</SelectItem>
                <SelectItem value="garden">Сад</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Экспорт
            </Button>
          </div>
        </div>

        {/* Customers Table */}
        <div className="rounded-lg border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Клиент</TableHead>
                <TableHead>Контакты</TableHead>
                <TableHead>Сегмент</TableHead>
                <TableHead>Профиль</TableHead>
                <TableHead className="text-right">Заказов</TableHead>
                <TableHead className="text-right">Сумма покупок</TableHead>
                <TableHead>Посл. заказ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers
                .filter((c) => segmentFilter === "all" || c.segment === segmentFilter)
                .map((customer) => {
                  const CategoryIcon = categoryConfig[customer.category].icon;
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
                              {customer.name.split(" ").map((n) => n[0]).join("")}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{customer.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p className="text-muted-foreground">{customer.email}</p>
                          <p className="text-muted-foreground">{customer.phone}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={segmentConfig[customer.segment].variant}>
                          {segmentConfig[customer.segment].label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <CategoryIcon className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{categoryConfig[customer.category].label}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">{customer.totalOrders}</TableCell>
                      <TableCell className="text-right font-medium">
                        {customer.totalSpent.toLocaleString()} ₽
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {customer.lastOrder}
                      </TableCell>
                    </TableRow>
                  );
                })}
            </TableBody>
          </Table>
        </div>

        {/* Customer Detail Sheet */}
        <Sheet open={!!selectedCustomer} onOpenChange={() => setSelectedCustomer(null)}>
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
                      {selectedCustomer.name.split(" ").map((n) => n[0]).join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-lg font-semibold">{selectedCustomer.name}</h3>
                    <Badge variant={segmentConfig[selectedCustomer.segment].variant}>
                      {segmentConfig[selectedCustomer.segment].label}
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
                      <span>{selectedCustomer.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{selectedCustomer.phone}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>Регистрация: {selectedCustomer.registeredAt}</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <ShoppingCart className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                      <p className="text-2xl font-semibold">{selectedCustomer.totalOrders}</p>
                      <p className="text-xs text-muted-foreground">заказов</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <TrendingUp className="h-5 w-5 mx-auto mb-1 text-primary" />
                      <p className="text-2xl font-semibold">{(selectedCustomer.totalSpent / 1000).toFixed(0)}K</p>
                      <p className="text-xs text-muted-foreground">потрачено</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Pet Profile */}
                {selectedCustomer.petProfile && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <PawPrint className="h-4 w-4" />
                        Профиль питомца
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-muted-foreground">Имя</p>
                          <p className="font-medium">{selectedCustomer.petProfile.name}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Тип</p>
                          <p className="font-medium">{selectedCustomer.petProfile.type}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Порода</p>
                          <p className="font-medium">{selectedCustomer.petProfile.breed}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Возраст</p>
                          <p className="font-medium">{selectedCustomer.petProfile.age} года</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  <Button className="flex-1 gap-2">
                    <Mail className="h-4 w-4" />
                    Написать
                  </Button>
                  <Button variant="outline" className="flex-1">
                    История заказов
                  </Button>
                </div>
              </div>
            )}
          </SheetContent>
        </Sheet>
      </AdminLayout>
    </>
  );
};

export default AdminCustomers;
