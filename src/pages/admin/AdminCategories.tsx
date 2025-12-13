import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  Search,
  ChevronRight,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  GripVertical,
  Loader2,
  RefreshCw,
  Download,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { exportToExcel, formatDataForExport } from "@/utils/exportToExcel";
import { AIGenerateButton } from "@/components/admin/AIGenerateButton";

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  parent_id: string | null;
  sort_order: number | null;
  productCount?: number;
  children?: Category[];
}

const AdminCategories = () => {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editCategory, setEditCategory] = useState<Category | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    parent_id: "",
    image_url: "",
  });

  // Fetch categories with product counts
  const { data: categories = [], isLoading, refetch } = useQuery({
    queryKey: ["admin-categories-tree"],
    queryFn: async () => {
      const { data: cats, error: catsError } = await supabase
        .from("categories")
        .select("*")
        .order("sort_order", { ascending: true });

      if (catsError) throw catsError;

      // Get product counts per category
      const { data: productCounts } = await supabase
        .from("products")
        .select("category_id");

      const countMap: Record<string, number> = {};
      productCounts?.forEach((p) => {
        if (p.category_id) {
          countMap[p.category_id] = (countMap[p.category_id] || 0) + 1;
        }
      });

      // Build tree structure
      const categoriesWithCounts = (cats || []).map((cat) => ({
        ...cat,
        productCount: countMap[cat.id] || 0,
      }));

      // Get root categories (no parent)
      const rootCategories = categoriesWithCounts.filter((c) => !c.parent_id);
      
      // Add children to each root category
      const buildTree = (parent: Category): Category => {
        const children = categoriesWithCounts.filter((c) => c.parent_id === parent.id);
        return {
          ...parent,
          children: children.map(buildTree),
        };
      };

      return rootCategories.map(buildTree);
    },
  });

  // Create category
  const createCategory = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase.from("categories").insert({
        name: data.name,
        slug: data.slug || data.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-zа-я0-9-]/gi, ""),
        description: data.description || null,
        parent_id: data.parent_id || null,
        image_url: data.image_url || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-categories-tree"] });
      toast.success("Категория создана");
      setAddDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error("Ошибка: " + error.message);
    },
  });

  // Update category
  const updateCategory = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const { error } = await supabase
        .from("categories")
        .update({
          name: data.name,
          slug: data.slug,
          description: data.description || null,
          parent_id: data.parent_id || null,
          image_url: data.image_url || null,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-categories-tree"] });
      toast.success("Категория обновлена");
      setEditCategory(null);
      resetForm();
    },
    onError: (error) => {
      toast.error("Ошибка: " + error.message);
    },
  });

  // Delete category
  const deleteCategory = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("categories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-categories-tree"] });
      toast.success("Категория удалена");
    },
    onError: (error) => {
      toast.error("Ошибка: " + error.message);
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      slug: "",
      description: "",
      parent_id: "",
      image_url: "",
    });
  };

  const openEditDialog = (category: Category) => {
    setEditCategory(category);
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description || "",
      parent_id: category.parent_id || "",
      image_url: category.image_url || "",
    });
  };

  const handleSubmit = () => {
    if (!formData.name) {
      toast.error("Введите название категории");
      return;
    }

    if (editCategory) {
      updateCategory.mutate({ id: editCategory.id, data: formData });
    } else {
      createCategory.mutate(formData);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Flatten categories for parent select
  const flattenCategories = (cats: Category[], level = 0): { id: string; name: string; level: number }[] => {
    return cats.flatMap((cat) => [
      { id: cat.id, name: cat.name, level },
      ...flattenCategories(cat.children || [], level + 1),
    ]);
  };
  const flatCategories = flattenCategories(categories);

  // Calculate total products
  const calculateTotalProducts = (cat: Category): number => {
    return (cat.productCount || 0) + (cat.children?.reduce((sum, child) => sum + calculateTotalProducts(child), 0) || 0);
  };

  const handleExport = () => {
    const exportData = formatDataForExport.categories(categories);
    exportToExcel(exportData, `categories-${new Date().toISOString().split('T')[0]}`, 'Категории');
    toast.success('Экспорт завершён');
  };

  const CategoryItem = ({ category, level = 0 }: { category: Category; level?: number }) => {
    const hasChildren = category.children && category.children.length > 0;
    const isExpanded = expandedCategories.has(category.id);
    const totalProducts = calculateTotalProducts(category);

    return (
      <div>
        <div
          className="flex items-center gap-2 p-3 hover:bg-muted/50 transition-colors border-b border-border"
          style={{ paddingLeft: level * 24 + 12 }}
        >
          <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
          {hasChildren ? (
            <button onClick={() => toggleExpand(category.id)} className="p-1">
              <ChevronRight className={`h-4 w-4 transition-transform ${isExpanded ? "rotate-90" : ""}`} />
            </button>
          ) : (
            <div className="w-6" />
          )}
          <span className="flex-1 font-medium text-sm">{category.name}</span>
          <Badge variant="outline" className="text-xs">
            {totalProducts} товаров
          </Badge>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => openEditDialog(category)}>
                <Edit className="h-4 w-4 mr-2" />
                Редактировать
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => window.open(`/catalog/${category.slug}`, "_blank")}>
                <Eye className="h-4 w-4 mr-2" />
                Просмотр
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => deleteCategory.mutate(category.id)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Удалить
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        {hasChildren && isExpanded && (
          <div>
            {category.children!.map((child) => (
              <CategoryItem key={child.id} category={child} level={level + 1} />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <Helmet>
        <title>Категории — BelBird Admin</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <AdminLayout title="Категории" description="Управление структурой каталога">
        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Поиск категорий..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button variant="outline" className="gap-2" onClick={handleExport}>
              <Download className="h-4 w-4" />
              Экспорт
            </Button>
            <Button className="gap-2" onClick={() => setAddDialogOpen(true)}>
              <Plus className="h-4 w-4" />
              Добавить категорию
            </Button>
          </div>
        </div>

        {/* Categories Tree */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : categories.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-muted-foreground mb-4">Категории не найдены</p>
              <Button onClick={() => setAddDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Добавить первую категорию
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Все категории ({categories.length})</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="border-t border-border">
                {categories.map((category) => (
                  <CategoryItem key={category.id} category={category} />
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </AdminLayout>

      {/* Add/Edit Category Dialog */}
      <Dialog open={addDialogOpen || !!editCategory} onOpenChange={(open) => {
        if (!open) {
          setAddDialogOpen(false);
          setEditCategory(null);
          resetForm();
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editCategory ? "Редактировать категорию" : "Добавить категорию"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Название *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Корма для собак"
              />
            </div>
            <div className="space-y-2">
              <Label>Slug (URL)</Label>
              <Input
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder="korma-dlya-sobak"
              />
            </div>
            <div className="space-y-2">
              <Label>Родительская категория</Label>
              <Select
                value={formData.parent_id || "none"}
                onValueChange={(value) => setFormData({ ...formData, parent_id: value === "none" ? "" : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Без родителя (корневая)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Без родителя (корневая)</SelectItem>
                  {flatCategories
                    .filter((c) => c.id !== editCategory?.id)
                    .map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {"—".repeat(cat.level)} {cat.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>URL изображения</Label>
              <Input
                value={formData.image_url}
                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                placeholder="https://..."
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Описание</Label>
                {formData.name && (
                  <AIGenerateButton
                    type="description"
                    context={{ name: formData.name, currentDescription: formData.description }}
                    onGenerated={(result) => {
                      if (result.description) {
                        setFormData({ ...formData, description: result.description });
                      }
                    }}
                  />
                )}
              </div>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Описание категории..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setAddDialogOpen(false);
              setEditCategory(null);
              resetForm();
            }}>
              Отмена
            </Button>
            <Button onClick={handleSubmit} disabled={createCategory.isPending || updateCategory.isPending}>
              {(createCategory.isPending || updateCategory.isPending) && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              {editCategory ? "Сохранить" : "Добавить"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AdminCategories;
