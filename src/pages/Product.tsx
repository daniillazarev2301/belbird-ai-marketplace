import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { 
  ChevronLeft, ChevronRight, Heart, Share2, ShoppingCart, Truck, Shield, RotateCcw, 
  Star, ThumbsUp, ThumbsDown, MessageSquare, Play, Sparkles, ChevronDown, Plus, Minus,
  Check, Clock, Package
} from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import MobileNav from "@/components/layout/MobileNav";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";

const productImages = [
  "/placeholder.svg",
  "/placeholder.svg",
  "/placeholder.svg",
  "/placeholder.svg",
  "/placeholder.svg"
];

const productVideo = {
  thumbnail: "/placeholder.svg",
  duration: "2:34"
};

const product = {
  id: "1",
  name: "Корм для собак Royal Canin Maxi Adult для крупных пород старше 15 месяцев",
  brand: "Royal Canin",
  sku: "RC-MAXI-15KG",
  price: 7490,
  oldPrice: 8900,
  rating: 4.8,
  reviewCount: 1247,
  inStock: true,
  stockCount: 23,
  description: "Полнорационный сухой корм для взрослых собак крупных пород (вес взрослой собаки от 26 до 44 кг) в возрасте от 15 месяцев до 5 лет. Специально разработанная формула поддерживает здоровье костей и суставов благодаря оптимальному содержанию кальция и фосфора.",
  features: [
    "Поддержка суставов и костей",
    "Здоровое пищеварение",
    "Оптимальный вес",
    "Здоровая кожа и шерсть"
  ]
};

const specifications = [
  { label: "Вес упаковки", value: "15 кг" },
  { label: "Страна производства", value: "Франция" },
  { label: "Возраст питомца", value: "от 15 месяцев до 5 лет" },
  { label: "Размер породы", value: "Крупные (26-44 кг)" },
  { label: "Особые потребности", value: "Поддержка суставов" },
  { label: "Основной ингредиент", value: "Курица" },
  { label: "Белок", value: "26%" },
  { label: "Жир", value: "17%" },
  { label: "Клетчатка", value: "1.9%" },
  { label: "Срок годности", value: "18 месяцев" }
];

const aiReviewSummary = {
  overall: "Отличный корм для крупных пород",
  pros: [
    "Собаки едят с удовольствием (87% отзывов)",
    "Улучшение состояния шерсти (72% отзывов)",
    "Нормализация пищеварения (68% отзывов)",
    "Удобная упаковка с застёжкой"
  ],
  cons: [
    "Высокая цена (34% отзывов)",
    "Иногда меняется состав (12% отзывов)"
  ],
  sentiment: {
    quality: 92,
    value: 71,
    effectiveness: 89
  }
};

const reviews = [
  {
    id: "1",
    author: "Елена М.",
    date: "15 ноября 2024",
    rating: 5,
    pet: "Лабрадор, 3 года",
    text: "Кормим этим кормом уже второй год. Собака ест с удовольствием, шерсть блестит, проблем с пищеварением нет. Рекомендую!",
    helpful: 45,
    notHelpful: 2,
    verified: true
  },
  {
    id: "2",
    author: "Дмитрий К.",
    date: "10 ноября 2024",
    rating: 4,
    pet: "Немецкая овчарка, 2 года",
    text: "Хороший корм, качество стабильное. Единственный минус - цена постоянно растёт. Но пока альтернативы не нашли, собака привыкла именно к этому корму.",
    helpful: 23,
    notHelpful: 1,
    verified: true
  },
  {
    id: "3",
    author: "Анна В.",
    date: "5 ноября 2024",
    rating: 5,
    pet: "Золотистый ретривер, 4 года",
    text: "Перешли на этот корм по рекомендации ветеринара. За 3 месяца собака похудела до нормы, стала более активной. Очень довольны!",
    helpful: 67,
    notHelpful: 3,
    verified: true
  }
];

const ratingDistribution = [
  { stars: 5, count: 892, percent: 72 },
  { stars: 4, count: 248, percent: 20 },
  { stars: 3, count: 62, percent: 5 },
  { stars: 2, count: 25, percent: 2 },
  { stars: 1, count: 20, percent: 1 }
];

const qaItems = [
  {
    id: "1",
    question: "Подойдёт ли этот корм для собаки с чувствительным пищеварением?",
    answer: "Да, корм Royal Canin Maxi Adult содержит легкоусвояемые белки и пребиотики для поддержки здоровой микрофлоры кишечника. Однако при серьёзных проблемах с ЖКТ рекомендуем линейку Gastrointestinal.",
    author: "AI Консультант BelBird",
    isAI: true,
    date: "12 ноября 2024",
    helpful: 34
  },
  {
    id: "2", 
    question: "Какой расход корма в месяц для собаки весом 35 кг?",
    answer: "Для собаки весом 35 кг при нормальной активности рекомендуемая суточная норма составляет 380-420 г. Таким образом, упаковки 15 кг хватит примерно на 5-6 недель.",
    author: "AI Консультант BelBird",
    isAI: true,
    date: "10 ноября 2024",
    helpful: 56
  },
  {
    id: "3",
    question: "Можно ли смешивать с влажным кормом?",
    answer: "Да, можно комбинировать с влажными кормами Royal Canin той же линейки. При смешанном кормлении уменьшите порцию сухого корма на 30-40%.",
    author: "Эксперт магазина",
    isAI: false,
    date: "8 ноября 2024",
    helpful: 28
  }
];

const Product = () => {
  const { toast } = useToast();
  const [currentImage, setCurrentImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const [newQuestion, setNewQuestion] = useState("");

  const nextImage = () => setCurrentImage((prev) => (prev + 1) % productImages.length);
  const prevImage = () => setCurrentImage((prev) => (prev - 1 + productImages.length) % productImages.length);

  const addToCart = () => {
    toast({
      title: "Добавлено в корзину",
      description: `${product.name} (${quantity} шт.)`,
    });
  };

  const askQuestion = () => {
    if (newQuestion.trim()) {
      toast({
        title: "Вопрос отправлен",
        description: "AI-консультант ответит в ближайшее время",
      });
      setNewQuestion("");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-6 pb-24 lg:pb-12">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-foreground">Главная</Link>
          <span>/</span>
          <Link to="/catalog/pets" className="hover:text-foreground">Питомцы</Link>
          <span>/</span>
          <Link to="/catalog/pets/dogs" className="hover:text-foreground">Собаки</Link>
          <span>/</span>
          <span className="text-foreground">Корма</span>
        </nav>

        <div className="grid lg:grid-cols-2 gap-8 mb-12">
          {/* Gallery */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="relative aspect-square rounded-xl bg-muted overflow-hidden">
              {showVideo ? (
                <div className="w-full h-full flex items-center justify-center bg-black">
                  <p className="text-white">Видео обзор товара</p>
                </div>
              ) : (
                <img 
                  src={productImages[currentImage]} 
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              )}
              
              {/* Navigation Arrows */}
              {!showVideo && (
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

              {/* Discount Badge */}
              {product.oldPrice && (
                <Badge className="absolute top-4 left-4 bg-destructive">
                  -{Math.round((1 - product.price / product.oldPrice) * 100)}%
                </Badge>
              )}

              {/* Actions */}
              <div className="absolute top-4 right-4 flex flex-col gap-2">
                <Button
                  variant="secondary"
                  size="icon"
                  onClick={() => setIsFavorite(!isFavorite)}
                >
                  <Heart className={`h-5 w-5 ${isFavorite ? 'fill-destructive text-destructive' : ''}`} />
                </Button>
                <Button variant="secondary" size="icon">
                  <Share2 className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Thumbnails */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {/* Video Thumbnail */}
              <button
                className={`relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${showVideo ? 'border-primary' : 'border-transparent hover:border-primary/50'}`}
                onClick={() => setShowVideo(true)}
              >
                <img src={productVideo.thumbnail} alt="Video" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <Play className="h-6 w-6 text-white fill-white" />
                </div>
                <span className="absolute bottom-1 right-1 text-[10px] text-white bg-black/60 px-1 rounded">
                  {productVideo.duration}
                </span>
              </button>
              
              {/* Image Thumbnails */}
              {productImages.map((img, index) => (
                <button
                  key={index}
                  className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${!showVideo && currentImage === index ? 'border-primary' : 'border-transparent hover:border-primary/50'}`}
                  onClick={() => {
                    setCurrentImage(index);
                    setShowVideo(false);
                  }}
                >
                  <img src={img} alt={`${product.name} ${index + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <p className="text-sm text-muted-foreground mb-1">{product.brand}</p>
              <h1 className="text-2xl lg:text-3xl font-bold mb-3">{product.name}</h1>
              
              {/* Rating */}
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-5 w-5 ${star <= Math.round(product.rating) ? 'fill-yellow-400 text-yellow-400' : 'text-muted'}`}
                    />
                  ))}
                  <span className="font-medium ml-1">{product.rating}</span>
                </div>
                <Link to="#reviews" className="text-sm text-muted-foreground hover:text-foreground">
                  {product.reviewCount} отзывов
                </Link>
                <span className="text-sm text-muted-foreground">Артикул: {product.sku}</span>
              </div>

              {/* Price */}
              <div className="flex items-baseline gap-3 mb-4">
                <span className="text-3xl font-bold">{product.price.toLocaleString()} ₽</span>
                {product.oldPrice && (
                  <span className="text-xl text-muted-foreground line-through">
                    {product.oldPrice.toLocaleString()} ₽
                  </span>
                )}
              </div>

              {/* Stock */}
              <div className="flex items-center gap-2 mb-6">
                {product.inStock ? (
                  <>
                    <Check className="h-5 w-5 text-green-600" />
                    <span className="text-green-600 font-medium">В наличии</span>
                    <span className="text-muted-foreground">({product.stockCount} шт.)</span>
                  </>
                ) : (
                  <>
                    <Clock className="h-5 w-5 text-orange-500" />
                    <span className="text-orange-500 font-medium">Под заказ (3-5 дней)</span>
                  </>
                )}
              </div>
            </div>

            {/* Quantity & Add to Cart */}
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
              <Button className="flex-1 h-12" size="lg" onClick={addToCart}>
                <ShoppingCart className="h-5 w-5 mr-2" />
                В корзину
              </Button>
            </div>

            {/* BelBird Expert Rationale */}
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Почему BelBird рекомендует</h3>
                    <p className="text-sm text-muted-foreground">
                      Идеально подходит для вашего питомца Рекс (немецкая овчарка, 2 года, 38 кг). 
                      Формула поддерживает здоровье суставов, что особенно важно для крупных пород. 
                      92% покупателей с похожими питомцами довольны этим кормом.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Delivery & Guarantees */}
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

            {/* Features */}
            <div className="flex flex-wrap gap-2">
              {product.features.map((feature, index) => (
                <Badge key={index} variant="secondary">
                  <Check className="h-3 w-3 mr-1" />
                  {feature}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        {/* Tabs: Description, Specs, Reviews, Q&A */}
        <Tabs defaultValue="description" className="mb-12">
          <TabsList className="w-full justify-start overflow-x-auto">
            <TabsTrigger value="description">Описание</TabsTrigger>
            <TabsTrigger value="specs">Характеристики</TabsTrigger>
            <TabsTrigger value="reviews">Отзывы ({product.reviewCount})</TabsTrigger>
            <TabsTrigger value="qa">Вопросы и ответы</TabsTrigger>
          </TabsList>

          {/* Description */}
          <TabsContent value="description" className="mt-6">
            <div className="prose prose-sm max-w-none">
              <p className="text-muted-foreground leading-relaxed">{product.description}</p>
            </div>
          </TabsContent>

          {/* Specifications */}
          <TabsContent value="specs" className="mt-6">
            <div className="grid md:grid-cols-2 gap-4">
              {specifications.map((spec, index) => (
                <div key={index} className="flex justify-between py-3 border-b">
                  <span className="text-muted-foreground">{spec.label}</span>
                  <span className="font-medium">{spec.value}</span>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Reviews */}
          <TabsContent value="reviews" className="mt-6" id="reviews">
            <div className="grid lg:grid-cols-3 gap-8">
              {/* AI Summary */}
              <Card className="lg:col-span-1 h-fit">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    AI-анализ отзывов
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="font-medium">{aiReviewSummary.overall}</p>
                  
                  <div>
                    <p className="text-sm font-medium text-green-600 mb-2">Плюсы:</p>
                    <ul className="space-y-1">
                      {aiReviewSummary.pros.map((pro, i) => (
                        <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                          <ThumbsUp className="h-3 w-3 mt-1 text-green-600 flex-shrink-0" />
                          {pro}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-destructive mb-2">Минусы:</p>
                    <ul className="space-y-1">
                      {aiReviewSummary.cons.map((con, i) => (
                        <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                          <ThumbsDown className="h-3 w-3 mt-1 text-destructive flex-shrink-0" />
                          {con}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Качество</span>
                        <span>{aiReviewSummary.sentiment.quality}%</span>
                      </div>
                      <Progress value={aiReviewSummary.sentiment.quality} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Цена/качество</span>
                        <span>{aiReviewSummary.sentiment.value}%</span>
                      </div>
                      <Progress value={aiReviewSummary.sentiment.value} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Эффективность</span>
                        <span>{aiReviewSummary.sentiment.effectiveness}%</span>
                      </div>
                      <Progress value={aiReviewSummary.sentiment.effectiveness} className="h-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Reviews List */}
              <div className="lg:col-span-2 space-y-6">
                {/* Rating Distribution */}
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-8">
                      <div className="text-center">
                        <div className="text-4xl font-bold">{product.rating}</div>
                        <div className="flex items-center justify-center my-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`h-4 w-4 ${star <= Math.round(product.rating) ? 'fill-yellow-400 text-yellow-400' : 'text-muted'}`}
                            />
                          ))}
                        </div>
                        <div className="text-sm text-muted-foreground">{product.reviewCount} отзывов</div>
                      </div>
                      <div className="flex-1 space-y-2">
                        {ratingDistribution.map((item) => (
                          <div key={item.stars} className="flex items-center gap-2">
                            <span className="text-sm w-3">{item.stars}</span>
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            <Progress value={item.percent} className="flex-1 h-2" />
                            <span className="text-sm text-muted-foreground w-12">{item.count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Individual Reviews */}
                {reviews.map((review) => (
                  <Card key={review.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback>{review.author.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{review.author}</span>
                              {review.verified && (
                                <Badge variant="secondary" className="text-xs">
                                  <Check className="h-3 w-3 mr-1" />
                                  Покупка подтверждена
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">{review.pet}</p>
                          </div>
                        </div>
                        <span className="text-sm text-muted-foreground">{review.date}</span>
                      </div>

                      <div className="flex items-center gap-1 mb-3">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-4 w-4 ${star <= review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted'}`}
                          />
                        ))}
                      </div>

                      <p className="text-sm text-muted-foreground mb-4">{review.text}</p>

                      <div className="flex items-center gap-4">
                        <span className="text-sm text-muted-foreground">Полезен отзыв?</span>
                        <Button variant="ghost" size="sm">
                          <ThumbsUp className="h-4 w-4 mr-1" />
                          {review.helpful}
                        </Button>
                        <Button variant="ghost" size="sm">
                          <ThumbsDown className="h-4 w-4 mr-1" />
                          {review.notHelpful}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                <Button variant="outline" className="w-full">
                  Показать все отзывы
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* Q&A */}
          <TabsContent value="qa" className="mt-6">
            <div className="max-w-3xl space-y-6">
              {/* Ask Question */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Задать вопрос
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    placeholder="Введите ваш вопрос о товаре..."
                    value={newQuestion}
                    onChange={(e) => setNewQuestion(e.target.value)}
                    className="mb-4"
                  />
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-primary" />
                      AI-консультант ответит в течение нескольких минут
                    </p>
                    <Button onClick={askQuestion} disabled={!newQuestion.trim()}>
                      Отправить
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Q&A List */}
              {qaItems.map((item) => (
                <Collapsible key={item.id} defaultOpen>
                  <Card>
                    <CollapsibleTrigger className="w-full">
                      <CardHeader className="flex flex-row items-center justify-between">
                        <div className="flex items-start gap-3 text-left">
                          <MessageSquare className="h-5 w-5 text-primary mt-0.5" />
                          <span className="font-medium">{item.question}</span>
                        </div>
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent className="pt-0">
                        <div className="ml-8 pl-4 border-l-2 border-primary/20">
                          <div className="flex items-center gap-2 mb-2">
                            {item.isAI && <Sparkles className="h-4 w-4 text-primary" />}
                            <span className="font-medium text-sm">{item.author}</span>
                            <span className="text-xs text-muted-foreground">{item.date}</span>
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">{item.answer}</p>
                          <Button variant="ghost" size="sm">
                            <ThumbsUp className="h-4 w-4 mr-1" />
                            Полезно ({item.helpful})
                          </Button>
                        </div>
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              ))}
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
