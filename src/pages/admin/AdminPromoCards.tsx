import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useSiteSettings, PromoCard, PromoCardsSettings } from "@/hooks/useSiteSettings";
import { Loader2, Save, Percent, Clock, Repeat, Eye } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const defaultCards: PromoCard[] = [
  {
    id: "main",
    type: "main",
    title: "Скидка 20% на первый заказ",
    description: "Используйте промокод BELBIRD20 при оформлении заказа",
    badge: "Специальное предложение",
    button_text: "Использовать",
    button_link: "/catalog",
    is_active: true,
  },
  {
    id: "flash_sale",
    type: "flash_sale",
    title: "Товары дня до -50%",
    description: "Успейте купить со скидкой",
    badge: "Flash Sale",
    button_text: "Смотреть",
    button_link: "/catalog",
    is_active: true,
    end_time: "",
    discount_percent: 50,
  },
  {
    id: "subscription",
    type: "subscription",
    title: "Подписка на корм",
    description: "Экономьте до 15% с регулярной доставкой",
    badge: "Выгодно",
    button_text: "Узнать больше",
    button_link: "/account/subscriptions",
    is_active: true,
  },
];

const AdminPromoCards = () => {
  const { settings, isLoading, updateSettings } = useSiteSettings();
  const [cards, setCards] = useState<PromoCard[]>(defaultCards);

  useEffect(() => {
    if (settings?.promo_cards?.cards && settings.promo_cards.cards.length > 0) {
      setCards(settings.promo_cards.cards);
    }
  }, [settings]);

  const updateCard = (id: string, updates: Partial<PromoCard>) => {
    setCards(prev => prev.map(card => 
      card.id === id ? { ...card, ...updates } : card
    ));
  };

  const handleSave = () => {
    updateSettings.mutate({ 
      key: 'promo_cards', 
      value: { cards } as PromoCardsSettings 
    });
  };

  if (isLoading) {
    return (
      <AdminLayout title="Промо-блоки" description="Управление промо-карточками на главной странице">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AdminLayout>
    );
  }

  const mainCard = cards.find(c => c.id === "main") || defaultCards[0];
  const flashCard = cards.find(c => c.id === "flash_sale") || defaultCards[1];
  const subCard = cards.find(c => c.id === "subscription") || defaultCards[2];

  return (
    <>
      <Helmet>
        <title>Промо-блоки — BelBird Admin</title>
      </Helmet>
      <AdminLayout title="Промо-блоки" description="Управление промо-карточками на главной странице">
        <div className="space-y-6">
          {/* Preview Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Предпросмотр
              </CardTitle>
              <CardDescription>
                Так блоки будут выглядеть на главной странице
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4 scale-90 origin-top-left">
                {/* Main Promo Preview */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-primary/80 p-6 text-primary-foreground">
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-3">
                      <Percent className="h-4 w-4" />
                      <span className="text-xs font-medium opacity-90">{mainCard.badge}</span>
                    </div>
                    <h3 className="text-xl font-semibold mb-2">{mainCard.title}</h3>
                    <p className="text-sm opacity-80 mb-4">{mainCard.description}</p>
                    <Button variant="secondary" size="sm">{mainCard.button_text}</Button>
                  </div>
                  {!mainCard.is_active && (
                    <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                      <span className="text-sm font-medium text-muted-foreground">Выключено</span>
                    </div>
                  )}
                </div>

                <div className="grid gap-4">
                  {/* Flash Sale Preview */}
                  <div className="relative rounded-xl bg-secondary/10 p-4 border border-secondary/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="h-4 w-4 text-secondary" />
                      <span className="text-xs font-medium text-secondary">{flashCard.badge}</span>
                    </div>
                    <h4 className="font-semibold mb-1">{flashCard.title}</h4>
                    <p className="text-xs text-muted-foreground">{flashCard.description}</p>
                    {!flashCard.is_active && (
                      <div className="absolute inset-0 bg-background/80 rounded-xl flex items-center justify-center">
                        <span className="text-sm font-medium text-muted-foreground">Выключено</span>
                      </div>
                    )}
                  </div>

                  {/* Subscription Preview */}
                  <div className="relative rounded-xl bg-accent p-4">
                    <span className="inline-block px-2 py-0.5 text-xs font-medium bg-primary/10 text-primary rounded mb-2">
                      {subCard.badge}
                    </span>
                    <h4 className="font-semibold mb-1">{subCard.title}</h4>
                    <p className="text-xs text-muted-foreground">{subCard.description}</p>
                    {!subCard.is_active && (
                      <div className="absolute inset-0 bg-background/80 rounded-xl flex items-center justify-center">
                        <span className="text-sm font-medium text-muted-foreground">Выключено</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Edit Cards */}
          <Tabs defaultValue="main" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="main" className="gap-2">
                <Percent className="h-4 w-4" />
                Главный баннер
              </TabsTrigger>
              <TabsTrigger value="flash" className="gap-2">
                <Clock className="h-4 w-4" />
                Flash Sale
              </TabsTrigger>
              <TabsTrigger value="subscription" className="gap-2">
                <Repeat className="h-4 w-4" />
                Подписка
              </TabsTrigger>
            </TabsList>

            {/* Main Banner */}
            <TabsContent value="main">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Главный промо-баннер</CardTitle>
                      <CardDescription>Большой баннер слева с основной акцией</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Label htmlFor="main-active" className="text-sm">Активен</Label>
                      <Switch
                        id="main-active"
                        checked={mainCard.is_active}
                        onCheckedChange={(checked) => updateCard("main", { is_active: checked })}
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Заголовок</Label>
                      <Input
                        value={mainCard.title}
                        onChange={(e) => updateCard("main", { title: e.target.value })}
                        placeholder="Скидка 20% на первый заказ"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Бейдж</Label>
                      <Input
                        value={mainCard.badge || ""}
                        onChange={(e) => updateCard("main", { badge: e.target.value })}
                        placeholder="Специальное предложение"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Описание</Label>
                    <Textarea
                      value={mainCard.description}
                      onChange={(e) => updateCard("main", { description: e.target.value })}
                      placeholder="Используйте промокод BELBIRD20 при оформлении заказа"
                    />
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Текст кнопки</Label>
                      <Input
                        value={mainCard.button_text}
                        onChange={(e) => updateCard("main", { button_text: e.target.value })}
                        placeholder="Использовать"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Ссылка кнопки</Label>
                      <Input
                        value={mainCard.button_link}
                        onChange={(e) => updateCard("main", { button_link: e.target.value })}
                        placeholder="/catalog"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Flash Sale */}
            <TabsContent value="flash">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Flash Sale</CardTitle>
                      <CardDescription>Блок с обратным отсчётом для ограниченных акций</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Label htmlFor="flash-active" className="text-sm">Активен</Label>
                      <Switch
                        id="flash-active"
                        checked={flashCard.is_active}
                        onCheckedChange={(checked) => updateCard("flash_sale", { is_active: checked })}
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Заголовок</Label>
                      <Input
                        value={flashCard.title}
                        onChange={(e) => updateCard("flash_sale", { title: e.target.value })}
                        placeholder="Товары дня до -50%"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Бейдж</Label>
                      <Input
                        value={flashCard.badge || ""}
                        onChange={(e) => updateCard("flash_sale", { badge: e.target.value })}
                        placeholder="Flash Sale"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Описание</Label>
                    <Textarea
                      value={flashCard.description}
                      onChange={(e) => updateCard("flash_sale", { description: e.target.value })}
                      placeholder="Успейте купить со скидкой"
                    />
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Окончание акции</Label>
                      <Input
                        type="datetime-local"
                        value={flashCard.end_time || ""}
                        onChange={(e) => updateCard("flash_sale", { end_time: e.target.value })}
                      />
                      <p className="text-xs text-muted-foreground">
                        Оставьте пустым для статичного текста
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label>Скидка (%)</Label>
                      <Input
                        type="number"
                        value={flashCard.discount_percent || ""}
                        onChange={(e) => updateCard("flash_sale", { discount_percent: Number(e.target.value) })}
                        placeholder="50"
                      />
                    </div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Текст кнопки</Label>
                      <Input
                        value={flashCard.button_text}
                        onChange={(e) => updateCard("flash_sale", { button_text: e.target.value })}
                        placeholder="Смотреть"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Ссылка кнопки</Label>
                      <Input
                        value={flashCard.button_link}
                        onChange={(e) => updateCard("flash_sale", { button_link: e.target.value })}
                        placeholder="/catalog"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Subscription */}
            <TabsContent value="subscription">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Блок подписки</CardTitle>
                      <CardDescription>Промо для подписок на регулярную доставку</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Label htmlFor="sub-active" className="text-sm">Активен</Label>
                      <Switch
                        id="sub-active"
                        checked={subCard.is_active}
                        onCheckedChange={(checked) => updateCard("subscription", { is_active: checked })}
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Заголовок</Label>
                      <Input
                        value={subCard.title}
                        onChange={(e) => updateCard("subscription", { title: e.target.value })}
                        placeholder="Подписка на корм"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Бейдж</Label>
                      <Input
                        value={subCard.badge || ""}
                        onChange={(e) => updateCard("subscription", { badge: e.target.value })}
                        placeholder="Выгодно"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Описание</Label>
                    <Textarea
                      value={subCard.description}
                      onChange={(e) => updateCard("subscription", { description: e.target.value })}
                      placeholder="Экономьте до 15% с регулярной доставкой"
                    />
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Текст кнопки</Label>
                      <Input
                        value={subCard.button_text}
                        onChange={(e) => updateCard("subscription", { button_text: e.target.value })}
                        placeholder="Узнать больше"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Ссылка кнопки</Label>
                      <Input
                        value={subCard.button_link}
                        onChange={(e) => updateCard("subscription", { button_link: e.target.value })}
                        placeholder="/account/subscriptions"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={updateSettings.isPending} size="lg">
              {updateSettings.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Сохранить все изменения
            </Button>
          </div>
        </div>
      </AdminLayout>
    </>
  );
};

export default AdminPromoCards;