import { useState } from "react";
import { Helmet } from "react-helmet-async";
import AccountLayout from "@/components/account/AccountLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  RefreshCw,
  Calendar,
  Truck,
  Percent,
  Plus,
  Edit,
  Pause,
  Play,
  Trash2,
  Package,
  Clock,
  Check,
  Sparkles,
} from "lucide-react";

interface Subscription {
  id: string;
  product: {
    name: string;
    image: string;
    price: number;
  };
  frequency: "weekly" | "biweekly" | "monthly" | "bimonthly";
  quantity: number;
  discount: number;
  nextDelivery: string;
  status: "active" | "paused";
  totalSaved: number;
  deliveries: number;
}

const subscriptions: Subscription[] = [
  {
    id: "1",
    product: {
      name: "Royal Canin Indoor 2кг",
      image: "https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=200&h=200&fit=crop",
      price: 3290,
    },
    frequency: "monthly",
    quantity: 1,
    discount: 15,
    nextDelivery: "15.12.2024",
    status: "active",
    totalSaved: 4935,
    deliveries: 10,
  },
  {
    id: "2",
    product: {
      name: "Наполнитель Ever Clean 10л",
      image: "https://images.unsplash.com/photo-1574158622682-e40e69881006?w=200&h=200&fit=crop",
      price: 1890,
    },
    frequency: "biweekly",
    quantity: 1,
    discount: 10,
    nextDelivery: "20.12.2024",
    status: "active",
    totalSaved: 1890,
    deliveries: 5,
  },
  {
    id: "3",
    product: {
      name: "Витамины для суставов",
      image: "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=200&h=200&fit=crop",
      price: 1590,
    },
    frequency: "monthly",
    quantity: 1,
    discount: 12,
    nextDelivery: "—",
    status: "paused",
    totalSaved: 572,
    deliveries: 3,
  },
];

const frequencyLabels: Record<string, string> = {
  weekly: "Каждую неделю",
  biweekly: "Каждые 2 недели",
  monthly: "Каждый месяц",
  bimonthly: "Каждые 2 месяца",
};

const AccountSubscriptions = () => {
  const [editingSubscription, setEditingSubscription] = useState<Subscription | null>(null);

  const activeSubscriptions = subscriptions.filter((s) => s.status === "active");
  const pausedSubscriptions = subscriptions.filter((s) => s.status === "paused");

  const totalMonthlySpend = subscriptions
    .filter((s) => s.status === "active")
    .reduce((sum, s) => {
      const multiplier = s.frequency === "weekly" ? 4 : s.frequency === "biweekly" ? 2 : 1;
      return sum + s.product.price * s.quantity * multiplier * (1 - s.discount / 100);
    }, 0);

  const totalSaved = subscriptions.reduce((sum, s) => sum + s.totalSaved, 0);

  return (
    <>
      <Helmet>
        <title>Подписки — BelBird</title>
      </Helmet>
      <AccountLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-serif font-semibold">Мои подписки</h1>
              <p className="text-muted-foreground">
                Автоматическая доставка товаров со скидкой
              </p>
            </div>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Добавить товар
            </Button>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <RefreshCw className="h-5 w-5 mx-auto mb-2 text-primary" />
                <p className="text-2xl font-semibold">{activeSubscriptions.length}</p>
                <p className="text-xs text-muted-foreground">Активных подписок</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Calendar className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
                <p className="text-2xl font-semibold">15.12</p>
                <p className="text-xs text-muted-foreground">Ближайшая доставка</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Truck className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
                <p className="text-2xl font-semibold">{Math.round(totalMonthlySpend).toLocaleString()} ₽</p>
                <p className="text-xs text-muted-foreground">В месяц</p>
              </CardContent>
            </Card>
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-4 text-center">
                <Percent className="h-5 w-5 mx-auto mb-2 text-primary" />
                <p className="text-2xl font-semibold text-primary">{totalSaved.toLocaleString()} ₽</p>
                <p className="text-xs text-muted-foreground">Сэкономлено всего</p>
              </CardContent>
            </Card>
          </div>

          {/* Benefits Banner */}
          <Card className="bg-gradient-to-r from-secondary/10 to-primary/10 border-0">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-secondary/20">
                  <Sparkles className="h-6 w-6 text-secondary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">Преимущества подписки</h3>
                  <p className="text-sm text-muted-foreground">
                    Скидка до 15% • Бесплатная доставка • Гибкое управление • Отмена в любой момент
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Active Subscriptions */}
          {activeSubscriptions.length > 0 && (
            <div>
              <h2 className="font-semibold mb-4 flex items-center gap-2">
                <Check className="h-5 w-5 text-primary" />
                Активные подписки ({activeSubscriptions.length})
              </h2>
              <div className="space-y-4">
                {activeSubscriptions.map((sub) => (
                  <SubscriptionCard
                    key={sub.id}
                    subscription={sub}
                    onEdit={() => setEditingSubscription(sub)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Paused Subscriptions */}
          {pausedSubscriptions.length > 0 && (
            <div>
              <h2 className="font-semibold mb-4 flex items-center gap-2 text-muted-foreground">
                <Pause className="h-5 w-5" />
                Приостановленные ({pausedSubscriptions.length})
              </h2>
              <div className="space-y-4">
                {pausedSubscriptions.map((sub) => (
                  <SubscriptionCard
                    key={sub.id}
                    subscription={sub}
                    onEdit={() => setEditingSubscription(sub)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {subscriptions.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <RefreshCw className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold mb-2">У вас пока нет подписок</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Оформите подписку на регулярные товары и экономьте до 15%
                </p>
                <Button>Выбрать товары для подписки</Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Edit Dialog */}
        <Dialog open={!!editingSubscription} onOpenChange={() => setEditingSubscription(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Настройки подписки</DialogTitle>
            </DialogHeader>
            {editingSubscription && (
              <div className="space-y-6">
                {/* Product */}
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <img
                    src={editingSubscription.product.image}
                    alt={editingSubscription.product.name}
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                  <div>
                    <p className="font-medium">{editingSubscription.product.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {editingSubscription.product.price.toLocaleString()} ₽
                    </p>
                  </div>
                </div>

                {/* Settings */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Частота доставки</label>
                    <Select defaultValue={editingSubscription.frequency}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="weekly">Каждую неделю</SelectItem>
                        <SelectItem value="biweekly">Каждые 2 недели</SelectItem>
                        <SelectItem value="monthly">Каждый месяц</SelectItem>
                        <SelectItem value="bimonthly">Каждые 2 месяца</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Количество</label>
                    <Select defaultValue={String(editingSubscription.quantity)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5].map((n) => (
                          <SelectItem key={n} value={String(n)}>
                            {n} шт
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg bg-primary/5">
                    <div>
                      <p className="font-medium">Скидка подписки</p>
                      <p className="text-sm text-muted-foreground">Применяется автоматически</p>
                    </div>
                    <Badge className="bg-primary text-primary-foreground">
                      -{editingSubscription.discount}%
                    </Badge>
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-2">
                  <Button className="w-full" onClick={() => setEditingSubscription(null)}>
                    Сохранить изменения
                  </Button>
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1 gap-2">
                      {editingSubscription.status === "active" ? (
                        <>
                          <Pause className="h-4 w-4" />
                          Приостановить
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4" />
                          Возобновить
                        </>
                      )}
                    </Button>
                    <Button variant="outline" className="flex-1 gap-2 text-destructive hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                      Отменить
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </AccountLayout>
    </>
  );
};

interface SubscriptionCardProps {
  subscription: Subscription;
  onEdit: () => void;
}

const SubscriptionCard = ({ subscription, onEdit }: SubscriptionCardProps) => {
  return (
    <Card className={subscription.status === "paused" ? "opacity-60" : ""}>
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <img
            src={subscription.product.image}
            alt={subscription.product.name}
            className="w-16 h-16 rounded-lg object-cover"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <p className="font-medium truncate">{subscription.product.name}</p>
              <Badge variant={subscription.status === "active" ? "default" : "outline"}>
                {subscription.status === "active" ? "Активна" : "Пауза"}
              </Badge>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {frequencyLabels[subscription.frequency]}
              </span>
              <span className="flex items-center gap-1">
                <Package className="h-3.5 w-3.5" />
                {subscription.quantity} шт
              </span>
              <span className="flex items-center gap-1 text-primary font-medium">
                <Percent className="h-3.5 w-3.5" />
                -{subscription.discount}%
              </span>
            </div>
          </div>
          <div className="text-right">
            <p className="font-semibold">
              {Math.round(subscription.product.price * (1 - subscription.discount / 100)).toLocaleString()} ₽
            </p>
            {subscription.status === "active" && (
              <p className="text-xs text-muted-foreground">
                След. доставка: {subscription.nextDelivery}
              </p>
            )}
          </div>
          <Button variant="ghost" size="icon" onClick={onEdit}>
            <Edit className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AccountSubscriptions;
