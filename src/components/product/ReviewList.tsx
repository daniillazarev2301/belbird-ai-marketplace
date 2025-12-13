import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Star, ThumbsUp, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { ReviewForm } from "./ReviewForm";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

interface ReviewListProps {
  productId: string;
}

interface Review {
  id: string;
  rating: number;
  title: string | null;
  content: string | null;
  pros: string | null;
  cons: string | null;
  is_verified_purchase: boolean;
  helpful_count: number;
  created_at: string;
  user_id: string;
}

export const ReviewList = ({ productId }: ReviewListProps) => {
  const [showForm, setShowForm] = useState(false);

  const { data: reviews = [], isLoading, refetch } = useQuery({
    queryKey: ["reviews", productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .eq("product_id", productId)
        .eq("is_approved", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Review[];
    },
  });

  const averageRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  const ratingCounts = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
    percent: reviews.length > 0
      ? (reviews.filter((r) => r.rating === star).length / reviews.length) * 100
      : 0,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
        <div className="flex items-center gap-6">
          {/* Average Rating */}
          <div className="text-center">
            <div className="text-4xl font-bold">{averageRating.toFixed(1)}</div>
            <div className="flex gap-0.5 justify-center my-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={cn(
                    "h-4 w-4",
                    averageRating >= star ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"
                  )}
                />
              ))}
            </div>
            <div className="text-sm text-muted-foreground">{reviews.length} отзывов</div>
          </div>

          {/* Rating Bars */}
          <div className="space-y-1 w-48">
            {ratingCounts.map(({ star, count, percent }) => (
              <div key={star} className="flex items-center gap-2 text-sm">
                <span className="w-3">{star}</span>
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-yellow-400 rounded-full transition-all"
                    style={{ width: `${percent}%` }}
                  />
                </div>
                <span className="w-6 text-muted-foreground">{count}</span>
              </div>
            ))}
          </div>
        </div>

        <Button onClick={() => setShowForm(true)}>Написать отзыв</Button>
      </div>

      {/* Review Form */}
      {showForm && (
        <ReviewForm
          productId={productId}
          onSuccess={() => {
            setShowForm(false);
            refetch();
          }}
          onCancel={() => setShowForm(false)}
        />
      )}

      {/* Reviews List */}
      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Загрузка отзывов...</div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          Пока нет отзывов. Будьте первым!
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="p-4 border border-border rounded-lg space-y-3">
              {/* Review Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {review.user_id.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={cn(
                              "h-4 w-4",
                              review.rating >= star ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"
                            )}
                          />
                        ))}
                      </div>
                      {review.is_verified_purchase && (
                        <Badge variant="secondary" className="text-xs gap-1">
                          <Check className="h-3 w-3" />
                          Покупка подтверждена
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(review.created_at), "d MMMM yyyy", { locale: ru })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Title & Content */}
              {review.title && <h4 className="font-medium">{review.title}</h4>}
              {review.content && <p className="text-sm text-muted-foreground">{review.content}</p>}

              {/* Pros & Cons */}
              {(review.pros || review.cons) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  {review.pros && (
                    <div className="flex gap-2">
                      <span className="text-green-600 font-medium">+</span>
                      <span>{review.pros}</span>
                    </div>
                  )}
                  {review.cons && (
                    <div className="flex gap-2">
                      <span className="text-red-600 font-medium">−</span>
                      <span>{review.cons}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Helpful */}
              <div className="flex items-center gap-2 pt-2">
                <Button variant="ghost" size="sm" className="text-xs gap-1">
                  <ThumbsUp className="h-3 w-3" />
                  Полезно ({review.helpful_count})
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
