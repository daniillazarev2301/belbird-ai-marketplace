import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
  Loader2,
  Sparkles,
  Image as ImageIcon,
  FileText,
  Settings,
  Search,
  Package,
  Zap,
  Eye,
  Tag,
  TrendingUp,
  Star,
  Flame,
  Bot,
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
  meta_title: string;
  meta_description: string;
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
  const [generatingSEO, setGeneratingSEO] = useState(false);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [brands, setBrands] = useState<{ id: string; name: string }[]>([]);
  const [activeTab, setActiveTab] = useState("main");

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
    meta_title: "",
    meta_description: "",
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
          meta_title: "",
          meta_description: "",
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
    const translitMap: Record<string, string> = {
      'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo',
      'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
      'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
      'ф': 'f', 'х': 'h', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'sch', 'ъ': '',
      'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya'
    };
    
    return name
      .toLowerCase()
      .split('')
      .map(char => translitMap[char] || char)
      .join('')
      .replace(/[^a-z0-9\s-]/g, '')
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
      const imageFiles = fileArray.filter(f => !['mp4', 'webm'].includes(f.name.split('.').pop()?.toLowerCase() || ''));
      const videoFiles = fileArray.filter(f => ['mp4', 'webm'].includes(f.name.split('.').pop()?.toLowerCase() || ''));
      
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

  const generateSEO = async () => {
    if (!formData.name) {
      toast.error("Введите название товара");
      return;
    }

    setGeneratingSEO(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-product-content', {
        body: {
          productName: formData.name,
          category: categories.find(c => c.id === formData.category_id)?.name || "Общее",
          characteristics: formData.description || featuresText || formData.name,
          tone: 'professional',
          type: 'seo'
        }
      });

      if (error) throw error;
      
      setFormData(prev => ({ 
        ...prev, 
        meta_title: data.meta_title || formData.name,
        meta_description: data.meta_description || formData.description?.substring(0, 160) || "",
      }));
      toast.success("SEO-теги сгенерированы!");
    } catch (error) {
      console.error('Error generating SEO:', error);
      toast.error("Ошибка при генерации SEO");
    } finally {
      setGeneratingSEO(false);
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

  const videoCount = formData.images.filter(isVideo).length;
  const imageCount = formData.images.length - videoCount;

  return (
    <>
      <Helmet>
        <title>{isNew ? "Новый товар" : `Редактирование: ${formData.name}`} — BelBird Admin</title>
      </Helmet>
      <AdminLayout 
        title={isNew ? "Создание товара" : "Редактирование товара"} 
        description={isNew ? "Добавьте новый товар в каталог" : `Редактирование: ${formData.name}`}
      >
        {/* Top Actions Bar */}
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" size="sm" onClick={() => navigate('/admin/products')} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Назад к списку
          </Button>
          <div className="flex items-center gap-3">
            {!isNew && (
              <Button variant="outline" size="sm" asChild className="gap-2">
                <a href={`/product/${formData.slug}`} target="_blank" rel="noopener noreferrer">
                  <Eye className="h-4 w-4" />
                  Предпросмотр
                </a>
              </Button>
            )}
            <Button onClick={handleSubmit} disabled={saving} className="gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {isNew ? "Создать товар" : "Сохранить"}
            </Button>
          </div>
        </div>

        {/* Product Card Preview */}
        {formData.name && (
          <Card className="mb-6 bg-muted/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                {formData.images[0] ? (
                  isVideo(formData.images[0]) ? (
                    <video 
                      src={formData.images[0]} 
                      className="w-16 h-16 object-cover rounded-lg"
                      muted
                      loop
                      autoPlay
                      playsInline
                    />
                  ) : (
                    <img 
                      src={formData.images[0]} 
                      alt={formData.name} 
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                  )
                ) : (
                  <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                    <Package className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{formData.name}</h3>
                    {formData.is_bestseller && <Badge variant="secondary" className="text-xs"><Flame className="h-3 w-3 mr-1" />Хит</Badge>}
                    {formData.is_new && <Badge variant="secondary" className="text-xs"><Star className="h-3 w-3 mr-1" />Новинка</Badge>}
                    {formData.is_ai_recommended && <Badge variant="secondary" className="text-xs"><Bot className="h-3 w-3 mr-1" />AI</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground">{formData.sku || 'Без артикула'}</p>
                </div>
                <div className="text-right">
                  <div className="font-bold text-lg">{formData.price ? `${parseFloat(formData.price).toLocaleString('ru-RU')} ₽` : '—'}</div>
                  {formData.old_price && (
                    <div className="text-sm text-muted-foreground line-through">
                      {parseFloat(formData.old_price).toLocaleString('ru-RU')} ₽
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="main" className="gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Основное</span>
            </TabsTrigger>
            <TabsTrigger value="media" className="gap-2">
              <ImageIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Медиа</span>
              {formData.images.length > 0 && (
                <Badge variant="secondary" className="ml-1">{formData.images.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="seo" className="gap-2">
              <Search className="h-4 w-4" />
              <span className="hidden sm:inline">SEO</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Настройки</span>
            </TabsTrigger>
          </TabsList>

          {/* Main Info Tab */}
          <TabsContent value="main" className="space-y-6">
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Основная информация</CardTitle>
                    <CardDescription>Название, артикул и описание товара</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Название товара *</Label>
                      <Input
                        value={formData.name}
                        onChange={(e) => handleNameChange(e.target.value)}
                        placeholder="Например: Корм для собак Premium Adult"
                        className="text-lg"
                      />
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>URL (slug) *</Label>
                        <Input
                          value={formData.slug}
                          onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                          placeholder="korm-dlya-sobak-premium"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Артикул (SKU)</Label>
                        <Input
                          value={formData.sku}
                          onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))}
                          placeholder="DOG-FOOD-001"
                        />
                      </div>
                    </div>
                    <Separator />
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Описание товара</Label>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={generateDescription}
                          disabled={generatingDescription}
                          className="gap-2"
                        >
                          {generatingDescription ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Sparkles className="h-4 w-4" />
                          )}
                          Сгенерировать AI
                        </Button>
                      </div>
                      <Textarea
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Подробное описание товара для покупателей..."
                        rows={6}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Характеристики</CardTitle>
                    <CardDescription>Введите каждую характеристику с новой строки</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      value={featuresText}
                      onChange={(e) => setFeaturesText(e.target.value)}
                      placeholder="Премиум качество&#10;Натуральные ингредиенты&#10;Без консервантов&#10;Подходит для всех пород"
                      rows={5}
                    />
                    {featuresText && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {featuresText.split('\n').filter(Boolean).map((feature, i) => (
                          <Badge key={i} variant="outline">{feature}</Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Цена и наличие
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Цена *</Label>
                      <div className="relative">
                        <Input
                          type="number"
                          value={formData.price}
                          onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                          placeholder="0"
                          className="pr-8"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">₽</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Старая цена (зачёркнутая)</Label>
                      <div className="relative">
                        <Input
                          type="number"
                          value={formData.old_price}
                          onChange={(e) => setFormData(prev => ({ ...prev, old_price: e.target.value }))}
                          placeholder="0"
                          className="pr-8"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">₽</span>
                      </div>
                    </div>
                    <Separator />
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
                    <CardTitle className="flex items-center gap-2">
                      <Tag className="h-4 w-4" />
                      Категория и бренд
                    </CardTitle>
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
              </div>
            </div>
          </TabsContent>

          {/* Media Tab */}
          <TabsContent value="media" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <ImageIcon className="h-5 w-5" />
                    Медиафайлы товара
                  </span>
                  {compressionInfo && (
                    <span className="text-sm font-normal text-green-600 flex items-center gap-1">
                      <Zap className="h-4 w-4" />
                      {compressionInfo}
                    </span>
                  )}
                </CardTitle>
                <CardDescription>
                  Загрузите фото и видео товара. Видео автоматически становится главным и воспроизводится при наведении.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div
                  className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-all mb-6"
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
                    <div className="space-y-3">
                      <Loader2 className="h-10 w-10 mx-auto text-primary animate-spin" />
                      <Progress value={uploadProgress} className="w-full max-w-sm mx-auto" />
                      <p className="text-sm text-muted-foreground">{Math.round(uploadProgress)}% — загрузка и сжатие...</p>
                    </div>
                  ) : (
                    <>
                      <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                      <p className="text-base font-medium mb-1">Нажмите для выбора файлов</p>
                      <p className="text-sm text-muted-foreground">
                        PNG, JPG, WEBP, MP4, WEBM, GIF • Изображения автоматически сжимаются до 1MB
                      </p>
                    </>
                  )}
                </div>

                {formData.images.length > 0 ? (
                  <>
                    <div className="flex items-center gap-4 mb-4">
                      <Badge variant="outline" className="gap-1">
                        <ImageIcon className="h-3 w-3" />
                        {imageCount} фото
                      </Badge>
                      {videoCount > 0 && (
                        <Badge variant="outline" className="gap-1">
                          <Eye className="h-3 w-3" />
                          {videoCount} видео
                        </Badge>
                      )}
                      <span className="text-sm text-muted-foreground">
                        Перетаскивайте для изменения порядка. Первый файл — главный.
                      </span>
                    </div>
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={handleDragEnd}
                    >
                      <SortableContext
                        items={formData.images}
                        strategy={rectSortingStrategy}
                      >
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
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
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <ImageIcon className="h-12 w-12 mb-3" />
                    <p className="text-lg font-medium">Нет загруженных медиафайлов</p>
                    <p className="text-sm">Загрузите фото или видео товара</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* SEO Tab */}
          <TabsContent value="seo" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Search className="h-5 w-5" />
                    SEO-оптимизация
                  </span>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={generateSEO}
                    disabled={generatingSEO}
                    className="gap-2"
                  >
                    {generatingSEO ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4" />
                    )}
                    Сгенерировать AI
                  </Button>
                </CardTitle>
                <CardDescription>
                  Настройте мета-теги для лучшего ранжирования в поисковых системах
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Meta Title</Label>
                  <Input
                    value={formData.meta_title}
                    onChange={(e) => setFormData(prev => ({ ...prev, meta_title: e.target.value }))}
                    placeholder={formData.name || "Заголовок страницы для поисковиков"}
                    maxLength={60}
                  />
                  <p className="text-xs text-muted-foreground text-right">
                    {formData.meta_title.length}/60 символов
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Meta Description</Label>
                  <Textarea
                    value={formData.meta_description}
                    onChange={(e) => setFormData(prev => ({ ...prev, meta_description: e.target.value }))}
                    placeholder="Краткое описание товара для поисковой выдачи..."
                    rows={3}
                    maxLength={160}
                  />
                  <p className="text-xs text-muted-foreground text-right">
                    {formData.meta_description.length}/160 символов
                  </p>
                </div>

                <Separator />

                {/* Yandex Preview */}
                <div>
                  <Label className="mb-3 block">Предпросмотр в Яндекс</Label>
                  <div className="border rounded-lg p-4 bg-background">
                    <div className="text-blue-600 text-lg hover:underline cursor-pointer truncate">
                      {formData.meta_title || formData.name || "Заголовок товара"}
                    </div>
                    <div className="text-green-700 text-sm truncate">
                      belbird.ru › product › {formData.slug || 'slug'}
                    </div>
                    <div className="text-sm text-muted-foreground line-clamp-2 mt-1">
                      {formData.meta_description || formData.description?.substring(0, 160) || "Описание товара будет отображаться здесь..."}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Статус публикации</CardTitle>
                  <CardDescription>Управление видимостью товара в каталоге</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
                    <div>
                      <p className="font-medium">Активен</p>
                      <p className="text-sm text-muted-foreground">Товар виден в каталоге</p>
                    </div>
                    <Switch
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Метки товара</CardTitle>
                  <CardDescription>Отображаются на карточке товара</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                        <Flame className="h-4 w-4 text-orange-600" />
                      </div>
                      <div>
                        <p className="font-medium">Хит продаж</p>
                        <p className="text-xs text-muted-foreground">Популярный товар</p>
                      </div>
                    </div>
                    <Switch
                      checked={formData.is_bestseller}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_bestseller: checked }))}
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                        <Star className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium">Новинка</p>
                        <p className="text-xs text-muted-foreground">Новый товар</p>
                      </div>
                    </div>
                    <Switch
                      checked={formData.is_new}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_new: checked }))}
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                        <Bot className="h-4 w-4 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-medium">AI рекомендация</p>
                        <p className="text-xs text-muted-foreground">Рекомендован AI</p>
                      </div>
                    </div>
                    <Switch
                      checked={formData.is_ai_recommended}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_ai_recommended: checked }))}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </AdminLayout>
    </>
  );
};

export default AdminProductEdit;
