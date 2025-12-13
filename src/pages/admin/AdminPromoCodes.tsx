import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Tag, Calendar, Percent, DollarSign } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

interface PromoCode {
  id: string;
  code: string;
  discount_percent: number | null;
  discount_amount: number | null;
  min_order_amount: number;
  max_uses: number | null;
  used_count: number;
  is_active: boolean;
  valid_from: string;
  valid_until: string | null;
  created_at: string;
}

const emptyPromo: Omit<PromoCode, "id" | "created_at" | "used_count"> = {
  code: "",
  discount_percent: 10,
  discount_amount: null,
  min_order_amount: 0,
  max_uses: null,
  is_active: true,
  valid_from: new Date().toISOString(),
  valid_until: null,
};

const AdminPromoCodes = () => {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState<PromoCode | null>(null);
  const [formData, setFormData] = useState(emptyPromo);
  const [discountType, setDiscountType] = useState<"percent" | "amount">("percent");

  const { data: promoCodes, isLoading } = useQuery({
    queryKey: ["promo-codes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("promo_codes")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as PromoCode[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData & { id?: string }) => {
      const payload = {
        code: data.code.toUpperCase(),
        discount_percent: discountType === "percent" ? data.discount_percent : null,
        discount_amount: discountType === "amount" ? data.discount_amount : null,
        min_order_amount: data.min_order_amount || 0,
        max_uses: data.max_uses || null,
        is_active: data.is_active,
        valid_from: data.valid_from,
        valid_until: data.valid_until || null,
      };

      if (data.id) {
        const { error } = await supabase
          .from("promo_codes")
          .update(payload)
          .eq("id", data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("promo_codes")
          .insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["promo-codes"] });
      setDialogOpen(false);
      toast.success(editingPromo ? "Промокод обновлён" : "Промокод создан");
    },
    onError: (error: Error) => {
      toast.error("Ошибка: " + error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("promo_codes")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["promo-codes"] });
      toast.success("Промокод удалён");
    },
    onError: (error: Error) => {
      toast.error("Ошибка: " + error.message);
    },
  });

  const openCreate = () => {
    setEditingPromo(null);
    setFormData(emptyPromo);
    setDiscountType("percent");
    setDialogOpen(true);
  };

  const openEdit = (promo: PromoCode) => {
    setEditingPromo(promo);
    setFormData({
      code: promo.code,
      discount_percent: promo.discount_percent,
      discount_amount: promo.discount_amount,
      min_order_amount: promo.min_order_amount,
      max_uses: promo.max_uses,
      is_active: promo.is_active,
      valid_from: promo.valid_from,
      valid_until: promo.valid_until,
    });
    setDiscountType(promo.discount_amount ? "amount" : "percent");
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!formData.code) {
      toast.error("Введите код промокода");
      return;
    }
    saveMutation.mutate(editingPromo ? { ...formData, id: editingPromo.id } : formData);
  };

  const getPromoStatus = (promo: PromoCode) => {
    if (!promo.is_active) return { label: "Неактивен", variant: "secondary" as const };
    const now = new Date();
    if (promo.valid_until && new Date(promo.valid_until) < now) {
      return { label: "Истёк", variant: "destructive" as const };
    }
    if (promo.max_uses && promo.used_count >= promo.max_uses) {
      return { label: "Исчерпан", variant: "destructive" as const };
    }
    return { label: "Активен", variant: "default" as const };
  };

  return (
    <AdminLayout title="Промокоды" description="Управление скидочными кодами">
      <div className="space-y-6">
        <div className="flex items-center justify-end">
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Создать промокод
          </Button>
        </div>

        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Код</TableHead>
                <TableHead>Скидка</TableHead>
                <TableHead>Мин. сумма</TableHead>
                <TableHead>Использований</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead>Срок действия</TableHead>
                <TableHead className="w-[100px]">Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    Загрузка...
                  </TableCell>
                </TableRow>
              ) : !promoCodes?.length ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Промокодов пока нет
                  </TableCell>
                </TableRow>
              ) : (
                promoCodes.map((promo) => {
                  const status = getPromoStatus(promo);
                  return (
                    <TableRow key={promo.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Tag className="h-4 w-4 text-muted-foreground" />
                          <span className="font-mono font-medium">{promo.code}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {promo.discount_percent
                          ? `${promo.discount_percent}%`
                          : `${promo.discount_amount?.toLocaleString()} ₽`}
                      </TableCell>
                      <TableCell>
                        {promo.min_order_amount > 0
                          ? `от ${promo.min_order_amount.toLocaleString()} ₽`
                          : "—"}
                      </TableCell>
                      <TableCell>
                        {promo.used_count}
                        {promo.max_uses && ` / ${promo.max_uses}`}
                      </TableCell>
                      <TableCell>
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {promo.valid_until
                          ? `до ${format(new Date(promo.valid_until), "dd.MM.yyyy", { locale: ru })}`
                          : "Бессрочно"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEdit(promo)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteMutation.mutate(promo.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingPromo ? "Редактировать промокод" : "Новый промокод"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Код промокода</Label>
              <Input
                value={formData.code}
                onChange={(e) =>
                  setFormData({ ...formData, code: e.target.value.toUpperCase() })
                }
                placeholder="BELBIRD10"
                className="font-mono"
              />
            </div>

            <div className="space-y-2">
              <Label>Тип скидки</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={discountType === "percent" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setDiscountType("percent")}
                >
                  <Percent className="h-4 w-4 mr-1" />
                  Процент
                </Button>
                <Button
                  type="button"
                  variant={discountType === "amount" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setDiscountType("amount")}
                >
                  <DollarSign className="h-4 w-4 mr-1" />
                  Сумма
                </Button>
              </div>
            </div>

            {discountType === "percent" ? (
              <div className="space-y-2">
                <Label>Скидка (%)</Label>
                <Input
                  type="number"
                  min="1"
                  max="100"
                  value={formData.discount_percent || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, discount_percent: parseInt(e.target.value) || null })
                  }
                  placeholder="10"
                />
              </div>
            ) : (
              <div className="space-y-2">
                <Label>Скидка (₽)</Label>
                <Input
                  type="number"
                  min="1"
                  value={formData.discount_amount || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, discount_amount: parseFloat(e.target.value) || null })
                  }
                  placeholder="500"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label>Минимальная сумма заказа (₽)</Label>
              <Input
                type="number"
                min="0"
                value={formData.min_order_amount || ""}
                onChange={(e) =>
                  setFormData({ ...formData, min_order_amount: parseFloat(e.target.value) || 0 })
                }
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label>Максимум использований (пусто = без ограничений)</Label>
              <Input
                type="number"
                min="1"
                value={formData.max_uses || ""}
                onChange={(e) =>
                  setFormData({ ...formData, max_uses: parseInt(e.target.value) || null })
                }
                placeholder="100"
              />
            </div>

            <div className="space-y-2">
              <Label>Действует до (пусто = бессрочно)</Label>
              <Input
                type="date"
                value={formData.valid_until?.split("T")[0] || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    valid_until: e.target.value ? new Date(e.target.value).toISOString() : null,
                  })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <Label>Активен</Label>
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, is_active: checked })
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Отмена
            </Button>
            <Button onClick={handleSave} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? "Сохранение..." : "Сохранить"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminPromoCodes;
