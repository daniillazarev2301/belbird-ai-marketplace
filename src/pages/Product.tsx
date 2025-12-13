import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { 
  ChevronLeft, ChevronRight, Heart, Share2, ShoppingCart, Truck, Shield, RotateCcw, 
  Star, ThumbsUp, MessageSquare, Sparkles, Plus, Minus, Check, Clock
} from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import MobileNav from "@/components/layout/MobileNav";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

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
  brand?: { name: string };
  category?: { name: string; slug: string };
}

const Product = () => {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [product, setProduct] = useState<ProductData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImage, setCurrentImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    loadProduct();
  }, [id]);

  const loadProduct = async () => {
    if (!id) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from("products")
      .select(`
        id, name, slug, description, price, old_price, images, features, rating, review_count, stock_count, sku,
        brand:brands(name),
        category:categories(name, slug)
      `)
      .or(`slug.eq.${id},id.eq.${id}`)
      .single();

    if (error) {
      console.error("Error loading product:", error);
    } else {
      setProduct(data as ProductData);
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
    toast({
      title: "Добавлено в корзину",
      description: `${product?.name} (${quantity} шт.)`,
    });
  };

  const toggleFavorite = () => {
    setIsFavorite(!isFavorite);
    toast({
      title: isFavorite ? "Удалено из избранного" : "Добавлено в избранное",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-6 pb-24 lg:pb-12">
          <div className="grid lg:grid-cols-2 gap-8">
            <Skeleton className="aspect-square rounded-xl" />
            <div className="space-y-4">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-10 w-1/3" />
              <Skeleton className="h-24 w-full" />
            </div>
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

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-6 pb-24 lg:pb-12">
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6 flex-wrap">
          <Link to="/" className="hover:text-foreground">Главная</Link>
          <span>/</span>
          <Link to="/catalog" className="hover:text-foreground">Каталог</Link>
          {product.category && (
            <>
              <span>/</span>
              <Link to={`/catalog/${product.category.slug}`} className="hover:text-foreground">{product.category.name}</Link>
            </>
          )}
          <span>/</span>
          <span className="text-foreground truncate max-w-[200px]">{product.name}</span>
        </nav>

        <div className="grid lg:grid-cols-2 gap-8 mb-12">
          {/* Gallery */}
          <div className="space-y-4">
            <div className="relative aspect-square rounded-xl bg-muted overflow-hidden">
              <img 
                src={images[currentImage]} 
                alt={product.name}
                className="w-full h-full object-cover"
              />
              
              {images.length > 1 && (
                <>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="absolute left-4 top-1/2 -translate-y-1/2"
                    onClick={prevImage}
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="absolute right-4 top-1/2 -translate-y-1/2"
                    onClick={nextImage}
                  >
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </>
              )}

              {discount > 0 && (
                <Badge className="absolute top-4 left-4 bg-destructive">-{discount}%</Badge>
              )}

              <div className="absolute top-4 right-4 flex flex-col gap-2">
                <Button variant="secondary" size="icon" onClick={toggleFavorite}>
                  <Heart className={`h-5 w-5 ${isFavorite ? 'fill-destructive text-destructive' : ''}`} />
                </Button>
                <Button variant="secondary" size="icon">
                  <Share2 className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {images.map((img, index) => (
                  <button
                    key={index}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${currentImage === index ? 'border-primary' : 'border-transparent hover:border-primary/50'}`}
                    onClick={() => setCurrentImage(index)}
                  >
                    <img src={img} alt={`${product.name} ${index + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              {product.brand && (
                <p className="text-sm text-muted-foreground mb-1">{product.brand.name}</p>
              )}
              <h1 className="text-2xl lg:text-3xl font-bold mb-3">{product.name}</h1>
              
              <div className="flex items-center gap-4 mb-4 flex-wrap">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-5 w-5 ${star <= Math.round(product.rating || 0) ? 'fill-yellow-400 text-yellow-400' : 'text-muted'}`}
                    />
                  ))}
                  <span className="font-medium ml-1">{product.rating || 0}</span>
                </div>
                <span className="text-sm text-muted-foreground">{product.review_count || 0} отзывов</span>
                {product.sku && <span className="text-sm text-muted-foreground">Артикул: {product.sku}</span>}
              </div>

              <div className="flex items-baseline gap-3 mb-4">
                <span className="text-3xl font-bold">{product.price.toLocaleString()} ₽</span>
                {product.old_price && (
                  <span className="text-xl text-muted-foreground line-through">
                    {product.old_price.toLocaleString()} ₽
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 mb-6">
                {product.stock_count > 0 ? (
                  <>
                    <Check className="h-5 w-5 text-green-600" />
                    <span className="text-green-600 font-medium">В наличии</span>
                    <span className="text-muted-foreground">({product.stock_count} шт.)</span>
                  </>
                ) : (
                  <>
                    <Clock className="h-5 w-5 text-orange-500" />
                    <span className="text-orange-500 font-medium">Под заказ (3-5 дней)</span>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center border rounded-lg">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-12 text-center font-medium">{quantity}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setQuantity(quantity + 1)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <Button className="flex-1 h-12" size="lg" onClick={addToCart} disabled={product.stock_count === 0}>
                <ShoppingCart className="h-5 w-5 mr-2" />
                В корзину
              </Button>
            </div>

            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Почему BelBird рекомендует</h3>
                    <p className="text-sm text-muted-foreground">
                      Этот товар пользуется высоким спросом. {product.review_count} покупателей оставили положительные отзывы.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-3 gap-4">
              <div className="flex flex-col items-center text-center p-3 rounded-lg bg-muted/50">
                <Truck className="h-6 w-6 mb-2 text-primary" />
                <span className="text-xs font-medium">Доставка</span>
                <span className="text-xs text-muted-foreground">от 1 дня</span>
              </div>
              <div className="flex flex-col items-center text-center p-3 rounded-lg bg-muted/50">
                <RotateCcw className="h-6 w-6 mb-2 text-primary" />
                <span className="text-xs font-medium">Возврат</span>
                <span className="text-xs text-muted-foreground">14 дней</span>
              </div>
              <div className="flex flex-col items-center text-center p-3 rounded-lg bg-muted/50">
                <Shield className="h-6 w-6 mb-2 text-primary" />
                <span className="text-xs font-medium">Гарантия</span>
                <span className="text-xs text-muted-foreground">Оригинал</span>
              </div>
            </div>
          </div>
        </div>

        <Tabs defaultValue="description" className="mb-12">
          <TabsList className="w-full justify-start border-b rounded-none bg-transparent h-auto p-0 gap-8">
            <TabsTrigger value="description" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 pb-3">
              Описание
            </TabsTrigger>
            <TabsTrigger value="features" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 pb-3">
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
          </TabsContent>

          <TabsContent value="features" className="pt-6">
            {product.features?.length ? (
              <ul className="space-y-3">
                {product.features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-primary" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground">Характеристики не указаны.</p>
            )}
          </TabsContent>

          <TabsContent value="reviews" className="pt-6">
            <div className="text-center py-8">
              <ThumbsUp className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
              <p className="text-muted-foreground">Отзывов пока нет. Будьте первым!</p>
            </div>
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
      <MobileNav />
    </div>
  );
};

export default Product;
