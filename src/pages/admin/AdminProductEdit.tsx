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
  Plus,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { logAdminActivity } from "@/hooks/useAdminActivityLog";
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
import { CreateBrandDialog } from "@/components/admin/CreateBrandDialog";
import { SpecificationsEditor } from "@/components/admin/SpecificationsEditor";
import { RichContentEditor, RichContentBlock } from "@/components/admin/RichContentEditor";
import { compressMultipleImages, formatFileSize, MEDIA_REQUIREMENTS, validateMediaFile, validateImageDimensions, isVideoFile, countMediaTypes } from "@/utils/imageCompression";

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
  specifications: Record<string, string>;
  rich_content: RichContentBlock[];
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
  const [createBrandOpen, setCreateBrandOpen] = useState(false);
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
    specifications: {},
    rich_content: [],
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
          specifications: (data.specifications as Record<string, string>) || {},
          rich_content: Array.isArray(data.rich_content) ? (data.rich_content as unknown as RichContentBlock[]) : [],
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

  const isVideo = (url: string) => isVideoFile(url);

  const handleMediaUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const currentMedia = countMediaTypes(formData.images);
    const fileArray = Array.from(files);
    
    // Validate files before uploading
    const validFiles: File[] = [];
    const warnings: string[] = [];
    
    for (const file of fileArray) {
      const validation = validateMediaFile(file, currentMedia);
      
      if (!validation.valid) {
        validation.errors.forEach(err => toast.error(`${file.name}: ${err}`));
        continue;
      }
      
      // Check image dimensions
      const dimensionValidation = await validateImageDimensions(file);
      warnings.push(...dimensionValidation.warnings.map(w => `${file.name}: ${w}`));
      
      validFiles.push(file);
      
      // Update count for next iteration
      if (isVideoFile(file.name)) {
        currentMedia.videos++;
      } else {
        currentMedia.images++;
      }
    }
    
    // Show warnings
    warnings.forEach(w => toast.warning(w));
    
    if (validFiles.length === 0) return;
    
    setUploadingImages(true);
    setUploadProgress(0);
    setCompressionInfo(null);
    const newUrls: string[] = [];
    
    try {
      const imageFiles = validFiles.filter(f => !['mp4', 'mov', 'webm'].includes(f.name.split('.').pop()?.toLowerCase() || ''));
      const videoFiles = validFiles.filter(f => ['mp4', 'mov', 'webm'].includes(f.name.split('.').pop()?.toLowerCase() || ''));
      
      let compressedImages: File[] = [];
      if (imageFiles.length > 0) {
        const originalSize = imageFiles.reduce((sum, f) => sum + f.size, 0);
        setCompressionInfo(`Сжатие ${imageFiles.length} изображений...`);
        
        compressedImages = await compressMultipleImages(
          imageFiles,
          { maxSizeMB: 1, maxWidthOrHeight: 1920, initialQuality: MEDIA_REQUIREMENTS.image.quality },
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
        const isVideoUpload = ['mp4', 'mov', 'webm'].includes(fileExt || '');
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `product-${isVideoUpload ? 'videos' : 'images'}/${fileName}`;

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
        specifications: formData.specifications,
        rich_content: JSON.parse(JSON.stringify(formData.rich_content)),
      };

      if (isNew) {
        const { data: newProduct, error } = await supabase.from('products').insert(productData).select('id').single();
        if (error) throw error;
        await logAdminActivity({ action: "create", entityType: "product", entityId: newProduct?.id, details: { name: formData.name } });
        toast.success("Товар создан");
      } else {
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', id);
        if (error) throw error;
        await logAdminActivity({ action: "update", entityType: "product", entityId: id, details: { name: formData.name } });
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

        {/* WB-style Layout: Media Left, Form Right */}
        <div className="grid lg:grid-cols-12 gap-6">
          {/* Left Column - Media */}
          <div className="lg:col-span-5 space-y-4">
            {/* Product Preview Card */}
            {formData.name && (
              <Card className="bg-muted/30">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    {formData.images[0] ? (
                      isVideo(formData.images[0]) ? (
                        <video 
                          src={formData.images[0]} 
                          className="w-12 h-12 object-cover rounded-lg"
                          muted
                          loop
                          autoPlay
                          playsInline
                        />
                      ) : (
                        <img 
                          src={formData.images[0]} 
                          alt={formData.name} 
                          className="w-12 h-12 object-cover rounded-lg"
                        />
                      )
                    ) : (
                      <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                        <Package className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{formData.name || 'Укажите наименование'}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {formData.is_bestseller && <Badge variant="secondary" className="text-[10px] px-1.5"><Flame className="h-2.5 w-2.5 mr-0.5" />Хит</Badge>}
                        {formData.is_new && <Badge variant="secondary" className="text-[10px] px-1.5"><Star className="h-2.5 w-2.5 mr-0.5" />Новинка</Badge>}
                        {formData.is_ai_recommended && <Badge variant="secondary" className="text-[10px] px-1.5"><Bot className="h-2.5 w-2.5 mr-0.5" />AI</Badge>}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Media Upload Area */}
            <Card>
              <CardContent className="p-4">
                <div
                  className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-all"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp,.mp4,.mov"
                    multiple
                    className="hidden"
                    onChange={(e) => handleMediaUpload(e.target.files)}
                  />
                  {uploadingImages ? (
                    <div className="space-y-3">
                      <Loader2 className="h-10 w-10 mx-auto text-primary animate-spin" />
                      <Progress value={uploadProgress} className="w-full max-w-xs mx-auto" />
                      <p className="text-sm text-muted-foreground">{Math.round(uploadProgress)}%</p>
                    </div>
                  ) : (
                    <>
                      <div className="w-16 h-16 mx-auto mb-3 bg-muted rounded-lg flex items-center justify-center">
                        <ImageIcon className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <p className="text-base font-medium mb-1">Загрузите файлы или перетащите их сюда</p>
                      <p className="text-xs text-muted-foreground mb-3">
                        Какими должны быть фото и видео
                      </p>
                      <Button variant="outline" size="sm" type="button">
                        Выбрать
                      </Button>
                    </>
                  )}
                </div>

                {compressionInfo && (
                  <div className="mt-3 text-center text-sm text-green-600 flex items-center justify-center gap-1">
                    <Zap className="h-4 w-4" />
                    {compressionInfo}
                  </div>
                )}

                {/* Media Grid */}
                {formData.images.length > 0 && (
                  <div className="mt-4">
                    <div className="flex items-center gap-3 mb-3 text-sm text-muted-foreground">
                      <span>{imageCount}/{MEDIA_REQUIREMENTS.image.maxCount} фото</span>
                      <span>•</span>
                      <span>{videoCount}/{MEDIA_REQUIREMENTS.video.maxCount} видео</span>
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
                        <div className="grid grid-cols-3 gap-2">
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
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Media Requirements Info */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg border bg-muted/30 text-xs">
                <p className="font-medium mb-2">Требования к фото</p>
                <div className="space-y-1 text-muted-foreground">
                  <p>Формат: JPG, PNG, WEBP</p>
                  <p>Размер: от {MEDIA_REQUIREMENTS.image.minWidth}×{MEDIA_REQUIREMENTS.image.minHeight}px</p>
                  <p>До {MEDIA_REQUIREMENTS.image.maxSizeMB} МБ, до {MEDIA_REQUIREMENTS.image.maxCount} шт</p>
                </div>
              </div>
              <div className="p-3 rounded-lg border bg-muted/30 text-xs">
                <p className="font-medium mb-2">Требования к видео</p>
                <div className="space-y-1 text-muted-foreground">
                  <p>Формат: MP4, MOV</p>
                  <p>До {MEDIA_REQUIREMENTS.video.maxSizeMB} МБ</p>
                  <p>{MEDIA_REQUIREMENTS.video.maxCount} видеообложка</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Form */}
          <div className="lg:col-span-7 space-y-6">
            {/* Main Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
              <TabsList className="w-full">
                <TabsTrigger value="main" className="flex-1 gap-2">
                  <FileText className="h-4 w-4" />
                  Основное
                </TabsTrigger>
                <TabsTrigger value="seo" className="flex-1 gap-2">
                  <Search className="h-4 w-4" />
                  SEO
                </TabsTrigger>
                <TabsTrigger value="settings" className="flex-1 gap-2">
                  <Settings className="h-4 w-4" />
                  Настройки
                </TabsTrigger>
              </TabsList>

              {/* Main Info Tab */}
              <TabsContent value="main" className="space-y-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Основная информация</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Наименование *</Label>
                      <Input
                        value={formData.name}
                        onChange={(e) => handleNameChange(e.target.value)}
                        placeholder="Например: Корм для собак Premium Adult"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Категория продавца</Label>
                        <Select
                          value={formData.category_id}
                          onValueChange={(value) => setFormData(prev => ({ ...prev, category_id: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Выбрать" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((cat) => (
                              <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Артикул продавца</Label>
                        <Input
                          value={formData.sku}
                          onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))}
                          placeholder="DOG-FOOD-001"
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
                          className="gap-1 text-xs"
                        >
                          {generatingDescription ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Sparkles className="h-3 w-3" />
                          )}
                          Сгенерировать
                        </Button>
                      </div>
                      <Textarea
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Подробное описание товара..."
                        rows={4}
                      />
                      <p className="text-xs text-muted-foreground text-right">Без ограничений</p>
                    </div>
                    <div className="space-y-2">
                      <Label>Особенности (для описания)</Label>
                      <Textarea
                        value={featuresText}
                        onChange={(e) => setFeaturesText(e.target.value)}
                        placeholder="Премиум качество&#10;Натуральные ингредиенты"
                        rows={3}
                      />
                      {featuresText && (
                        <div className="flex flex-wrap gap-1.5">
                          {featuresText.split('\n').filter(Boolean).map((feature, i) => (
                            <Badge key={i} variant="outline" className="text-xs">{feature}</Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Specifications Editor */}
                <SpecificationsEditor
                  specifications={formData.specifications}
                  onChange={(specs) => setFormData(prev => ({ ...prev, specifications: specs }))}
                />

                {/* Rich Content Editor */}
                <RichContentEditor
                  blocks={formData.rich_content}
                  onChange={(blocks) => setFormData(prev => ({ ...prev, rich_content: blocks }))}
                  productName={formData.name}
                />

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Цена и наличие
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
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
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₽</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Старая цена</Label>
                        <div className="relative">
                          <Input
                            type="number"
                            value={formData.old_price}
                            onChange={(e) => setFormData(prev => ({ ...prev, old_price: e.target.value }))}
                            placeholder="0"
                            className="pr-8"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₽</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Остаток</Label>
                        <Input
                          type="number"
                          value={formData.stock_count}
                          onChange={(e) => setFormData(prev => ({ ...prev, stock_count: e.target.value }))}
                          placeholder="0"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>URL (slug)</Label>
                        <Input
                          value={formData.slug}
                          onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                          placeholder="korm-dlya-sobak-premium"
                        />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label>Бренд</Label>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setCreateBrandOpen(true)}
                            className="h-6 text-xs gap-1"
                          >
                            <Plus className="h-3 w-3" />
                            Создать
                          </Button>
                        </div>
                        <Select
                          value={formData.brand_id}
                          onValueChange={(value) => setFormData(prev => ({ ...prev, brand_id: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Выбрать бренд" />
                          </SelectTrigger>
                          <SelectContent>
                            {brands.map((brand) => (
                              <SelectItem key={brand.id} value={brand.id}>{brand.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* SEO Tab */}
              <TabsContent value="seo" className="space-y-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center justify-between">
                      <span>SEO-оптимизация</span>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={generateSEO}
                        disabled={generatingSEO}
                        className="gap-1 text-xs"
                      >
                        {generatingSEO ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Sparkles className="h-3 w-3" />
                        )}
                        Сгенерировать
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Meta Title</Label>
                      <Input
                        value={formData.meta_title}
                        onChange={(e) => setFormData(prev => ({ ...prev, meta_title: e.target.value }))}
                        placeholder={formData.name || "Заголовок для поисковиков"}
                        maxLength={60}
                      />
                      <p className="text-xs text-muted-foreground text-right">{formData.meta_title.length}/60</p>
                    </div>
                    <div className="space-y-2">
                      <Label>Meta Description</Label>
                      <Textarea
                        value={formData.meta_description}
                        onChange={(e) => setFormData(prev => ({ ...prev, meta_description: e.target.value }))}
                        placeholder="Краткое описание для поисковой выдачи..."
                        rows={2}
                        maxLength={160}
                      />
                      <p className="text-xs text-muted-foreground text-right">{formData.meta_description.length}/160</p>
                    </div>
                    <Separator />
                    <div>
                      <Label className="mb-2 block text-xs">Предпросмотр в Яндекс</Label>
                      <div className="border rounded-lg p-3 bg-background text-sm">
                        <div className="text-blue-600 hover:underline cursor-pointer truncate">
                          {formData.meta_title || formData.name || "Заголовок товара"}
                        </div>
                        <div className="text-green-700 text-xs truncate">
                          belbird.ru › product › {formData.slug || 'slug'}
                        </div>
                        <div className="text-xs text-muted-foreground line-clamp-2 mt-1">
                          {formData.meta_description || formData.description?.substring(0, 160) || "Описание товара..."}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Settings Tab */}
              <TabsContent value="settings" className="space-y-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Статус и метки</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                      <div>
                        <p className="font-medium text-sm">Активен</p>
                        <p className="text-xs text-muted-foreground">Товар виден в каталоге</p>
                      </div>
                      <Switch
                        checked={formData.is_active}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                      />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center gap-2">
                        <Flame className="h-4 w-4 text-orange-500" />
                        <span className="text-sm">Хит продаж</span>
                      </div>
                      <Switch
                        checked={formData.is_bestseller}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_bestseller: checked }))}
                      />
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center gap-2">
                        <Star className="h-4 w-4 text-green-500" />
                        <span className="text-sm">Новинка</span>
                      </div>
                      <Switch
                        checked={formData.is_new}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_new: checked }))}
                      />
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center gap-2">
                        <Bot className="h-4 w-4 text-purple-500" />
                        <span className="text-sm">AI рекомендация</span>
                      </div>
                      <Switch
                        checked={formData.is_ai_recommended}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_ai_recommended: checked }))}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t">
          <Button variant="outline" onClick={() => navigate('/admin/products')} className="gap-2">
            К списку товаров
          </Button>
          <Button onClick={handleSubmit} disabled={saving} className="gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {isNew ? "Создать и завершить" : "Сохранить изменения"}
          </Button>
        </div>

        {/* Create Brand Dialog */}
        <CreateBrandDialog
          open={createBrandOpen}
          onOpenChange={setCreateBrandOpen}
          onBrandCreated={(newBrand) => {
            setBrands(prev => [...prev, newBrand].sort((a, b) => a.name.localeCompare(b.name)));
            setFormData(prev => ({ ...prev, brand_id: newBrand.id }));
          }}
        />
      </AdminLayout>
    </>
  );
};

export default AdminProductEdit;
