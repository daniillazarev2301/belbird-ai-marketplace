import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Star, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ReviewFormProps {
  productId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export const ReviewForm = ({ productId, onSuccess, onCancel }: ReviewFormProps) => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [pros, setPros] = useState("");
  const [cons, setCons] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (rating === 0) {
      toast.error("Пожалуйста, поставьте оценку");
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("Войдите, чтобы оставить отзыв");
        return;
      }

      const { error } = await supabase.from("reviews").insert({
        product_id: productId,
        user_id: user.id,
        rating,
        title: title || null,
        content: content || null,
        pros: pros || null,
        cons: cons || null,
      });

      if (error) throw error;

      toast.success("Отзыв отправлен на модерацию");
      onSuccess();
    } catch (error: any) {
      toast.error("Ошибка: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 border border-border rounded-lg bg-card">
      <h3 className="font-semibold text-lg">Написать отзыв</h3>
      
      {/* Rating */}
      <div className="space-y-2">
        <Label>Ваша оценка *</Label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              className="p-1"
            >
              <Star
                className={cn(
                  "h-6 w-6 transition-colors",
                  (hoverRating || rating) >= star
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-muted-foreground"
                )}
              />
            </button>
          ))}
        </div>
      </div>

      {/* Title */}
      <div className="space-y-2">
        <Label htmlFor="title">Заголовок</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Кратко о вашем впечатлении"
        />
      </div>

      {/* Content */}
      <div className="space-y-2">
        <Label htmlFor="content">Отзыв</Label>
        <Textarea
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Расскажите подробнее о товаре"
          rows={4}
        />
      </div>

      {/* Pros & Cons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="pros" className="text-green-600">Достоинства</Label>
          <Textarea
            id="pros"
            value={pros}
            onChange={(e) => setPros(e.target.value)}
            placeholder="Что понравилось?"
            rows={2}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cons" className="text-red-600">Недостатки</Label>
          <Textarea
            id="cons"
            value={cons}
            onChange={(e) => setCons(e.target.value)}
            placeholder="Что не понравилось?"
            rows={2}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>
          Отмена
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
          Отправить
        </Button>
      </div>
    </form>
  );
};
