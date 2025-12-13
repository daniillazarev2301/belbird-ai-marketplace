import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { format, addDays } from "date-fns";
import { ru } from "date-fns/locale";
import AccountLayout from "@/components/account/AccountLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  RefreshCw,
  Sparkles,
  Pause,
  Play,
  Trash2,
  Calendar,
  Package,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Subscription {
  id: string;
  product_id: string;
  quantity: number;
  frequency_days: number;
  next_delivery_date: string;
  is_active: boolean;
  discount_percent: number;
  product?: {
    name: string;
    price: number;
    images: string[];
    slug: string;
  };
}

const AccountSubscriptions = () => {
  const { toast } = useToast();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("subscriptions")
      .select(`
        *,
        product:products(name, price, images, slug)
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setSubscriptions(data as Subscription[]);
    }
    setLoading(false);
  };

  const toggleSubscription = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from("subscriptions")
      .update({ is_active: !currentStatus })
      .eq("id", id);

    if (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось обновить подписку",
        variant: "destructive"
      });
      return;
    }

    setSubscriptions(prev =>
      prev.map(s => s.id === id ? { ...s, is_active: !currentStatus } : s)
    );

    toast({
      title: currentStatus ? "Подписка приостановлена" : "Подписка возобновлена",
    });
  };

  const updateFrequency = async (id: string, frequencyDays: number) => {
    const nextDate = addDays(new Date(), frequencyDays);

    const { error } = await supabase
      .from("subscriptions")
      .update({ 
        frequency_days: frequencyDays,
        next_delivery_date: nextDate.toISOString().split('T')[0]
      })
      .eq("id", id);

    if (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось обновить частоту доставки",
        variant: "destructive"
      });
      return;
    }

    setSubscriptions(prev =>
      prev.map(s => s.id === id ? { 
        ...s, 
        frequency_days: frequencyDays,
        next_delivery_date: nextDate.toISOString().split('T')[0]
      } : s)
    );

    toast({ title: "Частота доставки обновлена" });
  };

  const deleteSubscription = async (id: string) => {
    const { error } = await supabase
      .from("subscriptions")
      .delete()
      .eq("id", id);

    if (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось удалить подписку",
        variant: "destructive"
      });
      return;
    }

    setSubscriptions(prev => prev.filter(s => s.id !== id));
    toast({ title: "Подписка отменена" });
  };

  if (loading) {
    return (
      <AccountLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </AccountLayout>
    );
  }

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

          {/* Subscriptions List */}
          {subscriptions.length > 0 ? (
            <div className="space-y-4">
              {subscriptions.map((subscription) => (
                <Card key={subscription.id} className={!subscription.is_active ? "opacity-60" : ""}>
                  <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row gap-4">
                      {/* Product Image */}
                      <Link to={`/product/${subscription.product?.slug}`}>
                        <img
                          src={subscription.product?.images?.[0] || "/placeholder.svg"}
                          alt={subscription.product?.name}
                          className="w-20 h-20 rounded-lg object-cover"
                        />
                      </Link>

                      {/* Product Info */}
                      <div className="flex-1 space-y-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <Link 
                              to={`/product/${subscription.product?.slug}`}
                              className="font-medium hover:text-primary"
                            >
                              {subscription.product?.name}
                            </Link>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant={subscription.is_active ? "default" : "secondary"}>
                                {subscription.is_active ? "Активна" : "Приостановлена"}
                              </Badge>
                              <Badge variant="outline" className="text-green-600">
                                -{subscription.discount_percent}%
                              </Badge>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold">
                              {((subscription.product?.price || 0) * subscription.quantity * (1 - subscription.discount_percent / 100)).toLocaleString()} ₽
                            </p>
                            <p className="text-xs text-muted-foreground line-through">
                              {((subscription.product?.price || 0) * subscription.quantity).toLocaleString()} ₽
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4 text-muted-foreground" />
                            <span>Кол-во: {subscription.quantity}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span>
                              След. доставка: {format(new Date(subscription.next_delivery_date), "d MMMM", { locale: ru })}
                            </span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-wrap items-center gap-2 pt-2">
                          <Select
                            value={subscription.frequency_days.toString()}
                            onValueChange={(value) => updateFrequency(subscription.id, parseInt(value))}
                          >
                            <SelectTrigger className="w-40 h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="14">Каждые 2 недели</SelectItem>
                              <SelectItem value="30">Каждый месяц</SelectItem>
                              <SelectItem value="60">Каждые 2 месяца</SelectItem>
                              <SelectItem value="90">Каждые 3 месяца</SelectItem>
                            </SelectContent>
                          </Select>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleSubscription(subscription.id, subscription.is_active)}
                          >
                            {subscription.is_active ? (
                              <>
                                <Pause className="h-4 w-4 mr-1" />
                                Приостановить
                              </>
                            ) : (
                              <>
                                <Play className="h-4 w-4 mr-1" />
                                Возобновить
                              </>
                            )}
                          </Button>

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm" className="text-destructive">
                                <Trash2 className="h-4 w-4 mr-1" />
                                Отменить
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Отменить подписку?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Это действие нельзя отменить. Подписка будет удалена, и автоматические доставки прекратятся.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Нет, оставить</AlertDialogCancel>
                                <AlertDialogAction onClick={() => deleteSubscription(subscription.id)}>
                                  Да, отменить
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <RefreshCw className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold mb-2">У вас пока нет подписок</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Оформите подписку на регулярные товары и экономьте до 15%
                </p>
                <Button asChild>
                  <Link to="/catalog">Выбрать товары для подписки</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </AccountLayout>
    </>
  );
};

export default AccountSubscriptions;