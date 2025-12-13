import { Helmet } from "react-helmet-async";
import AccountLayout from "@/components/account/AccountLayout";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Bell,
  Mail,
  MessageSquare,
  Smartphone,
  Globe,
  Moon,
  Sun,
  Trash2,
  Shield,
  Download,
} from "lucide-react";
import { PushNotificationToggle } from "@/components/notifications/PushNotificationToggle";
const AccountSettings = () => {
  return (
    <>
      <Helmet>
        <title>Настройки — BelBird</title>
      </Helmet>
      <AccountLayout>
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-serif font-semibold">Настройки</h1>
            <p className="text-muted-foreground">Управляйте предпочтениями аккаунта</p>
          </div>

          {/* Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Уведомления
              </CardTitle>
              <CardDescription>Настройте способы связи</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Email notifications */}
              <div>
                <h4 className="font-medium flex items-center gap-2 mb-4">
                  <Mail className="h-4 w-4" />
                  Email-уведомления
                </h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Статус заказа</p>
                      <p className="text-xs text-muted-foreground">Оповещения о доставке и изменениях</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Акции и скидки</p>
                      <p className="text-xs text-muted-foreground">Специальные предложения и промокоды</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Рекомендации</p>
                      <p className="text-xs text-muted-foreground">Персональные подборки товаров</p>
                    </div>
                    <Switch />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Снижение цены</p>
                      <p className="text-xs text-muted-foreground">Уведомления о товарах из избранного</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Push notifications */}
              <div>
                <h4 className="font-medium flex items-center gap-2 mb-4">
                  <Smartphone className="h-4 w-4" />
                  Push-уведомления
                </h4>
                <div className="space-y-4">
                  {/* Main push toggle */}
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <PushNotificationToggle />
                    <p className="text-xs text-muted-foreground mt-2">
                      Получайте уведомления о статусе заказов и акциях прямо на устройство
                    </p>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Статус доставки</p>
                      <p className="text-xs text-muted-foreground">Отслеживание в реальном времени</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Напоминание о подписке</p>
                      <p className="text-xs text-muted-foreground">За день до отправки</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>
              </div>

              <Separator />

              {/* SMS */}
              <div>
                <h4 className="font-medium flex items-center gap-2 mb-4">
                  <MessageSquare className="h-4 w-4" />
                  SMS
                </h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Код подтверждения</p>
                      <p className="text-xs text-muted-foreground">Для входа и оплаты</p>
                    </div>
                    <Switch defaultChecked disabled />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Статус доставки</p>
                      <p className="text-xs text-muted-foreground">SMS при изменении статуса</p>
                    </div>
                    <Switch />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Preferences */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Предпочтения
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Язык</p>
                  <p className="text-xs text-muted-foreground">Язык интерфейса</p>
                </div>
                <Select defaultValue="ru">
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ru">Русский</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Тема</p>
                  <p className="text-xs text-muted-foreground">Оформление интерфейса</p>
                </div>
                <Select defaultValue="light">
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">
                      <span className="flex items-center gap-2">
                        <Sun className="h-4 w-4" />
                        Светлая
                      </span>
                    </SelectItem>
                    <SelectItem value="dark">
                      <span className="flex items-center gap-2">
                        <Moon className="h-4 w-4" />
                        Тёмная
                      </span>
                    </SelectItem>
                    <SelectItem value="system">Системная</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Валюта</p>
                  <p className="text-xs text-muted-foreground">Отображение цен</p>
                </div>
                <Select defaultValue="rub">
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rub">RUB (₽)</SelectItem>
                    <SelectItem value="usd">USD ($)</SelectItem>
                    <SelectItem value="eur">EUR (€)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Privacy */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Конфиденциальность
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Персонализация</p>
                  <p className="text-xs text-muted-foreground">Использовать историю для рекомендаций</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Аналитика</p>
                  <p className="text-xs text-muted-foreground">Помочь улучшить сервис</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Скачать мои данные</p>
                  <p className="text-xs text-muted-foreground">Экспорт всех данных аккаунта</p>
                </div>
                <Button variant="outline" size="sm" className="gap-2">
                  <Download className="h-4 w-4" />
                  Скачать
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="border-destructive/50">
            <CardHeader>
              <CardTitle className="text-base text-destructive flex items-center gap-2">
                <Trash2 className="h-5 w-5" />
                Опасная зона
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Очистить историю просмотров</p>
                  <p className="text-xs text-muted-foreground">Удалить все просмотренные товары</p>
                </div>
                <Button variant="outline" size="sm">
                  Очистить
                </Button>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-destructive">Удалить аккаунт</p>
                  <p className="text-xs text-muted-foreground">Это действие необратимо</p>
                </div>
                <Button variant="destructive" size="sm">
                  Удалить аккаунт
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </AccountLayout>
    </>
  );
};

export default AccountSettings;
