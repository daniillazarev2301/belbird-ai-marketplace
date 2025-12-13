import { useState, useEffect } from "react";
import { MapPin, Plus, Check, Trash2, Edit, Loader2, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

interface SavedAddressesProps {
  onSelect: (address: SavedAddress) => void;
  selectedAddressId?: string;
}

const SavedAddresses = ({ onSelect, selectedAddressId }: SavedAddressesProps) => {
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
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Home className="h-5 w-5 text-muted-foreground" />
          <h3 className="font-medium">Сохранённые адреса</h3>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            resetForm();
            setEditingAddress(null);
            setDialogOpen(true);
          }}
        >
          <Plus className="h-4 w-4 mr-1" />
          Добавить
        </Button>
      </div>

      {addresses.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          Нет сохранённых адресов
        </p>
      ) : (
        <div className="grid gap-2">
          {addresses.map((address) => (
            <Card
              key={address.id}
              className={`cursor-pointer transition-colors ${
                selectedAddressId === address.id
                  ? "border-primary bg-primary/5"
                  : "hover:border-primary/50"
              }`}
              onClick={() => onSelect(address)}
            >
              <CardContent className="p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {selectedAddressId === address.id && (
                        <Check className="h-4 w-4 text-primary flex-shrink-0" />
                      )}
                      <span className="font-medium">{address.name}</span>
                      {address.is_default && (
                        <Badge variant="secondary" className="text-xs">
                          По умолчанию
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                      {address.city}
                      {address.street && `, ${address.street}`}
                      {address.house && `, д. ${address.house}`}
                      {address.apartment && `, кв. ${address.apartment}`}
                    </p>
                    {address.pickup_point_name && (
                      <p className="text-xs text-primary mt-1">
                        <MapPin className="h-3 w-3 inline mr-1" />
                        {address.pickup_point_name}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditDialog(address);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(address.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

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
          <DialogFooter className="gap-2">
            {editingAddress && !editingAddress.is_default && (
              <Button
                variant="outline"
                onClick={() => {
                  handleSetDefault(editingAddress.id);
                  setDialogOpen(false);
                }}
              >
                Сделать основным
              </Button>
            )}
            <Button onClick={handleSave} disabled={saving || !formData.name || !formData.city}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {editingAddress ? "Сохранить" : "Добавить"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SavedAddresses;
