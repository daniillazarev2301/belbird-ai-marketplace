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
import { Progress } from "@/components/ui/progress";
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
  Video,
  Star,
  GripVertical,
  Zap,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { SortableMediaItem } from "@/components/admin/SortableMediaItem";
import { compressMultipleImages, formatFileSize } from "@/utils/imageCompression";

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
  is_bestseller: boolean;
  is_new: boolean;
  is_ai_recommended: boolean;
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
  const [uploadProgress, setUploadProgress] = useState(0);
  const [compressionInfo, setCompressionInfo] = useState<string | null>(null);
  const [generatingDescription, setGeneratingDescription] = useState(false);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [brands, setBrands] = useState<{ id: string; name: string }[]>([]);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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
    is_bestseller: false,
    is_new: false,
    is_ai_recommended: false,
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
          is_bestseller: data.is_bestseller ?? false,
          is_new: data.is_new ?? false,
          is_ai_recommended: data.is_ai_recommended ?? false,
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

  const isVideo = (url: string) => {
    const lower = url.toLowerCase();
    return lower.endsWith('.mp4') || lower.endsWith('.webm') || lower.endsWith('.gif') || lower.includes('video');
  };

  const handleMediaUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    setUploadingImages(true);
    setUploadProgress(0);
    setCompressionInfo(null);
    const newUrls: string[] = [];
    const fileArray = Array.from(files);
    
    try {
      // Separate images and videos
      const imageFiles = fileArray.filter(f => !['mp4', 'webm'].includes(f.name.split('.').pop()?.toLowerCase() || ''));
      const videoFiles = fileArray.filter(f => ['mp4', 'webm'].includes(f.name.split('.').pop()?.toLowerCase() || ''));
      
      // Compress images
      let compressedImages: File[] = [];
      if (imageFiles.length > 0) {
        const originalSize = imageFiles.reduce((sum, f) => sum + f.size, 0);
        setCompressionInfo(`Сжатие ${imageFiles.length} изображений...`);
        
        compressedImages = await compressMultipleImages(
          imageFiles,
          { maxSizeMB: 1, maxWidthOrHeight: 1920 },
          (completed, total) => {
            setUploadProgress((completed / total) * 30);
          }
        );
        
        const compressedSize = compressedImages.reduce((sum, f) => sum + f.size, 0);
        const savedPercent = ((1 - compressedSize / originalSize) * 100).toFixed(0);
        setCompressionInfo(`Сжато: ${formatFileSize(originalSize)} → ${formatFileSize(compressedSize)} (−${savedPercent}%)`);
      }
      
      // Combine all files for upload
      const allFiles = [...compressedImages, ...videoFiles];
      const totalFiles = allFiles.length;
      
      for (let i = 0; i < allFiles.length; i++) {
        const file = allFiles[i];
        const fileExt = file.name.split('.').pop()?.toLowerCase();
        const isVideoFile = ['mp4', 'webm'].includes(fileExt || '');
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `product-${isVideoFile ? 'videos' : 'images'}/${fileName}`;

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
        setUploadProgress(30 + ((i + 1) / totalFiles) * 70);
      }

      // Videos go first by default
      const videos = newUrls.filter(url => isVideo(url));
      const images = newUrls.filter(url => !isVideo(url));
      
      setFormData(prev => {
        const existingVideos = prev.images.filter(url => isVideo(url));
        const existingImages = prev.images.filter(url => !isVideo(url));
        return {
          ...prev,
          images: [...existingVideos, ...videos, ...existingImages, ...images],
        };
      });
      toast.success(`Загружено ${newUrls.length} файлов`);
    } catch (error) {
      console.error('Error uploading media:', error);
      toast.error("Ошибка при загрузке файлов");
    } finally {
      setUploadingImages(false);
      setUploadProgress(0);
      setTimeout(() => setCompressionInfo(null), 5000);
    }
  };

  const removeMedia = (url: string) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter(u => u !== url),
    }));
  };

  const setAsMain = (url: string) => {
    setFormData(prev => {
      const filtered = prev.images.filter(u => u !== url);
      return {
        ...prev,
        images: [url, ...filtered],
      };
    });
    toast.success("Установлено как главное");
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      setFormData(prev => {
        const oldIndex = prev.images.indexOf(active.id as string);
        const newIndex = prev.images.indexOf(over.id as string);
        return {
          ...prev,
          images: arrayMove(prev.images, oldIndex, newIndex),
        };
      });
    }
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
        is_bestseller: formData.is_bestseller,
        is_new: formData.is_new,
        is_ai_recommended: formData.is_ai_recommended,
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

            {/* Media (Images & Videos) */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <ImageIcon className="h-4 w-4" />
                  Медиа (фото и видео)
                  {compressionInfo && (
                    <span className="ml-auto text-xs font-normal text-green-600 flex items-center gap-1">
                      <Zap className="h-3 w-3" />
                      {compressionInfo}
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors mb-4"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,video/mp4,video/webm,.gif"
                    multiple
                    className="hidden"
                    onChange={(e) => handleMediaUpload(e.target.files)}
                  />
                  {uploadingImages ? (
                    <div className="space-y-2">
                      <Loader2 className="h-8 w-8 mx-auto text-muted-foreground animate-spin" />
                      <Progress value={uploadProgress} className="w-full max-w-xs mx-auto" />
                      <p className="text-xs text-muted-foreground">{Math.round(uploadProgress)}%</p>
                    </div>
                  ) : (
                    <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  )}
                  <p className="text-sm font-medium">
                    {uploadingImages ? "Загрузка и сжатие..." : "Нажмите для выбора файлов"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    PNG, JPG, WEBP, MP4, WEBM, GIF. Изображения автоматически сжимаются до 1MB.
                  </p>
                </div>

                {formData.images.length > 0 && (
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext
                      items={formData.images}
                      strategy={rectSortingStrategy}
                    >
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                        {formData.images.map((url, index) => (
                          <SortableMediaItem
                            key={url}
                            id={url}
                            url={url}
                            index={index}
                            isVideo={isVideo(url)}
                            onRemove={removeMedia}
                            onSetMain={setAsMain}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                )}

                {formData.images.length === 0 && (
                  <div className="flex items-center justify-center py-8 text-muted-foreground">
                    <ImageIcon className="h-8 w-8 mr-2" />
                    <span className="text-sm">Нет загруженных медиафайлов</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Статус и метки</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Активен</Label>
                  <Switch
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Хит продаж</Label>
                  <Switch
                    checked={formData.is_bestseller}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_bestseller: checked }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Новинка</Label>
                  <Switch
                    checked={formData.is_new}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_new: checked }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>AI рекомендация</Label>
                  <Switch
                    checked={formData.is_ai_recommended}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_ai_recommended: checked }))}
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
