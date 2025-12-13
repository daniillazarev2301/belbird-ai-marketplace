import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { 
  ChevronLeft, ChevronRight, Heart, Share2, ShoppingCart, Truck, Shield, RotateCcw, 
  Star, MessageSquare, Plus, Minus, Check, Clock, ArrowLeft, Package, RefreshCw, Box
} from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import MobileNav from "@/components/layout/MobileNav";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/contexts/CartContext";
import { ReviewForm } from "@/components/product/ReviewForm";
import { ReviewList } from "@/components/product/ReviewList";
import { RichContentDisplay } from "@/components/product/RichContentDisplay";
import { RelatedProducts } from "@/components/product/RelatedProducts";
import Product3DViewer from "@/components/product/Product3DViewer";

interface RichContentBlock {
  id: string;
  type: "text" | "image" | "video" | "heading" | "features";
  content: string;
  title?: string;
  items?: string[];
}

interface ProductData {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  old_price?: number;
  images: string[];
  features: string[];
  rating: number;
  review_count: number;
  stock_count: number;
  sku?: string;
  specifications?: Record<string, string>;
  rich_content?: unknown;
  category_id?: string;
  brand_id?: string;
  model_3d_url?: string;
  brand?: { name: string; slug: string };
  category?: { name: string; slug: string };
}

const Product = () => {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const { addItem } = useCart();
  const [product, setProduct] = useState<ProductData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImage, setCurrentImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isFavorite, setIsFavorite] = useState(false);
  const [show3DViewer, setShow3DViewer] = useState(false);
  const [subscriptionDialogOpen, setSubscriptionDialogOpen] = useState(false);
  const [subscriptionFrequency, setSubscriptionFrequency] = useState("30");
  const [isCreatingSubscription, setIsCreatingSubscription] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    loadProduct();
    checkFavoriteStatus();
  }, [id]);

  // Check if user is authenticated and if product is in favorites
  const checkFavoriteStatus = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUserId(user?.id || null);
    
    if (user && id) {
      // First try to get product by slug
      const { data: productData } = await supabase
        .from("products")
        .select("id")
        .eq("slug", id)
        .single();
      
      const productId = productData?.id || id;
      
      const { data } = await supabase
        .from("favorites")
        .select("id")
        .eq("user_id", user.id)
        .eq("product_id", productId)
        .maybeSingle();
      
      setIsFavorite(!!data);
    }
  };

  // Record product view
  const recordProductView = async (productId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    const sessionId = localStorage.getItem("session_id") || crypto.randomUUID();
    localStorage.setItem("session_id", sessionId);

    await supabase.from("product_views").insert({
      product_id: productId,
      user_id: user?.id || null,
      session_id: user ? null : sessionId
    });
  };

  const loadProduct = async () => {
    if (!id) return;
    
    setLoading(true);
    
    let query = supabase
      .from("products")
      .select(`
        id, name, slug, description, price, old_price, images, features, rating, review_count, stock_count, sku, specifications, rich_content, category_id, brand_id, model_3d_url,
        brand:brands(name, slug),
        category:categories(name, slug)
      `)
      .eq("slug", id)
      .single();

    let { data, error } = await query;

    if (error && id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      const result = await supabase
        .from("products")
        .select(`
          id, name, slug, description, price, old_price, images, features, rating, review_count, stock_count, sku, specifications, rich_content, category_id, brand_id, model_3d_url,
          brand:brands(name, slug),
          category:categories(name, slug)
        `)
        .eq("id", id)
        .single();
      
      data = result.data;
      error = result.error;
    }

    if (error) {
      console.error("Error loading product:", error);
    } else {
      setProduct(data as ProductData);
      // Record product view
      if (data?.id) {
        recordProductView(data.id);
      }
    }
    setLoading(false);
  };

  const nextImage = () => {
    if (product?.images) {
      setCurrentImage((prev) => (prev + 1) % product.images.length);
    }
  };
  
  const prevImage = () => {
    if (product?.images) {
      setCurrentImage((prev) => (prev - 1 + product.images.length) % product.images.length);
    }
  };

  const addToCart = () => {
    if (!product) return;
    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      oldPrice: product.old_price,
      quantity: quantity,
      image: product.images?.[0] || "/placeholder.svg",
      slug: product.slug,
    });
    toast({
      title: "Добавлено в корзину",
      description: `${product.name} (${quantity} шт.)`,
    });
  };

  const toggleFavorite = async () => {
    if (!userId) {
      toast({
        title: "Требуется авторизация",
        description: "Войдите в аккаунт, чтобы добавить в избранное",
        variant: "destructive"
      });
      return;
    }

    if (!product) return;

    try {
      if (isFavorite) {
        await supabase
          .from("favorites")
          .delete()
          .eq("user_id", userId)
          .eq("product_id", product.id);
        setIsFavorite(false);
        toast({ title: "Удалено из избранного" });
      } else {
        await supabase
          .from("favorites")
          .insert({ user_id: userId, product_id: product.id });
        setIsFavorite(true);
        toast({ title: "Добавлено в избранное" });
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось обновить избранное",
        variant: "destructive"
      });
    }
  };

  const createSubscription = async () => {
    if (!product) return;
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: "Требуется авторизация",
        description: "Войдите в аккаунт, чтобы оформить подписку",
        variant: "destructive"
      });
      return;
    }

    setIsCreatingSubscription(true);
    try {
      const nextDeliveryDate = new Date();
      nextDeliveryDate.setDate(nextDeliveryDate.getDate() + parseInt(subscriptionFrequency));

      const { error } = await supabase.from("subscriptions").insert({
        user_id: user.id,
        product_id: product.id,
        quantity: quantity,
        frequency_days: parseInt(subscriptionFrequency),
        next_delivery_date: nextDeliveryDate.toISOString().split('T')[0],
        discount_percent: 10
      });

      if (error) throw error;

      toast({
        title: "Подписка оформлена!",
        description: `${product.name} будет доставляться каждые ${subscriptionFrequency} дней со скидкой 10%`,
      });
      setSubscriptionDialogOpen(false);
    } catch (error) {
      console.error("Error creating subscription:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось оформить подписку",
        variant: "destructive"
      });
    } finally {
      setIsCreatingSubscription(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-6 pb-24 lg:pb-12">
          <div className="grid lg:grid-cols-12 gap-6">
            <div className="lg:col-span-1"><Skeleton className="w-20 h-20" /></div>
            <div className="lg:col-span-5"><Skeleton className="aspect-square rounded-xl" /></div>
            <div className="lg:col-span-4 space-y-4">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-24 w-full" />
            </div>
            <div className="lg:col-span-2"><Skeleton className="h-48 w-full" /></div>
          </div>
        </main>
        <Footer />
        <MobileNav />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-12 text-center">
          <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-4">Товар не найден</h1>
          <Button asChild>
            <Link to="/catalog">Вернуться в каталог</Link>
          </Button>
        </main>
        <Footer />
        <MobileNav />
      </div>
    );
  }

  const images = product.images?.length ? product.images : ["/placeholder.svg"];
  const discount = product.old_price ? Math.round((1 - product.price / product.old_price) * 100) : 0;
  const specifications = (product.specifications as Record<string, string>) || {};
  const richContent = Array.isArray(product.rich_content) ? (product.rich_content as RichContentBlock[]) : [];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pb-24 lg:pb-12">
        {/* Breadcrumb Bar */}
        <div className="border-b bg-muted/30">
          <div className="container mx-auto px-4 py-3">
            <nav className="flex items-center gap-2 text-sm text-muted-foreground">
              <Link to="/" className="hover:text-foreground flex items-center gap-1">
                <ArrowLeft className="h-4 w-4" />
                Главная
              </Link>
              <span>/</span>
              <Link to="/catalog" className="hover:text-foreground">Каталог</Link>
              {product.category && (
                <>
                  <span>/</span>
                  <Link to={`/catalog/${product.category.slug}`} className="hover:text-foreground">
                    {product.category.name}
                  </Link>
                </>
              )}
              {product.brand && (
                <>
                  <span>/</span>
                  <span className="text-foreground">{product.brand.name}</span>
                </>
              )}
              <div className="flex-1" />
              <Button variant="ghost" size="icon" onClick={toggleFavorite} className="h-8 w-8">
                <Heart className={`h-5 w-5 ${isFavorite ? "fill-destructive text-destructive" : ""}`} />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Share2 className="h-5 w-5" />
              </Button>
            </nav>
          </div>
        </div>

        <div className="container mx-auto px-4 py-6">
          <div className="grid lg:grid-cols-12 gap-6">
            {/* Left: Thumbnails */}
            <div className="hidden lg:flex lg:col-span-1 flex-col gap-2">
              {images.map((img, index) => (
                <button
                  key={index}
                  className={`relative w-full aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                    currentImage === index ? "border-primary" : "border-transparent hover:border-primary/50"
                  }`}
                  onClick={() => setCurrentImage(index)}
                >
                  <img src={img} alt={`${product.name} ${index + 1}`} className="w-full h-full object-cover" />
                  {index === 0 && discount > 0 && (
                    <Badge className="absolute top-0 left-0 text-[10px] px-1 py-0 bg-destructive rounded-none rounded-br">
                      НГ на ВБ
                    </Badge>
                  )}
                </button>
              ))}
            </div>

            {/* Center: Main Image / 3D Viewer */}
            <div className="lg:col-span-5">
              <div className="relative aspect-square rounded-xl bg-muted overflow-hidden sticky top-4">
                {show3DViewer && product.model_3d_url ? (
                  <Product3DViewer modelUrl={product.model_3d_url} productName={product.name} />
                ) : (
                  <>
                    <img 
                      src={images[currentImage]} 
                      alt={product.name}
                      className="w-full h-full object-contain"
                    />
                    
                    {images.length > 1 && (
                      <>
                        <Button
                          variant="secondary"
                          size="icon"
                          className="absolute left-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full"
                          onClick={prevImage}
                        >
                          <ChevronLeft className="h-5 w-5" />
                        </Button>
                        <Button
                          variant="secondary"
                          size="icon"
                          className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full"
                          onClick={nextImage}
                        >
                          <ChevronRight className="h-5 w-5" />
                        </Button>
                      </>
                    )}

                    {discount > 0 && (
                      <Badge className="absolute top-4 left-4 bg-destructive">-{discount}%</Badge>
                    )}

                    {/* Mobile thumbnails */}
                    <div className="lg:hidden absolute bottom-4 left-0 right-0 flex justify-center gap-1.5">
                      {images.map((_, index) => (
                        <button
                          key={index}
                          className={`w-2 h-2 rounded-full transition-colors ${
                            currentImage === index ? "bg-primary" : "bg-muted-foreground/30"
                          }`}
                          onClick={() => setCurrentImage(index)}
                        />
                      ))}
                    </div>
                  </>
                )}

                {/* 3D Toggle Button */}
                {product.model_3d_url && (
                  <Button
                    variant={show3DViewer ? "default" : "secondary"}
                    size="sm"
                    className="absolute top-4 right-4 gap-2"
                    onClick={() => setShow3DViewer(!show3DViewer)}
                  >
                    <Box className="h-4 w-4" />
                    {show3DViewer ? "Фото" : "3D"}
                  </Button>
                )}
              </div>
            </div>

            {/* Center-Right: Product Info */}
            <div className="lg:col-span-4 space-y-4">
              <div>
                <h1 className="text-xl lg:text-2xl font-bold mb-2">{product.name}</h1>
                
                <div className="flex items-center gap-3 text-sm">
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium">{product.rating || 0}</span>
                  </div>
                  <span className="text-muted-foreground">• {product.review_count || 0} отзывов</span>
                </div>
              </div>

              {/* Specifications Table */}
              {(Object.keys(specifications).length > 0 || product.sku) && (
                <div className="space-y-2">
                  {product.sku && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground w-40">Артикул</span>
                      <span className="font-mono">{product.sku}</span>
                    </div>
                  )}
                  {Object.entries(specifications).slice(0, 5).map(([key, value]) => (
                    <div key={key} className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground w-40">{key}</span>
                      <span className="flex-1 border-b border-dotted border-border" />
                      <span>{value}</span>
                    </div>
                  ))}
                  {Object.keys(specifications).length > 5 && (
                    <Button variant="link" size="sm" className="p-0 h-auto text-xs">
                      Характеристики и описание
                    </Button>
                  )}
                </div>
              )}

              <div className="flex items-center gap-2 text-sm">
                <RotateCcw className="h-4 w-4 text-muted-foreground" />
                <span>14 дней на возврат</span>
              </div>

              {/* Brand & Category Links */}
              <div className="flex items-center gap-4 text-sm">
                {product.brand && (
                  <Link to={`/catalog?brand=${product.brand.name}`} className="flex items-center gap-2 hover:text-primary">
                    <Package className="h-4 w-4" />
                    <div>
                      <span className="text-muted-foreground text-xs">Бренд</span>
                      <p className="font-medium">{product.brand.name}</p>
                    </div>
                  </Link>
                )}
                {product.category && (
                  <Link to={`/catalog/${product.category.slug}`} className="flex items-center gap-2 hover:text-primary">
                    <Package className="h-4 w-4" />
                    <div>
                      <span className="text-muted-foreground text-xs">Категория</span>
                      <p className="font-medium">{product.category.name}</p>
                    </div>
                  </Link>
                )}
              </div>
            </div>

            {/* Right: Buy Card (Sticky) */}
            <div className="lg:col-span-2">
              <Card className="sticky top-4">
                <CardContent className="p-4 space-y-4">
                  <div className="space-y-1">
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-primary">
                        {product.price.toLocaleString()} ₽
                      </span>
                    </div>
                    {product.old_price && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground line-through">
                          {product.old_price.toLocaleString()} ₽
                        </span>
                        <Badge variant="secondary" className="text-xs">
                          -{discount}%
                        </Badge>
                      </div>
                    )}
                    {discount > 0 && (
                      <p className="text-xs text-green-600 flex items-center gap-1">
                        <Check className="h-3 w-3" />
                        Хорошая цена
                      </p>
                    )}
                  </div>

                  <Button className="w-full h-11" onClick={addToCart} disabled={product.stock_count === 0}>
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Добавить в корзину
                  </Button>
                  
                  <Button variant="outline" className="w-full h-11">
                    Купить сейчас
                  </Button>

                  {/* Subscription Button */}
                  <Dialog open={subscriptionDialogOpen} onOpenChange={setSubscriptionDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="ghost" className="w-full h-10 text-sm gap-2">
                        <RefreshCw className="h-4 w-4" />
                        Оформить подписку -10%
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Оформить регулярную доставку</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="flex items-center gap-4">
                          <img 
                            src={images[0]} 
                            alt={product.name}
                            className="w-16 h-16 rounded-lg object-cover"
                          />
                          <div>
                            <p className="font-medium">{product.name}</p>
                            <p className="text-sm text-muted-foreground">Количество: {quantity}</p>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Частота доставки</label>
                          <Select value={subscriptionFrequency} onValueChange={setSubscriptionFrequency}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="14">Каждые 2 недели</SelectItem>
                              <SelectItem value="30">Каждый месяц</SelectItem>
                              <SelectItem value="60">Каждые 2 месяца</SelectItem>
                              <SelectItem value="90">Каждые 3 месяца</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Цена за единицу</span>
                            <span>{product.price.toLocaleString()} ₽</span>
                          </div>
                          <div className="flex justify-between text-sm text-green-600">
                            <span>Скидка по подписке</span>
                            <span>-10%</span>
                          </div>
                          <Separator />
                          <div className="flex justify-between font-bold">
                            <span>Итого</span>
                            <span>{(product.price * quantity * 0.9).toLocaleString()} ₽</span>
                          </div>
                        </div>

                        <Button 
                          className="w-full" 
                          onClick={createSubscription}
                          disabled={isCreatingSubscription}
                        >
                          {isCreatingSubscription ? "Оформление..." : "Оформить подписку"}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Truck className="h-4 w-4" />
                    <span>
                      {product.stock_count > 0 ? (
                        <>Завтра, склад продавца</>
                      ) : (
                        <>Под заказ 3-5 дней</>
                      )}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Rich Content */}
          {richContent.length > 0 && (
            <div className="mt-12 max-w-4xl">
              <RichContentDisplay blocks={richContent} />
            </div>
          )}

          {/* Tabs */}
          <Tabs defaultValue="description" className="mt-12">
            <TabsList className="w-full justify-start border-b rounded-none bg-transparent h-auto p-0 gap-8">
              <TabsTrigger value="description" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 pb-3">
                Описание
              </TabsTrigger>
              <TabsTrigger value="specs" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 pb-3">
                Характеристики
              </TabsTrigger>
              <TabsTrigger value="reviews" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 pb-3 flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Отзывы ({product.review_count || 0})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="description" className="pt-6">
              <div className="prose max-w-none">
                <p className="text-muted-foreground">{product.description || "Описание товара не указано."}</p>
              </div>
              {product.features?.length > 0 && (
                <div className="mt-6">
                  <h3 className="font-semibold mb-4">Особенности</h3>
                  <ul className="space-y-2">
                    {product.features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-3">
                        <Check className="h-5 w-5 text-primary" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </TabsContent>

            <TabsContent value="specs" className="pt-6">
              {Object.keys(specifications).length > 0 ? (
                <div className="max-w-2xl space-y-3">
                  {Object.entries(specifications).map(([key, value]) => (
                    <div key={key} className="flex items-center gap-2 py-2 border-b">
                      <span className="text-muted-foreground w-48">{key}</span>
                      <span className="flex-1 border-b border-dotted border-border" />
                      <span className="font-medium">{value}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">Характеристики не указаны.</p>
              )}
            </TabsContent>

            <TabsContent value="reviews" className="pt-6">
              <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                  <ReviewList productId={product.id} />
                </div>
                <div>
                  <ReviewForm productId={product.id} />
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Related Products */}
          <div className="mt-12">
            <RelatedProducts 
              currentProductId={product.id} 
              categoryId={product.category_id}
              brandId={product.brand_id}
            />
          </div>
        </div>
      </main>
      <Footer />
      <MobileNav />
    </div>
  );
};

export default Product;
