import { useState, useRef } from "react";
import { Helmet } from "react-helmet-async";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Edit,
  Copy,
  Trash2,
  Eye,
  Sparkles,
  Download,
  Upload,
  Image,
  Loader2,
  X,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const products = [
  {
    id: "1",
    sku: "RC-001",
    name: "Royal Canin Indoor для кошек",
    category: "Корма для кошек",
    price: 3290,
    stock: 45,
    status: "active",
    image: "https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=80&h=80&fit=crop",
  },
  {
    id: "2",
    sku: "PB-102",
    name: "Лежанка Premium для собак XL",
    category: "Аксессуары для собак",
    price: 4990,
    stock: 12,
    status: "active",
    image: "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=80&h=80&fit=crop",
  },
  {
    id: "3",
    sku: "SD-203",
    name: "Семена томатов Черри органические",
    category: "Семена",
    price: 590,
    stock: 230,
    status: "active",
    image: "https://images.unsplash.com/photo-1592921870789-04563d55041c?w=80&h=80&fit=crop",
  },
  {
    id: "4",
    sku: "HD-304",
    name: "Свеча ароматическая с эфирными маслами",
    category: "Декор для дома",
    price: 1490,
    stock: 0,
    status: "out_of_stock",
    image: "https://images.unsplash.com/photo-1602607550528-80baf3b9c38a?w=80&h=80&fit=crop",
  },
  {
    id: "5",
    sku: "GD-405",
    name: "Секатор садовый профессиональный",
    category: "Инструменты",
    price: 1290,
    stock: 67,
    status: "active",
    image: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=80&h=80&fit=crop",
  },
  {
    id: "6",
    sku: "PL-506",
    name: "Монстера в декоративном кашпо",
    category: "Комнатные растения",
    price: 2890,
    stock: 8,
    status: "low_stock",
    image: "https://images.unsplash.com/photo-1614594975525-e45190c55d0b?w=80&h=80&fit=crop",
  },
];

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  active: { label: "Активен", variant: "default" },
  low_stock: { label: "Мало", variant: "secondary" },
  out_of_stock: { label: "Нет в наличии", variant: "destructive" },
  draft: { label: "Черновик", variant: "outline" },
};

const AdminProducts = () => {
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [selectedProductForUpload, setSelectedProductForUpload] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleImageUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    setUploadingImages(true);
    const newUrls: string[] = [];

    try {
      for (const file of Array.from(files)) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `product-images/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('products')
          .upload(filePath, file);

        if (uploadError) {
          console.error('Upload error:', uploadError);
          toast.error(`Ошибка загрузки ${file.name}`);
          continue;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('products')
          .getPublicUrl(filePath);

        newUrls.push(publicUrl);
      }

      setUploadedImages(prev => [...prev, ...newUrls]);
      toast.success(`Загружено ${newUrls.length} изображений`);
    } catch (error) {
      console.error('Error uploading images:', error);
      toast.error("Ошибка при загрузке изображений");
    } finally {
      setUploadingImages(false);
    }
  };

  const removeUploadedImage = (url: string) => {
    setUploadedImages(prev => prev.filter(u => u !== url));
  };

  const openUploadDialog = (productId: string) => {
    setSelectedProductForUpload(productId);
    setUploadedImages([]);
    setUploadDialogOpen(true);
  };

  return (
    <>
      <Helmet>
        <title>Товары — BelBird Admin</title>
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
            <Select defaultValue="all">
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Категория" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все категории</SelectItem>
                <SelectItem value="pets">Любимцы</SelectItem>
                <SelectItem value="home">Дом</SelectItem>
                <SelectItem value="garden">Сад</SelectItem>
              </SelectContent>
            </Select>
            <Select defaultValue="all">
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Статус" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все</SelectItem>
                <SelectItem value="active">Активные</SelectItem>
                <SelectItem value="low_stock">Мало</SelectItem>
                <SelectItem value="out_of_stock">Нет в наличии</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Bulk Actions & Add Button */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {selectedProducts.length > 0 && (
              <>
                <span className="text-sm text-muted-foreground">
                  Выбрано: {selectedProducts.length}
                </span>
                <Button variant="outline" size="sm" className="gap-1">
                  <Sparkles className="h-3 w-3" />
                  AI-описания
                </Button>
                <Button variant="outline" size="sm" className="gap-1 text-destructive">
                  <Trash2 className="h-3 w-3" />
                  Удалить
                </Button>
              </>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-1">
              <Download className="h-4 w-4" />
              Экспорт
            </Button>
            <Button variant="outline" size="sm" className="gap-1">
              <Upload className="h-4 w-4" />
              Импорт
            </Button>
            <Button size="sm" className="gap-1">
              <Plus className="h-4 w-4" />
              Добавить товар
            </Button>
          </div>
        </div>

        {/* Products Table */}
        <div className="rounded-lg border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedProducts.length === products.length}
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
              {products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedProducts.includes(product.id)}
                      onCheckedChange={() => toggleProduct(product.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-10 h-10 rounded-lg object-cover"
                      />
                      <span className="font-medium text-sm">{product.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {product.sku}
                  </TableCell>
                  <TableCell className="text-sm">{product.category}</TableCell>
                  <TableCell className="text-right font-medium">
                    {product.price.toLocaleString()} ₽
                  </TableCell>
                  <TableCell className="text-right">{product.stock}</TableCell>
                  <TableCell>
                    <Badge variant={statusConfig[product.status].variant}>
                      {statusConfig[product.status].label}
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
                        <DropdownMenuItem>
                          <Eye className="h-4 w-4 mr-2" />
                          Просмотр
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="h-4 w-4 mr-2" />
                          Редактировать
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openUploadDialog(product.id)}>
                          <Image className="h-4 w-4 mr-2" />
                          Загрузить фото
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Copy className="h-4 w-4 mr-2" />
                          Дублировать
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Sparkles className="h-4 w-4 mr-2" />
                          AI-описание
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Удалить
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-muted-foreground">
            Показано 1-6 из 12,847 товаров
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled>
              Назад
            </Button>
            <Button variant="outline" size="sm">
              Далее
            </Button>
          </div>
        </div>
      </AdminLayout>

      {/* Image Upload Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Загрузка изображений товара</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div
              className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => handleImageUpload(e.target.files)}
              />
              {uploadingImages ? (
                <Loader2 className="h-10 w-10 mx-auto mb-3 text-muted-foreground animate-spin" />
              ) : (
                <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
              )}
              <p className="text-sm font-medium">
                {uploadingImages ? "Загрузка..." : "Нажмите для выбора файлов"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                PNG, JPG, WEBP до 10MB
              </p>
            </div>

            {uploadedImages.length > 0 && (
              <div>
                <Label className="text-sm">Загруженные изображения</Label>
                <div className="grid grid-cols-4 gap-2 mt-2">
                  {uploadedImages.map((url, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={url}
                        alt={`Uploaded ${index + 1}`}
                        className="w-full h-20 object-cover rounded-lg"
                      />
                      <button
                        onClick={() => removeUploadedImage(url)}
                        className="absolute top-1 right-1 p-1 rounded-full bg-destructive text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-4">
              <Button variant="outline" className="flex-1" onClick={() => setUploadDialogOpen(false)}>
                Отмена
              </Button>
              <Button className="flex-1" disabled={uploadedImages.length === 0}>
                Сохранить ({uploadedImages.length})
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AdminProducts;
