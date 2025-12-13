import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  Download,
  Loader2,
  RefreshCw,
  Tags,
  FolderOpen,
  Flame,
  Star,
  Bot,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { exportToExcel, formatDataForExport } from "@/utils/exportToExcel";
import { useRealtimeSubscription } from "@/hooks/useRealtimeSubscription";

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  old_price: number | null;
  images: string[] | null;
  stock_count: number | null;
  rating: number | null;
  is_active: boolean | null;
  is_bestseller: boolean | null;
  is_new: boolean | null;
  is_ai_recommended: boolean | null;
  sku: string | null;
  category_id: string | null;
  brand_id: string | null;
  categories?: { name: string } | null;
  brands?: { name: string } | null;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Brand {
  id: string;
  name: string;
}

interface BulkEditData {
  category_id?: string;
  brand_id?: string;
  is_bestseller?: boolean;
  is_new?: boolean;
  is_ai_recommended?: boolean;
  is_active?: boolean;
}

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  active: { label: "Активен", variant: "default" },
  low_stock: { label: "Мало", variant: "secondary" },
  out_of_stock: { label: "Нет в наличии", variant: "destructive" },
  draft: { label: "Черновик", variant: "outline" },
};

const getProductStatus = (product: Product) => {
  if (!product.is_active) return "draft";
  if ((product.stock_count ?? 0) === 0) return "out_of_stock";
  if ((product.stock_count ?? 0) < 10) return "low_stock";
  return "active";
};

const AdminProducts = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [bulkEditDialogOpen, setBulkEditDialogOpen] = useState(false);
  const [bulkEditData, setBulkEditData] = useState<BulkEditData>({});
  const [bulkEditFields, setBulkEditFields] = useState<Record<string, boolean>>({});

  // Realtime subscription
  useRealtimeSubscription({
    table: "products",
    queryKey: ["admin-products"],
  });

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    price: "",
    old_price: "",
    stock_count: "",
    sku: "",
    category_id: "",
    is_active: true,
    is_bestseller: false,
    is_new: false,
    is_ai_recommended: false,
  });

  // Fetch products
  const { data: products = [], isLoading: productsLoading, refetch } = useQuery({
    queryKey: ["admin-products", searchQuery, categoryFilter, statusFilter],
    queryFn: async () => {
      let query = supabase
        .from("products")
        .select("*, categories(name), brands(name)")
        .order("created_at", { ascending: false });

      if (searchQuery) {
        query = query.or(`name.ilike.%${searchQuery}%,sku.ilike.%${searchQuery}%`);
      }

      if (categoryFilter !== "all") {
        query = query.eq("category_id", categoryFilter);
      }

      const { data, error } = await query;
      if (error) throw error;

      let filtered = data || [];
      if (statusFilter !== "all") {
        filtered = filtered.filter((p) => getProductStatus(p) === statusFilter);
      }

      return filtered as Product[];
    },
  });

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name, slug")
        .order("name");
      if (error) throw error;
      return data as Category[];
    },
  });

  // Fetch brands
  const { data: brands = [] } = useQuery({
    queryKey: ["admin-brands"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("brands")
        .select("id, name")
        .order("name");
      if (error) throw error;
      return data as Brand[];
    },
  });

  // Create product mutation
  const createProduct = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase.from("products").insert({
        name: data.name,
        slug: data.slug || data.name.toLowerCase().replace(/\s+/g, "-"),
        description: data.description || null,
        price: parseFloat(data.price) || 0,
        old_price: data.old_price ? parseFloat(data.old_price) : null,
        stock_count: data.stock_count ? parseInt(data.stock_count) : 0,
        sku: data.sku || null,
        category_id: data.category_id || null,
        is_active: data.is_active,
        is_bestseller: data.is_bestseller,
        is_new: data.is_new,
        is_ai_recommended: data.is_ai_recommended,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      toast.success("Товар успешно добавлен");
      setAddDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error("Ошибка при добавлении товара: " + error.message);
    },
  });

  const updateProduct = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const { error } = await supabase
        .from("products")
        .update({
          name: data.name,
          slug: data.slug,
          description: data.description || null,
          price: parseFloat(data.price) || 0,
          old_price: data.old_price ? parseFloat(data.old_price) : null,
          stock_count: data.stock_count ? parseInt(data.stock_count) : 0,
          sku: data.sku || null,
          category_id: data.category_id || null,
          is_active: data.is_active,
          is_bestseller: data.is_bestseller,
          is_new: data.is_new,
          is_ai_recommended: data.is_ai_recommended,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      toast.success("Товар успешно обновлён");
      setEditProduct(null);
      resetForm();
    },
    onError: (error) => {
      toast.error("Ошибка при обновлении товара: " + error.message);
    },
  });

  // Delete product mutation
  const deleteProduct = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      toast.success("Товар удалён");
    },
    onError: (error) => {
      toast.error("Ошибка при удалении: " + error.message);
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      slug: "",
      description: "",
      price: "",
      old_price: "",
      stock_count: "",
      sku: "",
      category_id: "",
      is_active: true,
      is_bestseller: false,
      is_new: false,
      is_ai_recommended: false,
    });
  };

  const openEditDialog = (product: Product) => {
    setEditProduct(product);
    setFormData({
      name: product.name,
      slug: product.slug,
      description: product.description || "",
      price: product.price.toString(),
      old_price: product.old_price?.toString() || "",
      stock_count: product.stock_count?.toString() || "",
      sku: product.sku || "",
      category_id: product.category_id || "",
      is_active: product.is_active ?? true,
      is_bestseller: product.is_bestseller ?? false,
      is_new: product.is_new ?? false,
      is_ai_recommended: product.is_ai_recommended ?? false,
    });
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.price) {
      toast.error("Заполните название и цену");
      return;
    }

    if (editProduct) {
      updateProduct.mutate({ id: editProduct.id, data: formData });
    } else {
      createProduct.mutate(formData);
    }
  };

  const toggleAll = () => {
    if (selectedProducts.length === products.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(products.map((p) => p.id));
    }
  };

  const toggleProduct = (id: string) => {
    setSelectedProducts((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const handleDeleteSelected = async () => {
    if (selectedProducts.length === 0) return;
    
    try {
      const { error } = await supabase
        .from("products")
        .delete()
        .in("id", selectedProducts);
      
      if (error) throw error;
      
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      toast.success(`Удалено ${selectedProducts.length} товаров`);
      setSelectedProducts([]);
    } catch (error: any) {
      toast.error("Ошибка при удалении: " + error.message);
    }
  };

  // Bulk update mutation
  const bulkUpdateProducts = useMutation({
    mutationFn: async (data: BulkEditData) => {
      const updateData: Record<string, any> = {};
      
      if (bulkEditFields.category_id && data.category_id !== undefined) {
        updateData.category_id = data.category_id || null;
      }
      if (bulkEditFields.brand_id && data.brand_id !== undefined) {
        updateData.brand_id = data.brand_id || null;
      }
      if (bulkEditFields.is_bestseller) {
        updateData.is_bestseller = data.is_bestseller ?? false;
      }
      if (bulkEditFields.is_new) {
        updateData.is_new = data.is_new ?? false;
      }
      if (bulkEditFields.is_ai_recommended) {
        updateData.is_ai_recommended = data.is_ai_recommended ?? false;
      }
      if (bulkEditFields.is_active) {
        updateData.is_active = data.is_active ?? true;
      }

      if (Object.keys(updateData).length === 0) {
        throw new Error("Выберите поля для изменения");
      }

      const { error } = await supabase
        .from("products")
        .update(updateData)
        .in("id", selectedProducts);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      toast.success(`Обновлено ${selectedProducts.length} товаров`);
      setBulkEditDialogOpen(false);
      setBulkEditData({});
      setBulkEditFields({});
      setSelectedProducts([]);
    },
    onError: (error: any) => {
      toast.error("Ошибка: " + error.message);
    },
  });

  const openBulkEditDialog = () => {
    setBulkEditData({});
    setBulkEditFields({});
    setBulkEditDialogOpen(true);
  };

  return (
    <>
      <Helmet>
        <title>Товары — BelBird Admin</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <AdminLayout title="Товары" description="Управление каталогом товаров">
        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Поиск по названию, SKU..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Категория" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все категории</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Статус" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все</SelectItem>
                <SelectItem value="active">Активные</SelectItem>
                <SelectItem value="low_stock">Мало</SelectItem>
                <SelectItem value="out_of_stock">Нет в наличии</SelectItem>
                <SelectItem value="draft">Черновик</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Bulk Actions & Add Button */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 flex-wrap">
            {selectedProducts.length > 0 && (
              <>
                <Badge variant="secondary" className="text-sm">
                  Выбрано: {selectedProducts.length}
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1"
                  onClick={openBulkEditDialog}
                >
                  <Tags className="h-3 w-3" />
                  Массовое редактирование
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1 text-destructive hover:text-destructive"
                  onClick={handleDeleteSelected}
                >
                  <Trash2 className="h-3 w-3" />
                  Удалить
                </Button>
              </>
            )}
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-1"
              onClick={() => {
                const exportData = formatDataForExport.products(products);
                exportToExcel(exportData, `products-${new Date().toISOString().split('T')[0]}`, 'Товары');
                toast.success('Экспорт завершён');
              }}
            >
              <Download className="h-4 w-4" />
              Экспорт
            </Button>
            <Button size="sm" className="gap-1" onClick={() => setAddDialogOpen(true)}>
              <Plus className="h-4 w-4" />
              Добавить товар
            </Button>
          </div>
        </div>

        {/* Products Table */}
        <div className="rounded-lg border border-border bg-card">
          {productsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-muted-foreground mb-4">Товары не найдены</p>
              <Button onClick={() => setAddDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Добавить первый товар
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedProducts.length === products.length && products.length > 0}
                      onCheckedChange={toggleAll}
                    />
                  </TableHead>
                  <TableHead>Товар</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Категория</TableHead>
                  <TableHead className="text-right">Цена</TableHead>
                  <TableHead className="text-right">Остаток</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => {
                  const status = getProductStatus(product);
                  return (
                    <TableRow key={product.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedProducts.includes(product.id)}
                          onCheckedChange={() => toggleProduct(product.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {product.images?.[0] ? (
                            <img
                              src={product.images[0]}
                              alt={product.name}
                              className="w-10 h-10 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-xs text-muted-foreground">
                              Нет
                            </div>
                          )}
                          <div>
                            <span className="font-medium text-sm line-clamp-1">{product.name}</span>
                            <div className="flex gap-1 mt-1">
                              {product.is_bestseller && (
                                <Badge variant="secondary" className="text-[10px] px-1 py-0">Хит</Badge>
                              )}
                              {product.is_new && (
                                <Badge variant="outline" className="text-[10px] px-1 py-0">Новинка</Badge>
                              )}
                              {product.is_ai_recommended && (
                                <Badge className="text-[10px] px-1 py-0 bg-primary/20 text-primary border-0">AI</Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {product.sku || "—"}
                      </TableCell>
                      <TableCell className="text-sm">
                        {product.categories?.name || "—"}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {product.price.toLocaleString()} ₽
                      </TableCell>
                      <TableCell className="text-right">{product.stock_count ?? 0}</TableCell>
                      <TableCell>
                        <Badge variant={statusConfig[status].variant}>
                          {statusConfig[status].label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEditDialog(product)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Редактировать
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => navigate(`/product/${product.slug}`)}>
                              <Eye className="h-4 w-4 mr-2" />
                              Просмотр
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => deleteProduct.mutate(product.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Удалить
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>

        {/* Pagination */}
        {products.length > 0 && (
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-muted-foreground">
              Показано {products.length} товаров
            </p>
          </div>
        )}
      </AdminLayout>

      {/* Add/Edit Product Dialog */}
      <Dialog open={addDialogOpen || !!editProduct} onOpenChange={(open) => {
        if (!open) {
          setAddDialogOpen(false);
          setEditProduct(null);
          resetForm();
        }
      }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editProduct ? "Редактировать товар" : "Добавить товар"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Название *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Корм для собак"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Цена *</Label>
                <Input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="1990"
                />
              </div>
              <div className="space-y-2">
                <Label>Старая цена</Label>
                <Input
                  type="number"
                  value={formData.old_price}
                  onChange={(e) => setFormData({ ...formData, old_price: e.target.value })}
                  placeholder="2490"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>SKU</Label>
                <Input
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  placeholder="RC-001"
                />
              </div>
              <div className="space-y-2">
                <Label>Остаток</Label>
                <Input
                  type="number"
                  value={formData.stock_count}
                  onChange={(e) => setFormData({ ...formData, stock_count: e.target.value })}
                  placeholder="100"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Категория</Label>
              <Select
                value={formData.category_id}
                onValueChange={(value) => setFormData({ ...formData, category_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Выберите категорию" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Slug (URL)</Label>
              <Input
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder="korm-dlya-sobak"
              />
            </div>
            <div className="space-y-2">
              <Label>Описание</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Описание товара..."
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: !!checked })}
                />
                <Label>Активен</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={formData.is_bestseller}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_bestseller: !!checked })}
                />
                <Label>Хит продаж</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={formData.is_new}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_new: !!checked })}
                />
                <Label>Новинка</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={formData.is_ai_recommended}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_ai_recommended: !!checked })}
                />
                <Label>AI рекомендация</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setAddDialogOpen(false);
              setEditProduct(null);
              resetForm();
            }}>
              Отмена
            </Button>
            <Button onClick={handleSubmit} disabled={createProduct.isPending || updateProduct.isPending}>
              {(createProduct.isPending || updateProduct.isPending) && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              {editProduct ? "Сохранить" : "Добавить"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Edit Dialog */}
      <Dialog open={bulkEditDialogOpen} onOpenChange={setBulkEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Tags className="h-5 w-5" />
              Массовое редактирование
            </DialogTitle>
            <DialogDescription>
              Изменения будут применены к {selectedProducts.length} выбранным товарам.
              Выберите поля, которые хотите изменить.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Category */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="bulk-category"
                  checked={bulkEditFields.category_id || false}
                  onCheckedChange={(checked) => setBulkEditFields(prev => ({ ...prev, category_id: !!checked }))}
                />
                <Label htmlFor="bulk-category" className="flex items-center gap-2">
                  <FolderOpen className="h-4 w-4" />
                  Категория
                </Label>
              </div>
              {bulkEditFields.category_id && (
                <Select
                  value={bulkEditData.category_id || ""}
                  onValueChange={(value) => setBulkEditData(prev => ({ ...prev, category_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите категорию" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Без категории</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <Separator />

            {/* Brand */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="bulk-brand"
                  checked={bulkEditFields.brand_id || false}
                  onCheckedChange={(checked) => setBulkEditFields(prev => ({ ...prev, brand_id: !!checked }))}
                />
                <Label htmlFor="bulk-brand" className="flex items-center gap-2">
                  <Tags className="h-4 w-4" />
                  Бренд
                </Label>
              </div>
              {bulkEditFields.brand_id && (
                <Select
                  value={bulkEditData.brand_id || ""}
                  onValueChange={(value) => setBulkEditData(prev => ({ ...prev, brand_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите бренд" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Без бренда</SelectItem>
                    {brands.map((brand) => (
                      <SelectItem key={brand.id} value={brand.id}>{brand.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <Separator />

            {/* Labels */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Метки товаров</Label>
              
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="bulk-bestseller-enable"
                    checked={bulkEditFields.is_bestseller || false}
                    onCheckedChange={(checked) => setBulkEditFields(prev => ({ ...prev, is_bestseller: !!checked }))}
                  />
                  <Label htmlFor="bulk-bestseller-enable" className="flex items-center gap-2">
                    <Flame className="h-4 w-4 text-orange-500" />
                    Хит продаж
                  </Label>
                </div>
                {bulkEditFields.is_bestseller && (
                  <Switch
                    checked={bulkEditData.is_bestseller || false}
                    onCheckedChange={(checked) => setBulkEditData(prev => ({ ...prev, is_bestseller: checked }))}
                  />
                )}
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="bulk-new-enable"
                    checked={bulkEditFields.is_new || false}
                    onCheckedChange={(checked) => setBulkEditFields(prev => ({ ...prev, is_new: !!checked }))}
                  />
                  <Label htmlFor="bulk-new-enable" className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-green-500" />
                    Новинка
                  </Label>
                </div>
                {bulkEditFields.is_new && (
                  <Switch
                    checked={bulkEditData.is_new || false}
                    onCheckedChange={(checked) => setBulkEditData(prev => ({ ...prev, is_new: checked }))}
                  />
                )}
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="bulk-ai-enable"
                    checked={bulkEditFields.is_ai_recommended || false}
                    onCheckedChange={(checked) => setBulkEditFields(prev => ({ ...prev, is_ai_recommended: !!checked }))}
                  />
                  <Label htmlFor="bulk-ai-enable" className="flex items-center gap-2">
                    <Bot className="h-4 w-4 text-purple-500" />
                    AI рекомендация
                  </Label>
                </div>
                {bulkEditFields.is_ai_recommended && (
                  <Switch
                    checked={bulkEditData.is_ai_recommended || false}
                    onCheckedChange={(checked) => setBulkEditData(prev => ({ ...prev, is_ai_recommended: checked }))}
                  />
                )}
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="bulk-active-enable"
                    checked={bulkEditFields.is_active || false}
                    onCheckedChange={(checked) => setBulkEditFields(prev => ({ ...prev, is_active: !!checked }))}
                  />
                  <Label htmlFor="bulk-active-enable" className="flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    Активен (виден в каталоге)
                  </Label>
                </div>
                {bulkEditFields.is_active && (
                  <Switch
                    checked={bulkEditData.is_active ?? true}
                    onCheckedChange={(checked) => setBulkEditData(prev => ({ ...prev, is_active: checked }))}
                  />
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkEditDialogOpen(false)}>
              Отмена
            </Button>
            <Button 
              onClick={() => bulkUpdateProducts.mutate(bulkEditData)}
              disabled={bulkUpdateProducts.isPending || !Object.values(bulkEditFields).some(Boolean)}
            >
              {bulkUpdateProducts.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Применить к {selectedProducts.length} товарам
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AdminProducts;