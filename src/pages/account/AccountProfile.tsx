import { Helmet } from "react-helmet-async";
import AccountLayout from "@/components/account/AccountLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Camera, Mail, Phone, MapPin, Calendar, Shield, Star, Gift } from "lucide-react";

const AccountProfile = () => {
  return (
    <>
      <Helmet>
        <title>Профиль — BelBird</title>
      </Helmet>
      <AccountLayout>
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-serif font-semibold">Мой профиль</h1>
            <p className="text-muted-foreground">Управляйте личными данными</p>
          </div>

          {/* Loyalty Status Card */}
          <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-primary/20">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-full bg-secondary/20">
                    <Star className="h-6 w-6 text-secondary fill-current" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-lg">VIP статус</h3>
                      <Badge className="bg-secondary text-secondary-foreground">До Platinum: 5,000 ₽</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Накоплено бонусов: <span className="font-semibold text-primary">2,450 ₽</span>
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="gap-2">
                    <Gift className="h-4 w-4" />
                    Потратить бонусы
                  </Button>
                  <Button size="sm">Подробнее о программе</Button>
                </div>
              </div>
              {/* Progress bar */}
              <div className="mt-4">
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>VIP</span>
                  <span>Platinum</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-secondary rounded-full" style={{ width: "65%" }} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Profile Form */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Личные данные</CardTitle>
              <CardDescription>Обновите информацию профиля</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar */}
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src="" />
                    <AvatarFallback className="bg-primary/10 text-primary text-2xl">АМ</AvatarFallback>
                  </Avatar>
                  <button className="absolute bottom-0 right-0 p-1.5 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
                    <Camera className="h-4 w-4" />
                  </button>
                </div>
                <div>
                  <p className="font-medium">Анна Морозова</p>
                  <p className="text-sm text-muted-foreground">Клиент с марта 2023</p>
                </div>
              </div>

              <Separator />

              {/* Form Fields */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Имя</Label>
                  <Input defaultValue="Анна" />
                </div>
                <div className="space-y-2">
                  <Label>Фамилия</Label>
                  <Input defaultValue="Морозова" />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input defaultValue="anna@mail.ru" className="pl-10" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Телефон</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input defaultValue="+7 999 123 45 67" className="pl-10" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Дата рождения</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input type="date" defaultValue="1990-05-15" className="pl-10" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Пол</Label>
                  <Select defaultValue="female">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="female">Женский</SelectItem>
                      <SelectItem value="male">Мужской</SelectItem>
                      <SelectItem value="other">Не указывать</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              {/* Addresses */}
              <div>
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Адреса доставки
                </h4>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 rounded-lg border border-border bg-muted/30">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">Дом</p>
                        <Badge variant="outline" className="text-xs">По умолчанию</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        г. Москва, ул. Пушкина, д. 10, кв. 25
                      </p>
                    </div>
                    <Button variant="ghost" size="sm">Изменить</Button>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg border border-border">
                    <div className="flex-1">
                      <p className="text-sm font-medium">Работа</p>
                      <p className="text-sm text-muted-foreground">
                        г. Москва, Тверская ул., д. 15, офис 312
                      </p>
                    </div>
                    <Button variant="ghost" size="sm">Изменить</Button>
                  </div>
                  <Button variant="outline" size="sm" className="w-full">
                    + Добавить адрес
                  </Button>
                </div>
              </div>

              <Separator />

              <div className="flex justify-end">
                <Button>Сохранить изменения</Button>
              </div>
            </CardContent>
          </Card>

          {/* Security */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Безопасность
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Пароль</p>
                  <p className="text-sm text-muted-foreground">Последнее изменение: 3 месяца назад</p>
                </div>
                <Button variant="outline">Изменить пароль</Button>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Двухфакторная аутентификация</p>
                  <p className="text-sm text-muted-foreground">Дополнительная защита аккаунта</p>
                </div>
                <Button variant="outline">Включить</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </AccountLayout>
    </>
  );
};

export default AccountProfile;
