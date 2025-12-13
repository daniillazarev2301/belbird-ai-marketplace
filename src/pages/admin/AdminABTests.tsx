import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, FlaskConical, TrendingUp, Eye, MousePointer } from "lucide-react";

interface ABExperiment {
  id: string;
  name: string;
  description: string | null;
  element_selector: string;
  variant_a_content: string;
  variant_b_content: string;
  variant_a_views: number;
  variant_b_views: number;
  variant_a_conversions: number;
  variant_b_conversions: number;
  is_active: boolean;
  created_at: string;
}

const AdminABTests = () => {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingExperiment, setEditingExperiment] = useState<ABExperiment | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    element_selector: "",
    variant_a_content: "",
    variant_b_content: "",
    is_active: true,
  });

  const { data: experiments = [], isLoading } = useQuery({
    queryKey: ["admin-ab-experiments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ab_experiments")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as ABExperiment[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase.from("ab_experiments").insert([data]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-ab-experiments"] });
      toast.success("Эксперимент создан");
      closeDialog();
    },
    onError: () => toast.error("Ошибка создания"),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<typeof formData> }) => {
      const { error } = await supabase.from("ab_experiments").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-ab-experiments"] });
      toast.success("Эксперимент обновлён");
      closeDialog();
    },
    onError: () => toast.error("Ошибка обновления"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("ab_experiments").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-ab-experiments"] });
      toast.success("Эксперимент удалён");
    },
    onError: () => toast.error("Ошибка удаления"),
  });

  const openCreateDialog = () => {
    setEditingExperiment(null);
    setFormData({
      name: "",
      description: "",
      element_selector: "",
      variant_a_content: "",
      variant_b_content: "",
      is_active: true,
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (experiment: ABExperiment) => {
    setEditingExperiment(experiment);
    setFormData({
      name: experiment.name,
      description: experiment.description || "",
      element_selector: experiment.element_selector,
      variant_a_content: experiment.variant_a_content,
      variant_b_content: experiment.variant_b_content,
      is_active: experiment.is_active,
    });
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingExperiment(null);
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.element_selector) {
      toast.error("Заполните обязательные поля");
      return;
    }

    if (editingExperiment) {
      updateMutation.mutate({ id: editingExperiment.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const calculateConversionRate = (views: number, conversions: number) => {
    if (views === 0) return 0;
    return ((conversions / views) * 100).toFixed(1);
  };

  const getWinner = (experiment: ABExperiment) => {
    const rateA = experiment.variant_a_views > 0 
      ? experiment.variant_a_conversions / experiment.variant_a_views 
      : 0;
    const rateB = experiment.variant_b_views > 0 
      ? experiment.variant_b_conversions / experiment.variant_b_views 
      : 0;
    
    if (rateA > rateB && experiment.variant_a_views > 50) return "A";
    if (rateB > rateA && experiment.variant_b_views > 50) return "B";
    return null;
  };

  return (
    <>
      <Helmet>
        <title>A/B Тестирование — Админ</title>
      </Helmet>
      <AdminLayout title="A/B Тестирование">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <FlaskConical className="h-6 w-6" />
                A/B Тестирование
              </h1>
              <p className="text-muted-foreground">
                Тестируйте варианты элементов сайта без разработчика
              </p>
            </div>
            <Button onClick={openCreateDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Новый эксперимент
            </Button>
          </div>

          {experiments.length === 0 && !isLoading ? (
            <Card>
              <CardContent className="py-12 text-center">
                <FlaskConical className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold mb-2">Нет активных экспериментов</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Создайте первый A/B тест для оптимизации конверсии
                </p>
                <Button onClick={openCreateDialog}>Создать эксперимент</Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {experiments.map((experiment) => {
                const winner = getWinner(experiment);
                const totalViews = experiment.variant_a_views + experiment.variant_b_views;
                
                return (
                  <Card key={experiment.id}>
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            {experiment.name}
                            <Badge variant={experiment.is_active ? "default" : "secondary"}>
                              {experiment.is_active ? "Активен" : "Остановлен"}
                            </Badge>
                            {winner && (
                              <Badge variant="outline" className="bg-primary/10">
                                <TrendingUp className="h-3 w-3 mr-1" />
                                Лидер: Вариант {winner}
                              </Badge>
                            )}
                          </CardTitle>
                          {experiment.description && (
                            <CardDescription>{experiment.description}</CardDescription>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(experiment)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteMutation.mutate(experiment.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid md:grid-cols-2 gap-6">
                        {/* Variant A */}
                        <div className={`p-4 rounded-lg border-2 ${winner === "A" ? "border-primary bg-primary/5" : "border-border"}`}>
                          <div className="flex items-center justify-between mb-3">
                            <span className="font-semibold">Вариант A</span>
                            <span className="text-sm text-muted-foreground">
                              {experiment.variant_a_views} просмотров
                            </span>
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm">
                              <Eye className="h-4 w-4 text-muted-foreground" />
                              <span>{experiment.variant_a_views}</span>
                              <MousePointer className="h-4 w-4 text-muted-foreground ml-4" />
                              <span>{experiment.variant_a_conversions}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Progress 
                                value={Number(calculateConversionRate(experiment.variant_a_views, experiment.variant_a_conversions))} 
                                className="flex-1"
                              />
                              <span className="text-sm font-medium w-12 text-right">
                                {calculateConversionRate(experiment.variant_a_views, experiment.variant_a_conversions)}%
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Variant B */}
                        <div className={`p-4 rounded-lg border-2 ${winner === "B" ? "border-primary bg-primary/5" : "border-border"}`}>
                          <div className="flex items-center justify-between mb-3">
                            <span className="font-semibold">Вариант B</span>
                            <span className="text-sm text-muted-foreground">
                              {experiment.variant_b_views} просмотров
                            </span>
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm">
                              <Eye className="h-4 w-4 text-muted-foreground" />
                              <span>{experiment.variant_b_views}</span>
                              <MousePointer className="h-4 w-4 text-muted-foreground ml-4" />
                              <span>{experiment.variant_b_conversions}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Progress 
                                value={Number(calculateConversionRate(experiment.variant_b_views, experiment.variant_b_conversions))} 
                                className="flex-1"
                              />
                              <span className="text-sm font-medium w-12 text-right">
                                {calculateConversionRate(experiment.variant_b_views, experiment.variant_b_conversions)}%
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t text-sm text-muted-foreground">
                        <span>Селектор: </span>
                        <code className="bg-muted px-2 py-0.5 rounded">{experiment.element_selector}</code>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingExperiment ? "Редактировать эксперимент" : "Новый A/B эксперимент"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Название *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Тест кнопки CTA"
                  />
                </div>
                <div className="space-y-2">
                  <Label>CSS Селектор *</Label>
                  <Input
                    value={formData.element_selector}
                    onChange={(e) => setFormData({ ...formData, element_selector: e.target.value })}
                    placeholder="[data-ab='hero-button']"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Описание</Label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Тестируем цвет и текст кнопки"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Вариант A (контроль)</Label>
                  <Textarea
                    value={formData.variant_a_content}
                    onChange={(e) => setFormData({ ...formData, variant_a_content: e.target.value })}
                    placeholder="HTML или текст варианта A"
                    rows={4}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Вариант B (тест)</Label>
                  <Textarea
                    value={formData.variant_b_content}
                    onChange={(e) => setFormData({ ...formData, variant_b_content: e.target.value })}
                    placeholder="HTML или текст варианта B"
                    rows={4}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between pt-2">
                <Label>Активен</Label>
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={closeDialog}>
                Отмена
              </Button>
              <Button onClick={handleSubmit}>
                {editingExperiment ? "Сохранить" : "Создать"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </AdminLayout>
    </>
  );
};

export default AdminABTests;