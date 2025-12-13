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
import { Loader2, Save, Percent, Clock, Repeat, Eye, Sparkles, Plus, Trash2, GripVertical } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  const [isGenerating, setIsGenerating] = useState<string | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newCardType, setNewCardType] = useState<"main" | "flash_sale" | "subscription" | "custom">("custom");

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

  const deleteCard = (id: string) => {
    // Don't allow deleting default cards
    if (["main", "flash_sale", "subscription"].includes(id)) {
      toast.error("Нельзя удалить базовые промо-блоки");
      return;
    }
    setCards(prev => prev.filter(card => card.id !== id));
    toast.success("Промо-блок удалён");
  };

  const addNewCard = () => {
    const newCard: PromoCard = {
      id: `custom_${Date.now()}`,
      type: newCardType,
      title: "Новый промо-блок",
      description: "Описание акции",
      badge: "Акция",
      button_text: "Подробнее",
      button_link: "/catalog",
      is_active: false,
    };
    setCards(prev => [...prev, newCard]);
    setShowAddDialog(false);
    toast.success("Промо-блок добавлен");
  };

  const generateWithAI = async (cardId: string) => {
    setIsGenerating(cardId);
    try {
      const card = cards.find(c => c.id === cardId);
      if (!card) return;

      const prompt = `Сгенерируй привлекательный промо-текст для интернет-магазина зоотоваров BelBird.
Тип блока: ${card.type === "main" ? "главный баннер" : card.type === "flash_sale" ? "flash-распродажа" : card.type === "subscription" ? "подписка на товары" : "промо-акция"}

Верни JSON в формате:
{
  "title": "короткий заголовок до 50 символов",
  "description": "описание до 100 символов", 
  "badge": "бейдж до 20 символов",
  "button_text": "текст кнопки до 15 символов"
}

Текст должен быть на русском языке, привлекательным и побуждать к покупке.`;

      const { data, error } = await supabase.functions.invoke("generate-product-content", {
        body: { prompt, type: "promo" }
      });

      if (error) throw error;

      try {
        const result = JSON.parse(data.content || data.text || "{}");
        updateCard(cardId, {
          title: result.title || card.title,
          description: result.description || card.description,
          badge: result.badge || card.badge,
          button_text: result.button_text || card.button_text,
        });
        toast.success("Контент сгенерирован!");
      } catch {
        // Try to extract from text response
        const text = data.content || data.text || "";
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const result = JSON.parse(jsonMatch[0]);
          updateCard(cardId, {
            title: result.title || card.title,
            description: result.description || card.description,
            badge: result.badge || card.badge,
            button_text: result.button_text || card.button_text,
          });
          toast.success("Контент сгенерирован!");
        } else {
          throw new Error("Не удалось распарсить ответ AI");
        }
      }
    } catch (error) {
      console.error("AI generation error:", error);
      toast.error("Ошибка генерации контента");
    } finally {
      setIsGenerating(null);
    }
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
  const customCards = cards.filter(c => !["main", "flash_sale", "subscription"].includes(c.id));

  return (
    <>
      <Helmet>
        <title>Промо-блоки — BelBird Admin</title>
      </Helmet>
      <AdminLayout title="Промо-блоки" description="Управление промо-карточками на главной странице">
        <div className="space-y-6">
          {/* Actions */}
          <div className="flex items-center justify-between">
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Добавить блок
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Добавить промо-блок</DialogTitle>
                  <DialogDescription>
                    Выберите тип нового промо-блока
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <Label>Тип блока</Label>
                  <Select value={newCardType} onValueChange={(v) => setNewCardType(v as any)}>
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="custom">Обычный баннер</SelectItem>
                      <SelectItem value="flash_sale">Flash Sale</SelectItem>
                      <SelectItem value="subscription">Подписка</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                    Отмена
                  </Button>
                  <Button onClick={addNewCard}>
                    Добавить
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Button onClick={handleSave} disabled={updateSettings.isPending} className="gap-2">
              {updateSettings.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Сохранить все
            </Button>
          </div>

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
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="main" className="gap-2">
                <Percent className="h-4 w-4" />
                Главный
              </TabsTrigger>
              <TabsTrigger value="flash" className="gap-2">
                <Clock className="h-4 w-4" />
                Flash Sale
              </TabsTrigger>
              <TabsTrigger value="subscription" className="gap-2">
                <Repeat className="h-4 w-4" />
                Подписка
              </TabsTrigger>
              <TabsTrigger value="custom" className="gap-2">
                <Plus className="h-4 w-4" />
                Дополнительные ({customCards.length})
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
                    <div className="flex items-center gap-3">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="gap-2"
                        onClick={() => generateWithAI("main")}
                        disabled={isGenerating === "main"}
                      >
                        {isGenerating === "main" ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Sparkles className="h-4 w-4" />
                        )}
                        AI генерация
                      </Button>
                      <div className="flex items-center gap-2">
                        <Label htmlFor="main-active" className="text-sm">Активен</Label>
                        <Switch
                          id="main-active"
                          checked={mainCard.is_active}
                          onCheckedChange={(checked) => updateCard("main", { is_active: checked })}
                        />
                      </div>
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
                    <div className="flex items-center gap-3">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="gap-2"
                        onClick={() => generateWithAI("flash_sale")}
                        disabled={isGenerating === "flash_sale"}
                      >
                        {isGenerating === "flash_sale" ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Sparkles className="h-4 w-4" />
                        )}
                        AI генерация
                      </Button>
                      <div className="flex items-center gap-2">
                        <Label htmlFor="flash-active" className="text-sm">Активен</Label>
                        <Switch
                          id="flash-active"
                          checked={flashCard.is_active}
                          onCheckedChange={(checked) => updateCard("flash_sale", { is_active: checked })}
                        />
                      </div>
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
                    <div className="flex items-center gap-3">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="gap-2"
                        onClick={() => generateWithAI("subscription")}
                        disabled={isGenerating === "subscription"}
                      >
                        {isGenerating === "subscription" ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Sparkles className="h-4 w-4" />
                        )}
                        AI генерация
                      </Button>
                      <div className="flex items-center gap-2">
                        <Label htmlFor="sub-active" className="text-sm">Активен</Label>
                        <Switch
                          id="sub-active"
                          checked={subCard.is_active}
                          onCheckedChange={(checked) => updateCard("subscription", { is_active: checked })}
                        />
                      </div>
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

            {/* Custom Cards */}
            <TabsContent value="custom">
              <div className="space-y-4">
                {customCards.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <p className="text-muted-foreground mb-4">
                        Нет дополнительных промо-блоков
                      </p>
                      <Button variant="outline" onClick={() => setShowAddDialog(true)} className="gap-2">
                        <Plus className="h-4 w-4" />
                        Добавить блок
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  customCards.map((card) => (
                    <Card key={card.id}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
                            <div>
                              <CardTitle className="text-base">{card.title || "Без названия"}</CardTitle>
                              <CardDescription>Тип: {card.type}</CardDescription>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="gap-2"
                              onClick={() => generateWithAI(card.id)}
                              disabled={isGenerating === card.id}
                            >
                              {isGenerating === card.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Sparkles className="h-4 w-4" />
                              )}
                              AI
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteCard(card.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                            <Switch
                              checked={card.is_active}
                              onCheckedChange={(checked) => updateCard(card.id, { is_active: checked })}
                            />
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label>Заголовок</Label>
                            <Input
                              value={card.title}
                              onChange={(e) => updateCard(card.id, { title: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Бейдж</Label>
                            <Input
                              value={card.badge || ""}
                              onChange={(e) => updateCard(card.id, { badge: e.target.value })}
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Описание</Label>
                          <Textarea
                            value={card.description}
                            onChange={(e) => updateCard(card.id, { description: e.target.value })}
                          />
                        </div>
                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label>Текст кнопки</Label>
                            <Input
                              value={card.button_text}
                              onChange={(e) => updateCard(card.id, { button_text: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Ссылка кнопки</Label>
                            <Input
                              value={card.button_link}
                              onChange={(e) => updateCard(card.id, { button_link: e.target.value })}
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </AdminLayout>
    </>
  );
};

export default AdminPromoCards;