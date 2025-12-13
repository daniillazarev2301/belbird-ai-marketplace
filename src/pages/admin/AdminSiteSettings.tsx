import { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSiteSettings, SettingsKey } from "@/hooks/useSiteSettings";
import { Loader2, Save, Globe, Phone, Share2, Search, Truck, CreditCard, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const AdminSiteSettings = () => {
  const { settings, isLoading, updateSettings } = useSiteSettings();
  
  // Local state for form values
  const [general, setGeneral] = useState({
    site_name: '',
    tagline: '',
    logo_url: '',
    favicon_url: '',
  });
  
  const [contacts, setContacts] = useState({
    phone: '',
    email: '',
    address: '',
    work_hours: '',
  });
  
  const [social, setSocial] = useState({
    vk: '',
    telegram: '',
    whatsapp: '',
    youtube: '',
    rutube: '',
    dzen: '',
  });
  
  const [seo, setSeo] = useState({
    meta_title: '',
    meta_description: '',
    meta_keywords: '',
  });
  
  const [delivery, setDelivery] = useState({
    free_delivery_threshold: 3000,
    delivery_info: '',
    delivery_regions: [] as string[],
  });
  
  const [payment, setPayment] = useState({
    methods: [] as string[],
    installment_available: false,
  });
  
  const [features, setFeatures] = useState({
    show_ai_recommendations: true,
    show_stories: true,
    show_promo_banner: true,
    enable_chat: true,
  });

  // Load settings into local state
  useEffect(() => {
    if (settings) {
      if (settings.general) setGeneral(settings.general);
      if (settings.contacts) setContacts(settings.contacts);
      if (settings.social) setSocial(settings.social);
      if (settings.seo) setSeo(settings.seo);
      if (settings.delivery) setDelivery(settings.delivery);
      if (settings.payment) setPayment(settings.payment);
      if (settings.features) setFeatures(settings.features);
    }
  }, [settings]);

  const handleSave = (key: SettingsKey, value: any) => {
    updateSettings.mutate({ key, value });
  };

  if (isLoading) {
    return (
      <AdminLayout title="Настройки сайта" description="Управление настройками интернет-магазина">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Настройки сайта" description="Управление настройками интернет-магазина">
      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-7 h-auto gap-1">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            <span className="hidden sm:inline">Основные</span>
          </TabsTrigger>
          <TabsTrigger value="contacts" className="flex items-center gap-2">
            <Phone className="h-4 w-4" />
            <span className="hidden sm:inline">Контакты</span>
          </TabsTrigger>
          <TabsTrigger value="social" className="flex items-center gap-2">
            <Share2 className="h-4 w-4" />
            <span className="hidden sm:inline">Соцсети</span>
          </TabsTrigger>
          <TabsTrigger value="seo" className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            <span className="hidden sm:inline">SEO</span>
          </TabsTrigger>
          <TabsTrigger value="delivery" className="flex items-center gap-2">
            <Truck className="h-4 w-4" />
            <span className="hidden sm:inline">Доставка</span>
          </TabsTrigger>
          <TabsTrigger value="payment" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            <span className="hidden sm:inline">Оплата</span>
          </TabsTrigger>
          <TabsTrigger value="features" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            <span className="hidden sm:inline">Функции</span>
          </TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>Основные настройки</CardTitle>
              <CardDescription>Название, логотип и основная информация о магазине</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="site_name">Название сайта</Label>
                  <Input
                    id="site_name"
                    value={general.site_name}
                    onChange={(e) => setGeneral({ ...general, site_name: e.target.value })}
                    placeholder="BelBird"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tagline">Слоган</Label>
                  <Input
                    id="tagline"
                    value={general.tagline}
                    onChange={(e) => setGeneral({ ...general, tagline: e.target.value })}
                    placeholder="Премиальный зоомагазин"
                  />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="logo_url">URL логотипа</Label>
                  <Input
                    id="logo_url"
                    value={general.logo_url}
                    onChange={(e) => setGeneral({ ...general, logo_url: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="favicon_url">URL favicon</Label>
                  <Input
                    id="favicon_url"
                    value={general.favicon_url}
                    onChange={(e) => setGeneral({ ...general, favicon_url: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
              </div>
              <Button onClick={() => handleSave('general', general)} disabled={updateSettings.isPending}>
                {updateSettings.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                Сохранить
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Contacts */}
        <TabsContent value="contacts">
          <Card>
            <CardHeader>
              <CardTitle>Контактная информация</CardTitle>
              <CardDescription>Телефон, email, адрес и часы работы</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="phone">Телефон</Label>
                  <Input
                    id="phone"
                    value={contacts.phone}
                    onChange={(e) => setContacts({ ...contacts, phone: e.target.value })}
                    placeholder="+7 (800) 123-45-67"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={contacts.email}
                    onChange={(e) => setContacts({ ...contacts, email: e.target.value })}
                    placeholder="info@belbird.ru"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Адрес</Label>
                <Input
                  id="address"
                  value={contacts.address}
                  onChange={(e) => setContacts({ ...contacts, address: e.target.value })}
                  placeholder="Москва, ул. Примерная, д. 1"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="work_hours">Часы работы</Label>
                <Input
                  id="work_hours"
                  value={contacts.work_hours}
                  onChange={(e) => setContacts({ ...contacts, work_hours: e.target.value })}
                  placeholder="Пн-Пт: 9:00-21:00, Сб-Вс: 10:00-18:00"
                />
              </div>
              <Button onClick={() => handleSave('contacts', contacts)} disabled={updateSettings.isPending}>
                {updateSettings.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                Сохранить
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Social Networks */}
        <TabsContent value="social">
          <Card>
            <CardHeader>
              <CardTitle>Социальные сети</CardTitle>
              <CardDescription>Ссылки на страницы в социальных сетях</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="vk">ВКонтакте</Label>
                  <Input
                    id="vk"
                    value={social.vk}
                    onChange={(e) => setSocial({ ...social, vk: e.target.value })}
                    placeholder="https://vk.com/..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telegram">Telegram</Label>
                  <Input
                    id="telegram"
                    value={social.telegram}
                    onChange={(e) => setSocial({ ...social, telegram: e.target.value })}
                    placeholder="https://t.me/..."
                  />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="whatsapp">WhatsApp</Label>
                  <Input
                    id="whatsapp"
                    value={social.whatsapp}
                    onChange={(e) => setSocial({ ...social, whatsapp: e.target.value })}
                    placeholder="https://wa.me/..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="youtube">YouTube</Label>
                  <Input
                    id="youtube"
                    value={social.youtube}
                    onChange={(e) => setSocial({ ...social, youtube: e.target.value })}
                    placeholder="https://youtube.com/..."
                  />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="rutube">RuTube</Label>
                  <Input
                    id="rutube"
                    value={social.rutube}
                    onChange={(e) => setSocial({ ...social, rutube: e.target.value })}
                    placeholder="https://rutube.ru/..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dzen">Дзен</Label>
                  <Input
                    id="dzen"
                    value={social.dzen}
                    onChange={(e) => setSocial({ ...social, dzen: e.target.value })}
                    placeholder="https://dzen.ru/..."
                  />
                </div>
              </div>
              <Button onClick={() => handleSave('social', social)} disabled={updateSettings.isPending}>
                {updateSettings.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                Сохранить
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SEO */}
        <TabsContent value="seo">
          <Card>
            <CardHeader>
              <CardTitle>SEO настройки</CardTitle>
              <CardDescription>Мета-теги для поисковых систем (Яндекс, Google)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="meta_title">Meta Title</Label>
                <Input
                  id="meta_title"
                  value={seo.meta_title}
                  onChange={(e) => setSeo({ ...seo, meta_title: e.target.value })}
                  placeholder="BelBird - Премиальный зоомагазин"
                />
                <p className="text-xs text-muted-foreground">Рекомендуется до 60 символов</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="meta_description">Meta Description</Label>
                <Textarea
                  id="meta_description"
                  value={seo.meta_description}
                  onChange={(e) => setSeo({ ...seo, meta_description: e.target.value })}
                  placeholder="Товары для животных, дома и сада с доставкой по России"
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">Рекомендуется до 160 символов</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="meta_keywords">Ключевые слова</Label>
                <Textarea
                  id="meta_keywords"
                  value={seo.meta_keywords}
                  onChange={(e) => setSeo({ ...seo, meta_keywords: e.target.value })}
                  placeholder="зоомагазин, товары для животных, корм для собак"
                  rows={2}
                />
              </div>
              <Button onClick={() => handleSave('seo', seo)} disabled={updateSettings.isPending}>
                {updateSettings.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                Сохранить
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Delivery */}
        <TabsContent value="delivery">
          <Card>
            <CardHeader>
              <CardTitle>Настройки доставки</CardTitle>
              <CardDescription>Условия и регионы доставки</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="free_delivery_threshold">Бесплатная доставка от (₽)</Label>
                  <Input
                    id="free_delivery_threshold"
                    type="number"
                    value={delivery.free_delivery_threshold}
                    onChange={(e) => setDelivery({ ...delivery, free_delivery_threshold: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="delivery_info">Информация о доставке</Label>
                  <Input
                    id="delivery_info"
                    value={delivery.delivery_info}
                    onChange={(e) => setDelivery({ ...delivery, delivery_info: e.target.value })}
                    placeholder="Бесплатная доставка от 3000 ₽"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Регионы доставки</Label>
                <div className="flex flex-wrap gap-2">
                  {delivery.delivery_regions?.map((region, index) => (
                    <Badge key={index} variant="secondary" className="cursor-pointer" onClick={() => {
                      setDelivery({
                        ...delivery,
                        delivery_regions: delivery.delivery_regions.filter((_, i) => i !== index)
                      });
                    }}>
                      {region} ×
                    </Badge>
                  ))}
                </div>
                <Input
                  placeholder="Добавить регион (Enter)"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const value = e.currentTarget.value.trim();
                      if (value && !delivery.delivery_regions?.includes(value)) {
                        setDelivery({
                          ...delivery,
                          delivery_regions: [...(delivery.delivery_regions || []), value]
                        });
                        e.currentTarget.value = '';
                      }
                    }
                  }}
                />
              </div>
              <Button onClick={() => handleSave('delivery', delivery)} disabled={updateSettings.isPending}>
                {updateSettings.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                Сохранить
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payment */}
        <TabsContent value="payment">
          <Card>
            <CardHeader>
              <CardTitle>Способы оплаты</CardTitle>
              <CardDescription>Настройка доступных способов оплаты</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <Label>Доступные способы оплаты</Label>
                <div className="grid gap-3 md:grid-cols-2">
                  {[
                    { id: 'card', label: 'Банковская карта' },
                    { id: 'sbp', label: 'СБП (Система быстрых платежей)' },
                    { id: 'cash', label: 'Наличные при получении' },
                    { id: 'online', label: 'Онлайн-оплата' },
                  ].map((method) => (
                    <div key={method.id} className="flex items-center space-x-2">
                      <Switch
                        id={method.id}
                        checked={payment.methods?.includes(method.id)}
                        onCheckedChange={(checked) => {
                          setPayment({
                            ...payment,
                            methods: checked
                              ? [...(payment.methods || []), method.id]
                              : payment.methods?.filter(m => m !== method.id) || []
                          });
                        }}
                      />
                      <Label htmlFor={method.id}>{method.label}</Label>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="installment"
                  checked={payment.installment_available}
                  onCheckedChange={(checked) => setPayment({ ...payment, installment_available: checked })}
                />
                <Label htmlFor="installment">Доступна рассрочка</Label>
              </div>
              <Button onClick={() => handleSave('payment', payment)} disabled={updateSettings.isPending}>
                {updateSettings.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                Сохранить
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Features */}
        <TabsContent value="features">
          <Card>
            <CardHeader>
              <CardTitle>Функции сайта</CardTitle>
              <CardDescription>Включение и отключение функций магазина</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="ai_recommendations">AI рекомендации</Label>
                    <p className="text-sm text-muted-foreground">Показывать персонализированные рекомендации на основе AI</p>
                  </div>
                  <Switch
                    id="ai_recommendations"
                    checked={features.show_ai_recommendations}
                    onCheckedChange={(checked) => setFeatures({ ...features, show_ai_recommendations: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="stories">BelBird Stories</Label>
                    <p className="text-sm text-muted-foreground">Показывать истории на главной странице</p>
                  </div>
                  <Switch
                    id="stories"
                    checked={features.show_stories}
                    onCheckedChange={(checked) => setFeatures({ ...features, show_stories: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="promo_banner">Промо-баннер</Label>
                    <p className="text-sm text-muted-foreground">Показывать промо-баннер на главной странице</p>
                  </div>
                  <Switch
                    id="promo_banner"
                    checked={features.show_promo_banner}
                    onCheckedChange={(checked) => setFeatures({ ...features, show_promo_banner: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="chat">AI Чат-консультант</Label>
                    <p className="text-sm text-muted-foreground">Показывать виджет AI-консультанта</p>
                  </div>
                  <Switch
                    id="chat"
                    checked={features.enable_chat}
                    onCheckedChange={(checked) => setFeatures({ ...features, enable_chat: checked })}
                  />
                </div>
              </div>
              <Button onClick={() => handleSave('features', features)} disabled={updateSettings.isPending}>
                {updateSettings.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                Сохранить
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AdminLayout>
  );
};

export default AdminSiteSettings;
