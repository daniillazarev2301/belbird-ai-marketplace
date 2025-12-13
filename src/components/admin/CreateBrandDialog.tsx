import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Upload, Loader2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { compressImage } from "@/utils/imageCompression";

interface CreateBrandDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBrandCreated: (brand: { id: string; name: string }) => void;
}

export function CreateBrandDialog({ open, onOpenChange, onBrandCreated }: CreateBrandDialogProps) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const generateSlug = (name: string) => {
    const translitMap: Record<string, string> = {
      'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'e',
      'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
      'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
      'ф': 'f', 'х': 'h', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'sch',
      'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya'
    };

    return name
      .toLowerCase()
      .split('')
      .map(char => translitMap[char] || char)
      .join('')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const handleNameChange = (value: string) => {
    setName(value);
    setSlug(generateSlug(value));
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error("Выберите изображение");
      return;
    }

    setUploading(true);
    try {
      const compressedFile = await compressImage(file, {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 400,
        initialQuality: 0.85
      });

      const fileName = `brand-${Date.now()}.webp`;
      const filePath = `brands/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('site-assets')
        .upload(filePath, compressedFile, { contentType: 'image/webp' });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('site-assets')
        .getPublicUrl(filePath);

      setLogoUrl(publicUrl);
      toast.success("Логотип загружен");
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast.error("Ошибка при загрузке логотипа");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSubmit = async () => {
    if (!name || !slug) {
      toast.error("Заполните название бренда");
      return;
    }

    setSaving(true);
    try {
      const { data, error } = await supabase
        .from('brands')
        .insert({
          name,
          slug,
          logo_url: logoUrl,
        })
        .select()
        .single();

      if (error) throw error;

      toast.success("Бренд создан");
      onBrandCreated({ id: data.id, name: data.name });
      resetForm();
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating brand:', error);
      toast.error("Ошибка при создании бренда");
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setName("");
    setSlug("");
    setLogoUrl(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Новый бренд</DialogTitle>
          <DialogDescription>
            Быстрое создание бренда
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Logo */}
          <div className="flex items-center gap-4">
            {logoUrl ? (
              <div className="relative">
                <img
                  src={logoUrl}
                  alt="Логотип"
                  className="w-16 h-16 object-contain rounded-lg bg-muted border"
                />
                <button
                  onClick={() => setLogoUrl(null)}
                  className="absolute -top-2 -right-2 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-16 h-16 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors"
              >
                {uploading ? (
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                ) : (
                  <Upload className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              className="hidden"
            />
            <div className="flex-1">
              <Label htmlFor="brand-name">Название *</Label>
              <Input
                id="brand-name"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Royal Canin"
                className="mt-1"
              />
            </div>
          </div>

          {/* Slug */}
          <div className="space-y-2">
            <Label htmlFor="brand-slug">URL (slug)</Label>
            <Input
              id="brand-slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="royal-canin"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Отмена
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Создать
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
