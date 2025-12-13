import { useState } from "react";
import { Helmet } from "react-helmet-async";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Search, Star, Check, X, Eye, Loader2, RefreshCw, MessageSquare, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

interface Review {
  id: string;
  product_id: string;
  user_id: string;
  rating: number;
  title: string | null;
  content: string | null;
  pros: string | null;
  cons: string | null;
  is_approved: boolean;
  is_verified_purchase: boolean;
  helpful_count: number;
  created_at: string;
  products?: { name: string; slug: string } | null;
}

interface Product {
  id: string;
  name: string;
}

const AdminReviews = () => {
  const queryClient = useQueryClient();
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<string>("");
  const [reviewCount, setReviewCount] = useState("5");
  const [isGenerating, setIsGenerating] = useState(false);

  const { data: reviews = [], isLoading, refetch } = useQuery({
    queryKey: ["admin-reviews", statusFilter, searchQuery],
    queryFn: async () => {
      let query = supabase
        .from("reviews")
        .select("*, products(name, slug)")
        .order("created_at", { ascending: false });

      if (statusFilter === "pending") {
        query = query.eq("is_approved", false);
      } else if (statusFilter === "approved") {
        query = query.eq("is_approved", true);
      }

      const { data, error } = await query;
      if (error) throw error;

      let filtered = data || [];
      if (searchQuery) {
        const search = searchQuery.toLowerCase();
        filtered = filtered.filter(
          (r) =>
            r.title?.toLowerCase().includes(search) ||
            r.content?.toLowerCase().includes(search) ||
            r.products?.name?.toLowerCase().includes(search)
        );
      }

      return filtered as Review[];
    },
  });

  const { data: products = [] } = useQuery({
    queryKey: ["admin-products-for-reviews"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data as Product[];
    },
  });

  const updateReview = useMutation({
    mutationFn: async ({ id, is_approved }: { id: string; is_approved: boolean }) => {
      const { error } = await supabase
        .from("reviews")
        .update({ is_approved })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-reviews"] });
      toast.success("Отзыв обновлён");
    },
    onError: (error: Error) => {
      toast.error("Ошибка: " + error.message);
    },
  });

  const deleteReview = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("reviews").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-reviews"] });
      toast.success("Отзыв удалён");
      setSelectedReview(null);
    },
    onError: (error: Error) => {
      toast.error("Ошибка: " + error.message);
    },
  });

  const handleGenerateReviews = async () => {
    if (!selectedProduct) {
      toast.error("Выберите товар");
      return;
    }

    const product = products.find(p => p.id === selectedProduct);
    if (!product) return;

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-reviews", {
        body: {
          productId: selectedProduct,
          productName: product.name,
          count: parseInt(reviewCount),
        },
      });

      if (error) throw error;

      toast.success(`Создано ${data.count} отзывов`);
      setGenerateDialogOpen(false);
      setSelectedProduct("");
      queryClient.invalidateQueries({ queryKey: ["admin-reviews"] });
    } catch (error) {
      console.error("Error generating reviews:", error);
      toast.error("Ошибка генерации отзывов");
    } finally {
      setIsGenerating(false);
    }
  };

  const stats = {
    total: reviews.length,
    pending: reviews.filter((r) => !r.is_approved).length,
    approved: reviews.filter((r) => r.is_approved).length,
  };

  return (
    <>
      <Helmet>
        <title>Отзывы — BelBird Admin</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <AdminLayout title="Отзывы" description="Модерация отзывов покупателей">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => setStatusFilter("all")}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <MessageSquare className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Всего отзывов</p>
              </div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => setStatusFilter("pending")}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-secondary/20">
                <Eye className="h-5 w-5 text-secondary-foreground" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{stats.pending}</p>
                <p className="text-xs text-muted-foreground">На модерации</p>
              </div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => setStatusFilter("approved")}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted">
                <Check className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{stats.approved}</p>
                <p className="text-xs text-muted-foreground">Одобрено</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Поиск по отзывам..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Статус" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все</SelectItem>
                <SelectItem value="pending">На модерации</SelectItem>
                <SelectItem value="approved">Одобрено</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button className="gap-2" onClick={() => setGenerateDialogOpen(true)}>
              <Sparkles className="h-4 w-4" />
              AI Отзывы
            </Button>
          </div>
        </div>

        {/* Reviews Table */}
        <div className="rounded-lg border border-border bg-card">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : reviews.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-muted-foreground mb-4">Отзывы не найдены</p>
              <Button onClick={() => setGenerateDialogOpen(true)} className="gap-2">
                <Sparkles className="h-4 w-4" />
                Сгенерировать AI отзывы
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Товар</TableHead>
                  <TableHead>Рейтинг</TableHead>
                  <TableHead>Отзыв</TableHead>
                  <TableHead>Дата</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead className="w-24">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reviews.map((review) => (
                  <TableRow
                    key={review.id}
                    className="cursor-pointer"
                    onClick={() => setSelectedReview(review)}
                  >
                    <TableCell className="font-medium">
                      {review.products?.name || "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-4 w-4 ${
                              review.rating >= star
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-muted-foreground"
                            }`}
                          />
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="line-clamp-2 text-sm">
                        {review.title || review.content || "Без текста"}
                      </p>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(review.created_at), "d MMM yyyy", { locale: ru })}
                    </TableCell>
                    <TableCell>
                      <Badge variant={review.is_approved ? "default" : "secondary"}>
                        {review.is_approved ? "Одобрен" : "На модерации"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                        {!review.is_approved && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-green-600"
                            onClick={() => updateReview.mutate({ id: review.id, is_approved: true })}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => deleteReview.mutate(review.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        {/* Review Detail Dialog */}
        <Dialog open={!!selectedReview} onOpenChange={() => setSelectedReview(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Детали отзыва</DialogTitle>
            </DialogHeader>
            {selectedReview && (
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Товар</p>
                  <p className="font-medium">{selectedReview.products?.name}</p>
                </div>
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-5 w-5 ${
                        selectedReview.rating >= star
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-muted-foreground"
                      }`}
                    />
                  ))}
                </div>
                {selectedReview.title && (
                  <div>
                    <p className="text-sm text-muted-foreground">Заголовок</p>
                    <p className="font-medium">{selectedReview.title}</p>
                  </div>
                )}
                {selectedReview.content && (
                  <div>
                    <p className="text-sm text-muted-foreground">Отзыв</p>
                    <p>{selectedReview.content}</p>
                  </div>
                )}
                {selectedReview.pros && (
                  <div>
                    <p className="text-sm text-green-600">Достоинства</p>
                    <p>{selectedReview.pros}</p>
                  </div>
                )}
                {selectedReview.cons && (
                  <div>
                    <p className="text-sm text-red-600">Недостатки</p>
                    <p>{selectedReview.cons}</p>
                  </div>
                )}
                <div className="flex gap-2 pt-4">
                  {!selectedReview.is_approved && (
                    <Button
                      onClick={() => {
                        updateReview.mutate({ id: selectedReview.id, is_approved: true });
                        setSelectedReview(null);
                      }}
                      className="gap-2"
                    >
                      <Check className="h-4 w-4" />
                      Одобрить
                    </Button>
                  )}
                  <Button
                    variant="destructive"
                    onClick={() => deleteReview.mutate(selectedReview.id)}
                    className="gap-2"
                  >
                    <X className="h-4 w-4" />
                    Удалить
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Generate Reviews Dialog */}
        <Dialog open={generateDialogOpen} onOpenChange={setGenerateDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Генерация AI отзывов
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Товар *</Label>
                <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите товар" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Количество отзывов</Label>
                <Select value={reviewCount} onValueChange={setReviewCount}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3 отзыва</SelectItem>
                    <SelectItem value="5">5 отзывов</SelectItem>
                    <SelectItem value="10">10 отзывов</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <p className="text-sm text-muted-foreground">
                AI сгенерирует реалистичные отзывы на русском языке с разными оценками и текстами
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setGenerateDialogOpen(false)}>
                Отмена
              </Button>
              <Button onClick={handleGenerateReviews} disabled={isGenerating} className="gap-2">
                {isGenerating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                Сгенерировать
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </AdminLayout>
    </>
  );
};

export default AdminReviews;
