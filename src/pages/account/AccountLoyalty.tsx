import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { useQuery } from "@tanstack/react-query";
import AccountLayout from "@/components/account/AccountLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Gift,
  Star,
  Trophy,
  Check,
  Lock,
  Coins,
  Users,
  Share2,
  ArrowUp,
  ArrowDown,
  History,
  Loader2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

const levels = [
  { name: "Новичок", minSpent: 0, cashback: 3, color: "bg-muted" },
  { name: "Любитель", minSpent: 10000, cashback: 5, color: "bg-secondary/30" },
  { name: "VIP", minSpent: 50000, cashback: 7, color: "bg-secondary" },
  { name: "Platinum", minSpent: 150000, cashback: 10, color: "bg-primary" },
];

interface LoyaltyTransaction {
  id: string;
  points: number;
  type: string;
  description: string | null;
  order_id: string | null;
  created_at: string;
}

const AccountLoyalty = () => {
  const [profile, setProfile] = useState<{ loyalty_points: number | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [transactionFilter, setTransactionFilter] = useState<"all" | "earn" | "spend">("all");

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUserId(user.id);
      const { data } = await supabase
        .from('profiles')
        .select('loyalty_points')
        .eq('id', user.id)
        .single();
      setProfile(data);
    }
    setLoading(false);
  };

  const { data: transactions = [], isLoading: loadingTransactions } = useQuery({
    queryKey: ["loyalty-transactions", userId, transactionFilter],
    queryFn: async () => {
      if (!userId) return [];
      
      let query = supabase
        .from("loyalty_transactions")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(50);

      if (transactionFilter === "earn") {
        query = query.eq("type", "earn");
      } else if (transactionFilter === "spend") {
        query = query.eq("type", "spend");
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as LoyaltyTransaction[];
    },
    enabled: !!userId,
  });

  const bonusBalance = profile?.loyalty_points || 0;
  const currentLevel = 0;
  const currentSpent = 0;
  const nextLevelSpent = levels[currentLevel + 1]?.minSpent || levels[currentLevel].minSpent;
  const progress = nextLevelSpent > 0 ? (currentSpent / nextLevelSpent) * 100 : 0;

  if (loading) {
    return (
      <AccountLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AccountLayout>
    );
  }

  return (
    <>
      <Helmet>
        <title>Бонусы и лояльность — BelBird</title>
      </Helmet>
      <AccountLayout>
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-serif font-semibold">Бонусы и лояльность</h1>
            <p className="text-muted-foreground">
              Зарабатывайте бонусы и получайте привилегии
            </p>
          </div>

          {/* Balance Card */}
          <Card className="bg-gradient-to-br from-primary via-primary/90 to-primary/80 text-primary-foreground overflow-hidden relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary-foreground/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            <CardContent className="p-6 relative">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Coins className="h-5 w-5" />
                    <span className="text-primary-foreground/80">Ваш баланс</span>
                  </div>
                  <p className="text-4xl font-bold mb-1">{bonusBalance.toLocaleString()} ₽</p>
                  <p className="text-sm text-primary-foreground/70">
                    1 бонус = 1 ₽ при оплате
                  </p>
                </div>
                <div className="flex gap-3">
                  <Button variant="secondary" className="gap-2" disabled={bonusBalance === 0} asChild>
                    <a href="/catalog">
                      <Gift className="h-4 w-4" />
                      Потратить бонусы
                    </a>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="history" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="history" className="gap-2">
                <History className="h-4 w-4" />
                История операций
              </TabsTrigger>
              <TabsTrigger value="level" className="gap-2">
                <Trophy className="h-4 w-4" />
                Уровень и привилегии
              </TabsTrigger>
            </TabsList>

            {/* Transaction History */}
            <TabsContent value="history">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <CardTitle className="text-base">История транзакций</CardTitle>
                    <div className="flex gap-2">
                      <Button
                        variant={transactionFilter === "all" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setTransactionFilter("all")}
                      >
                        Все
                      </Button>
                      <Button
                        variant={transactionFilter === "earn" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setTransactionFilter("earn")}
                        className="gap-1"
                      >
                        <ArrowUp className="h-3 w-3" />
                        Начисления
                      </Button>
                      <Button
                        variant={transactionFilter === "spend" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setTransactionFilter("spend")}
                        className="gap-1"
                      >
                        <ArrowDown className="h-3 w-3" />
                        Списания
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {loadingTransactions ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : transactions.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <History className="h-12 w-12 mx-auto mb-3 opacity-30" />
                      <p>Нет операций</p>
                      <p className="text-sm">Сделайте первый заказ, чтобы получить бонусы</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {transactions.map((tx) => (
                        <div
                          key={tx.id}
                          className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-full ${tx.type === "earn" ? "bg-green-100 text-green-600" : "bg-orange-100 text-orange-600"}`}>
                              {tx.type === "earn" ? (
                                <ArrowUp className="h-4 w-4" />
                              ) : (
                                <ArrowDown className="h-4 w-4" />
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-medium">
                                {tx.description || (tx.type === "earn" ? "Начисление бонусов" : "Списание бонусов")}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(tx.created_at), "d MMMM yyyy, HH:mm", { locale: ru })}
                              </p>
                            </div>
                          </div>
                          <div className={`text-sm font-semibold ${tx.type === "earn" ? "text-green-600" : "text-orange-600"}`}>
                            {tx.type === "earn" ? "+" : ""}{tx.points.toLocaleString()} ₽
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Level Progress */}
            <TabsContent value="level">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-secondary" />
                    Ваш уровень
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Level badges */}
                  <div className="flex justify-between mb-4">
                    {levels.map((level, idx) => (
                      <div key={level.name} className="flex flex-col items-center">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center mb-1 ${
                            idx <= currentLevel
                              ? level.color + " text-primary-foreground"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {idx < currentLevel ? (
                            <Check className="h-5 w-5" />
                          ) : idx === currentLevel ? (
                            <Star className="h-5 w-5 fill-current" />
                          ) : (
                            <Lock className="h-4 w-4" />
                          )}
                        </div>
                        <span className={`text-xs font-medium ${idx === currentLevel ? "text-primary" : ""}`}>
                          {level.name}
                        </span>
                        <span className="text-xs text-muted-foreground">{level.cashback}%</span>
                      </div>
                    ))}
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>{levels[currentLevel].name}</span>
                      <span className="text-muted-foreground">
                        {currentSpent.toLocaleString()} / {nextLevelSpent.toLocaleString()} ₽
                      </span>
                    </div>
                    <Progress value={progress} className="h-2" />
                    <p className="text-sm text-muted-foreground">
                      До уровня {levels[currentLevel + 1]?.name || "Platinum"}: ещё{" "}
                      <span className="font-medium text-foreground">
                        {(nextLevelSpent - currentSpent).toLocaleString()} ₽
                      </span>
                    </p>
                  </div>

                  {/* Current benefits */}
                  <div className="mt-6 p-4 rounded-lg bg-accent/50">
                    <h4 className="font-medium mb-3">Ваши привилегии</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-primary" />
                        <span>Кэшбэк {levels[currentLevel].cashback}% с покупок</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-primary" />
                        <span>Бесплатная доставка от 5000 ₽</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Referral */}
              <Card className="bg-gradient-to-r from-secondary/10 to-primary/10 border-0 mt-4">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    <div className="p-3 rounded-full bg-secondary/20">
                      <Users className="h-6 w-6 text-secondary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold mb-1">Пригласите друзей</h3>
                      <p className="text-sm text-muted-foreground">
                        Получите 500 ₽ за каждого друга, который сделает первый заказ
                      </p>
                    </div>
                    <Button className="gap-2">
                      <Share2 className="h-4 w-4" />
                      Поделиться ссылкой
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </AccountLayout>
    </>
  );
};

export default AccountLoyalty;