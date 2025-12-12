import { useState } from "react";
import { Helmet } from "react-helmet-async";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Settings,
  Users,
  Link,
  Shield,
  Bell,
  CreditCard,
  Truck,
  Edit,
  Trash2,
  Plus,
  Check,
  Eye,
  EyeOff,
} from "lucide-react";

const teamMembers = [
  { id: "1", name: "Админ Главный", email: "admin@belbird.ru", role: "super_admin", status: "active" },
  { id: "2", name: "Анна Контент", email: "anna@belbird.ru", role: "content", status: "active" },
  { id: "3", name: "Сергей Логист", email: "sergey@belbird.ru", role: "logistics", status: "active" },
  { id: "4", name: "Мария Оператор", email: "maria@belbird.ru", role: "operator", status: "inactive" },
];

const integrations = [
  { id: "1c", name: "1С:Предприятие", status: "connected", description: "Синхронизация товаров и остатков" },
  { id: "cdek", name: "СДЭК", status: "connected", description: "Расчёт и отслеживание доставки" },
  { id: "boxberry", name: "Boxberry", status: "connected", description: "Пункты выдачи" },
  { id: "yookassa", name: "ЮKassa", status: "connected", description: "Приём платежей" },
  { id: "sberbank", name: "Сбербанк", status: "pending", description: "Эквайринг" },
];

const roleConfig: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
  super_admin: { label: "Super-Admin", variant: "default" },
  content: { label: "Контент", variant: "secondary" },
  logistics: { label: "Логист", variant: "secondary" },
  operator: { label: "Оператор", variant: "outline" },
};

const AdminSettings = () => {
  const [showApiKey, setShowApiKey] = useState(false);

  return (
    <>
      <Helmet>
        <title>Настройки — BelBird Admin</title>
      </Helmet>
      <AdminLayout title="Настройки" description="Конфигурация платформы">
        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="flex-wrap h-auto gap-2">
            <TabsTrigger value="general" className="gap-2">
              <Settings className="h-4 w-4" />
              Общие
            </TabsTrigger>
            <TabsTrigger value="team" className="gap-2">
              <Users className="h-4 w-4" />
              Команда
            </TabsTrigger>
            <TabsTrigger value="integrations" className="gap-2">
              <Link className="h-4 w-4" />
              Интеграции
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2">
              <Bell className="h-4 w-4" />
              Уведомления
            </TabsTrigger>
          </TabsList>

          {/* General Settings */}
          <TabsContent value="general" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Основные настройки</CardTitle>
                <CardDescription>Базовые параметры магазина</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Название магазина</Label>
                    <Input defaultValue="BelBird" />
                  </div>
                  <div className="space-y-2">
                    <Label>Email поддержки</Label>
                    <Input defaultValue="support@belbird.ru" />
                  </div>
                  <div className="space-y-2">
                    <Label>Телефон</Label>
                    <Input defaultValue="+7 800 123 45 67" />
                  </div>
                  <div className="space-y-2">
                    <Label>Валюта</Label>
                    <Select defaultValue="rub">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="rub">RUB (₽)</SelectItem>
                        <SelectItem value="usd">USD ($)</SelectItem>
                        <SelectItem value="eur">EUR (€)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button>Сохранить изменения</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>AI-функции</CardTitle>
                <CardDescription>Управление AI-модулями платформы</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">AI-рекомендации</p>
                    <p className="text-sm text-muted-foreground">Персонализированные рекомендации товаров</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">AI-консультант</p>
                    <p className="text-sm text-muted-foreground">Чат-бот на сайте</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">AI-генерация контента</p>
                    <p className="text-sm text-muted-foreground">Описания товаров и SEO</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Прогноз спроса</p>
                    <p className="text-sm text-muted-foreground">AI-аналитика продаж</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Team Management */}
          <TabsContent value="team" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Команда</CardTitle>
                  <CardDescription>Управление пользователями и ролями</CardDescription>
                </div>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Добавить
                </Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Пользователь</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Роль</TableHead>
                      <TableHead>Статус</TableHead>
                      <TableHead className="w-24"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {teamMembers.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                {member.name.split(" ").map((n) => n[0]).join("")}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{member.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{member.email}</TableCell>
                        <TableCell>
                          <Badge variant={roleConfig[member.role].variant}>
                            {roleConfig[member.role].label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={member.status === "active" ? "default" : "outline"}>
                            {member.status === "active" ? "Активен" : "Неактивен"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Права доступа</CardTitle>
                <CardDescription>Настройка разрешений по ролям</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Модуль</TableHead>
                        <TableHead className="text-center">Super-Admin</TableHead>
                        <TableHead className="text-center">Контент</TableHead>
                        <TableHead className="text-center">Логист</TableHead>
                        <TableHead className="text-center">Оператор</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {[
                        { module: "Дашборд", permissions: [true, true, true, true] },
                        { module: "Товары", permissions: [true, true, false, false] },
                        { module: "Заказы", permissions: [true, false, true, true] },
                        { module: "Клиенты", permissions: [true, false, false, true] },
                        { module: "AI-Контент", permissions: [true, true, false, false] },
                        { module: "Настройки", permissions: [true, false, false, false] },
                      ].map((row) => (
                        <TableRow key={row.module}>
                          <TableCell className="font-medium">{row.module}</TableCell>
                          {row.permissions.map((hasAccess, idx) => (
                            <TableCell key={idx} className="text-center">
                              {hasAccess ? (
                                <Check className="h-4 w-4 mx-auto text-primary" />
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Integrations */}
          <TabsContent value="integrations" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {integrations.map((integration) => (
                <Card key={integration.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">{integration.name}</h3>
                          <Badge variant={integration.status === "connected" ? "default" : "outline"}>
                            {integration.status === "connected" ? "Подключено" : "Ожидает"}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{integration.description}</p>
                      </div>
                      <Button variant="outline" size="sm">
                        Настроить
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card>
              <CardHeader>
                <CardTitle>API-ключи</CardTitle>
                <CardDescription>Ключи для внешних интеграций</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Публичный API-ключ</Label>
                  <div className="flex gap-2">
                    <Input
                      type={showApiKey ? "text" : "password"}
                      value="pk_live_51234567890abcdef"
                      readOnly
                      className="font-mono"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setShowApiKey(!showApiKey)}
                    >
                      {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline">Создать новый ключ</Button>
                  <Button variant="outline" className="text-destructive">Отозвать все ключи</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications */}
          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Email-уведомления</CardTitle>
                <CardDescription>Настройка почтовых оповещений</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Новые заказы</p>
                    <p className="text-sm text-muted-foreground">Уведомление при поступлении нового заказа</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Низкий остаток</p>
                    <p className="text-sm text-muted-foreground">Когда товар заканчивается на складе</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Возвраты</p>
                    <p className="text-sm text-muted-foreground">Запросы на возврат товаров</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Отзывы</p>
                    <p className="text-sm text-muted-foreground">Новые отзывы на товары</p>
                  </div>
                  <Switch />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Push-уведомления</CardTitle>
                <CardDescription>Уведомления в браузере</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Критические оповещения</p>
                    <p className="text-sm text-muted-foreground">AI-светофор рисков, сбои системы</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Новые заказы</p>
                    <p className="text-sm text-muted-foreground">Мгновенные уведомления о заказах</p>
                  </div>
                  <Switch />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </AdminLayout>
    </>
  );
};

export default AdminSettings;
