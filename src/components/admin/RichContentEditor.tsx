import { useState } from "react";
import { Plus, Trash2, MoveUp, MoveDown, Type, Image as ImageIcon, Video, Sparkles, Loader2, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface RichContentBlock {
  id: string;
  type: "text" | "image" | "video" | "heading" | "features";
  content: string;
  title?: string;
  items?: string[];
}

interface RichContentEditorProps {
  blocks: RichContentBlock[];
  onChange: (blocks: RichContentBlock[]) => void;
  productName?: string;
}

const generateId = () => Math.random().toString(36).substring(2, 9);

export function RichContentEditor({ blocks, onChange, productName }: RichContentEditorProps) {
  const [generatingAI, setGeneratingAI] = useState(false);

  const addBlock = (type: RichContentBlock["type"]) => {
    const newBlock: RichContentBlock = {
      id: generateId(),
      type,
      content: "",
      title: type === "features" ? "Преимущества" : undefined,
      items: type === "features" ? [""] : undefined,
    };
    onChange([...blocks, newBlock]);
  };

  const updateBlock = (id: string, updates: Partial<RichContentBlock>) => {
    onChange(blocks.map(b => b.id === id ? { ...b, ...updates } : b));
  };

  const removeBlock = (id: string) => {
    onChange(blocks.filter(b => b.id !== id));
  };

  const moveBlock = (id: string, direction: "up" | "down") => {
    const index = blocks.findIndex(b => b.id === id);
    if (direction === "up" && index > 0) {
      const newBlocks = [...blocks];
      [newBlocks[index - 1], newBlocks[index]] = [newBlocks[index], newBlocks[index - 1]];
      onChange(newBlocks);
    }
    if (direction === "down" && index < blocks.length - 1) {
      const newBlocks = [...blocks];
      [newBlocks[index], newBlocks[index + 1]] = [newBlocks[index + 1], newBlocks[index]];
      onChange(newBlocks);
    }
  };

  const updateFeatureItem = (blockId: string, itemIndex: number, value: string) => {
    const block = blocks.find(b => b.id === blockId);
    if (block && block.items) {
      const newItems = [...block.items];
      newItems[itemIndex] = value;
      updateBlock(blockId, { items: newItems });
    }
  };

  const addFeatureItem = (blockId: string) => {
    const block = blocks.find(b => b.id === blockId);
    if (block && block.items) {
      updateBlock(blockId, { items: [...block.items, ""] });
    }
  };

  const removeFeatureItem = (blockId: string, itemIndex: number) => {
    const block = blocks.find(b => b.id === blockId);
    if (block && block.items && block.items.length > 1) {
      updateBlock(blockId, { items: block.items.filter((_, i) => i !== itemIndex) });
    }
  };

  const generateWithAI = async () => {
    if (!productName) {
      toast.error("Сначала укажите название товара");
      return;
    }

    setGeneratingAI(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-product-content", {
        body: {
          productName,
          type: "rich_content",
          tone: "professional",
        },
      });

      if (error) throw error;

      if (data?.blocks && Array.isArray(data.blocks)) {
        const newBlocks: RichContentBlock[] = data.blocks.map((block: any) => ({
          id: generateId(),
          type: block.type || "text",
          content: block.content || "",
          title: block.title,
          items: block.items,
        }));
        onChange([...blocks, ...newBlocks]);
        toast.success("Рич-контент сгенерирован!");
      } else {
        throw new Error("Invalid response format");
      }
    } catch (error) {
      console.error("Error generating rich content:", error);
      toast.error("Ошибка генерации контента");
    } finally {
      setGeneratingAI(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Рич-контент</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={generateWithAI}
            disabled={generatingAI}
            className="gap-1"
          >
            {generatingAI ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Sparkles className="h-3 w-3" />
            )}
            Сгенерировать AI
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Создайте красивое описание товара с изображениями и текстом
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Existing Blocks */}
        {blocks.map((block, index) => (
          <div key={block.id} className="relative border rounded-lg p-4 bg-muted/30">
            <div className="flex items-start gap-2 mb-3">
              <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab mt-0.5" />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  {block.type === "heading" && <Type className="h-4 w-4" />}
                  {block.type === "text" && <Type className="h-4 w-4" />}
                  {block.type === "image" && <ImageIcon className="h-4 w-4" />}
                  {block.type === "video" && <Video className="h-4 w-4" />}
                  {block.type === "features" && <Type className="h-4 w-4" />}
                  <span className="text-sm font-medium capitalize">
                    {block.type === "heading" && "Заголовок"}
                    {block.type === "text" && "Текст"}
                    {block.type === "image" && "Изображение"}
                    {block.type === "video" && "Видео"}
                    {block.type === "features" && "Список преимуществ"}
                  </span>
                </div>

                {block.type === "heading" && (
                  <Input
                    value={block.content}
                    onChange={(e) => updateBlock(block.id, { content: e.target.value })}
                    placeholder="Заголовок секции"
                    className="font-semibold"
                  />
                )}

                {block.type === "text" && (
                  <Textarea
                    value={block.content}
                    onChange={(e) => updateBlock(block.id, { content: e.target.value })}
                    placeholder="Текст описания..."
                    rows={3}
                  />
                )}

                {block.type === "image" && (
                  <div className="space-y-2">
                    <Input
                      value={block.content}
                      onChange={(e) => updateBlock(block.id, { content: e.target.value })}
                      placeholder="URL изображения"
                    />
                    {block.content && (
                      <img src={block.content} alt="Preview" className="max-h-40 rounded-lg object-cover" />
                    )}
                  </div>
                )}

                {block.type === "video" && (
                  <Input
                    value={block.content}
                    onChange={(e) => updateBlock(block.id, { content: e.target.value })}
                    placeholder="URL видео (YouTube, Vimeo)"
                  />
                )}

                {block.type === "features" && (
                  <div className="space-y-2">
                    <Input
                      value={block.title || ""}
                      onChange={(e) => updateBlock(block.id, { title: e.target.value })}
                      placeholder="Заголовок списка"
                      className="font-medium"
                    />
                    {block.items?.map((item, itemIndex) => (
                      <div key={itemIndex} className="flex items-center gap-2">
                        <Input
                          value={item}
                          onChange={(e) => updateFeatureItem(block.id, itemIndex, e.target.value)}
                          placeholder={`Пункт ${itemIndex + 1}`}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeFeatureItem(block.id, itemIndex)}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addFeatureItem(block.id)}
                      className="gap-1"
                    >
                      <Plus className="h-3 w-3" />
                      Добавить пункт
                    </Button>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => moveBlock(block.id, "up")}
                  disabled={index === 0}
                  className="h-7 w-7"
                >
                  <MoveUp className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => moveBlock(block.id, "down")}
                  disabled={index === blocks.length - 1}
                  className="h-7 w-7"
                >
                  <MoveDown className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeBlock(block.id)}
                  className="h-7 w-7 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        ))}

        {/* Add Block Buttons */}
        <div className="flex flex-wrap gap-2 pt-2 border-t">
          <Button variant="outline" size="sm" onClick={() => addBlock("heading")} className="gap-1">
            <Type className="h-3 w-3" />
            Заголовок
          </Button>
          <Button variant="outline" size="sm" onClick={() => addBlock("text")} className="gap-1">
            <Type className="h-3 w-3" />
            Текст
          </Button>
          <Button variant="outline" size="sm" onClick={() => addBlock("image")} className="gap-1">
            <ImageIcon className="h-3 w-3" />
            Изображение
          </Button>
          <Button variant="outline" size="sm" onClick={() => addBlock("features")} className="gap-1">
            <Plus className="h-3 w-3" />
            Список
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
