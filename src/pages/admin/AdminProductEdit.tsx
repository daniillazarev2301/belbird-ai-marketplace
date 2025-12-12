import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Save,
  ArrowLeft,
  Upload,
  X,
  Loader2,
  Sparkles,
  Image as ImageIcon,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ProductFormData {
  name: string;
  slug: string;
  sku: string;
  description: string;
  price: string;
  old_price: string;
  stock_count: string;
  category_id: string;
  brand_id: string;
  is_active: boolean;
  features: string[];
  images: string[];
}

const AdminProductEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = id === "new";
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [generatingDescription, setGeneratingDescription] = useState(false);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [brands, setBrands] = useState<{ id: string; name: string }[]>([]);

  const [formData, setFormData] = useState<ProductFormData>({
    name: "",
    slug: "",
    sku: "",
    description: "",
    price: "",
    old_price: "",
    stock_count: "0",
    category_id: "",
    brand_id: "",
    is_active: true,
    features: [],
    images: [],
  });

  const [featuresText, setFeaturesText] = useState("");

  useEffect(() => {
    fetchCategoriesAndBrands();
    if (!isNew && id) {
      fetchProduct(id);
    }
  }, [id, isNew]);

  const fetchCategoriesAndBrands = async () => {
    const [categoriesRes, brandsRes] = await Promise.all([
      supabase.from('categories').select('id, name').order('name'),
      supabase.from('brands').select('id, name').order('name'),
    ]);
    
    if (categoriesRes.data) setCategories(categoriesRes.data);
    if (brandsRes.data) setBrands(brandsRes.data);
  };

  const fetchProduct = async (productId: string) => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single();

      if (error) throw error;

      if (data) {
        setFormData({
          name: data.name,
          slug: data.slug,
          sku: data.sku || "",
          description: data.description || "",
          price: data.price.toString(),
          old_price: data.old_price?.toString() || "",
          stock_count: data.stock_count?.toString() || "0",
          category_id: data.category_id || "",
          brand_id: data.brand_id || "",
          is_active: data.is_active ?? true,
          features: data.features || [],
          images: data.images || [],
        });
        setFeaturesText(data.features?.join("\n") || "");
      }
    } catch (error) {
      console.error('Error fetching product:', error);
      toast.error("Ошибка загрузки товара");
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-zа-яё0-9\s-]/gi, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleNameChange = (name: string) => {
    setFormData(prev => ({
      ...prev,
      name,
      slug: prev.slug || generateSlug(name),
    }));
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

      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...newUrls],
      }));
      toast.success(`Загружено ${newUrls.length} изображений`);
    } catch (error) {
      console.error('Error uploading images:', error);
      toast.error("Ошибка при загрузке изображений");
    } finally {
      setUploadingImages(false);
    }
  };

  const removeImage = (url: string) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter(u => u !== url),
    }));
  };

  const generateDescription = async () => {
    if (!formData.name) {
      toast.error("Введите название товара");
      return;
    }

    setGeneratingDescription(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-product-content', {
        body: {
          productName: formData.name,
          category: categories.find(c => c.id === formData.category_id)?.name || "Общее",
          characteristics: featuresText || formData.name,
          tone: 'professional',
          type: 'description'
        }
      });

      if (error) throw error;
      setFormData(prev => ({ ...prev, description: data.content }));
      toast.success("Описание сгенерировано!");
    } catch (error) {
      console.error('Error generating description:', error);
      toast.error("Ошибка при генерации описания");
    } finally {
      setGeneratingDescription(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.slug || !formData.price) {
      toast.error("Заполните обязательные поля");
      return;
    }

    setSaving(true);
    try {
      const productData = {
        name: formData.name,
        slug: formData.slug,
        sku: formData.sku || null,
        description: formData.description || null,
        price: parseFloat(formData.price),
        old_price: formData.old_price ? parseFloat(formData.old_price) : null,
        stock_count: parseInt(formData.stock_count) || 0,
        category_id: formData.category_id || null,
        brand_id: formData.brand_id || null,
        is_active: formData.is_active,
        features: featuresText ? featuresText.split('\n').filter(Boolean) : [],
        images: formData.images,
      };

      if (isNew) {
        const { error } = await supabase.from('products').insert(productData);
        if (error) throw error;
        toast.success("Товар создан");
      } else {
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', id);
        if (error) throw error;
        toast.success("Товар обновлён");
      }

      navigate('/admin/products');
    } catch (error) {
      console.error('Error saving product:', error);
      toast.error("Ошибка при сохранении товара");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout title="Загрузка..." description="">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <>
      <Helmet>
        <title>{isNew ? "Новый товар" : `Редактирование: ${formData.name}`} — BelBird Admin</title>
      </Helmet>
      <AdminLayout 
        title={isNew ? "Новый товар" : "Редактирование товара"} 
        description={isNew ? "Создание нового товара в каталоге" : `Редактирование: ${formData.name}`}
      >
        <div className="mb-6">
          <Button variant="ghost" size="sm" onClick={() => navigate('/admin/products')} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Назад к списку
          </Button>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Основная информация</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Название товара *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="Введите название товара"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>URL (slug) *</Label>
                    <Input
                      value={formData.slug}
                      onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                      placeholder="url-slug"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>SKU</Label>
                    <Input
                      value={formData.sku}
                      onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))}
                      placeholder="ABC-123"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Описание</Label>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={generateDescription}
                      disabled={generatingDescription}
                      className="gap-1"
                    >
                      {generatingDescription ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Sparkles className="h-3 w-3" />
                      )}
                      AI-генерация
                    </Button>
                  </div>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Описание товара..."
                    rows={5}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Характеристики (каждая с новой строки)</Label>
                  <Textarea
                    value={featuresText}
                    onChange={(e) => setFeaturesText(e.target.value)}
                    placeholder="Премиум качество&#10;Натуральные ингредиенты&#10;Подходит для всех пород"
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Images */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Изображения</CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors mb-4"
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
                    <Loader2 className="h-8 w-8 mx-auto mb-2 text-muted-foreground animate-spin" />
                  ) : (
                    <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  )}
                  <p className="text-sm font-medium">
                    {uploadingImages ? "Загрузка..." : "Нажмите для выбора файлов"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    PNG, JPG, WEBP до 10MB
                  </p>
                </div>

                {formData.images.length > 0 && (
                  <div className="grid grid-cols-4 gap-3">
                    {formData.images.map((url, index) => (
                      <div key={index} className="relative group aspect-square">
                        <img
                          src={url}
                          alt={`Product ${index + 1}`}
                          className="w-full h-full object-cover rounded-lg"
                        />
                        <button
                          onClick={() => removeImage(url)}
                          className="absolute top-1 right-1 p-1 rounded-full bg-destructive text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </button>
                        {index === 0 && (
                          <span className="absolute bottom-1 left-1 px-1.5 py-0.5 text-xs bg-primary text-primary-foreground rounded">
                            Главное
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {formData.images.length === 0 && (
                  <div className="flex items-center justify-center py-8 text-muted-foreground">
                    <ImageIcon className="h-8 w-8 mr-2" />
                    <span className="text-sm">Нет загруженных изображений</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Статус</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <Label>Активен</Label>
                  <Switch
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Цена и наличие</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Цена *</Label>
                  <Input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Старая цена</Label>
                  <Input
                    type="number"
                    value={formData.old_price}
                    onChange={(e) => setFormData(prev => ({ ...prev, old_price: e.target.value }))}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Остаток на складе</Label>
                  <Input
                    type="number"
                    value={formData.stock_count}
                    onChange={(e) => setFormData(prev => ({ ...prev, stock_count: e.target.value }))}
                    placeholder="0"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Категория и бренд</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Категория</Label>
                  <Select
                    value={formData.category_id}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, category_id: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите категорию" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Бренд</Label>
                  <Select
                    value={formData.brand_id}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, brand_id: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите бренд" />
                    </SelectTrigger>
                    <SelectContent>
                      {brands.map((brand) => (
                        <SelectItem key={brand.id} value={brand.id}>{brand.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Button onClick={handleSubmit} disabled={saving} className="w-full gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {isNew ? "Создать товар" : "Сохранить изменения"}
            </Button>
          </div>
        </div>
      </AdminLayout>
    </>
  );
};

export default AdminProductEdit;
