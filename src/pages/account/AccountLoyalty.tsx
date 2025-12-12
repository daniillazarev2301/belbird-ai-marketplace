import { Helmet } from "react-helmet-async";
import AccountLayout from "@/components/account/AccountLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Gift,
  Star,
  Trophy,
  Sparkles,
  ChevronRight,
  Check,
  Lock,
  Coins,
  ShoppingBag,
  PawPrint,
  Calendar,
  Users,
  Share2,
} from "lucide-react";

const levels = [
  { name: "Новичок", minSpent: 0, cashback: 3, color: "bg-muted" },
  { name: "Любитель", minSpent: 10000, cashback: 5, color: "bg-secondary/30" },
  { name: "VIP", minSpent: 50000, cashback: 7, color: "bg-secondary" },
  { name: "Platinum", minSpent: 150000, cashback: 10, color: "bg-primary" },
];

const achievements = [
  { id: "1", name: "Первый заказ", description: "Сделайте первую покупку", icon: ShoppingBag, earned: true, reward: 100 },
  { id: "2", name: "Профиль питомца", description: "Добавьте профиль питомца", icon: PawPrint, earned: true, reward: 200 },
  { id: "3", name: "Отзыв эксперта", description: "Оставьте 5 отзывов", icon: Star, earned: true, reward: 300 },
  { id: "4", name: "Подписчик", description: "Оформите подписку на товар", icon: Calendar, earned: true, reward: 500 },
  { id: "5", name: "Социальный", description: "Поделитесь товаром в соцсетях", icon: Share2, earned: false, reward: 150 },
  { id: "6", name: "Друзья", description: "Пригласите 3 друзей", icon: Users, earned: false, reward: 1000 },
];

const transactions = [
  { id: "1", date: "12.12.2024", description: "Кэшбэк за заказ #12345", amount: 523, type: "earn" },
  { id: "2", date: "10.12.2024", description: "Достижение: Подписчик", amount: 500, type: "earn" },
  { id: "3", date: "05.12.2024", description: "Списание при оплате", amount: -800, type: "spend" },
  { id: "4", date: "01.12.2024", description: "Кэшбэк за заказ #12340", amount: 412, type: "earn" },
  { id: "5", date: "25.11.2024", description: "Бонус ко дню рождения", amount: 500, type: "earn" },
];

const AccountLoyalty = () => {
  const currentLevel = 2; // VIP (index)
  const currentSpent = 78500;
  const nextLevelSpent = levels[currentLevel + 1]?.minSpent || levels[currentLevel].minSpent;
  const progress = ((currentSpent - levels[currentLevel].minSpent) / (nextLevelSpent - levels[currentLevel].minSpent)) * 100;
  const bonusBalance = 2450;

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
                  <Button variant="secondary" className="gap-2">
                    <Gift className="h-4 w-4" />
                    Потратить бонусы
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Level Progress */}
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
                <h4 className="font-medium mb-3">Ваши привилегии VIP</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span>Кэшбэк 7% с покупок</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span>Бесплатная доставка от 3000 ₽</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span>Ранний доступ к акциям</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span>Подарок на день рождения</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Achievements */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-secondary" />
                  Достижения
                </CardTitle>
                <span className="text-sm text-muted-foreground">
                  {achievements.filter((a) => a.earned).length}/{achievements.length}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {achievements.map((achievement) => {
                  const Icon = achievement.icon;
                  return (
                    <div
                      key={achievement.id}
                      className={`p-4 rounded-lg border text-center transition-colors ${
                        achievement.earned
                          ? "border-primary/30 bg-primary/5"
                          : "border-border bg-muted/30 opacity-60"
                      }`}
                    >
                      <div
                        className={`w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center ${
                          achievement.earned ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                        }`}
                      >
                        <Icon className="h-6 w-6" />
                      </div>
                      <p className="font-medium text-sm mb-0.5">{achievement.name}</p>
                      <p className="text-xs text-muted-foreground mb-2">{achievement.description}</p>
                      <Badge variant={achievement.earned ? "default" : "outline"} className="text-xs">
                        {achievement.earned ? `+${achievement.reward} ₽ получено` : `+${achievement.reward} ₽`}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Transaction History */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">История бонусов</CardTitle>
                <Button variant="ghost" size="sm" className="gap-1">
                  Все операции
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {transactions.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div>
                      <p className="text-sm font-medium">{tx.description}</p>
                      <p className="text-xs text-muted-foreground">{tx.date}</p>
                    </div>
                    <span
                      className={`font-semibold ${
                        tx.type === "earn" ? "text-primary" : "text-muted-foreground"
                      }`}
                    >
                      {tx.type === "earn" ? "+" : ""}{tx.amount} ₽
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Referral */}
          <Card className="bg-gradient-to-r from-secondary/10 to-primary/10 border-0">
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
        </div>
      </AccountLayout>
    </>
  );
};

export default AccountLoyalty;
