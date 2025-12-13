import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Edit, Trash2, Loader2, RefreshCw, Save, Truck, Package, Settings2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSiteSettings } from "@/hooks/useSiteSettings";

interface DeliveryZone {
  id: string;
  name: string;
  provider: string;
  zone_code: string | null;
  base_cost: number;
  free_threshold: number | null;
  delivery_days_min: number | null;
  delivery_days_max: number | null;
  is_active: boolean;
}

const providers = [
  { value: "cdek", label: "СДЭК" },
  { value: "boxberry", label: "Boxberry" },
  { value: "russian_post", label: "Почта России" },
  { value: "courier", label: "Курьер" },
  { value: "pickup", label: "Самовывоз" },
];

const AdminDelivery = () => {
  const queryClient = useQueryClient();
  const { settings, updateSettings, isLoading: settingsLoading } = useSiteSettings();
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editZone, setEditZone] = useState<DeliveryZone | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    provider: "cdek",
    zone_code: "",
    base_cost: "",
    free_threshold: "",
    delivery_days_min: "",
    delivery_days_max: "",
    is_active: true,
  });

  // Provider settings state
  const [providerSettings, setProviderSettings] = useState({
    cdek_enabled: false,
    cdek_account: "",
    cdek_password: "",
    cdek_test_mode: true,
    boxberry_enabled: false,
    boxberry_token: "",
    boxberry_test_mode: true,
    russian_post_enabled: false,
    russian_post_token: "",
    russian_post_login: "",
    russian_post_password: "",
    russian_post_test_mode: true,
  });

  // Load provider settings
  useEffect(() => {
    if (settings?.delivery_providers) {
      setProviderSettings(settings.delivery_providers);
    }
  }, [settings]);

  const { data: zones = [], isLoading, refetch } = useQuery({
    queryKey: ["admin-delivery-zones"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("delivery_zones")
        .select("*")
        .order("name");

      if (error) throw error;
      return data as DeliveryZone[];
    },
  });

  const createZone = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase.from("delivery_zones").insert({
        name: data.name,
        provider: data.provider,
        zone_code: data.zone_code || null,
        base_cost: parseFloat(data.base_cost) || 0,
        free_threshold: data.free_threshold ? parseFloat(data.free_threshold) : null,
        delivery_days_min: data.delivery_days_min ? parseInt(data.delivery_days_min) : null,
        delivery_days_max: data.delivery_days_max ? parseInt(data.delivery_days_max) : null,
        is_active: data.is_active,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-delivery-zones"] });
      toast.success("Зона доставки создана");
      setDialogOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast.error("Ошибка: " + error.message);
    },
  });

  const updateZone = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const { error } = await supabase
        .from("delivery_zones")
        .update({
          name: data.name,
          provider: data.provider,
          zone_code: data.zone_code || null,
          base_cost: parseFloat(data.base_cost) || 0,
          free_threshold: data.free_threshold ? parseFloat(data.free_threshold) : null,
          delivery_days_min: data.delivery_days_min ? parseInt(data.delivery_days_min) : null,
          delivery_days_max: data.delivery_days_max ? parseInt(data.delivery_days_max) : null,
          is_active: data.is_active,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-delivery-zones"] });
      toast.success("Зона доставки обновлена");
      setDialogOpen(false);
      setEditZone(null);
      resetForm();
    },
    onError: (error: Error) => {
      toast.error("Ошибка: " + error.message);
    },
  });

  const deleteZone = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("delivery_zones").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-delivery-zones"] });
      toast.success("Зона доставки удалена");
    },
    onError: (error: Error) => {
      toast.error("Ошибка: " + error.message);
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      provider: "cdek",
      zone_code: "",
      base_cost: "",
      free_threshold: "",
      delivery_days_min: "",
      delivery_days_max: "",
      is_active: true,
    });
  };

  const openEditDialog = (zone: DeliveryZone) => {
    setEditZone(zone);
    setFormData({
      name: zone.name,
      provider: zone.provider,
      zone_code: zone.zone_code || "",
      base_cost: zone.base_cost.toString(),
      free_threshold: zone.free_threshold?.toString() || "",
      delivery_days_min: zone.delivery_days_min?.toString() || "",
      delivery_days_max: zone.delivery_days_max?.toString() || "",
      is_active: zone.is_active,
    });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.name) {
      toast.error("Введите название зоны");
      return;
    }

    if (editZone) {
      updateZone.mutate({ id: editZone.id, data: formData });
    } else {
      createZone.mutate(formData);
    }
  };

  const getProviderLabel = (provider: string) => {
    return providers.find((p) => p.value === provider)?.label || provider;
  };

  const handleSaveProviderSettings = () => {
    updateSettings.mutate({ key: 'delivery_providers', value: providerSettings });
  };

  return (
    <>
      <Helmet>
        <title>Доставка — BelBird Admin</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <AdminLayout title="Доставка" description="Настройки зон и служб доставки">
        <Tabs defaultValue="zones" className="space-y-6">
          <TabsList>
            <TabsTrigger value="zones" className="gap-2">
              <Package className="h-4 w-4" />
              Зоны доставки
            </TabsTrigger>
            <TabsTrigger value="providers" className="gap-2">
              <Settings2 className="h-4 w-4" />
              Интеграции
            </TabsTrigger>
          </TabsList>

          <TabsContent value="zones">
        {/* Actions */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-muted-foreground" />
            <span className="text-muted-foreground">
              Зон доставки: {zones.length}
            </span>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button
              className="gap-2"
              onClick={() => {
                resetForm();
                setEditZone(null);
                setDialogOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              Добавить зону
            </Button>
          </div>
        </div>

        {/* Zones Table */}
        <div className="rounded-lg border border-border bg-card">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : zones.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-muted-foreground mb-4">Зоны доставки не настроены</p>
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Добавить зону
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Название</TableHead>
                  <TableHead>Служба</TableHead>
                  <TableHead>Стоимость</TableHead>
                  <TableHead>Бесплатно от</TableHead>
                  <TableHead>Срок</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead className="w-24">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {zones.map((zone) => (
                  <TableRow key={zone.id}>
                    <TableCell className="font-medium">{zone.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{getProviderLabel(zone.provider)}</Badge>
                    </TableCell>
                    <TableCell>{zone.base_cost.toLocaleString()} ₽</TableCell>
                    <TableCell>
                      {zone.free_threshold ? `${zone.free_threshold.toLocaleString()} ₽` : "—"}
                    </TableCell>
                    <TableCell>
                      {zone.delivery_days_min && zone.delivery_days_max
                        ? `${zone.delivery_days_min}-${zone.delivery_days_max} дней`
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={zone.is_active ? "default" : "secondary"}>
                        {zone.is_active ? "Активна" : "Отключена"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openEditDialog(zone)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => deleteZone.mutate(zone.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
          </TabsContent>

          {/* Providers Tab */}
          <TabsContent value="providers">
            <div className="space-y-6">
              {/* CDEK */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>СДЭК</CardTitle>
                      <CardDescription>Интеграция с API СДЭК для расчёта стоимости</CardDescription>
                    </div>
                    <Switch
                      checked={providerSettings.cdek_enabled}
                      onCheckedChange={(checked) => setProviderSettings({ ...providerSettings, cdek_enabled: checked })}
                    />
                  </div>
                </CardHeader>
                {providerSettings.cdek_enabled && (
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-2 mb-4">
                      <Switch
                        checked={providerSettings.cdek_test_mode}
                        onCheckedChange={(checked) => setProviderSettings({ ...providerSettings, cdek_test_mode: checked })}
                      />
                      <Label>Тестовый режим</Label>
                      <Badge variant={providerSettings.cdek_test_mode ? "secondary" : "default"}>
                        {providerSettings.cdek_test_mode ? "Тест" : "Боевой"}
                      </Badge>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Account (Идентификатор клиента)</Label>
                        <Input
                          value={providerSettings.cdek_account}
                          onChange={(e) => setProviderSettings({ ...providerSettings, cdek_account: e.target.value })}
                          placeholder="EMscd6r9JnFiQ3bLoyjJY6eM78JrJceI"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Secure password</Label>
                        <Input
                          type="password"
                          value={providerSettings.cdek_password}
                          onChange={(e) => setProviderSettings({ ...providerSettings, cdek_password: e.target.value })}
                          placeholder="••••••••"
                        />
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>

              {/* Boxberry */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Boxberry</CardTitle>
                      <CardDescription>Интеграция с API Boxberry</CardDescription>
                    </div>
                    <Switch
                      checked={providerSettings.boxberry_enabled}
                      onCheckedChange={(checked) => setProviderSettings({ ...providerSettings, boxberry_enabled: checked })}
                    />
                  </div>
                </CardHeader>
                {providerSettings.boxberry_enabled && (
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-2 mb-4">
                      <Switch
                        checked={providerSettings.boxberry_test_mode}
                        onCheckedChange={(checked) => setProviderSettings({ ...providerSettings, boxberry_test_mode: checked })}
                      />
                      <Label>Тестовый режим</Label>
                    </div>
                    <div className="space-y-2">
                      <Label>API Token</Label>
                      <Input
                        type="password"
                        value={providerSettings.boxberry_token}
                        onChange={(e) => setProviderSettings({ ...providerSettings, boxberry_token: e.target.value })}
                        placeholder="Ваш API токен Boxberry"
                      />
                    </div>
                  </CardContent>
                )}
              </Card>

              {/* Russian Post */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Почта России</CardTitle>
                      <CardDescription>Интеграция с API Почты России</CardDescription>
                    </div>
                    <Switch
                      checked={providerSettings.russian_post_enabled}
                      onCheckedChange={(checked) => setProviderSettings({ ...providerSettings, russian_post_enabled: checked })}
                    />
                  </div>
                </CardHeader>
                {providerSettings.russian_post_enabled && (
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-2 mb-4">
                      <Switch
                        checked={providerSettings.russian_post_test_mode}
                        onCheckedChange={(checked) => setProviderSettings({ ...providerSettings, russian_post_test_mode: checked })}
                      />
                      <Label>Тестовый режим</Label>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Логин</Label>
                        <Input
                          value={providerSettings.russian_post_login}
                          onChange={(e) => setProviderSettings({ ...providerSettings, russian_post_login: e.target.value })}
                          placeholder="login@example.com"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Пароль</Label>
                        <Input
                          type="password"
                          value={providerSettings.russian_post_password}
                          onChange={(e) => setProviderSettings({ ...providerSettings, russian_post_password: e.target.value })}
                          placeholder="••••••••"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Access Token</Label>
                      <Input
                        type="password"
                        value={providerSettings.russian_post_token}
                        onChange={(e) => setProviderSettings({ ...providerSettings, russian_post_token: e.target.value })}
                        placeholder="Токен доступа"
                      />
                    </div>
                  </CardContent>
                )}
              </Card>

              <Button onClick={handleSaveProviderSettings} disabled={updateSettings.isPending} className="gap-2">
                {updateSettings.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Сохранить настройки
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        {/* Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editZone ? "Редактировать зону" : "Новая зона доставки"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Название *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Москва и МО"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Служба доставки</Label>
                  <Select
                    value={formData.provider}
                    onValueChange={(value) => setFormData({ ...formData, provider: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {providers.map((p) => (
                        <SelectItem key={p.value} value={p.value}>
                          {p.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Код зоны</Label>
                  <Input
                    value={formData.zone_code}
                    onChange={(e) => setFormData({ ...formData, zone_code: e.target.value })}
                    placeholder="MSK"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Базовая стоимость (₽)</Label>
                  <Input
                    type="number"
                    value={formData.base_cost}
                    onChange={(e) => setFormData({ ...formData, base_cost: e.target.value })}
                    placeholder="300"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Бесплатно от (₽)</Label>
                  <Input
                    type="number"
                    value={formData.free_threshold}
                    onChange={(e) => setFormData({ ...formData, free_threshold: e.target.value })}
                    placeholder="3000"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Срок от (дней)</Label>
                  <Input
                    type="number"
                    value={formData.delivery_days_min}
                    onChange={(e) => setFormData({ ...formData, delivery_days_min: e.target.value })}
                    placeholder="1"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Срок до (дней)</Label>
                  <Input
                    type="number"
                    value={formData.delivery_days_max}
                    onChange={(e) => setFormData({ ...formData, delivery_days_max: e.target.value })}
                    placeholder="3"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label>Активна</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Отмена
              </Button>
              <Button onClick={handleSubmit} className="gap-2">
                <Save className="h-4 w-4" />
                {editZone ? "Сохранить" : "Создать"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </AdminLayout>
    </>
  );
};

export default AdminDelivery;
