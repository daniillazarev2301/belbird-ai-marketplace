import { useState, useRef } from "react";
import { Camera, Upload, X, Loader2, Search, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface VisualSearchProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const VisualSearch = ({ isOpen, onOpenChange }: VisualSearchProps) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const handleFileSelect = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Выберите изображение");
      return;
    }

    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    
    await analyzeImage(file);
  };

  const analyzeImage = async (file: File) => {
    setIsAnalyzing(true);

    try {
      // Convert to base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(",")[1]);
        };
      });
      reader.readAsDataURL(file);
      const base64 = await base64Promise;

      const { data, error } = await supabase.functions.invoke("visual-search", {
        body: { image: base64 },
      });

      if (error) throw error;

      if (data?.searchQuery) {
        onOpenChange(false);
        navigate(`/search?q=${encodeURIComponent(data.searchQuery)}`);
        toast.success(`Найдено: ${data.searchQuery}`);
      } else {
        toast.error("Не удалось распознать объект на изображении");
      }
    } catch (error) {
      console.error("Visual search error:", error);
      toast.error("Ошибка анализа изображения");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const reset = () => {
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Поиск по фото
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Загрузите фото товара, питомца или проблемы — AI найдёт подходящие товары
          </p>

          {previewUrl ? (
            <div className="relative">
              <img
                src={previewUrl}
                alt="Preview"
                className="w-full aspect-video object-contain rounded-lg bg-muted"
              />
              {isAnalyzing && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-lg">
                  <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                    <p className="text-sm mt-2">Анализирую изображение...</p>
                  </div>
                </div>
              )}
              {!isAnalyzing && (
                <Button
                  variant="secondary"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={reset}
                >
                  <X className="h-4 w-4 mr-1" />
                  Сбросить
                </Button>
              )}
            </div>
          ) : (
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="font-medium mb-1">Перетащите изображение сюда</p>
              <p className="text-sm text-muted-foreground">или нажмите для выбора файла</p>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileSelect(file);
            }}
          />

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => fileInputRef.current?.click()}
              disabled={isAnalyzing}
            >
              <Upload className="h-4 w-4 mr-2" />
              Загрузить фото
            </Button>
          </div>

          <div className="text-xs text-muted-foreground">
            <p className="font-medium mb-1">Примеры использования:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Фото породы собаки → подбор корма</li>
              <li>Фото растения → подбор удобрений</li>
              <li>Фото проблемы с шерстью → средства ухода</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VisualSearch;