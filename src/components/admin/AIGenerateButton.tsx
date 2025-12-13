import { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AIGenerateButtonProps {
  type: "description" | "seo";
  context: {
    name: string;
    currentDescription?: string;
  };
  onGenerated: (result: { description?: string; metaTitle?: string; metaDescription?: string; metaKeywords?: string }) => void;
}

export function AIGenerateButton({ type, context, onGenerated }: AIGenerateButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [generatedContent, setGeneratedContent] = useState("");
  const [seoData, setSeoData] = useState({
    metaTitle: "",
    metaDescription: "",
    metaKeywords: "",
  });

  const handleGenerate = async () => {
    if (!context.name) {
      toast.error("Укажите название для генерации");
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-category-content", {
        body: {
          categoryName: context.name,
          currentDescription: context.currentDescription,
          type,
        },
      });

      if (error) throw error;

      if (type === "description") {
        setGeneratedContent(data.description || "");
      } else {
        setSeoData({
          metaTitle: data.metaTitle || "",
          metaDescription: data.metaDescription || "",
          metaKeywords: data.metaKeywords || "",
        });
      }
    } catch (error: any) {
      console.error("AI generation error:", error);
      toast.error("Ошибка генерации: " + (error.message || "Неизвестная ошибка"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = () => {
    if (type === "description") {
      onGenerated({ description: generatedContent });
    } else {
      onGenerated(seoData);
    }
    setIsOpen(false);
    toast.success("Контент применён");
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="gap-1.5"
        onClick={() => setIsOpen(true)}
      >
        <Sparkles className="h-3.5 w-3.5" />
        AI {type === "description" ? "описание" : "SEO"}
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              AI-генерация {type === "description" ? "описания" : "SEO-тегов"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Генерация для: <strong>{context.name}</strong>
            </p>

            {type === "description" ? (
              <div className="space-y-2">
                <Label>Сгенерированное описание</Label>
                <Textarea
                  value={generatedContent}
                  onChange={(e) => setGeneratedContent(e.target.value)}
                  placeholder="Нажмите 'Сгенерировать' для создания описания..."
                  rows={6}
                  className="resize-none"
                />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Meta Title</Label>
                  <Textarea
                    value={seoData.metaTitle}
                    onChange={(e) => setSeoData({ ...seoData, metaTitle: e.target.value })}
                    placeholder="SEO заголовок..."
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Meta Description</Label>
                  <Textarea
                    value={seoData.metaDescription}
                    onChange={(e) => setSeoData({ ...seoData, metaDescription: e.target.value })}
                    placeholder="SEO описание..."
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Meta Keywords</Label>
                  <Textarea
                    value={seoData.metaKeywords}
                    onChange={(e) => setSeoData({ ...seoData, metaKeywords: e.target.value })}
                    placeholder="Ключевые слова через запятую..."
                    rows={2}
                  />
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Отмена
            </Button>
            <Button
              variant="secondary"
              onClick={handleGenerate}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Генерация...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Сгенерировать
                </>
              )}
            </Button>
            <Button
              onClick={handleApply}
              disabled={type === "description" ? !generatedContent : !seoData.metaTitle}
            >
              Применить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
