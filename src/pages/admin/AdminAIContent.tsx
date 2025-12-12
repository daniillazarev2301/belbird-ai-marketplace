import { useState } from "react";
import { Helmet } from "react-helmet-async";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sparkles,
  Wand2,
  FileText,
  RefreshCw,
  Copy,
  Check,
  Loader2,
  Search,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const productTemplates = [
  { id: "1", name: "Royal Canin Indoor", category: "Корма", hasDescription: false, hasSEO: false },
  { id: "2", name: "Лежанка Premium XL", category: "Аксессуары", hasDescription: true, hasSEO: false },
  { id: "3", name: "Семена томатов Черри", category: "Семена", hasDescription: false, hasSEO: true },
  { id: "4", name: "Свеча ароматическая", category: "Декор", hasDescription: false, hasSEO: false },
];

const AdminAIContent = () => {
  const [generating, setGenerating] = useState(false);
  const [generatedDescription, setGeneratedDescription] = useState("");
  const [generatedSEO, setGeneratedSEO] = useState({ title: "", description: "", keywords: "" });
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  
  const [productName, setProductName] = useState("Royal Canin Indoor для кошек 2кг");
  const [category, setCategory] = useState("food");
  const [characteristics, setCharacteristics] = useState("Для домашних кошек, контроль веса, вывод шерсти, возраст 1-7 лет");
  const [tone, setTone] = useState("professional");

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-product-content', {
        body: {
          productName,
          category,
          characteristics,
          tone,
          type: 'description'
        }
      });

      if (error) throw error;
      setGeneratedDescription(data.content);
      toast.success("Описание сгенерировано!");
    } catch (error) {
      console.error('Error generating description:', error);
      toast.error("Ошибка при генерации описания");
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerateSEO = async () => {
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-product-content', {
        body: {
          productName,
          category,
          characteristics,
          tone,
          type: 'seo'
        }
      });

      if (error) throw error;
      
      // Parse JSON from response
      try {
        const jsonMatch = data.content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const seoData = JSON.parse(jsonMatch[0]);
          setGeneratedSEO(seoData);
        }
      } catch {
        setGeneratedSEO({ title: data.content, description: "", keywords: "" });
      }
      toast.success("SEO-теги сгенерированы!");
    } catch (error) {
      console.error('Error generating SEO:', error);
      toast.error("Ошибка при генерации SEO");
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Скопировано!");
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleProduct = (id: string) => {
    setSelectedProducts((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  return (
    <>
      <Helmet>
        <title>AI-Контент — BelBird Admin</title>
      </Helmet>
      <AdminLayout title="AI-Контент" description="Генерация описаний и SEO-тегов с помощью AI">
        <Tabs defaultValue="single" className="space-y-6">
          <TabsList>
            <TabsTrigger value="single" className="gap-2">
              <FileText className="h-4 w-4" />
              Единичная генерация
            </TabsTrigger>
            <TabsTrigger value="bulk" className="gap-2">
              <Sparkles className="h-4 w-4" />
              Массовая генерация
            </TabsTrigger>
            <TabsTrigger value="blog" className="gap-2">
              <Wand2 className="h-4 w-4" />
              Блог-статьи
            </TabsTrigger>
          </TabsList>

          {/* Single Generation */}
          <TabsContent value="single" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Input */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Параметры товара</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Название товара</Label>
                    <Input 
                      value={productName}
                      onChange={(e) => setProductName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Категория</Label>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="food">Корма для кошек</SelectItem>
                        <SelectItem value="accessories">Аксессуары</SelectItem>
                        <SelectItem value="health">Здоровье</SelectItem>
                        <SelectItem value="home">Уют и Дом</SelectItem>
                        <SelectItem value="garden">Сад и Огород</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Ключевые характеристики</Label>
                    <Textarea
                      placeholder="Введите основные характеристики товара..."
                      value={characteristics}
                      onChange={(e) => setCharacteristics(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Тон описания</Label>
                    <Select value={tone} onValueChange={setTone}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="professional">Профессиональный</SelectItem>
                        <SelectItem value="friendly">Дружелюбный</SelectItem>
                        <SelectItem value="premium">Премиальный</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleGenerate} disabled={generating} className="flex-1 gap-2">
                      {generating ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Sparkles className="h-4 w-4" />
                      )}
                      Сгенерировать описание
                    </Button>
                    <Button onClick={handleGenerateSEO} disabled={generating} variant="outline" className="flex-1 gap-2">
                      {generating ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Search className="h-4 w-4" />
                      )}
                      SEO-теги
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Output */}
              <div className="space-y-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-base">Описание товара</CardTitle>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon" onClick={handleGenerate} disabled={generating}>
                        <RefreshCw className={`h-4 w-4 ${generating ? 'animate-spin' : ''}`} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleCopy(generatedDescription)}
                        disabled={!generatedDescription}
                      >
                        {copied ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {generatedDescription ? (
                      <p className="text-sm leading-relaxed">{generatedDescription}</p>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                        <Sparkles className="h-8 w-8 mb-2" />
                        <p className="text-sm">Нажмите &quot;Сгенерировать&quot; для создания описания</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {generatedSEO.title && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">SEO-теги</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <Label className="text-xs text-muted-foreground">Title</Label>
                        <p className="text-sm font-medium">{generatedSEO.title}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Meta Description</Label>
                        <p className="text-sm">{generatedSEO.description}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Keywords</Label>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {generatedSEO.keywords.split(", ").filter(Boolean).map((keyword) => (
                            <Badge key={keyword} variant="secondary" className="text-xs">
                              {keyword}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Bulk Generation */}
          <TabsContent value="bulk" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Массовая генерация контента</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      Выберите товары для генерации описаний и SEO-тегов
                    </p>
                    <div className="flex gap-2">
                      <Select defaultValue="no_desc">
                        <SelectTrigger className="w-48">
                          <SelectValue placeholder="Фильтр" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Все товары</SelectItem>
                          <SelectItem value="no_desc">Без описания</SelectItem>
                          <SelectItem value="no_seo">Без SEO</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="rounded-lg border border-border">
                    <div className="p-3 border-b border-border bg-muted/50 flex items-center gap-3">
                      <Checkbox
                        checked={selectedProducts.length === productTemplates.length}
                        onCheckedChange={() => {
                          if (selectedProducts.length === productTemplates.length) {
                            setSelectedProducts([]);
                          } else {
                            setSelectedProducts(productTemplates.map((p) => p.id));
                          }
                        }}
                      />
                      <span className="text-sm font-medium">Выбрать все</span>
                      {selectedProducts.length > 0 && (
                        <Badge variant="secondary">{selectedProducts.length} выбрано</Badge>
                      )}
                    </div>
                    {productTemplates.map((product) => (
                      <div
                        key={product.id}
                        className="p-3 border-b border-border last:border-0 flex items-center gap-3 hover:bg-muted/30 transition-colors"
                      >
                        <Checkbox
                          checked={selectedProducts.includes(product.id)}
                          onCheckedChange={() => toggleProduct(product.id)}
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium">{product.name}</p>
                          <p className="text-xs text-muted-foreground">{product.category}</p>
                        </div>
                        <div className="flex gap-2">
                          {!product.hasDescription && (
                            <Badge variant="outline" className="text-xs">Нет описания</Badge>
                          )}
                          {!product.hasSEO && (
                            <Badge variant="outline" className="text-xs">Нет SEO</Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <Button disabled={selectedProducts.length === 0} className="gap-2">
                      <Sparkles className="h-4 w-4" />
                      Сгенерировать описания ({selectedProducts.length})
                    </Button>
                    <Button disabled={selectedProducts.length === 0} variant="outline" className="gap-2">
                      <Search className="h-4 w-4" />
                      Сгенерировать SEO ({selectedProducts.length})
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Blog Articles */}
          <TabsContent value="blog" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Генерация статьи для блога</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Тема статьи</Label>
                    <Input placeholder="Например: Как выбрать корм для котёнка" />
                  </div>
                  <div className="space-y-2">
                    <Label>Ключевые слова</Label>
                    <Input placeholder="корм для котёнка, питание, советы" />
                  </div>
                  <div className="space-y-2">
                    <Label>Категория</Label>
                    <Select defaultValue="pets">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pets">Любимцы</SelectItem>
                        <SelectItem value="home">Уют и Дом</SelectItem>
                        <SelectItem value="garden">Сад и Огород</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Длина статьи</Label>
                    <Select defaultValue="medium">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="short">Короткая (500 слов)</SelectItem>
                        <SelectItem value="medium">Средняя (1000 слов)</SelectItem>
                        <SelectItem value="long">Длинная (2000 слов)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button className="w-full gap-2">
                    <Wand2 className="h-4 w-4" />
                    Сгенерировать статью
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Предпросмотр</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <FileText className="h-12 w-12 mb-3" />
                    <p className="text-sm text-center">
                      Заполните параметры и нажмите &quot;Сгенерировать&quot;
                      <br />
                      для создания статьи
                    </p>
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

export default AdminAIContent;
