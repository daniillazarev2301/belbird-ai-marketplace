import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import AccountLayout from "@/components/account/AccountLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { MapPin, Plus, Edit, Trash2, Star, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SavedAddress {
  id: string;
  name: string;
  city: string;
  street: string | null;
  house: string | null;
  apartment: string | null;
  postal_code: string | null;
  phone: string | null;
  is_default: boolean;
  provider: string | null;
  pickup_point_id: string | null;
  pickup_point_name: string | null;
  pickup_point_address: string | null;
}

const AccountAddresses = () => {
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<SavedAddress | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    city: "",
    street: "",
    house: "",
    apartment: "",
    postal_code: "",
    phone: "",
    is_default: false,
  });

  const fetchAddresses = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("saved_addresses")
      .select("*")
      .eq("user_id", user.id)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: false });

    if (!error && data) {
      setAddresses(data as SavedAddress[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Необходимо войти в аккаунт");
      setSaving(false);
      return;
    }

    const addressData = {
      ...formData,
      user_id: user.id,
    };

    if (editingAddress) {
      const { error } = await supabase
        .from("saved_addresses")
        .update(addressData)
        .eq("id", editingAddress.id);

      if (error) {
        toast.error("Ошибка сохранения");
      } else {
        toast.success("Адрес обновлён");
      }
    } else {
      const { error } = await supabase
        .from("saved_addresses")
        .insert(addressData);

      if (error) {
        toast.error("Ошибка сохранения");
      } else {
        toast.success("Адрес добавлен");
      }
    }

    setSaving(false);
    setDialogOpen(false);
    setEditingAddress(null);
    resetForm();
    fetchAddresses();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from("saved_addresses")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Ошибка удаления");
    } else {
      toast.success("Адрес удалён");
      fetchAddresses();
    }
  };

  const handleSetDefault = async (id: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Reset all defaults
    await supabase
      .from("saved_addresses")
      .update({ is_default: false })
      .eq("user_id", user.id);

    // Set new default
    await supabase
      .from("saved_addresses")
      .update({ is_default: true })
      .eq("id", id);

    toast.success("Адрес по умолчанию обновлён");
    fetchAddresses();
  };

  const openEditDialog = (address: SavedAddress) => {
    setEditingAddress(address);
    setFormData({
      name: address.name,
      city: address.city,
      street: address.street || "",
      house: address.house || "",
      apartment: address.apartment || "",
      postal_code: address.postal_code || "",
      phone: address.phone || "",
      is_default: address.is_default,
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      city: "",
      street: "",
      house: "",
      apartment: "",
      postal_code: "",
      phone: "",
      is_default: false,
    });
  };

  if (loading) {
    return (
      <AccountLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AccountLayout>
    );
  }

  return (
    <>
      <Helmet>
        <title>Адреса доставки — BelBird</title>
      </Helmet>
      <AccountLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-serif font-semibold">Адреса доставки</h1>
              <p className="text-muted-foreground">Управляйте сохранёнными адресами</p>
            </div>
            <Button
              onClick={() => {
                resetForm();
                setEditingAddress(null);
                setDialogOpen(true);
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Добавить адрес
            </Button>
          </div>

          {addresses.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <MapPin className="h-12 w-12 text-muted-foreground/30 mb-4" />
                <h3 className="text-lg font-medium mb-2">Нет сохранённых адресов</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Добавьте адрес доставки для быстрого оформления заказов
                </p>
                <Button
                  onClick={() => {
                    resetForm();
                    setDialogOpen(true);
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Добавить адрес
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {addresses.map((address) => (
                <Card key={address.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-base">{address.name}</CardTitle>
                        {address.is_default && (
                          <Badge variant="secondary" className="text-xs">
                            <Star className="h-3 w-3 mr-1 fill-current" />
                            Основной
                          </Badge>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openEditDialog(address)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => handleDelete(address.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <p className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <span>
                          {address.city}
                          {address.street && `, ${address.street}`}
                          {address.house && `, д. ${address.house}`}
                          {address.apartment && `, кв. ${address.apartment}`}
                          {address.postal_code && ` (${address.postal_code})`}
                        </span>
                      </p>
                      {address.phone && (
                        <p className="text-muted-foreground pl-6">{address.phone}</p>
                      )}
                      {address.pickup_point_name && (
                        <div className="mt-2 p-2 rounded bg-muted/50">
                          <p className="text-xs text-muted-foreground">Пункт выдачи:</p>
                          <p className="font-medium">{address.pickup_point_name}</p>
                          <p className="text-xs text-muted-foreground">{address.pickup_point_address}</p>
                        </div>
                      )}
                    </div>
                    {!address.is_default && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-4"
                        onClick={() => handleSetDefault(address.id)}
                      >
                        <Star className="h-4 w-4 mr-2" />
                        Сделать основным
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingAddress ? "Редактировать адрес" : "Новый адрес"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Название *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Дом, Работа, Дача..."
                />
              </div>
              <div className="space-y-2">
                <Label>Город *</Label>
                <Input
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="Москва"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Улица</Label>
                  <Input
                    value={formData.street}
                    onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                    placeholder="ул. Пушкина"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Дом</Label>
                  <Input
                    value={formData.house}
                    onChange={(e) => setFormData({ ...formData, house: e.target.value })}
                    placeholder="10"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Квартира</Label>
                  <Input
                    value={formData.apartment}
                    onChange={(e) => setFormData({ ...formData, apartment: e.target.value })}
                    placeholder="25"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Индекс</Label>
                  <Input
                    value={formData.postal_code}
                    onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                    placeholder="101000"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Телефон</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+7 999 123 45 67"
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleSave} disabled={saving || !formData.name || !formData.city}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {editingAddress ? "Сохранить" : "Добавить"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </AccountLayout>
    </>
  );
};

export default AccountAddresses;
