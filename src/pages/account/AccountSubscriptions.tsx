import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import AccountLayout from "@/components/account/AccountLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  RefreshCw,
  Sparkles,
} from "lucide-react";

const AccountSubscriptions = () => {
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

          {/* Empty State */}
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
        </div>
      </AccountLayout>
    </>
  );
};

export default AccountSubscriptions;
